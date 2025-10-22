import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MS_IN_SECOND, SECONDS_IN_MINUTE } from '../constants/units';
import { setSecureItem, removeSecureItem, migrateSensitiveData } from '../utils/secureStorageAdapter';
import { supabase } from '../services/supabase';

// 관리자 이메일 리스트 (환경 변수 또는 직접 지정)
const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS ?? 'bluesky78060@gmail.com')
  .split(',')
  .map(email => email.trim().toLowerCase());

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
  isAdmin: boolean;
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

      /* eslint-disable no-console */
      // OAuth 콜백 디버깅
      const urlParams = new URLSearchParams(window.location.search);
      const hasOAuthCode = urlParams.has('code');
      const hasAccessToken = urlParams.has('access_token');
      const hasError = urlParams.has('error');

      console.log('🟢 [UserContext] URL params check:', {
        hasOAuthCode,
        hasAccessToken,
        hasError,
        fullURL: window.location.href
      });
      /* eslint-enable no-console */

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
          /* eslint-disable no-console */
          console.log('🟢 [UserContext] Checking Supabase session...');
          /* eslint-enable no-console */

          try {
            const { data: { session }, error } = await supabase.auth.getSession();

            /* eslint-disable no-console */
            console.log('🟢 [UserContext] getSession result:', {
              hasSession: session !== null,
              hasUser: session?.user !== undefined && session?.user !== null,
              error: error?.message,
              userEmail: session?.user?.email
            });
            /* eslint-enable no-console */

            if (session?.user !== undefined && session?.user !== null) {
              const supabaseUser: User = {
                id: 1,
                username: session.user.email ?? 'user',
                name: session.user.user_metadata?.name ?? session.user.email ?? 'User',
                role: 'admin'
              };
              /* eslint-disable no-console */
              console.log('✅ [UserContext] Session found, logging in:', supabaseUser.username);
              /* eslint-enable no-console */
              setCurrentUser(supabaseUser);
              setIsLoggedIn(true);
              try { sessionStorage.setItem('CURRENT_USER', JSON.stringify(supabaseUser)); } catch (e) {}
              return;
            }
          } catch (err) {
            /* eslint-disable no-console */
            console.error('❌ [UserContext] getSession error:', err);
            /* eslint-enable no-console */
          }
        }

        // 로컬 세션 확인
        const savedUser = sessionStorage.getItem('CURRENT_USER');
        if (savedUser !== null && savedUser !== '') {
          /* eslint-disable no-console */
          console.log('🟢 [UserContext] Restoring from sessionStorage');
          /* eslint-enable no-console */
          setCurrentUser(JSON.parse(savedUser) as User);
          setIsLoggedIn(true);
        } else {
          /* eslint-disable no-console */
          console.log('⚠️ [UserContext] No saved session found');
          /* eslint-enable no-console */
          // 과거 잔존 세션 제거
          removeSecureItem('CURRENT_USER');
        }
      }
    })();

    // Supabase auth state 변경 감지
    if (supabase === null) {
      return;
    }

    /* eslint-disable no-console */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔵 [UserContext] onAuthStateChange triggered:', event);
      console.log('🔵 [UserContext] session:', (session?.user !== undefined && session?.user !== null) ? 'has user' : 'no user');

      // PKCE 플로우: URL에 code 파라미터가 있으면 자동으로 세션 교환
      if (event === 'SIGNED_IN' && session?.user !== undefined && session?.user !== null) {
        const supabaseUser: User = {
          id: 1,
          username: session.user.email ?? 'user',
          name: session.user.user_metadata?.name ?? session.user.email ?? 'User',
          role: 'admin'
        };
        console.log('✅ [UserContext] Setting logged in:', supabaseUser.username);
        setCurrentUser(supabaseUser);
        setIsLoggedIn(true);
        try { sessionStorage.setItem('CURRENT_USER', JSON.stringify(supabaseUser)); } catch (e) {}

        // OAuth 콜백 후 URL 파라미터 정리
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('code')) {
          console.log('🔵 [UserContext] Cleaning OAuth params from URL');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (session?.user !== undefined && session?.user !== null) {
        // 일반 세션 복원
        const supabaseUser: User = {
          id: 1,
          username: session.user.email ?? 'user',
          name: session.user.user_metadata?.name ?? session.user.email ?? 'User',
          role: 'admin'
        };
        console.log('✅ [UserContext] Session restored:', supabaseUser.username);
        setCurrentUser(supabaseUser);
        setIsLoggedIn(true);
        try { sessionStorage.setItem('CURRENT_USER', JSON.stringify(supabaseUser)); } catch (e) {}
      } else if (!getLoginDisabled() && event !== 'INITIAL_SESSION') {
        // Only clear session for explicit sign out events, not for initial session check
        console.log('⚠️ [UserContext] No session, logging out');
        setCurrentUser(null);
        setIsLoggedIn(false);
        try { sessionStorage.removeItem('CURRENT_USER'); } catch (e) {}
      }
    });
    /* eslint-enable no-console */

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

  // 관리자 여부 확인
  const isAdmin = currentUser !== null && ADMIN_EMAILS.includes(currentUser.username.toLowerCase());

  const value: UserContextType = {
    currentUser,
    isLoggedIn,
    isAdmin,
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
