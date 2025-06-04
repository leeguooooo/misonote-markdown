'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface UserInfo {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  email?: string;
  isRealAdmin?: boolean; // 区分真正的管理员和模拟管理员
  token?: string; // JWT token
}

interface UserContextType {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  isAdmin: boolean;
  isLoggedIn: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => { },
  isAdmin: false,
  isLoggedIn: false,
});

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // 从 localStorage 加载用户信息
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  useEffect(() => {
    // 保存用户信息到 localStorage
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [user]);

  const isAdmin = user?.role === 'admin';
  const isLoggedIn = user !== null;

  return (
    <UserContext.Provider value={{ user, setUser, isAdmin, isLoggedIn }}>
      {children}
    </UserContext.Provider>
  );
}
