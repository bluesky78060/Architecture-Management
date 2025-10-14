import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MS_IN_SECOND, SECONDS_IN_MINUTE } from '../constants/units';
import { setSecureItem, removeSecureItem, migrateSensitiveData } from '../utils/secureStorageAdapter';
import { supabase } from '../services/supabase';

interface User {
  id: number;
  username: string;
  password?: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
}

interface UserContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  logout: () => void;
  getUserStorageKey: (username: string, key: string) => string;
}

interface UserProviderProps {
  children: ReactNode;
}

const isLoginDisabledEnv = (): boolean => process.env.REACT_APP_DISABLE_LOGIN === '1';

const isLoginDisabledRuntime = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    const s = window.sessionStorage.getItem('CMS_DISABLE_LOGIN_PLAIN');
    if (s === '1') return true;
    const raw = window.localStorage.getItem('CMS_DISABLE_LOGIN');
    return raw === '1'; // 암호화된 경우에는 런타임 판별은 세션 플래그에 의해 처리
  } catch (_) {
    return false;
  }
};

const getLoginDisabled = (): boolean => isLoginDisabledEnv() || isLoginDisabledRuntime();

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(getLoginDisabled() ? true : false);

  useEffect(() => {
    // 마이그레이션: 기존 민감한 데이터를 암호화된 형태로 변환
    (async () => {
      await migrateSensitiveData();

      // Support URL toggle: ?bypassLogin=1 sets runtime flag
      try {
        const params = new URLSearchParams(window.location.search);
        const bypassLogin = params.get('bypassLogin');
        if (bypassLogin === '1') {
          setSecureItem('CMS_DISABLE_LOGIN', '1');
          try { window.sessionStorage.setItem('CMS_DISABLE_LOGIN_PLAIN', '1'); } catch (_) {}
        } else if (bypassLogin === '0') {
          removeSecureItem('CMS_DISABLE_LOGIN');
          try { window.sessionStorage.removeItem('CMS_DISABLE_LOGIN_PLAIN'); } catch (_) {}
        }

        if (params.get('resetAuth') === '1') {
          try { window.sessionStorage.removeItem('CURRENT_USER'); } catch (_) {}
          try { removeSecureItem('CURRENT_USER'); } catch (_) {}
          try { removeSecureItem('CMS_DISABLE_LOGIN'); } catch (_) {}
          try { window.sessionStorage.removeItem('CMS_DISABLE_LOGIN_PLAIN'); } catch (_) {}
        }
      } catch (_) {}

      if (getLoginDisabled()) {
        const devUser: User = { id: 1, username: 'dev', name: '개발자', role: 'admin' };
        setCurrentUser(devUser);
        setIsLoggedIn(true);
        try { sessionStorage.setItem('CURRENT_USER', JSON.stringify(devUser)); } catch (e) {}
      } else {
        // Supabase 세션 확인
        if (supabase !== null) {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user !== undefined && session?.user !== null) {
              const supabaseUser: User = {
                id: 1,
                username: session.user.email ?? 'user',
                name: session.user.user_metadata?.name ?? session.user.email ?? 'User',
                role: 'admin'
              };
              setCurrentUser(supabaseUser);
              setIsLoggedIn(true);
              try { sessionStorage.setItem('CURRENT_USER', JSON.stringify(supabaseUser)); } catch (e) {}
              return;
            }
          }).catch(() => {
            // Supabase 세션 확인 실패 시 로컬 세션 확인
          });
        }

        // 로컬 세션 확인
        const savedUser = sessionStorage.getItem('CURRENT_USER');
        if (savedUser !== null && savedUser !== '') {
          setCurrentUser(JSON.parse(savedUser) as User);
          setIsLoggedIn(true);
        } else {
          // 과거 잔존 세션 제거
          removeSecureItem('CURRENT_USER');
        }
      }
    })();

    // Supabase auth state 변경 감지
    if (supabase === null) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user !== undefined && session?.user !== null) {
        const supabaseUser: User = {
          id: 1,
          username: session.user.email ?? 'user',
          name: session.user.user_metadata?.name ?? session.user.email ?? 'User',
          role: 'admin'
        };
        setCurrentUser(supabaseUser);
        setIsLoggedIn(true);
        try { sessionStorage.setItem('CURRENT_USER', JSON.stringify(supabaseUser)); } catch (e) {}
      } else if (!getLoginDisabled()) {
        setCurrentUser(null);
        setIsLoggedIn(false);
        try { sessionStorage.removeItem('CURRENT_USER'); } catch (e) {}
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = (): void => {
    if (getLoginDisabled()) {
      // 로그인 비활성화 모드에서는 로그아웃을 무시하거나 상태만 유지합니다.
      return;
    }

    // Supabase 로그아웃
    if (supabase !== null) {
      supabase.auth.signOut().catch(() => {
        // 로그아웃 실패해도 로컬 세션은 정리
      });
    }

    setCurrentUser(null);
    setIsLoggedIn(false);
    try { sessionStorage.removeItem('CURRENT_USER'); } catch (e) {}
    try { removeSecureItem('CURRENT_USER'); } catch (e) {}
    // 다른 탭에도 로그아웃 브로드캐스트
    try {
      setSecureItem('CMS_LOGOUT', String(Date.now()));
      removeSecureItem('CMS_LOGOUT');
    } catch (e) {}
  };

  const getUserStorageKey = (username: string, key: string): string => {
    return `USER_${username}_${key}`;
  };

  const value: UserContextType = {
    currentUser,
    isLoggedIn,
    logout,
    getUserStorageKey
  };

  // 1시간 무활동 자동 로그아웃
  useEffect(() => {
    if (!isLoggedIn || getLoginDisabled()) return;

    let timerId: NodeJS.Timeout;
    // eslint-disable-next-line no-magic-numbers
    const TIMEOUT_MS = 60 * SECONDS_IN_MINUTE * MS_IN_SECOND; // 1 hour in milliseconds

    const reset = (): void => {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        logout();
      }, TIMEOUT_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timerId);
      events.forEach(ev => window.removeEventListener(ev, reset));
    };
  }, [isLoggedIn]);

  // 다른 탭에서의 로그아웃 신호를 수신하여 즉시 로그아웃
  useEffect(() => {
    const onStorage = (e: StorageEvent): void => {
      if (e.key === 'CMS_LOGOUT') {
        setCurrentUser(null);
        setIsLoggedIn(false);
        try { sessionStorage.removeItem('CURRENT_USER'); } catch (err) {}
        try { removeSecureItem('CURRENT_USER'); } catch (err) {}
      }
    };
    
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
