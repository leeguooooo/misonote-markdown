'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { User, Settings, LogOut, Crown, Shield } from 'lucide-react';

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
  setUser: () => {},
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

export default function UserManager() {
  const { user, setUser, isAdmin, isLoggedIn } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ name: '', role: 'user' as 'admin' | 'user' });
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [isAdminLogging, setIsAdminLogging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const predefinedUsers = [
    { id: 'user1', name: '张三', role: 'user' as const, email: 'zhangsan@example.com' },
    { id: 'user2', name: '李四', role: 'user' as const, email: 'lisi@example.com' },
    { id: 'user3', name: '王五', role: 'user' as const, email: 'wangwu@example.com' },
  ];

  const handleLogin = (selectedUser?: UserInfo) => {
    if (selectedUser) {
      setUser(selectedUser);
    } else if (loginForm.name.trim()) {
      const newUser: UserInfo = {
        id: Date.now().toString(),
        name: loginForm.name.trim(),
        role: loginForm.role,
      };
      setUser(newUser);
    }
    setShowLoginDialog(false);
    setLoginForm({ name: '', role: 'user' });
  };

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) return;

    setIsAdminLogging(true);
    setAdminLoginError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        // 真正的管理员登录成功
        const adminUser: UserInfo = {
          id: 'admin',
          name: '管理员',
          role: 'admin',
          email: 'admin@system.com',
          isRealAdmin: true,
          token: data.token
        };

        setUser(adminUser);
        setShowAdminLogin(false);
        setAdminPassword('');
        setShowLoginDialog(false);
      } else {
        setAdminLoginError(data.error || '登录失败');
      }
    } catch (error) {
      console.error('管理员登录错误:', error);
      setAdminLoginError('网络错误，请重试');
    } finally {
      setIsAdminLogging(false);
    }
  };

  const handleLogout = () => {
    // 如果是真正的管理员，清除 token
    if (user?.isRealAdmin && user?.token) {
      localStorage.removeItem('admin-token');
    }
    setUser(null);
    setShowUserMenu(false);
  };

  const getUserAvatar = (user: UserInfo) => {
    if (user.avatar) return user.avatar;
    return user.name[0].toUpperCase();
  };

  const getUserBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'user':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-3 h-3" />;
      case 'user':
        return <User className="w-3 h-3" />;
      default:
        return <Shield className="w-3 h-3" />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'user':
        return '用户';
      default:
        return '访客';
    }
  };

  // 避免 hydration 错误
  if (!isMounted) {
    return (
      <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900     transition-colors">
        <User className="w-4 h-4" />
        登录
      </button>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <button
          onClick={() => setShowLoginDialog(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900     transition-colors"
        >
          <User className="w-4 h-4" />
          登录
        </button>

        {/* Login Dialog */}
        {showLoginDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white   rounded-lg p-6 w-96 max-w-[90vw]">
              <h3 className="text-lg font-semibold mb-4 text-gray-900  ">
                选择用户身份
              </h3>

              {/* Predefined Users */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700   mb-3">
                  快速登录
                </h4>
                <div className="space-y-2">
                  {predefinedUsers.map((predefinedUser) => (
                    <button
                      key={predefinedUser.id}
                      onClick={() => handleLogin(predefinedUser)}
                      className="w-full flex items-center gap-3 p-3 text-left bg-gray-50   hover:bg-gray-100   rounded-lg transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getUserBadgeColor(predefinedUser.role)}`}>
                        {getUserAvatar(predefinedUser)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900  ">
                            {predefinedUser.name}
                          </span>
                          <span className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200   text-gray-700   rounded">
                            {getRoleIcon(predefinedUser.role)}
                            {getRoleText(predefinedUser.role)}
                          </span>
                        </div>
                        {predefinedUser.email && (
                          <div className="text-sm text-gray-500  ">
                            {predefinedUser.email}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Login */}
              <div className="border-t border-gray-200   pt-4">
                <h4 className="text-sm font-medium text-gray-700   mb-3">
                  管理员登录
                </h4>
                {!showAdminLogin ? (
                  <button
                    onClick={() => setShowAdminLogin(true)}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-purple-50   border border-purple-200   text-purple-700   rounded-lg hover:bg-purple-100   transition-colors"
                  >
                    <Crown className="w-4 h-4" />
                    管理员登录
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="输入管理员密码"
                      className="w-full p-3 border border-gray-300   rounded-lg bg-white   text-gray-900   placeholder-gray-500   focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                    />
                    {adminLoginError && (
                      <div className="text-red-600 text-sm bg-red-50   p-2 rounded">
                        {adminLoginError}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowAdminLogin(false);
                          setAdminPassword('');
                          setAdminLoginError('');
                        }}
                        className="flex-1 px-3 py-2 text-gray-600   hover:text-gray-800  "
                      >
                        取消
                      </button>
                      <button
                        onClick={handleAdminLogin}
                        disabled={!adminPassword.trim() || isAdminLogging}
                        className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAdminLogging ? '登录中...' : '登录'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom User */}
              <div className="border-t border-gray-200   pt-4">
                <h4 className="text-sm font-medium text-gray-700   mb-3">
                  自定义用户
                </h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={loginForm.name}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="输入用户名"
                    className="w-full p-3 border border-gray-300   rounded-lg bg-white   text-gray-900   placeholder-gray-500   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={loginForm.role}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, role: e.target.value as 'user' }))}
                    className="w-full p-3 border border-gray-300   rounded-lg bg-white   text-gray-900   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="user">普通用户</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowLoginDialog(false)}
                  className="px-4 py-2 text-gray-600   hover:text-gray-800  "
                >
                  取消
                </button>
                <button
                  onClick={() => handleLogin()}
                  disabled={!loginForm.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  登录
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900     transition-colors"
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getUserBadgeColor(user?.role)}`}>
          {user && getUserAvatar(user)}
        </div>
        <span>{user?.name}</span>
        {isAdmin && <Crown className="w-3 h-3 text-yellow-500" />}
      </button>

      {/* User Menu */}
      {showUserMenu && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white   rounded-lg shadow-lg border border-gray-200   py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-200  ">
            <div className="font-medium text-gray-900  ">{user?.name}</div>
            <div className="flex items-center gap-1 text-sm text-gray-500  ">
              {user?.role && getRoleIcon(user.role)}
              {user?.role && getRoleText(user.role)}
            </div>
          </div>

          <button
            onClick={() => setShowUserMenu(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700   hover:bg-gray-100  "
          >
            <Settings className="w-4 h-4" />
            设置
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600   hover:bg-gray-100  "
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
