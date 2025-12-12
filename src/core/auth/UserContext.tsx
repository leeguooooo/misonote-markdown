'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { useAuthState } from './useAuthState';

export interface UserInfo {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  email?: string;
  isRealAdmin?: boolean;
  token?: string | null;
}

interface UserContextType {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  isAdmin: boolean;
  isLoggedIn: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  isAdmin: false,
  isLoggedIn: false,
});

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, isAdmin: isAuthAdmin, isLoggedIn: isAuthLoggedIn, login, logout } = useAuthState();
  const [customUser, setCustomUser] = useState<UserInfo | null>(null);

  const effectiveUser = authUser ?? customUser;
  const isAdmin = isAuthAdmin || effectiveUser?.role === 'admin';
  const isLoggedIn = isAuthLoggedIn || !!customUser;

  const contextValue = useMemo<UserContextType>(() => ({
    user: effectiveUser,
    setUser: (userInfo: UserInfo | null) => {
      if (!userInfo) {
        logout();
        setCustomUser(null);
        return;
      }

      if (userInfo.isRealAdmin) {
        login(userInfo, userInfo.token);
        setCustomUser(null);
        return;
      }

      setCustomUser(userInfo);
    },
    isAdmin,
    isLoggedIn,
  }), [effectiveUser, isAdmin, isLoggedIn, login, logout]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}
