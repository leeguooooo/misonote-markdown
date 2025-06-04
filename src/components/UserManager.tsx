'use client';

import { useState, useEffect } from 'react';
import { User, Settings, LogOut, Crown, Shield } from 'lucide-react';
import UnifiedLogin from '@/components/auth/UnifiedLogin';
import { useUser, UserProvider } from '@/core/auth/UserContext';

interface UserInfo {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  email?: string;
  isRealAdmin?: boolean;
  token?: string;
}

// 重新导出UserProvider和useUser以保持向后兼容
export { UserProvider, useUser };

export default function UserManager() {
  const { user, setUser, isAdmin, isLoggedIn } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUnifiedLogin, setShowUnifiedLogin] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);



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
      <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900   transition-colors">
        <User className="w-4 h-4" />
        登录
      </button>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <button
          onClick={() => setShowUnifiedLogin(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <User className="w-4 h-4" />
          登录
        </button>

        <UnifiedLogin
          isOpen={showUnifiedLogin}
          onClose={() => setShowUnifiedLogin(false)}
          purpose="general"
        />
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getUserBadgeColor(user?.role)}`}>
          {user && getUserAvatar(user)}
        </div>
        <span>{user?.name}</span>
        {isAdmin && <Crown className="w-3 h-3 text-yellow-500" />}
      </button>

      {/* User Menu */}
      {showUserMenu && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-200">
            <div className="font-medium text-gray-900">{user?.name}</div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {user?.role && getRoleIcon(user.role)}
              {user?.role && getRoleText(user.role)}
            </div>
          </div>

          <button
            onClick={() => setShowUserMenu(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Settings className="w-4 h-4" />
            设置
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
