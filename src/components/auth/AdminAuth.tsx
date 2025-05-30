'use client';

import { useState, useEffect } from 'react';
import { Lock, AlertTriangle, Shield, CheckCircle } from 'lucide-react';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('admin-token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUser(data.user);
        setSecurityStatus(data.securityStatus);
      } else {
        localStorage.removeItem('admin-token');
      }
    } catch (error) {
      console.error('认证检查失败:', error);
      localStorage.removeItem('admin-token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin-token', data.token);
        setIsAuthenticated(true);
        setUser(data.user);
        setSecurityStatus(data.securityStatus);
        setError('');
      } else {
        setError(data.error || '登录失败');
      }
    } catch (error) {
      console.error('登录错误:', error);
      setError('网络错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    setIsAuthenticated(false);
    setUser(null);
    setSecurityStatus(null);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              管理员登录
            </h1>
            <p className="text-gray-600">
              请输入管理员密码以访问文档管理功能
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入管理员密码"
                required
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              开发环境默认密码：admin123
            </p>
          </div>
        </div>
      </div>
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
