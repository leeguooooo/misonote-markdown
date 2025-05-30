'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Database, Clock } from 'lucide-react';

interface CacheStats {
  filesCached: number;
  directoriesCached: number;
  cacheHitRate: number;
}

export default function CacheMonitor() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/cache', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setLastUpdate(new Date());
      } else {
        console.error('获取缓存统计失败');
      }
    } catch (error) {
      console.error('获取缓存统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    if (!confirm('确定要清除所有缓存吗？这将导致下次访问时重新读取所有文件。')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/cache', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        alert('缓存已清除');
        fetchStats(); // 重新获取统计信息
      } else {
        alert('清除缓存失败');
      }
    } catch (error) {
      console.error('清除缓存失败:', error);
      alert('清除缓存失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // 每30秒自动刷新统计信息
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">缓存监控</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          
          <button
            onClick={clearCache}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            清除缓存
          </button>
        </div>
      </div>

      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">文件缓存</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.filesCached}
            </div>
            <div className="text-xs text-blue-700">个文件已缓存</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">目录缓存</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.directoriesCached}
            </div>
            <div className="text-xs text-green-700">个目录已缓存</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">命中率</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {(stats.cacheHitRate * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-purple-700">缓存命中率</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">
            {loading ? '加载中...' : '暂无数据'}
          </div>
        </div>
      )}

      {lastUpdate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            最后更新：{lastUpdate.toLocaleString()}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">缓存策略说明</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• 基于文件修改时间的智能缓存</li>
          <li>• 文件未变化时直接返回缓存内容</li>
          <li>• 目录扫描缓存有效期：5秒</li>
          <li>• 自动检测文件变化并更新缓存</li>
        </ul>
      </div>
    </div>
  );
}
