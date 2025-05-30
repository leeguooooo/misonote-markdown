'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Key,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  X,
  Save
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  isActive: boolean;
  expiresAt?: string;
  lastUsedAt?: string;
  usageCount: number;
  rateLimit: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  description?: string;
}

interface ApiKeyManagerProps {
  onClose?: () => void;
}

export default function ApiKeyManager({ onClose }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.data || []);
      }
    } catch (error) {
      console.error('加载 API 密钥失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async (keyData: any) => {
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
        body: JSON.stringify(keyData),
      });

      if (response.ok) {
        const data = await response.json();
        setNewSecretKey(data.data.secretKey);
        setShowSecretKey(true);
        await loadApiKeys();
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        alert(error.error || '创建 API 密钥失败');
      }
    } catch (error) {
      console.error('创建 API 密钥失败:', error);
      alert('创建 API 密钥失败');
    }
  };

  const handleUpdateApiKey = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await loadApiKeys();
        setEditingKey(null);
      } else {
        const error = await response.json();
        alert(error.error || '更新 API 密钥失败');
      }
    } catch (error) {
      console.error('更新 API 密钥失败:', error);
      alert('更新 API 密钥失败');
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('确定要删除这个 API 密钥吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
      });

      if (response.ok) {
        await loadApiKeys();
      } else {
        const error = await response.json();
        alert(error.error || '删除 API 密钥失败');
      }
    } catch (error) {
      console.error('删除 API 密钥失败:', error);
      alert('删除 API 密钥失败');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  const getStatusIcon = (apiKey: ApiKey) => {
    if (!apiKey.isActive) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }

    if (apiKey.expiresAt && new Date(apiKey.expiresAt) <= new Date()) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }

    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = (apiKey: ApiKey) => {
    if (!apiKey.isActive) return '未激活';
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) <= new Date()) return '已过期';
    return '正常';
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
        <h2 className="text-2xl font-bold">API 密钥管理</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            创建 API 密钥
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

      {showCreateForm && (
        <ApiKeyForm
          onSubmit={handleCreateApiKey}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {newSecretKey && showSecretKey && (
        <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-yellow-800">新 API 密钥已创建</h3>
            <button
              onClick={() => setShowSecretKey(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            请立即复制并保存此密钥，它只会显示一次：
          </p>
          <div className="flex items-center gap-2 p-3 bg-white border rounded">
            <code className="flex-1 font-mono text-sm">{newSecretKey}</code>
            <button
              onClick={() => copyToClipboard(newSecretKey)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {apiKeys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            还没有创建 API 密钥
          </div>
        ) : (
          apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="border rounded-lg p-4 bg-white">
              {editingKey === apiKey.id ? (
                <ApiKeyForm
                  apiKey={apiKey}
                  onSubmit={(data) => handleUpdateApiKey(apiKey.id, data)}
                  onCancel={() => setEditingKey(null)}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-blue-500" />
                      <h3 className="font-semibold">{apiKey.name}</h3>
                      {getStatusIcon(apiKey)}
                      <span className="text-sm text-gray-600">
                        {getStatusText(apiKey)}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        前缀: <code className="bg-gray-100 px-1 rounded">{apiKey.keyPrefix}...</code>
                      </p>
                      <p className="text-sm text-gray-600">
                        权限: {apiKey.permissions.join(', ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        使用次数: {apiKey.usageCount} | 速率限制: {apiKey.rateLimit}/小时
                      </p>
                      {apiKey.description && (
                        <p className="text-sm text-gray-500">{apiKey.description}</p>
                      )}
                      {apiKey.expiresAt && (
                        <p className="text-sm text-gray-500">
                          过期时间: {new Date(apiKey.expiresAt).toLocaleString()}
                        </p>
                      )}
                      {apiKey.lastUsedAt && (
                        <p className="text-sm text-gray-500">
                          最后使用: {new Date(apiKey.lastUsedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingKey(apiKey.id)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteApiKey(apiKey.id)}
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

interface ApiKeyFormProps {
  apiKey?: ApiKey;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

function ApiKeyForm({ apiKey, onSubmit, onCancel }: ApiKeyFormProps) {
  const [formData, setFormData] = useState({
    name: apiKey?.name || '',
    permissions: apiKey?.permissions || ['read', 'write'],
    expiresAt: apiKey?.expiresAt ? apiKey.expiresAt.split('T')[0] : '',
    rateLimit: apiKey?.rateLimit || 1000,
    description: apiKey?.description || '',
    isActive: apiKey?.isActive !== false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
    };

    onSubmit(submitData);
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permission]
      });
    } else {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => p !== permission)
      });
    }
  };

  const availablePermissions = ['read', 'write', 'mcp', 'admin', '*'];

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-gray-50 space-y-4">
      <h3 className="font-semibold">{apiKey ? '编辑 API 密钥' : '创建新 API 密钥'}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">名称</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">速率限制（每小时）</label>
          <input
            type="number"
            value={formData.rateLimit}
            onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg"
            min="1"
            max="10000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">权限</label>
        <div className="flex flex-wrap gap-2">
          {availablePermissions.map(permission => (
            <label key={permission} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.permissions.includes(permission)}
                onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">{permission}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">过期时间（可选）</label>
        <input
          type="date"
          value={formData.expiresAt}
          onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          min={new Date().toISOString().split('T')[0]}
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
        <label htmlFor="isActive" className="text-sm">激活密钥</label>
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
