import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSecureItem, setSecureItem, removeSecureItem, migrateSensitiveData } from '../utils/secureStorage';

interface User {
  id: number;
  username: string;
  password?: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
}

interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface UserResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

interface UserContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => LoginResult;
  logout: () => void;
  getUserStorageKey: (username: string, key: string) => string;
  getAllUsers: () => User[];
  addUser: (userData: Omit<User, 'id'>) => UserResult;
  updateUser: (userId: number, userData: Partial<User>) => UserResult;
  deleteUser: (userId: number) => DeleteResult;
  isAdmin: () => boolean;
}

interface UserProviderProps {
  children: ReactNode;
}

const isLoginDisabledEnv = (): boolean => process.env.REACT_APP_DISABLE_LOGIN === '1';

const isLoginDisabledRuntime = (): boolean => {
  try {
    return (typeof window !== 'undefined') && (getSecureItem('CMS_DISABLE_LOGIN') === '1');
  } catch (_) { 
    return false; 
  }
};

const getLoginDisabled = (): boolean => isLoginDisabledEnv() || isLoginDisabledRuntime();

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(getLoginDisabled() ? true : false);

  useEffect(() => {
    // 마이그레이션: 기존 민감한 데이터를 암호화된 형태로 변환
    migrateSensitiveData();

    // Support URL toggle: ?bypassLogin=1 sets runtime flag
    try {
      const params = new URLSearchParams(window.location.search);
      const bypassLogin = params.get('bypassLogin');
      if (bypassLogin === '1') {
        setSecureItem('CMS_DISABLE_LOGIN', '1');
      } else if (bypassLogin === '0') {
        removeSecureItem('CMS_DISABLE_LOGIN');
      }

      if (params.get('resetAuth') === '1') {
        try { window.sessionStorage.removeItem('CURRENT_USER'); } catch (_) {}
        try { removeSecureItem('CURRENT_USER'); } catch (_) {}
        try { removeSecureItem('CMS_DISABLE_LOGIN'); } catch (_) {}
      }
    } catch (_) {}

    const defaultUsers: User[] = [
      { id: 1, username: 'admin', password: 'admin123', name: '관리자', role: 'admin' },
      { id: 2, username: 'manager', password: 'manager123', name: '매니저', role: 'manager' },
      { id: 3, username: 'user', password: 'user123', name: '사용자', role: 'user' }
    ];
    
    const users = getSecureItem('CMS_USERS');
    if (!users) {
      setSecureItem('CMS_USERS', JSON.stringify(defaultUsers));
    }
    
    if (getLoginDisabled()) {
      const devUser: User = { id: 1, username: 'dev', name: '개발자', role: 'admin' };
      setCurrentUser(devUser);
      setIsLoggedIn(true);
      try { sessionStorage.setItem('CURRENT_USER', JSON.stringify(devUser)); } catch (e) {}
    } else {
      const savedUser = sessionStorage.getItem('CURRENT_USER');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser) as User);
        setIsLoggedIn(true);
      } else {
        // 과거 잔존 세션 제거
        removeSecureItem('CURRENT_USER');
      }
    }
  }, []);

  const login = (username: string, password: string): LoginResult => {
    if (getLoginDisabled()) {
      const user: User = { id: 1, username: username || 'dev', name: '개발자', role: 'admin' };
      setCurrentUser(user);
      setIsLoggedIn(true);
      try { sessionStorage.setItem('CURRENT_USER', JSON.stringify(user)); } catch (e) {}
      return { success: true, user };
    }
    
    const users: User[] = JSON.parse(getSecureItem('CMS_USERS') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      sessionStorage.setItem('CURRENT_USER', JSON.stringify(user));
      return { success: true, user };
    } else {
      return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
    }
  };

  const logout = (): void => {
    if (getLoginDisabled()) {
      // 로그인 비활성화 모드에서는 로그아웃을 무시하거나 상태만 유지합니다.
      return;
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

  const getAllUsers = (): User[] => {
    return JSON.parse(getSecureItem('CMS_USERS') || '[]');
  };

  const addUser = (userData: Omit<User, 'id'>): UserResult => {
    const users = getAllUsers();
    const newUser: User = {
      ...userData,
      id: Math.max(0, ...users.map(u => u.id)) + 1
    };
    
    if (users.find(u => u.username === userData.username)) {
      return { success: false, error: '이미 존재하는 아이디입니다.' };
    }

    users.push(newUser);
    setSecureItem('CMS_USERS', JSON.stringify(users));
    return { success: true, user: newUser };
  };

  const updateUser = (userId: number, userData: Partial<User>): UserResult => {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }

    if (userData.username) {
      const existingUser = users.find(u => u.username === userData.username && u.id !== userId);
      if (existingUser) {
        return { success: false, error: '이미 존재하는 아이디입니다.' };
      }
    }

    users[userIndex] = { ...users[userIndex], ...userData };
    setSecureItem('CMS_USERS', JSON.stringify(users));
    
    if (currentUser && currentUser.id === userId) {
      const updatedUser = users[userIndex];
      setCurrentUser(updatedUser);
      setSecureItem('CURRENT_USER', JSON.stringify(updatedUser));
    }

    return { success: true, user: users[userIndex] };
  };

  const deleteUser = (userId: number): DeleteResult => {
    const users = getAllUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    
    if (users.length === filteredUsers.length) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }

    setSecureItem('CMS_USERS', JSON.stringify(filteredUsers));
    
    if (currentUser && currentUser.id === userId) {
      logout();
    }

    return { success: true };
  };

  const isAdmin = (): boolean => {
    return currentUser?.role === 'admin' ?? false;
  };

  const value: UserContextType = {
    currentUser,
    isLoggedIn,
    login,
    logout,
    getUserStorageKey,
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
    isAdmin
  };

  // 1시간 무활동 자동 로그아웃
  useEffect(() => {
    if (!isLoggedIn || getLoginDisabled()) return;
    
    let timerId: NodeJS.Timeout;
    const TIMEOUT = 60 * 60 * 1000;
    
    const reset = (): void => {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        logout();
      }, TIMEOUT);
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