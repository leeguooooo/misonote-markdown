'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Eye,
  Edit3,
  Save,
  RotateCcw,
  Type,
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Table,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { marked } from 'marked';

interface FileItem {
  name: string;
  path: string;
  content: string;
  isNew?: boolean;
}

interface MarkdownEditorProps {
  file: FileItem;
  onContentChange: (content: string) => void;
  onSave: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export default function MarkdownEditor({
  file,
  onContentChange,
  onSave,
  isFullscreen = false,
  onToggleFullscreen,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [originalContent, setOriginalContent] = useState(file.content);

  useEffect(() => {
    setOriginalContent(file.content);
    setHasUnsavedChanges(false);
  }, [file.path]);

  useEffect(() => {
    setHasUnsavedChanges(file.content !== originalContent);
  }, [file.content, originalContent]);

  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    const newText = before + textToInsert + after;

    const newContent =
      textarea.value.substring(0, start) +
      newText +
      textarea.value.substring(end);

    onContentChange(newContent);

    // 设置新的光标位置
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const content = textarea.value;

    // 找到当前行的开始
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = content.indexOf('\n', start);
    const currentLine = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);

    // 检查是否已经有前缀
    if (currentLine.startsWith(prefix)) {
      // 移除前缀
      const newContent =
        content.substring(0, lineStart) +
        currentLine.substring(prefix.length) +
        content.substring(lineEnd === -1 ? content.length : lineEnd);
      onContentChange(newContent);
    } else {
      // 添加前缀
      const newContent =
        content.substring(0, lineStart) +
        prefix + currentLine +
        content.substring(lineEnd === -1 ? content.length : lineEnd);
      onContentChange(newContent);
    }
  };

  const toolbarButtons = [
    {
      icon: Bold,
      title: '粗体',
      action: () => insertText('**', '**', '粗体文本'),
    },
    {
      icon: Italic,
      title: '斜体',
      action: () => insertText('*', '*', '斜体文本'),
    },
    {
      icon: Type,
      title: '标题',
      action: () => insertAtLineStart('# '),
    },
    {
      icon: Link,
      title: '链接',
      action: () => insertText('[', '](url)', '链接文本'),
    },
    {
      icon: Quote,
      title: '引用',
      action: () => insertAtLineStart('> '),
    },
    {
      icon: Code,
      title: '代码',
      action: () => insertText('`', '`', '代码'),
    },
    {
      icon: List,
      title: '无序列表',
      action: () => insertAtLineStart('- '),
    },
    {
      icon: ListOrdered,
      title: '有序列表',
      action: () => insertAtLineStart('1. '),
    },
    {
      icon: Image,
      title: '图片',
      action: () => insertText('![', '](image-url)', '图片描述'),
    },
    {
      icon: Table,
      title: '表格',
      action: () => insertText('\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容 | 内容 | 内容 |\n'),
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    }

    // Tab 键插入空格
    if (e.key === 'Tab') {
      e.preventDefault();
      insertText('  ');
    }
  };

  const resetContent = () => {
    if (confirm('确定要重置内容吗？所有未保存的更改将丢失。')) {
      onContentChange(originalContent);
    }
  };

  return (
    <div className={`flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'
      }`}>
      111
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200  ">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-900  ">
            {file.name}
            {hasUnsavedChanges && (
              <span className="ml-2 text-sm text-orange-600">• 未保存</span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* 视图模式切换 */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1 rounded text-sm transition-colors ${mode === 'edit'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600  '
                }`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMode('split')}
              className={`px-3 py-1 rounded text-sm transition-colors ${mode === 'split'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600  '
                }`}
            >
              分屏
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1 rounded text-sm transition-colors ${mode === 'preview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600  '
                }`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <button
                onClick={resetContent}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800   transition-colors"
                title="重置内容"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onSave}
              className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              保存
            </button>

            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="px-3 py-1 text-gray-600 hover:text-gray-800   transition-colors"
                title={isFullscreen ? '退出全屏' : '全屏编辑'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 编辑工具栏 */}
      {(mode === 'edit' || mode === 'split') && (
        <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50  ">
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              onClick={button.action}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200   rounded transition-colors"
              title={button.title}
            >
              <button.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      )}

      {/* 编辑器内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 编辑器 */}
        {(mode === 'edit' || mode === 'split') && (
          <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
            <textarea
              ref={textareaRef}
              value={file.content}
              onChange={(e) => onContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 p-4 border-0 resize-none font-mono text-sm focus:ring-0 focus:outline-none   leading-relaxed"
              placeholder="在这里编写 Markdown 内容..."
              spellCheck={false}
            />
          </div>
        )}

        {/* 分割线 */}
        {mode === 'split' && (
          <div className="w-px bg-gray-200  " />
        )}

        {/* 预览 */}
        {(mode === 'preview' || mode === 'split') && (
          <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'} overflow-y-auto`}>
            <div className="p-4">
              <div className="prose max-w-none  ">
                <div dangerouslySetInnerHTML={{ __html: marked(file.content) }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500  ">
        <div className="flex items-center gap-4">
          <span>字符数: {file.content.length}</span>
          <span>行数: {file.content.split('\n').length}</span>
          <span>字数: {file.content.trim() ? file.content.trim().split(/\s+/).length : 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Ctrl+S 保存</span>
          <span>Tab 缩进</span>
        </div>
      </div>
    </div>
  );
}
