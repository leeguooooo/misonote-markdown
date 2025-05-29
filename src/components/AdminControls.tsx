'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, Shield, MessageCircle, Highlighter, Bookmark } from 'lucide-react';
import { useUser } from './UserManager';

interface AdminControlsProps {
  docPath: string;
}

export default function AdminControls({ docPath }: AdminControlsProps) {
  const { user, isAdmin } = useUser();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<'comments' | 'annotations' | 'all' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 只有真正的管理员才能看到控制面板
  if (!isAdmin || !user?.isRealAdmin) {
    return null;
  }

  const handleDeleteRequest = (type: 'comments' | 'annotations' | 'all') => {
    setDeleteType(type);
    setShowConfirmDialog(true);
  };

  const executeDelete = async () => {
    if (!deleteType) return;

    setIsDeleting(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // 添加 JWT token 到请求头
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      if (deleteType === 'comments' || deleteType === 'all') {
        // 删除评论
        const response = await fetch('/api/admin/clear-comments', {
          method: 'POST',
          headers,
          body: JSON.stringify({ docPath }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete comments');
        }
      }

      if (deleteType === 'annotations' || deleteType === 'all') {
        // 删除标注
        const response = await fetch('/api/admin/clear-annotations', {
          method: 'POST',
          headers,
          body: JSON.stringify({ docPath }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete annotations');
        }
      }

      // 刷新页面以更新显示
      window.location.reload();
    } catch (error) {
      console.error('Delete operation failed:', error);
      alert('删除操作失败，请重试');
    } finally {
      setIsDeleting(false);
      setShowConfirmDialog(false);
      setDeleteType(null);
    }
  };

  const getDeleteMessage = () => {
    switch (deleteType) {
      case 'comments':
        return '确定要删除此文档的所有评论吗？';
      case 'annotations':
        return '确定要删除此文档的所有标注吗？';
      case 'all':
        return '确定要删除此文档的所有评论和标注吗？';
      default:
        return '';
    }
  };

  const getDeleteTitle = () => {
    switch (deleteType) {
      case 'comments':
        return '删除所有评论';
      case 'annotations':
        return '删除所有标注';
      case 'all':
        return '删除所有内容';
      default:
        return '';
    }
  };

  return (
    <>
      {/* 管理员控制面板 */}
      <div className="fixed bottom-4 left-20 z-50 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">管理员控制</span>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleDeleteRequest('comments')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            清空评论
          </button>

          <button
            onClick={() => handleDeleteRequest('annotations')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <Highlighter className="w-4 h-4" />
            清空标注
          </button>

          <button
            onClick={() => handleDeleteRequest('all')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium"
          >
            <Trash2 className="w-4 h-4" />
            清空所有
          </button>
        </div>
      </div>

      {/* 确认对话框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {getDeleteTitle()}
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                {getDeleteMessage()}
              </p>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ <strong>警告：</strong>此操作不可撤销！所有相关数据将被永久删除。
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setDeleteType(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    删除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    确认删除
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
