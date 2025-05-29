'use client';

import { useState, useEffect, useRef, startTransition, useCallback } from 'react';
import { MessageCircle, Send, Heart, Reply, Clock, ChevronDown, ChevronUp, Crown, Shield, Trash2 } from 'lucide-react';
import { useUser } from './UserManager';

interface Comment {
  id: string;
  content: string;
  author: string;
  authorRole?: 'admin' | 'user' | 'guest';
  avatar?: string;
  timestamp: Date;
  likes: number;
  replies: Comment[];
  isLiked?: boolean;
}

interface RightSidebarCommentsProps {
  docPath: string;
}

export default function RightSidebarComments({ docPath }: RightSidebarCommentsProps) {
  const { user, isLoggedIn } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // React 19 并发特性已集成到组件逻辑中

  // 确保组件已挂载，避免 hydration 错误
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 加载评论数据
  useEffect(() => {
    const loadComments = async () => {
      try {
        const response = await fetch(`/api/comments?docPath=${encodeURIComponent(docPath)}`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        } else {
          // 如果 API 失败，使用模拟数据
          const mockComments: Comment[] = [
            {
              id: '1',
              content: '这个文档写得很详细！',
              author: '张三',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
              likes: 5,
              replies: []
            },
            {
              id: '2',
              content: 'Mermaid 图表功能很棒',
              author: '李四',
              timestamp: new Date(Date.now() - 30 * 60 * 1000),
              likes: 3,
              replies: []
            }
          ];
          setComments(mockComments);
        }
      } catch (error) {
        console.error('Failed to load comments:', error);
        setComments([]);
      }
    };

    loadComments();
  }, [docPath]);

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim() || !isLoggedIn || !user) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          docPath,
          author: user.name,
          authorRole: user.role
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // 使用 startTransition 来标记非紧急的状态更新
        startTransition(() => {
          setComments(prev => [data.comment, ...prev]);
        });
        setNewComment('');
      } else {
        // 如果 API 失败，本地添加
        const comment: Comment = {
          id: Date.now().toString(),
          content: newComment,
          author: user.name,
          authorRole: user.role,
          timestamp: new Date(),
          likes: 0,
          replies: []
        };
        startTransition(() => {
          setComments(prev => [comment, ...prev]);
        });
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      // 本地添加作为备选
      const comment: Comment = {
        id: Date.now().toString(),
        content: newComment,
        author: user.name,
        authorRole: user.role,
        timestamp: new Date(),
        likes: 0,
        replies: []
      };
      startTransition(() => {
        setComments(prev => [comment, ...prev]);
      });
      setNewComment('');
    }

    setIsLoading(false);
  }, [newComment, isLoggedIn, user, docPath]);

  const handleSubmitReply = useCallback(async (parentId: string) => {
    if (!replyContent.trim() || !isLoggedIn || !user) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent,
          docPath,
          parentId,
          author: user.name,
          authorRole: user.role
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // 使用 startTransition 来标记非紧急的状态更新
        startTransition(() => {
          setComments(prev => prev.map(comment =>
            comment.id === parentId
              ? { ...comment, replies: [...comment.replies, data.comment] }
              : comment
          ));
        });
      } else {
        // 本地添加回复
        const reply: Comment = {
          id: `${parentId}-${Date.now()}`,
          content: replyContent,
          author: user.name,
          authorRole: user.role,
          timestamp: new Date(),
          likes: 0,
          replies: []
        };

        startTransition(() => {
          setComments(prev => prev.map(comment =>
            comment.id === parentId
              ? { ...comment, replies: [...comment.replies, reply] }
              : comment
          ));
        });
      }
    } catch (error) {
      console.error('Failed to submit reply:', error);
    }

    // 清理状态时不使用 startTransition，因为这些是紧急更新
    setReplyContent('');
    setReplyTo(null);
    setIsLoading(false);
  }, [replyContent, isLoggedIn, user, docPath]);

  const handleLike = async (commentId: string, isReply = false, parentId?: string) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          action: 'like',
          docPath
        }),
      });

      if (response.ok || true) { // 总是执行本地更新
        if (isReply && parentId) {
          setComments(prev => prev.map(comment =>
            comment.id === parentId
              ? {
                  ...comment,
                  replies: comment.replies.map(reply =>
                    reply.id === commentId
                      ? { ...reply, likes: reply.likes + (reply.isLiked ? -1 : 1), isLiked: !reply.isLiked }
                      : reply
                  )
                }
              : comment
          ));
        } else {
          setComments(prev => prev.map(comment =>
            comment.id === commentId
              ? { ...comment, likes: comment.likes + (comment.isLiked ? -1 : 1), isLiked: !comment.isLiked }
              : comment
          ));
        }
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string, isReply = false, parentId?: string) => {
    if (!user?.isRealAdmin) return;

    if (!confirm('确定要删除这条评论吗？')) return;

    setDeletingCommentId(commentId);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await fetch(`/api/admin/delete-comment?commentId=${commentId}&docPath=${encodeURIComponent(docPath)}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        // 从本地状态中删除评论
        if (isReply && parentId) {
          setComments(prev => prev.map(comment =>
            comment.id === parentId
              ? {
                  ...comment,
                  replies: comment.replies.filter(reply => reply.id !== commentId)
                }
              : comment
          ));
        } else {
          setComments(prev => prev.filter(comment => comment.id !== commentId));
        }
      } else {
        alert('删除失败，请重试');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('删除失败，请重试');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // 检查是否是有效的日期
    if (isNaN(dateObj.getTime())) {
      return '时间未知';
    }

    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return dateObj.toLocaleDateString('zh-CN');
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

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-3 h-3 text-yellow-400" />;
      case 'user':
        return null;
      default:
        return <Shield className="w-3 h-3 text-gray-400" />;
    }
  };

  const CommentItem = ({ comment, isReply = false, parentId }: {
    comment: Comment;
    isReply?: boolean;
    parentId?: string;
  }) => {
    const replyInputRef = useRef<HTMLTextAreaElement>(null);
    const [hasSetInitialFocus, setHasSetInitialFocus] = useState(false);
    const composingRef = useRef(false); // 使用 ref 来避免状态更新导致的重渲染

    // React 19 并发特性优化焦点管理

    // 简化的焦点设置逻辑
    useEffect(() => {
      if (replyTo === comment.id && replyInputRef.current && !hasSetInitialFocus) {
        const textarea = replyInputRef.current;
        // 简单直接的焦点设置
        textarea.focus();
        setHasSetInitialFocus(true);
      }

      // 当回复框关闭时重置状态
      if (replyTo !== comment.id) {
        setHasSetInitialFocus(false);
      }
    }, [replyTo, comment.id, hasSetInitialFocus]);

    // 处理中文输入法事件
    const handleCompositionStart = useCallback(() => {
      composingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback(() => {
      composingRef.current = false;
    }, []);

    // 使用非受控组件方式处理中文输入
    const [localValue, setLocalValue] = useState('');

    // 同步外部状态到本地状态
    useEffect(() => {
      if (replyTo === comment.id) {
        setLocalValue(replyContent);
      }
    }, [replyTo, comment.id, replyContent]);

    // 处理输入变化
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setLocalValue(value);

      // 只在非输入法组合期间更新外部状态
      if (!composingRef.current) {
        setReplyContent(value);
      }
    }, []);

    return (
    <div className={`${isReply ? 'ml-6 mt-3' : 'mb-4'} bg-gray-50   rounded-lg p-3`}>
      <div className="flex items-start gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${getUserBadgeColor(comment.authorRole)}`}>
          {comment.author[0]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900   text-sm">{comment.author}</span>
            {getRoleIcon(comment.authorRole)}
            <span className="text-xs text-gray-500   flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(comment.timestamp)}
            </span>
          </div>

          <p className="text-gray-700   text-sm mb-2 leading-relaxed">{comment.content}</p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleLike(comment.id, isReply, parentId)}
              className={`flex items-center gap-1 text-xs transition-colors ${
                comment.isLiked
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-red-500    '
              }`}
            >
              <Heart className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`} />
              {comment.likes > 0 && <span>{comment.likes}</span>}
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500     transition-colors"
              >
                <Reply className="w-3 h-3" />
                回复
              </button>
            )}

            {/* 管理员删除按钮 */}
            {user?.isRealAdmin && (
              <button
                onClick={() => handleDeleteComment(comment.id, isReply, parentId)}
                disabled={deletingCommentId === comment.id}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500     transition-colors disabled:opacity-50"
                title="删除评论"
              >
                <Trash2 className="w-3 h-3" />
                {deletingCommentId === comment.id ? '删除中...' : '删除'}
              </button>
            )}
          </div>

          {/* 回复输入框 - 使用优化后的状态管理 */}
          {replyTo === comment.id && (
            <div className="mt-3 p-2 bg-white   rounded">
              <textarea
                ref={replyInputRef}
                value={localValue}
                onChange={handleInputChange}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={(e) => {
                  handleCompositionEnd();
                  // 输入法结束后确保状态同步
                  const value = e.currentTarget.value;
                  setLocalValue(value);
                  setReplyContent(value);
                }}
                placeholder={`回复 ${comment.author}...`}
                className="w-full p-2 text-sm border border-gray-300   rounded resize-none bg-white   text-gray-900   placeholder-gray-500   focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    // 立即清理状态，确保响应性
                    setReplyTo(null);
                    setReplyContent('');
                    setLocalValue('');
                  }}
                  className="px-2 py-1 text-xs text-gray-600   hover:text-gray-800  "
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    // 确保使用最新的本地值
                    if (localValue.trim()) {
                      setReplyContent(localValue);
                      handleSubmitReply(comment.id);
                    }
                  }}
                  disabled={!localValue.trim() || isLoading}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  回复
                </button>
              </div>
            </div>
          )}

          {/* 回复列表 */}
          {comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .map(reply => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    isReply={true}
                    parentId={comment.id}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
    );
  };

  // 避免 hydration 错误，等待客户端挂载
  if (!isMounted) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200  ">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900  ">
              评论
            </h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500  ">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200  ">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-gray-900  ">
            评论 ({comments.length})
          </h3>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-gray-500 hover:text-gray-700    "
        >
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* 新评论输入 */}
          <div className="p-4 border-b border-gray-200  ">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium ${getUserBadgeColor(user?.role)}`}>
                    {user?.name[0]}
                  </div>
                  <span className="text-sm text-gray-700  ">
                    以 <strong>{user?.name}</strong> 身份发表评论
                  </span>
                  {getRoleIcon(user?.role)}
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="分享你的想法..."
                  className="w-full p-3 text-sm border border-gray-300   rounded resize-none bg-white   text-gray-900   placeholder-gray-500   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    {isLoading ? '发布中...' : '发布'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500   text-sm mb-3">
                  请先登录后再发表评论
                </p>
                <p className="text-xs text-gray-400  ">
                  点击右上角的&ldquo;登录&rdquo;按钮选择身份
                </p>
              </div>
            )}
          </div>

          {/* 评论列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500   text-sm">还没有评论，来发表第一个评论吧！</p>
              </div>
            ) : (
              comments
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .map(comment => (
                  <CommentItem key={comment.id} comment={comment} />
                ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
