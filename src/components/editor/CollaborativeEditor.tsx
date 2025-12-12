'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Collaboration } from '@tiptap/extension-collaboration';
import { CollaborationCursor } from '@tiptap/extension-collaboration-cursor';
import { Placeholder } from '@tiptap/extension-placeholder';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface CollaborativeEditorProps {
  documentId: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
  user?: {
    id: string;
    name: string;
    color: string;
    avatar?: string;
  };
}

interface OnlineUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
}

export default function CollaborativeEditor({
  documentId,
  initialContent = '',
  onContentChange,
  onSave,
  readOnly = false,
  user = {
    id: 'anonymous',
    name: '匿名用户',
    color: '#3b82f6'
  }
}: CollaborativeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  // Yjs文档和提供者
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  
  // 防抖保存
  const debouncedSave = useCallback(
    debounce(async () => {
      const currentEditor = editorInstanceRef.current;
      if (!currentEditor) return;
      
      setSaveStatus('saving');
      try {
        const content = currentEditor.getHTML();
        
        // 保存到服务器
        await fetch(`/api/documents/${documentId}/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            yjsState: ydocRef.current ? Array.from(Y.encodeStateAsUpdate(ydocRef.current)) : null
          }),
        });
        
        setSaveStatus('saved');
        onSave?.();
      } catch (error) {
        console.error('保存失败:', error);
        setSaveStatus('unsaved');
      }
    }, 2000),
    [documentId, onSave]
  );
  
  // 初始化协作编辑器
  useEffect(() => {
    if (!editorRef.current) return;
    
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    let provider: WebsocketProvider | null = null;
    let editorInstance: Editor | null = null;
    let cancelled = false;
    
    const init = async () => {
      try {
        const tokenResponse = await fetch('/api/collab/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId }),
        });
  
        if (!tokenResponse.ok) {
          throw new Error('无法获取协作令牌');
        }
  
        const { token } = await tokenResponse.json();
        if (cancelled) return;
        
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = process.env.NODE_ENV === 'development' 
          ? 'localhost:3002'
          : window.location.host.replace(':3001', ':3002');
        
        const wsUrl = `${wsProtocol}//${wsHost}/${documentId}?token=${encodeURIComponent(token)}`;
        
        provider = new WebsocketProvider(wsUrl, documentId, ydoc, {
          params: {
            userId: user.id,
            userName: user.name,
            userColor: user.color,
          }
        });
        providerRef.current = provider;
        
        provider.on('status', (event: { status: string }) => {
          if (cancelled) return;
          setConnectionStatus(event.status === 'connected' ? 'connected' : 'disconnected');
        });
        
        const isAuthError = (code?: number) => code === 1008 || code === 4401 || code === 4403;

        provider.on('connection-error', (event: Event) => {
          console.error('WebSocket连接错误:', event);
          const code = (event as any)?.code as number | undefined;
          if (isAuthError(code)) {
            alert('认证失败，请重新登录');
            window.location.href = '/admin';
          }
        });
        
        provider.on('connection-close', (event: CloseEvent | null) => {
          if (isAuthError(event?.code)) {
            console.error('认证失败，连接被关闭:', event);
          }
        });
        
        provider.awareness.on('change', () => {
          if (cancelled) return;
          const users: OnlineUser[] = [];
          provider!.awareness.getStates().forEach((state, clientId) => {
            if (clientId !== provider!.awareness.clientID && state.user) {
              users.push({
                id: state.user.id,
                name: state.user.name,
                color: state.user.color,
                avatar: state.user.avatar
              });
            }
          });
          setOnlineUsers(users);
        });
        
        provider.awareness.setLocalStateField('user', {
          id: user.id,
          name: user.name,
          color: user.color,
          avatar: user.avatar
        });
        
        editorInstance = new Editor({
          element: editorRef.current!,
          extensions: [
            StarterKit.configure({
              history: false,
            }),
            Collaboration.configure({
              document: ydoc,
            }),
            CollaborationCursor.configure({
              provider,
              user: {
                name: user.name,
                color: user.color,
              },
            }),
            Placeholder.configure({
              placeholder: '开始协作编辑...',
            }),
          ],
          content: initialContent,
          editable: !readOnly,
          onUpdate: ({ editor }) => {
            const content = editor.getHTML();
            onContentChange?.(content);
            setSaveStatus('unsaved');
            debouncedSave();
          },
        });
        
        if (!cancelled) {
          editorInstanceRef.current = editorInstance;
          setEditor(editorInstance);
        }
      } catch (error) {
        console.error('初始化协作编辑器失败:', error);
      }
    };
    
    init();
    
    return () => {
      cancelled = true;
      editorInstance?.destroy();
      provider?.destroy();
      editorInstanceRef.current = null;
      ydoc.destroy();
    };
  }, [documentId, user.id, user.name, user.color, user.avatar, initialContent, readOnly, onContentChange, debouncedSave]);
  
  // 手动保存
  const handleSave = useCallback(async () => {
    if (!editor) return;
    
    setSaveStatus('saving');
    try {
      const content = editor.getHTML();
      
      await fetch(`/api/documents/${documentId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          yjsState: ydocRef.current ? Array.from(Y.encodeStateAsUpdate(ydocRef.current)) : null
        }),
      });
      
      setSaveStatus('saved');
      onSave?.();
    } catch (error) {
      console.error('保存失败:', error);
      setSaveStatus('unsaved');
    }
  }, [editor, documentId, onSave]);
  
  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);
  
  return (
    <div className="collaborative-editor h-full flex flex-col">
      {/* 工具栏 */}
      <div className="editor-toolbar flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center space-x-4">
          {/* 连接状态 */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-600">
              {connectionStatus === 'connected' ? '已连接' : 
               connectionStatus === 'connecting' ? '连接中...' : '连接断开'}
            </span>
          </div>
          
          {/* 在线用户 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">在线用户:</span>
            <div className="flex -space-x-2">
              {onlineUsers.slice(0, 5).map((onlineUser) => (
                <div
                  key={onlineUser.id}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: onlineUser.color }}
                  title={onlineUser.name}
                >
                  {onlineUser.avatar ? (
                    <img src={onlineUser.avatar} alt={onlineUser.name} className="w-full h-full rounded-full" />
                  ) : (
                    onlineUser.name.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
              {onlineUsers.length > 5 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-white text-xs">
                  +{onlineUsers.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* 保存状态 */}
          <div className="flex items-center space-x-2">
            {saveStatus === 'saving' && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
            <span className={`text-sm ${
              saveStatus === 'saved' ? 'text-green-600' : 
              saveStatus === 'saving' ? 'text-blue-600' : 'text-orange-600'
            }`}>
              {saveStatus === 'saved' ? '已保存' : 
               saveStatus === 'saving' ? '保存中...' : '未保存'}
            </span>
          </div>
          
          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || readOnly}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存 (Ctrl+S)
          </button>
        </div>
      </div>
      
      {/* 编辑器内容 */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={editorRef}
          className="h-full p-4 prose prose-sm max-w-none focus:outline-none"
          style={{
            minHeight: '100%',
          }}
        />
      </div>
      
      {/* 在线用户光标样式 */}
      <style jsx global>{`
        .collaboration-cursor__caret {
          position: relative;
          margin-left: -1px;
          margin-right: -1px;
          border-left: 1px solid #0d0d0d;
          border-right: 1px solid #0d0d0d;
          word-break: normal;
          pointer-events: none;
        }
        
        .collaboration-cursor__label {
          position: absolute;
          top: -1.4em;
          left: -1px;
          font-size: 12px;
          font-style: normal;
          font-weight: 600;
          line-height: normal;
          user-select: none;
          color: #0d0d0d;
          padding: 0.1rem 0.3rem;
          border-radius: 3px 3px 3px 0;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

// 防抖工具函数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
