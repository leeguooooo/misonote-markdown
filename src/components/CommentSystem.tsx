'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Send, Heart, Reply, Clock } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  author: string;
  avatar?: string;
  timestamp: Date;
  likes: number;
  replies: Comment[];
  isLiked?: boolean;
}

interface CommentSystemProps {
  docPath: string;
  className?: string;
}

export default function CommentSystem({ docPath, className = '' }: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 加载评论数据
  useEffect(() => {
    const loadComments = async () => {
      try {
        // 先使用模拟数据，确保组件能正常显示
        const mockComments: Comment[] = [
          {
            id: '1',
            content: '这个文档写得很详细，对新手很友好！特别是快速开始部分，步骤清晰易懂。',
            author: '张三',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            likes: 5,
            replies: [
              {
                id: '1-1',
                content: '同意！我按照步骤很快就搭建好了环境。',
                author: '李四',
                timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
                likes: 2,
                replies: []
              }
            ]
          },
          {
            id: '2',
            content: 'Mermaid 图表功能很棒，可以直接在文档中绘制流程图，不需要额外的工具。',
            author: '王五',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            likes: 3,
            replies: []
          }
        ];

        setComments(mockComments);

        // 后续可以替换为真实 API 调用
        // const response = await fetch(`/api/comments?docPath=${encodeURIComponent(docPath)}`);
        // if (response.ok) {
        //   const data = await response.json();
        //   setComments(data.comments || []);
        // }
      } catch (error) {
        console.error('Failed to load comments:', error);
        setComments([]);
      }
    };

    loadComments();
  }, [docPath]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsLoading(true);

    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 500));

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      author: '当前用户', // 实际项目中从用户状态获取
      timestamp: new Date(),
      likes: 0,
      replies: []
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
    setIsLoading(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsLoading(true);

    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 500));

    const reply: Comment = {
      id: `${parentId}-${Date.now()}`,
      content: replyContent,
      author: '当前用户',
      timestamp: new Date(),
      likes: 0,
      replies: []
    };

    setComments(prev => prev.map(comment =>
      comment.id === parentId
        ? { ...comment, replies: [...comment.replies, reply] }
        : comment
    ));

    setReplyContent('');
    setReplyTo(null);
    setIsLoading(false);
  };

  const handleLike = (commentId: string, isReply = false, parentId?: string) => {
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
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const CommentItem = ({ comment, isReply = false, parentId }: {
    comment: Comment;
    isReply?: boolean;
    parentId?: string;
  }) => (
    <div className={`${isReply ? 'ml-12 mt-4' : 'mb-6'} bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {comment.author[0]}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900 dark:text-gray-100">{comment.author}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(comment.timestamp)}
            </span>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{comment.content}</p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLike(comment.id, isReply, parentId)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                comment.isLiked
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
              {comment.likes > 0 && <span>{comment.likes}</span>}
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                <Reply className="w-4 h-4" />
                回复
              </button>
            )}
          </div>

          {/* 回复输入框 */}
          {replyTo === comment.id && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`回复 ${comment.author}...`}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setReplyTo(null)}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyContent.trim() || isLoading}
                  className="px-4 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  回复
                </button>
              </div>
            </div>
          )}

          {/* 回复列表 */}
          {comment.replies.length > 0 && (
            <div className="mt-4">
              {comment.replies.map(reply => (
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

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 rounded-xl p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          评论 ({comments.length})
        </h3>
      </div>

      {/* 新评论输入 */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="分享你的想法..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              支持 Markdown 语法
            </span>
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              {isLoading ? '发布中...' : '发布评论'}
            </button>
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      <div>
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">还没有评论，来发表第一个评论吧！</p>
          </div>
        ) : (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}
