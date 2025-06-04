'use client';

import { useEffect, useState } from 'react';
import { AuthDataCleaner } from '@/utils/authDataCleaner';
import { AlertTriangle, CheckCircle, RefreshCw, X } from 'lucide-react';

export default function AuthDataCleanupProvider({ children }: { children: React.ReactNode }) {
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [cleanupReport, setCleanupReport] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // 在客户端启动时检查认证数据
    const checkAuthData = () => {
      try {
        const report = AuthDataCleaner.getCleanupReport();

        if (report.needsCleanup) {
          console.warn('检测到认证数据问题:', report);
          setCleanupReport(report);
          setShowCleanupDialog(true);
        } else {
          // 认证数据正常，执行轻量级维护
          console.log('认证数据检查通过，执行轻量级维护');
          AuthDataCleaner.performMaintenance();
        }
      } catch (error) {
        console.error('检查认证数据失败:', error);
      }
    };

    // 延迟执行，确保页面已加载
    const timer = setTimeout(checkAuthData, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleAutoFix = async () => {
    setIsProcessing(true);
    try {
      const result = AuthDataCleaner.autoFix();
      console.log('自动修复结果:', result);

      if (result.fixed) {
        // 修复成功，重新检查
        const newReport = AuthDataCleaner.getCleanupReport();
        if (!newReport.needsCleanup) {
          setShowCleanupDialog(false);
          setCleanupReport(null);
        } else {
          setCleanupReport(newReport);
        }
      }
    } catch (error) {
      console.error('自动修复失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForceCleanup = () => {
    setIsProcessing(true);
    try {
      AuthDataCleaner.forceCleanup();
      setShowCleanupDialog(false);
      setCleanupReport(null);

      // 刷新页面以确保状态完全重置
      window.location.reload();
    } catch (error) {
      console.error('强制清理失败:', error);
      setIsProcessing(false);
    }
  };

  const handleIgnore = () => {
    setShowCleanupDialog(false);
    setCleanupReport(null);

    // 记录用户选择忽略
    try {
      localStorage.setItem('authCleanupIgnored', Date.now().toString());
    } catch (error) {
      console.warn('无法记录忽略状态:', error);
    }
  };

  return (
    <>
      {children}

      {/* 清理对话框 */}
      {showCleanupDialog && cleanupReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    检测到认证数据问题
                  </h2>
                  <p className="text-sm text-gray-600">
                    发现旧版本或损坏的认证数据
                  </p>
                </div>
              </div>
              <button
                onClick={handleIgnore}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6">
              <div className="space-y-4">
                {/* 版本信息 */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">当前版本:</span>
                      <span className="font-medium">{cleanupReport.currentVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">检测版本:</span>
                      <span className="font-medium">{cleanupReport.savedVersion}</span>
                    </div>
                  </div>
                </div>

                {/* 问题列表 */}
                {cleanupReport.issues.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">发现的问题:</h4>
                    <ul className="space-y-1">
                      {cleanupReport.issues.map((issue: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-red-600">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 建议 */}
                {cleanupReport.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">建议操作:</h4>
                    <ul className="space-y-1">
                      {cleanupReport.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-blue-600">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 说明 */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>说明:</strong> 清理认证数据不会影响您的文档内容，只会移除旧的登录状态和缓存数据。
                    清理后您需要重新登录。
                  </p>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleAutoFix}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                自动修复
              </button>

              <button
                onClick={handleForceCleanup}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                强制清理
              </button>

              <button
                onClick={handleIgnore}
                disabled={isProcessing}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                忽略
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
