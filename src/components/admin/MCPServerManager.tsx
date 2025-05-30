'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Settings,
  Trash2,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Save,
  X,
  Send
} from 'lucide-react';
import { MCPServerConfig } from '@/types/mcp';

interface MCPServerManagerProps {
  onClose?: () => void;
}

export default function MCPServerManager({ onClose }: MCPServerManagerProps) {
  const [servers, setServers] = useState<MCPServerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingServer, setEditingServer] = useState<string | null>(null);
  const [testingServer, setTestingServer] = useState<string | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const response = await fetch('/api/mcp/servers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setServers(data.data || []);
      }
    } catch (error) {
      console.error('加载 MCP 服务器失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddServer = async (serverData: Partial<MCPServerConfig>) => {
    try {
      const response = await fetch('/api/mcp/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
        body: JSON.stringify(serverData),
      });

      if (response.ok) {
        await loadServers();
        setShowAddForm(false);
      } else {
        const error = await response.json();
        alert(error.error || '添加服务器失败');
      }
    } catch (error) {
      console.error('添加服务器失败:', error);
      alert('添加服务器失败');
    }
  };

  const handleUpdateServer = async (id: string, updates: Partial<MCPServerConfig>) => {
    try {
      const response = await fetch(`/api/mcp/servers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await loadServers();
        setEditingServer(null);
      } else {
        const error = await response.json();
        alert(error.error || '更新服务器失败');
      }
    } catch (error) {
      console.error('更新服务器失败:', error);
      alert('更新服务器失败');
    }
  };

  const handleDeleteServer = async (id: string) => {
    if (!confirm('确定要删除这个 MCP 服务器吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/mcp/servers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
      });

      if (response.ok) {
        await loadServers();
      } else {
        const error = await response.json();
        alert(error.error || '删除服务器失败');
      }
    } catch (error) {
      console.error('删除服务器失败:', error);
      alert('删除服务器失败');
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingServer(id);

    try {
      const response = await fetch(`/api/mcp/servers/${id}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        alert(`连接测试成功！响应时间: ${result.data.responseTime}ms`);
      } else {
        alert(`连接测试失败: ${result.data.error}`);
      }

      await loadServers(); // 刷新状态
    } catch (error) {
      console.error('连接测试失败:', error);
      alert('连接测试失败');
    } finally {
      setTestingServer(null);
    }
  };

  const getStatusIcon = (status: MCPServerConfig['connectionStatus']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'testing':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: MCPServerConfig['connectionStatus']) => {
    switch (status) {
      case 'connected':
        return '已连接';
      case 'error':
        return '连接错误';
      case 'testing':
        return '测试中...';
      default:
        return '未连接';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">MCP 服务器管理</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            添加服务器
          </button>
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
      </div>

      {showAddForm && (
        <MCPServerForm
          onSubmit={handleAddServer}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <div className="grid gap-4">
        {servers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            还没有配置 MCP 服务器
          </div>
        ) : (
          servers.map((server) => (
            <div key={server.id} className="border rounded-lg p-4 bg-white">
              {editingServer === server.id ? (
                <MCPServerForm
                  server={server}
                  onSubmit={(data) => handleUpdateServer(server.id, data)}
                  onCancel={() => setEditingServer(null)}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{server.name}</h3>
                      {getStatusIcon(server.connectionStatus)}
                      <span className="text-sm text-gray-600">
                        {getStatusText(server.connectionStatus)}
                      </span>
                      {!server.isActive && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                          未激活
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{server.url}</p>
                    {server.description && (
                      <p className="text-sm text-gray-500 mt-1">{server.description}</p>
                    )}
                    {server.errorMessage && (
                      <p className="text-sm text-red-500 mt-1">错误: {server.errorMessage}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestConnection(server.id)}
                      disabled={testingServer === server.id}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="测试连接"
                    >
                      <TestTube className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingServer(server.id)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteServer(server.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface MCPServerFormProps {
  server?: MCPServerConfig;
  onSubmit: (data: Partial<MCPServerConfig>) => void;
  onCancel: () => void;
}

function MCPServerForm({ server, onSubmit, onCancel }: MCPServerFormProps) {
  const [formData, setFormData] = useState({
    name: server?.name || '',
    url: server?.url || '',
    apiKey: server?.apiKey || '',
    description: server?.description || '',
    isActive: server?.isActive !== false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-gray-50 space-y-4">
      <h3 className="font-semibold">{server ? '编辑服务器' : '添加新服务器'}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">服务器名称</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">服务器地址</label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="https://your-server.com"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">API 密钥</label>
        <input
          type="password"
          value={formData.apiKey}
          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">描述（可选）</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="isActive" className="text-sm">激活服务器</label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save className="w-4 h-4" />
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          <X className="w-4 h-4" />
          取消
        </button>
      </div>
    </form>
  );
}
