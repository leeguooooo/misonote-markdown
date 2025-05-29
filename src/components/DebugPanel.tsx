'use client';

import { useState } from 'react';
import { MessageCircle, Highlighter, Eye, EyeOff } from 'lucide-react';

export default function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="显示调试面板"
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">🔧 功能调试面板</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="隐藏调试面板"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-700 dark:text-green-300">固定导航栏已启用</span>
        </div>

        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
          <MessageCircle className="w-4 h-4 text-blue-600" />
          <span className="text-blue-700 dark:text-blue-300">右侧评论栏已启用</span>
        </div>

        <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
          <Highlighter className="w-4 h-4 text-yellow-600" />
          <span className="text-yellow-700 dark:text-yellow-300">划词标注已启用</span>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            💡 <strong>使用提示：</strong>
          </p>
          <ul className="text-xs text-gray-500 dark:text-gray-500 mt-1 space-y-1">
            <li>• 登录后选中文档文字查看标注菜单</li>
            <li>• 点击文档中的标注查看详情</li>
            <li>• 滚动页面测试固定导航</li>
            <li>• 在右侧查看评论栏</li>
            <li>• 数据自动保存到文件，刷新不丢失</li>
          </ul>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              所有功能正常运行
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
