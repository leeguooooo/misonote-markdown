'use client';

import { useState } from 'react';
import { useAuthState } from '@/core/auth/useAuthState';
import { RefreshCw, Trash2, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function AuthDebugPage() {
  const {
    isAuthenticated,
    user,
    token,
    isLoading,
    error,
    verifyAuth,
    logout,
    forceRefresh,
    clearAllData,
    diagnose,
    isAdmin,
    isLoggedIn
  } = useAuthState();

  const [diagnosis, setDiagnosis] = useState<any>(null);

  const handleDiagnose = () => {
    const result = diagnose();
    setDiagnosis(result);
  };

  const handleClearData = () => {
    if (confirm('确定要清除所有认证数据吗？')) {
      clearAllData();
      setDiagnosis(null);
    }
  };

  const handleForceRefresh = async () => {
    await forceRefresh();
    handleDiagnose(); // 重新诊断
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">认证状态调试</h1>

        {/* 当前状态 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">当前认证状态</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">认证状态:</span>
                <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {isAuthenticated ? '已认证' : '未认证'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                <span className="font-medium">登录状态:</span>
                <span>{isLoggedIn ? '已登录' : '未登录'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-purple-500" />
                <span className="font-medium">管理员权限:</span>
                <span>{isAdmin ? '是' : '否'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-gray-500" />
                <span className="font-medium">加载状态:</span>
                <span>{isLoading ? '加载中...' : '已完成'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="font-medium">用户信息:</span>
                <pre className="text-sm bg-gray-100 p-2 rounded mt-1">
                  {user ? JSON.stringify(user, null, 2) : '无'}
                </pre>
              </div>
              
              <div>
                <span className="font-medium">Token:</span>
                <div className="text-sm bg-gray-100 p-2 rounded mt-1 break-all">
                  {token ? `${token.substring(0, 50)}...` : '无'}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
              <strong>错误:</strong> {error}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">操作</h2>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={verifyAuth}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              验证认证状态
            </button>
            
            <button
              onClick={handleForceRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              强制刷新
            </button>
            
            <button
              onClick={handleDiagnose}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              <Info className="w-4 h-4" />
              诊断状态
            </button>
            
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <AlertTriangle className="w-4 h-4" />
              登出
            </button>
            
            <button
              onClick={handleClearData}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              清除所有数据
            </button>
          </div>
        </div>

        {/* 诊断结果 */}
        {diagnosis && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">诊断结果</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Token有效性:</span>
                  <span className={`ml-2 ${diagnosis.hasValidToken ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnosis.hasValidToken ? '✅ 有效' : '❌ 无效'}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium">认证版本:</span>
                  <span className="ml-2">{diagnosis.version}</span>
                </div>
                
                <div>
                  <span className="font-medium">Token年龄:</span>
                  <span className="ml-2">{Math.round(diagnosis.tokenAge / 1000 / 60)} 分钟</span>
                </div>
                
                <div>
                  <span className="font-medium">状态年龄:</span>
                  <span className="ml-2">{Math.round(diagnosis.stateAge / 1000 / 60)} 分钟</span>
                </div>
              </div>
              
              {diagnosis.recommendations.length > 0 && (
                <div>
                  <span className="font-medium">建议:</span>
                  <ul className="mt-2 space-y-1">
                    {diagnosis.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-yellow-700">
                        <AlertTriangle className="w-4 h-4" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* localStorage 内容 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">localStorage 内容</h2>
          
          <div className="space-y-3">
            {[
              'admin-token',
              'currentUser',
              'authState',
              'authVersion'
            ].map(key => {
              const value = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
              return (
                <div key={key} className="border rounded p-3">
                  <div className="font-medium text-gray-700">{key}:</div>
                  <div className="text-sm bg-gray-100 p-2 rounded mt-1 break-all">
                    {value || '(空)'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
