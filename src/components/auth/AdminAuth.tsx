'use client';

import { useState, useEffect } from 'react';
import { Lock, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import UnifiedLogin from '@/components/auth/UnifiedLogin';
import { useAuthState } from '@/core/auth/useAuthState';

interface AdminAuthProps {
  children: React.ReactNode;
}

interface SecurityStatus {
  isProduction: boolean;
  hasCustomPassword: boolean;
  hasCustomJwtSecret: boolean;
  recommendations: string[];
}

interface AuthUser {
  id: string;
  username: string;
  role: string;
}

export default function AdminAuth({ children }: AdminAuthProps) {
  const { isAuthenticated, user, isLoading, verifyAuth, logout } = useAuthState();
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [showUnifiedLogin, setShowUnifiedLogin] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isValid = await verifyAuth();
      if (isValid) {
        // 获取安全状态
        const response = await fetch('/api/auth/verify');

        if (response.ok) {
          const data = await response.json();
          setSecurityStatus(data.securityStatus);
        }
      }
    } catch (error) {
      console.error('认证检查失败:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('注销失败:', error);
    } finally {
      logout();
      setSecurityStatus(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                管理员登录
              </h1>
              <p className="text-gray-600 mb-6">
                请登录以访问文档管理功能
              </p>

              <button
                onClick={() => setShowUnifiedLogin(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                登录
              </button>
            </div>
          </div>
        </div>

        <UnifiedLogin
          isOpen={showUnifiedLogin}
          onClose={() => setShowUnifiedLogin(false)}
          purpose="admin"
        />
      </>
    );
  }

  return (
    <div>
      {/* 安全状态警告 */}
      {securityStatus && securityStatus.recommendations.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  安全配置建议
                </h3>
                <ul className="mt-1 text-sm text-yellow-700 space-y-1">
                  {securityStatus.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                文档管理
              </h1>
              {securityStatus && (
                <div className="flex items-center gap-2 text-sm">
                  {securityStatus.hasCustomPassword && securityStatus.hasCustomJwtSecret ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>安全</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span>需要配置</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                欢迎，{user?.username}
              </span>
              <a
                href="/docs"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                查看文档
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
