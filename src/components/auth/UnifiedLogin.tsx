'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Shield, Users, Crown, Zap, ArrowRight, CheckCircle, X } from 'lucide-react';
import { useUser } from '@/components/UserManager';
import { useAuthState } from '@/core/auth/useAuthState';

interface VersionInfo {
  type: 'community' | 'professional' | 'enterprise';
  name: string;
  description: string;
  enterpriseAvailable: boolean;
  hasValidLicense: boolean;
  licenseInfo?: {
    organization: string;
    type: string;
    expiresAt: string;
    maxUsers: number;
    isValid: boolean;
  };
  features: {
    available: string[];
    community: string[];
    professional: string[];
    enterprise: string[];
  };
  loginOptions: {
    adminRequired: boolean;
    supportsUserRegistration: boolean;
    supportsSSO: boolean;
    guestAccess: boolean;
  };
}

interface UnifiedLoginProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
  purpose?: 'edit' | 'admin' | 'general';
}

export default function UnifiedLogin({ isOpen, onClose, redirectTo, purpose = 'general' }: UnifiedLoginProps) {
  const { setUser } = useUser();
  const { clearAllData, diagnose, login } = useAuthState();
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'guest' | 'admin' | 'user'>('guest');
  const [adminPassword, setAdminPassword] = useState('');
  const [userForm, setUserForm] = useState({ name: '', role: 'user' as 'user' | 'admin' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (isOpen) {
      // 自动清理异常数据，无需提示
      const diagnosis = diagnose();
      if (diagnosis.recommendations.length > 0) {
        clearAllData();
      }
      fetchVersionInfo();
    }
  }, [isOpen]);

  useEffect(() => {
    if (versionInfo) {
      // 根据版本和目的设置默认标签页
      if (purpose === 'edit' || purpose === 'admin') {
        setActiveTab('admin');
      } else if (versionInfo.loginOptions.supportsUserRegistration) {
        setActiveTab('user');
      } else {
        setActiveTab('guest');
      }
    }
  }, [versionInfo, purpose]);

  const fetchVersionInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system/version');
      const data = await response.json();

      if (data.success) {
        setVersionInfo(data.version);
      }
    } catch (error) {
      console.error('获取版本信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) return;

    setIsSubmitting(true);
    setError('');

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
        const adminUser = {
          id: 'admin',
          name: '管理员',
          role: 'admin' as const,
          email: 'admin@system.com',
          isRealAdmin: true,
          token: data.token
        };

        // 使用AuthStateManager保存认证状态（包括token）
        login(adminUser, data.token);

        // 同时保存到UserContext以保持兼容性
        setUser(adminUser);

        onClose();

        // 根据目的进行跳转
        if (redirectTo) {
          window.location.href = redirectTo;
        } else if (purpose === 'edit' || purpose === 'admin') {
          window.location.href = '/admin';
        }
      } else {
        setError(data.error || '登录失败');
      }
    } catch (error) {
      console.error('管理员登录错误:', error);
      setError('网络错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserLogin = (selectedUser?: any) => {
    const newUser = selectedUser || {
      id: Date.now().toString(),
      name: userForm.name.trim(),
      role: userForm.role,
    };

    setUser(newUser);
    onClose();

    if (redirectTo) {
      window.location.href = redirectTo;
    }
  };

  const handleGuestAccess = () => {
    onClose();
    if (redirectTo) {
      window.location.href = redirectTo;
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {purpose === 'edit' ? '编辑文档' : purpose === 'admin' ? '管理后台' : '用户登录'}
              </h2>
              <p className="text-sm text-gray-600">
                {loading ? '正在检测版本...' : versionInfo?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">正在加载版本信息...</p>
          </div>
        ) : versionInfo ? (
          <div className="p-6">
            {/* 版本信息卡片 */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                {versionInfo.type === 'community' && <Users className="w-5 h-5 text-blue-600" />}
                {versionInfo.type === 'professional' && <Crown className="w-5 h-5 text-purple-600" />}
                {versionInfo.type === 'enterprise' && <Zap className="w-5 h-5 text-orange-600" />}
                <h3 className="font-semibold text-gray-900">{versionInfo.name}</h3>
                {versionInfo.hasValidLicense && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    已激活
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{versionInfo.description}</p>

              {versionInfo.licenseInfo && (
                <div className="text-xs text-gray-500">
                  组织: {versionInfo.licenseInfo.organization} |
                  最大用户数: {versionInfo.licenseInfo.maxUsers} |
                  到期时间: {new Date(versionInfo.licenseInfo.expiresAt).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* 登录选项标签页 */}
            <div className="flex border-b border-gray-200 mb-6">
              {versionInfo.loginOptions.guestAccess && (
                <button
                  onClick={() => setActiveTab('guest')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'guest'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  访客模式
                </button>
              )}

              {versionInfo.loginOptions.supportsUserRegistration && (
                <button
                  onClick={() => setActiveTab('user')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'user'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  用户登录
                </button>
              )}

              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                管理员登录
              </button>
            </div>

            {/* 登录内容 */}
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* 访客模式 */}
              {activeTab === 'guest' && versionInfo.loginOptions.guestAccess && (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">访客模式</h3>
                  <p className="text-gray-600 mb-6">
                    以访客身份浏览文档，可以查看内容和添加评论
                  </p>
                  <button
                    onClick={handleGuestAccess}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    继续访问
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 用户登录 */}
              {activeTab === 'user' && versionInfo.loginOptions.supportsUserRegistration && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">用户登录</h3>

                  {/* 预定义用户 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: 'user1', name: '张三', role: 'user' as const, email: 'zhangsan@example.com' },
                      { id: 'user2', name: '李四', role: 'user' as const, email: 'lisi@example.com' },
                      { id: 'user3', name: '王五', role: 'user' as const, email: 'wangwu@example.com' },
                    ].map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserLogin(user)}
                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">或者</span>
                    </div>
                  </div>

                  {/* 自定义用户 */}
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="输入您的姓名"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleUserLogin()}
                      disabled={!userForm.name.trim()}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      登录
                    </button>
                  </div>
                </div>
              )}

              {/* 管理员登录 */}
              {activeTab === 'admin' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Lock className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-medium text-gray-900">管理员登录</h3>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="请输入管理员密码"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                    />
                    <button
                      onClick={handleAdminLogin}
                      disabled={!adminPassword.trim() || isSubmitting}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? '登录中...' : '管理员登录'}
                    </button>
                  </div>

                  {versionInfo.type === 'community' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>开发环境默认密码：</strong> admin123
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 功能对比 */}
            {versionInfo.type === 'community' && (
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">升级到企业版获得更多功能</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    多用户协作
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    工作空间管理
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    版本控制
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    SSO集成
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600">无法加载版本信息</p>
          </div>
        )}
        </div>
      </div>
    </div>,
    document.body
  );
}
