'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
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

export default function AdminAuth({ children }: AdminAuthProps) {
  const { isAuthenticated, isAdmin, isLoading, verifyAuth, logout } = useAuthState();
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const isValid = await verifyAuth();
        if (isValid) {
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

    checkAuthStatus();
  }, [verifyAuth]);

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
        <UnifiedLogin
          isOpen={true}
          onClose={() => {}}
          purpose="admin"
        />
      </>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-4">
          <div className="text-center">
            <Lock className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h1 className="text-xl font-semibold text-gray-900">权限不足</h1>
            <p className="text-sm text-gray-600 mt-1">仅管理员可以访问控制台，请使用管理员账户登录。</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
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
              <button
                onClick={handleLogout}
                className="text-sm text-blue-700 hover:text-blue-900"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
