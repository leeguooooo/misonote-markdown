'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Bookmark, Highlighter, X } from 'lucide-react';
import { useUser } from './UserManager';

interface Annotation {
  id: string;
  text: string;
  comment: string;
  type: 'highlight' | 'note' | 'bookmark';
  position: {
    start: number;
    end: number;
    startContainer: string;
    endContainer: string;
  };
  timestamp: Date;
  author: string;
}

interface TextAnnotationProps {
  children: React.ReactNode;
  docPath: string;
  className?: string;
}

export default function TextAnnotation({ children, docPath, className = '' }: TextAnnotationProps) {
  const { user, isLoggedIn } = useUser();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [showAnnotationMenu, setShowAnnotationMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [annotationType, setAnnotationType] = useState<'highlight' | 'note' | 'bookmark'>('highlight');
  const [showAnnotationDetail, setShowAnnotationDetail] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 加载标注数据
  useEffect(() => {
    const loadAnnotations = async () => {
      try {
        const response = await fetch(`/api/annotations?docPath=${encodeURIComponent(docPath)}`);
        if (response.ok) {
          const data = await response.json();
          const loadedAnnotations = data.annotations || [];
          setAnnotations(loadedAnnotations);

          // 延迟应用标注样式，确保 DOM 已渲染
          setTimeout(() => {
            reapplyAnnotations(loadedAnnotations);
          }, 100);
        }
      } catch (error) {
        console.error('Failed to load annotations:', error);
      }
    };

    loadAnnotations();
  }, [docPath]);

  // 重新应用所有标注样式
  const reapplyAnnotations = (annotationsToApply: Annotation[]) => {
    if (!containerRef.current) return;

    // 清除现有的标注样式
    const existingAnnotations = containerRef.current.querySelectorAll('[data-annotation-id]');
    existingAnnotations.forEach(element => {
      const parent = element.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(element.textContent || ''), element);
        parent.normalize();
      }
    });

    // 重新应用标注
    annotationsToApply.forEach(annotation => {
      applyAnnotationByText(annotation);
    });
  };

  // 根据文本内容查找并应用标注
  const applyAnnotationByText = (annotation: Annotation) => {
    if (!containerRef.current) return;

    const walker = document.createTreeWalker(
      containerRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    // 查找包含标注文本的节点
    for (const textNode of textNodes) {
      const text = textNode.textContent || '';
      const index = text.indexOf(annotation.text);

      if (index !== -1) {
        try {
          const range = document.createRange();
          range.setStart(textNode, index);
          range.setEnd(textNode, index + annotation.text.length);

          // 检查选中的文本是否匹配
          if (range.toString() === annotation.text) {
            applyAnnotationStyle(range, annotation);
            break; // 只应用第一个匹配的
          }
        } catch (error) {
          console.error('Error applying annotation:', error);
        }
      }
    }
  };

  // 处理文本选择
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowAnnotationMenu(false);
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) {
      setShowAnnotationMenu(false);
      return;
    }

    // 只有登录用户才能创建标注
    if (!isLoggedIn) {
      setShowAnnotationMenu(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectedText(selectedText);
    setSelectionRange(range);
    setMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setShowAnnotationMenu(true);
  };

  // 创建标注
  const createAnnotation = async (type: 'highlight' | 'note' | 'bookmark') => {
    if (!selectionRange || !selectedText) return;

    const annotation: Annotation = {
      id: Date.now().toString(),
      text: selectedText,
      comment: type === 'highlight' ? '' : commentText,
      type,
      position: {
        start: selectionRange.startOffset,
        end: selectionRange.endOffset,
        startContainer: selectionRange.startContainer.textContent || '',
        endContainer: selectionRange.endContainer.textContent || ''
      },
      timestamp: new Date(),
      author: user?.name || '匿名用户'
    };

    try {
      // 保存到服务器
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...annotation,
          docPath
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnnotations(prev => [...prev, data.annotation]);

        // 应用样式到选中文本
        applyAnnotationStyle(selectionRange, data.annotation);
      } else {
        // 如果保存失败，仍然本地添加
        setAnnotations(prev => [...prev, annotation]);
        applyAnnotationStyle(selectionRange, annotation);
      }
    } catch (error) {
      console.error('Failed to save annotation:', error);
      // 保存失败时本地添加
      setAnnotations(prev => [...prev, annotation]);
      applyAnnotationStyle(selectionRange, annotation);
    }

    // 清理状态
    setShowAnnotationMenu(false);
    setShowCommentDialog(false);
    setCommentText('');
    window.getSelection()?.removeAllRanges();
  };

  // 应用标注样式
  const applyAnnotationStyle = (range: Range, annotation: Annotation) => {
    const span = document.createElement('span');
    span.className = getAnnotationClass(annotation.type);
    span.setAttribute('data-annotation-id', annotation.id);

    // 创建更详细的 title
    const typeText = annotation.type === 'highlight' ? '高亮' :
                    annotation.type === 'note' ? '笔记' : '书签';
    const title = annotation.comment ?
      `${typeText}: ${annotation.comment} (作者: ${annotation.author})` :
      `${typeText} (作者: ${annotation.author})`;
    span.title = title;

    try {
      range.surroundContents(span);
    } catch (error) {
      // 如果无法直接包围，使用提取和插入的方法
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }
  };

  // 获取标注样式类
  const getAnnotationClass = (type: 'highlight' | 'note' | 'bookmark') => {
    const baseClass = 'annotation cursor-pointer transition-all duration-200';
    switch (type) {
      case 'highlight':
        return `${baseClass} bg-yellow-200 dark:bg-yellow-800 hover:bg-yellow-300 dark:hover:bg-yellow-700`;
      case 'note':
        return `${baseClass} bg-blue-200 dark:bg-blue-800 hover:bg-blue-300 dark:hover:bg-blue-700 border-b-2 border-blue-400 dark:border-blue-600`;
      case 'bookmark':
        return `${baseClass} bg-green-200 dark:bg-green-800 hover:bg-green-300 dark:hover:bg-green-700 border-l-2 border-green-500 dark:border-green-400 pl-1`;
      default:
        return baseClass;
    }
  };

  // 删除标注
  const removeAnnotation = async (annotationId: string, isAdminDelete = false) => {
    try {
      let response;

      if (isAdminDelete && user?.isRealAdmin) {
        // 管理员删除
        const headers: Record<string, string> = {};
        if (user?.token) {
          headers['Authorization'] = `Bearer ${user.token}`;
        }

        response = await fetch(`/api/admin/delete-annotation?annotationId=${annotationId}&docPath=${encodeURIComponent(docPath)}`, {
          method: 'DELETE',
          headers,
        });
      } else {
        // 普通用户删除自己的标注
        response = await fetch(`/api/annotations?annotationId=${annotationId}&docPath=${encodeURIComponent(docPath)}`, {
          method: 'DELETE',
        });
      }

      if (response.ok || true) { // 总是执行本地删除
        setAnnotations(prev => prev.filter(a => a.id !== annotationId));

        // 移除 DOM 中的标注样式
        const element = document.querySelector(`[data-annotation-id="${annotationId}"]`);
        if (element) {
          const parent = element.parentNode;
          if (parent) {
            parent.replaceChild(document.createTextNode(element.textContent || ''), element);
            parent.normalize(); // 合并相邻的文本节点
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete annotation:', error);
      // 即使删除失败也执行本地删除
      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    }
  };

  // 处理标注点击
  const handleAnnotationClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const annotationElement = target.closest('[data-annotation-id]');

    if (annotationElement) {
      const annotationId = annotationElement.getAttribute('data-annotation-id');
      const annotation = annotations.find(a => a.id === annotationId);

      if (annotation) {
        setSelectedAnnotation(annotation);
        setShowAnnotationDetail(true);
      }
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleTextSelection);
    container.addEventListener('click', handleAnnotationClick);

    return () => {
      container.removeEventListener('mouseup', handleTextSelection);
      container.removeEventListener('click', handleAnnotationClick);
    };
  }, [annotations]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAnnotationMenu && !event.target) {
        setShowAnnotationMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAnnotationMenu]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {children}

      {/* 标注菜单 */}
      {showAnnotationMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2"
          style={{
            left: menuPosition.x - 100,
            top: menuPosition.y - 60,
          }}
        >
          <div className="flex items-center gap-1">
            <button
              onClick={() => createAnnotation('highlight')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="高亮"
            >
              <Highlighter className="w-4 h-4 text-yellow-600" />
            </button>
            <button
              onClick={() => {
                setAnnotationType('note');
                setShowCommentDialog(true);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="添加笔记"
            >
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={() => createAnnotation('bookmark')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="书签"
            >
              <Bookmark className="w-4 h-4 text-green-600" />
            </button>
            <button
              onClick={() => setShowAnnotationMenu(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="关闭"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* 评论对话框 */}
      {showCommentDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              添加笔记
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">选中文本：</p>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                "{selectedText}"
              </div>
            </div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="输入你的笔记..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowCommentDialog(false);
                  setShowAnnotationMenu(false);
                  setCommentText('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                取消
              </button>
              <button
                onClick={() => createAnnotation(annotationType)}
                disabled={!commentText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存笔记
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 标注详情对话框 */}
      {showAnnotationDetail && selectedAnnotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {selectedAnnotation.type === 'highlight' && <Highlighter className="w-5 h-5 text-yellow-600" />}
                {selectedAnnotation.type === 'note' && <MessageSquare className="w-5 h-5 text-blue-600" />}
                {selectedAnnotation.type === 'bookmark' && <Bookmark className="w-5 h-5 text-green-600" />}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedAnnotation.type === 'highlight' ? '高亮标注' :
                   selectedAnnotation.type === 'note' ? '笔记标注' : '书签标注'}
                </h3>
              </div>
              <button
                onClick={() => setShowAnnotationDetail(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">选中文本：</label>
                <div className="mt-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100">
                  "{selectedAnnotation.text}"
                </div>
              </div>

              {selectedAnnotation.comment && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">备注内容：</label>
                  <div className="mt-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100">
                    {selectedAnnotation.comment}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>作者：{selectedAnnotation.author}</span>
                <span>创建时间：{new Date(selectedAnnotation.timestamp).toLocaleString('zh-CN')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              {/* 只有作者或管理员可以删除 */}
              {(selectedAnnotation.author === user?.name || user?.isRealAdmin) && (
                <button
                  onClick={() => {
                    const isAdminDelete = user?.isRealAdmin && selectedAnnotation.author !== user.name;
                    if (isAdminDelete && !confirm(`确定要删除 ${selectedAnnotation.author} 的标注吗？`)) {
                      return;
                    }
                    removeAnnotation(selectedAnnotation.id, isAdminDelete);
                    setShowAnnotationDetail(false);
                  }}
                  className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  删除标注
                </button>
              )}
              <button
                onClick={() => setShowAnnotationDetail(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 标注列表 */}
      {annotations.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            我的标注 ({annotations.length})
          </h4>
          <div className="space-y-3">
            {annotations.map(annotation => (
              <div
                key={annotation.id}
                className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                onClick={() => {
                  setSelectedAnnotation(annotation);
                  setShowAnnotationDetail(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {annotation.type === 'highlight' && <Highlighter className="w-4 h-4 text-yellow-600" />}
                      {annotation.type === 'note' && <MessageSquare className="w-4 h-4 text-blue-600" />}
                      {annotation.type === 'bookmark' && <Bookmark className="w-4 h-4 text-green-600" />}
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {annotation.type === 'highlight' ? '高亮' : annotation.type === 'note' ? '笔记' : '书签'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        by {annotation.author}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      "{annotation.text}"
                    </p>
                    {annotation.comment && (
                      <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                        {annotation.comment}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {/* 管理员可以删除任何标注 */}
                    {user?.isRealAdmin && annotation.author !== user.name && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`确定要删除 ${annotation.author} 的标注吗？`)) {
                            removeAnnotation(annotation.id, true);
                          }
                        }}
                        className="p-1 text-orange-400 hover:text-red-500 transition-colors"
                        title="管理员删除"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}

                    {/* 用户可以删除自己的标注 */}
                    {(annotation.author === user?.name || user?.isRealAdmin) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnnotation(annotation.id, user?.isRealAdmin && annotation.author !== user.name);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="删除标注"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
