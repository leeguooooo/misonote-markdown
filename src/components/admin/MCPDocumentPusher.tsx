'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Folder,
  X
} from 'lucide-react';
import { MCPServerConfig } from '@/types/mcp';

interface Document {
  name: string;
  path: string;
  content: string;
  type: 'file' | 'folder';
  isSelected?: boolean;
}

interface MCPDocumentPusherProps {
  documents: Document[];
  onClose?: () => void;
}

export default function MCPDocumentPusher({ documents, onClose }: MCPDocumentPusherProps) {
  const [servers, setServers] = useState<MCPServerConfig[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [pushing, setPushing] = useState(false);
  const [pushResults, setPushResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadServers();
    // 默认选择所有文档
    const docPaths = documents.filter(doc => doc.type === 'file').map(doc => doc.path);
    setSelectedDocs(new Set(docPaths));
  }, [documents]);

  const loadServers = async () => {
    try {
      const response = await fetch('/api/mcp/servers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const activeServers = (data.data || []).filter((server: MCPServerConfig) => server.isActive);
        setServers(activeServers);

        if (activeServers.length > 0) {
          setSelectedServer(activeServers[0].id);
        }
      }
    } catch (error) {
      console.error('加载 MCP 服务器失败:', error);
    }
  };

  const handleDocumentToggle = (path: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedDocs(newSelected);
  };

  const handleSelectAll = () => {
    const allDocPaths = documents.filter(doc => doc.type === 'file').map(doc => doc.path);
    setSelectedDocs(new Set(allDocPaths));
  };

  const handleSelectNone = () => {
    setSelectedDocs(new Set());
  };

  const handlePush = async () => {
    if (!selectedServer || selectedDocs.size === 0) {
      alert('请选择服务器和要推送的文档');
      return;
    }

    setPushing(true);
    setPushResults([]);
    setShowResults(true);

    try {
      const selectedDocuments = documents
        .filter(doc => doc.type === 'file' && selectedDocs.has(doc.path))
        .map(doc => ({
          path: doc.path,
          content: doc.content,
          title: doc.name.replace('.md', ''),
          operation: 'create' as const,
          author: '管理员',
          timestamp: new Date(),
        }));

      const operation = selectedDocuments.length > 1 ? 'batch' : 'single';

      const response = await fetch('/api/mcp/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
        body: JSON.stringify({
          serverId: selectedServer,
          documents: operation === 'batch' ? selectedDocuments : selectedDocuments[0],
          operation,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (operation === 'batch') {
          setPushResults(result.data.results || []);
        } else {
          setPushResults([result.data]);
        }
      } else {
        setPushResults([{
          success: false,
          message: result.error || '推送失败',
          error: result.error,
        }]);
      }
    } catch (error: any) {
      setPushResults([{
        success: false,
        message: error.message || '推送过程中发生错误',
        error: error.message,
      }]);
    } finally {
      setPushing(false);
    }
  };

  const getResultIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const selectedServerInfo = servers.find(s => s.id === selectedServer);
  const fileDocuments = documents.filter(doc => doc.type === 'file');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">推送文档到 MCP 服务器</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
            关闭
          </button>
        )}
      </div>

      {servers.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">没有可用的 MCP 服务器</p>
          <p className="text-sm text-gray-500 mt-2">请先配置并激活至少一个 MCP 服务器</p>
        </div>
      ) : (
        <>
          {/* 服务器选择 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">选择目标服务器</label>
            <select
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {servers.map(server => (
                <option key={server.id} value={server.id}>
                  {server.name} ({server.url})
                </option>
              ))}
            </select>
            {selectedServerInfo && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {selectedServerInfo.connectionStatus === 'connected' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span>
                  {selectedServerInfo.connectionStatus === 'connected' ? '已连接' : '未连接'}
                </span>
              </div>
            )}
          </div>

          {/* 文档选择 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">选择要推送的文档</label>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  全选
                </button>
                <button
                  onClick={handleSelectNone}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  全不选
                </button>
              </div>
            </div>

            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {fileDocuments.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  没有可推送的文档
                </div>
              ) : (
                fileDocuments.map(doc => (
                  <div
                    key={doc.path}
                    className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocs.has(doc.path)}
                      onChange={() => handleDocumentToggle(doc.path)}
                      className="rounded"
                    />
                    <FileText className="w-4 h-4 text-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium">{doc.name}</div>
                      <div className="text-sm text-gray-500">{doc.path}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="text-sm text-gray-600">
              已选择 {selectedDocs.size} / {fileDocuments.length} 个文档
            </div>
          </div>

          {/* 推送按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handlePush}
              disabled={pushing || selectedDocs.size === 0 || !selectedServer}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pushing ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {pushing ? '推送中...' : '开始推送'}
            </button>
          </div>

          {/* 推送结果 */}
          {showResults && (
            <div className="space-y-4">
              <h3 className="font-semibold">推送结果</h3>
              <div className="border rounded-lg">
                {pushResults.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {pushing ? '推送中，请稍候...' : '暂无结果'}
                  </div>
                ) : (
                  pushResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border-b last:border-b-0"
                    >
                      {getResultIcon(result.success)}
                      <div className="flex-1">
                        <div className="font-medium">
                          {result.data?.path || `文档 ${index + 1}`}
                        </div>
                        <div className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                          {result.message}
                        </div>
                        {result.error && (
                          <div className="text-sm text-red-500 mt-1">
                            错误: {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
