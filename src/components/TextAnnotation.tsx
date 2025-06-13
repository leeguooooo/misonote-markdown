'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Bookmark, Highlighter, X } from 'lucide-react';
import { useUser } from './UserManager';
import { GlobalModal, ModalBody, ModalFooter } from './ui/GlobalModal';

interface Reply {
  id: string;
  content: string;
  author: string;
  authorRole?: string;
  timestamp: Date;
  likes: number;
  isLiked?: boolean;
}

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
    // 添加更精确的位置信息
    xpath?: string; // XPath路径
    textOffset?: number; // 在整个文档中的文本偏移量
    contextBefore?: string; // 前文上下文
    contextAfter?: string; // 后文上下文
  };
  timestamp: Date;
  author: string;
  authorRole?: string;
  likes: number;
  isLiked?: boolean;
  replies: Reply[];
  isResolved?: boolean; // 是否已解决（用于问题类型的标注）
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

  // 生成元素的XPath
  const getXPath = (element: Node): string => {
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentNode!;
    }

    const parts: string[] = [];
    let current = element as Element;

    while (current && current !== containerRef.current) {
      let index = 1;
      let sibling = current.previousElementSibling;

      while (sibling) {
        if (sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousElementSibling;
      }

      parts.unshift(`${current.tagName.toLowerCase()}[${index}]`);
      current = current.parentElement!;
    }

    return parts.join('/');
  };

  // 根据XPath查找元素
  const findElementByXPath = (xpath: string): Element | null => {
    if (!containerRef.current) return null;

    const parts = xpath.split('/');
    let current: Element = containerRef.current;

    for (const part of parts) {
      const match = part.match(/^(\w+)\[(\d+)\]$/);
      if (!match) continue;

      const [, tagName, indexStr] = match;
      const index = parseInt(indexStr, 10);

      const children = Array.from(current.children).filter(
        child => child.tagName.toLowerCase() === tagName
      );

      if (children.length < index) return null;
      current = children[index - 1];
    }

    return current;
  };

  // 获取文本在整个容器中的偏移量
  const getTextOffset = (container: Element, targetNode: Node, targetOffset: number): number => {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    let offset = 0;
    let node;

    while (node = walker.nextNode()) {
      if (node === targetNode) {
        return offset + targetOffset;
      }
      offset += node.textContent?.length || 0;
    }

    return offset;
  };

  // 根据文本偏移量查找位置
  const findPositionByOffset = (container: Element, targetOffset: number): { node: Node; offset: number } | null => {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentOffset = 0;
    let node;

    while (node = walker.nextNode()) {
      const nodeLength = node.textContent?.length || 0;

      if (currentOffset + nodeLength >= targetOffset) {
        return {
          node,
          offset: targetOffset - currentOffset
        };
      }

      currentOffset += nodeLength;
    }

    return null;
  };

  // 加载标注数据
  useEffect(() => {
    const loadAnnotations = async () => {
      try {
        const response = await fetch(`/api/annotations?docPath=${encodeURIComponent(docPath)}`);
        if (response.ok) {
          const data = await response.json();
          const rawAnnotations = data.annotations || [];

          // 转换数据库格式为前端格式
          const loadedAnnotations: Annotation[] = rawAnnotations.map((annotation: any) => ({
            id: annotation.id,
            text: annotation.selectedText,
            comment: annotation.commentText || '',
            type: annotation.annotationType,
            position: {
              start: annotation.positionData?.start || 0,
              end: annotation.positionData?.end || 0,
              startContainer: annotation.positionData?.startContainer || '',
              endContainer: annotation.positionData?.endContainer || '',
              xpath: annotation.positionData?.xpath,
              textOffset: annotation.positionData?.textOffset,
              contextBefore: annotation.positionData?.contextBefore,
              contextAfter: annotation.positionData?.contextAfter
            },
            timestamp: new Date(annotation.createdAt),
            author: annotation.authorName,
            authorRole: annotation.authorRole,
            likes: annotation.likes || 0,
            isLiked: false,
            replies: [],
            isResolved: annotation.isResolved || false
          }));

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

  // 当标注数据加载完成且内容已渲染时，重新应用标注样式
  useEffect(() => {
    if (annotations.length > 0 && containerRef.current) {
      // 延迟一点时间确保内容已完全渲染
      const timer = setTimeout(() => {
        reapplyAnnotations(annotations);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [annotations.length > 0 && containerRef.current?.textContent]);

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
      applyAnnotationByPosition(annotation);
    });
  };

  // 根据精确位置信息查找并应用标注
  const applyAnnotationByPosition = (annotation: Annotation) => {
    if (!containerRef.current) return;

    // 优先使用文本偏移量进行精确定位
    if (annotation.position.textOffset !== undefined) {
      const startPos = findPositionByOffset(containerRef.current, annotation.position.textOffset);
      const endPos = findPositionByOffset(containerRef.current, annotation.position.textOffset + annotation.text.length);

      if (startPos && endPos) {
        try {
          const range = document.createRange();
          range.setStart(startPos.node, startPos.offset);
          range.setEnd(endPos.node, endPos.offset);

          // 验证选中的文本是否匹配
          if (range.toString() === annotation.text) {
            applyAnnotationStyle(range, annotation);
            return;
          }
        } catch (error) {
          console.error('Error applying annotation by offset:', error);
        }
      }
    }

    // 备用方案：使用上下文匹配
    if (annotation.position.contextBefore && annotation.position.contextAfter) {
      const fullText = containerRef.current.textContent || '';
      const contextPattern = annotation.position.contextBefore + annotation.text + annotation.position.contextAfter;
      const contextIndex = fullText.indexOf(contextPattern);

      if (contextIndex !== -1) {
        const targetOffset = contextIndex + annotation.position.contextBefore.length;
        const startPos = findPositionByOffset(containerRef.current, targetOffset);
        const endPos = findPositionByOffset(containerRef.current, targetOffset + annotation.text.length);

        if (startPos && endPos) {
          try {
            const range = document.createRange();
            range.setStart(startPos.node, startPos.offset);
            range.setEnd(endPos.node, endPos.offset);

            if (range.toString() === annotation.text) {
              applyAnnotationStyle(range, annotation);
              return;
            }
          } catch (error) {
            console.error('Error applying annotation by context:', error);
          }
        }
      }
    }

    // 最后备用方案：使用原来的文本匹配（但只匹配第一个）
    const walker = document.createTreeWalker(
      containerRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent || '';
      const index = text.indexOf(annotation.text);

      if (index !== -1) {
        try {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + annotation.text.length);

          if (range.toString() === annotation.text) {
            applyAnnotationStyle(range, annotation);
            break; // 只应用第一个匹配的
          }
        } catch (error) {
          console.error('Error applying annotation by text:', error);
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

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // 计算菜单位置，使用 absolute 定位（相对于容器）
    // 获取容器的位置信息
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    // 计算相对于容器的位置
    const relativeX = rect.left - containerRect.left + rect.width / 2;
    const relativeY = rect.top - containerRect.top;

    // 菜单的基本位置
    let menuX = relativeX;
    let menuY = relativeY - 60; // 菜单显示在选中文本上方

    // 确保菜单不会超出视窗边界
    const menuWidth = 200; // 估算菜单宽度
    const menuHeight = 50; // 估算菜单高度

    // 水平边界检查（相对于视窗）
    const absoluteMenuX = rect.left + rect.width / 2;
    if (absoluteMenuX - menuWidth / 2 < 10) {
      menuX = 10 - containerRect.left + menuWidth / 2;
    } else if (absoluteMenuX + menuWidth / 2 > window.innerWidth - 10) {
      menuX = window.innerWidth - 10 - containerRect.left - menuWidth / 2;
    }

    // 垂直边界检查 - 如果上方空间不够，显示在下方
    if (rect.top < menuHeight + 10) {
      menuY = relativeY + rect.height + 10; // 显示在选中文本下方
    }

    setSelectedText(selectedText);
    setSelectionRange(range);
    setMenuPosition({
      x: menuX,
      y: menuY
    });
    setShowAnnotationMenu(true);
  };

  // 创建标注
  const createAnnotation = async (type: 'highlight' | 'note' | 'bookmark') => {
    if (!selectionRange || !selectedText || !containerRef.current) return;

    // 获取更精确的位置信息
    const startXPath = getXPath(selectionRange.startContainer);
    const startTextOffset = getTextOffset(containerRef.current, selectionRange.startContainer, selectionRange.startOffset);
    const endTextOffset = getTextOffset(containerRef.current, selectionRange.endContainer, selectionRange.endOffset);

    // 获取上下文信息
    const fullText = containerRef.current.textContent || '';
    const contextLength = 50;
    const contextBefore = fullText.substring(Math.max(0, startTextOffset - contextLength), startTextOffset);
    const contextAfter = fullText.substring(endTextOffset, Math.min(fullText.length, endTextOffset + contextLength));

    const annotation: Annotation = {
      id: Date.now().toString(),
      text: selectedText,
      comment: type === 'highlight' ? '' : commentText,
      type,
      position: {
        start: selectionRange.startOffset,
        end: selectionRange.endOffset,
        startContainer: selectionRange.startContainer.textContent || '',
        endContainer: selectionRange.endContainer.textContent || '',
        xpath: startXPath,
        textOffset: startTextOffset,
        contextBefore,
        contextAfter
      },
      timestamp: new Date(),
      author: user?.name || '匿名用户',
      authorRole: user?.role,
      likes: 0,
      isLiked: false,
      replies: [],
      isResolved: false
    };

    try {
      // 保存到服务器
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: annotation.text,
          comment: annotation.comment,
          type: annotation.type,
          position: annotation.position,
          docPath,
          author: annotation.author
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // 转换服务器返回的数据格式
        const serverAnnotation = data.annotation;
        const convertedAnnotation: Annotation = {
          id: serverAnnotation.id,
          text: serverAnnotation.selectedText,
          comment: serverAnnotation.commentText || '',
          type: serverAnnotation.annotationType,
          position: {
            start: serverAnnotation.positionData?.start || annotation.position.start,
            end: serverAnnotation.positionData?.end || annotation.position.end,
            startContainer: serverAnnotation.positionData?.startContainer || annotation.position.startContainer,
            endContainer: serverAnnotation.positionData?.endContainer || annotation.position.endContainer,
            xpath: serverAnnotation.positionData?.xpath || annotation.position.xpath,
            textOffset: serverAnnotation.positionData?.textOffset || annotation.position.textOffset,
            contextBefore: serverAnnotation.positionData?.contextBefore || annotation.position.contextBefore,
            contextAfter: serverAnnotation.positionData?.contextAfter || annotation.position.contextAfter
          },
          timestamp: new Date(serverAnnotation.createdAt),
          author: serverAnnotation.authorName,
          authorRole: serverAnnotation.authorRole,
          likes: serverAnnotation.likes || 0,
          isLiked: false,
          replies: [],
          isResolved: serverAnnotation.isResolved || false
        };

        setAnnotations(prev => [...prev, convertedAnnotation]);

        // 应用样式到选中文本
        applyAnnotationStyle(selectionRange, convertedAnnotation);
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
    try {
      // 检查range是否有效
      if (!range || range.collapsed) {
        console.warn('Invalid range for annotation:', annotation.id);
        return;
      }

      // 检查是否与现有标注重叠
      const existingAnnotations = containerRef.current?.querySelectorAll('[data-annotation-id]');
      let isNested = false;

      if (existingAnnotations) {
        for (const existing of existingAnnotations) {
          const existingRange = document.createRange();
          try {
            existingRange.selectNodeContents(existing);
            // 检查是否有重叠
            if (range.compareBoundaryPoints(Range.START_TO_END, existingRange) > 0 &&
              range.compareBoundaryPoints(Range.END_TO_START, existingRange) < 0) {
              isNested = true;
              break;
            }
          } catch (e) {
            // 忽略错误，继续检查下一个
          }
        }
      }

      const span = document.createElement('span');
      span.className = getAnnotationClass(annotation.type, isNested);
      span.setAttribute('data-annotation-id', annotation.id);
      span.setAttribute('data-annotation-type', annotation.type);
      span.setAttribute('data-annotation-author', annotation.author);

      // 为重叠标注添加特殊样式
      if (isNested) {
        span.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.2)';
        span.style.borderRadius = '2px';
        span.style.margin = '0 1px';
      }

      // 创建更详细的 title
      const typeText = annotation.type === 'highlight' ? '高亮' :
        annotation.type === 'note' ? '笔记' : '书签';
      const title = annotation.comment ?
        `${typeText}: ${annotation.comment} (作者: ${annotation.author})` :
        `${typeText} (作者: ${annotation.author})`;
      span.title = title;

      // 检查是否可以直接包围内容
      const canSurround = range.startContainer === range.endContainer &&
        range.startContainer.nodeType === Node.TEXT_NODE;

      if (canSurround) {
        try {
          range.surroundContents(span);
        } catch (error) {
          console.warn('Cannot surround contents, using extract method:', error);
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
        }
      } else {
        // 对于跨节点的选择，使用提取和插入的方法
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }
    } catch (error) {
      console.error('Error applying annotation style:', error, annotation);
    }
  };

  // 获取标注样式类
  const getAnnotationClass = (type: 'highlight' | 'note' | 'bookmark', isNested = false) => {
    const baseClass = 'annotation cursor-pointer transition-all duration-200 relative';
    const nestedClass = isNested ? 'nested-annotation' : '';

    switch (type) {
      case 'highlight':
        return `${baseClass} ${nestedClass} bg-yellow-200 hover:bg-yellow-300 border-b border-yellow-400`;
      case 'note':
        return `${baseClass} ${nestedClass} bg-blue-200 hover:bg-blue-300 border-b-2 border-blue-400`;
      case 'bookmark':
        return `${baseClass} ${nestedClass} bg-green-200 hover:bg-green-300 border-l-2 border-green-500 pl-1`;
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
  }, []); // 移除 annotations 依赖，避免重复绑定事件

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAnnotationMenu && event.target) {
        const target = event.target as Element;
        const menu = document.querySelector('.annotation-menu');
        // 如果点击的不是菜单内部，则关闭菜单
        if (menu && !menu.contains(target)) {
          setShowAnnotationMenu(false);
        }
      }
    };

    if (showAnnotationMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAnnotationMenu]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {children}

      {/* 标注菜单 */}
      {showAnnotationMenu && (
        <div
          className="annotation-menu absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2"
          style={{
            left: menuPosition.x - 100,
            top: menuPosition.y,
          }}
        >
          {isLoggedIn ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => createAnnotation('highlight')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="高亮"
              >
                <Highlighter className="w-4 h-4 text-yellow-600" />
              </button>
              <button
                onClick={() => {
                  setAnnotationType('note');
                  setShowCommentDialog(true);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="添加笔记"
              >
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </button>
              <button
                onClick={() => createAnnotation('bookmark')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="书签"
              >
                <Bookmark className="w-4 h-4 text-green-600" />
              </button>
              <button
                onClick={() => setShowAnnotationMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="关闭"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="text-sm text-gray-600">请先登录以使用标注功能</span>
              <button
                onClick={() => setShowAnnotationMenu(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="关闭"
              >
                <X className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 评论对话框 */}
      <GlobalModal
        isOpen={showCommentDialog}
        onClose={() => {
          setShowCommentDialog(false);
          setShowAnnotationMenu(false);
          setCommentText('');
        }}
        title="添加笔记"
        width="sm"
      >
        <ModalBody>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">选中文本：</p>
            <div className="p-3 bg-gray-100 rounded-lg text-sm">
              "{selectedText}"
            </div>
          </div>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="输入你的笔记..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => {
              setShowCommentDialog(false);
              setShowAnnotationMenu(false);
              setCommentText('');
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
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
        </ModalFooter>
      </GlobalModal>

      {/* 标注详情对话框 */}
      <GlobalModal
        isOpen={showAnnotationDetail && !!selectedAnnotation}
        onClose={() => setShowAnnotationDetail(false)}
        width="sm"
        showCloseButton={false}
      >
        {selectedAnnotation && (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedAnnotation.type === 'highlight' && <Highlighter className="w-5 h-5 text-yellow-600" />}
                  {selectedAnnotation.type === 'note' && <MessageSquare className="w-5 h-5 text-blue-600" />}
                  {selectedAnnotation.type === 'bookmark' && <Bookmark className="w-5 h-5 text-green-600" />}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedAnnotation.type === 'highlight' ? '高亮标注' :
                      selectedAnnotation.type === 'note' ? '笔记标注' : '书签标注'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAnnotationDetail(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <ModalBody>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">选中文本：</label>
                  <div className="mt-1 p-3 bg-gray-100 rounded-lg text-sm text-gray-900">
                    "{selectedAnnotation.text}"
                  </div>
                </div>

                {selectedAnnotation.comment && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">备注内容：</label>
                    <div className="mt-1 p-3 bg-gray-100 rounded-lg text-sm text-gray-900">
                      {selectedAnnotation.comment}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>作者：{selectedAnnotation.author}</span>
                  <span>创建时间：{new Date(selectedAnnotation.timestamp).toLocaleString('zh-CN')}</span>
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
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
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            </ModalFooter>
          </>
        )}
      </GlobalModal>

      {/* 标注列表 */}
      {annotations.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            我的标注 ({annotations.length})
          </h4>
          <div className="space-y-3">
            {annotations.map(annotation => (
              <div
                key={annotation.id}
                className="p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
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
                      <span className="text-sm font-medium text-gray-900  ">
                        {annotation.type === 'highlight' ? '高亮' : annotation.type === 'note' ? '笔记' : '书签'}
                      </span>
                      <span className="text-xs text-gray-500  ">
                        by {annotation.author}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      "{annotation.text}"
                    </p>
                    {annotation.comment && (
                      <p className="text-sm text-gray-800 line-clamp-2">
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
