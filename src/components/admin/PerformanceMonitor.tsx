'use client';

import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceData {
  storage: {
    avgReadLatency: number;
    avgWriteLatency: number;
    p95ReadLatency: number;
    p95WriteLatency: number;
    cacheHitRate: number;
    cacheSize: number;
    operationsPerSecond: number;
  };
  collaboration: {
    documentsInMemory: number;
    totalUpdates: number;
    compressedUpdates: number;
    averageUpdateSize: number;
    memoryUsage: number;
    operationsPerSecond: number;
    conflictResolutions: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: number;
    activeConnections: number;
  };
}

export default function PerformanceMonitor() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5秒
  
  // 历史数据用于图表
  const [historyData, setHistoryData] = useState<{
    timestamps: string[];
    readLatency: number[];
    writeLatency: number[];
    cacheHitRate: number[];
    memoryUsage: number[];
    operationsPerSecond: number[];
  }>({
    timestamps: [],
    readLatency: [],
    writeLatency: [],
    cacheHitRate: [],
    memoryUsage: [],
    operationsPerSecond: []
  });
  
  // 获取性能数据
  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/admin/performance');
      
      if (response.ok) {
        const newData = await response.json();
        const payload = newData.data || newData;
        setData(payload);
        
        // 更新历史数据
        const now = new Date().toLocaleTimeString();
        setHistoryData(prev => {
          const maxPoints = 20; // 保留最近20个数据点
          
          return {
            timestamps: [...prev.timestamps, now].slice(-maxPoints),
            readLatency: [...prev.readLatency, payload.storage.avgReadLatency].slice(-maxPoints),
            writeLatency: [...prev.writeLatency, payload.storage.avgWriteLatency].slice(-maxPoints),
            cacheHitRate: [...prev.cacheHitRate, payload.storage.cacheHitRate * 100].slice(-maxPoints),
            memoryUsage: [...prev.memoryUsage, payload.system.memoryUsage].slice(-maxPoints),
            operationsPerSecond: [...prev.operationsPerSecond, payload.storage.operationsPerSecond].slice(-maxPoints)
          };
        });
      }
    } catch (error) {
      console.error('获取性能数据失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 自动刷新
  useEffect(() => {
    fetchPerformanceData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="text-center text-gray-500 py-8">
        无法获取性能数据
      </div>
    );
  }
  
  // 图表配置
  const latencyChartData = {
    labels: historyData.timestamps,
    datasets: [
      {
        label: '读取延迟 (ms)',
        data: historyData.readLatency,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: '写入延迟 (ms)',
        data: historyData.writeLatency,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
    ],
  };
  
  const cacheChartData = {
    labels: historyData.timestamps,
    datasets: [
      {
        label: '缓存命中率 (%)',
        data: historyData.cacheHitRate,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
    ],
  };
  
  const memoryChartData = {
    labels: ['已使用', '可用'],
    datasets: [
      {
        data: [data.system.memoryUsage, 100 - data.system.memoryUsage],
        backgroundColor: ['#ef4444', '#e5e7eb'],
        borderWidth: 0,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">性能监控</h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              自动刷新
            </label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="border rounded px-2 py-1"
              disabled={!autoRefresh}
            >
              <option value={1000}>1秒</option>
              <option value={5000}>5秒</option>
              <option value={10000}>10秒</option>
              <option value={30000}>30秒</option>
            </select>
            <button
              onClick={fetchPerformanceData}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              刷新
            </button>
          </div>
        </div>
      </div>
      
      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">平均读取延迟</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.storage.avgReadLatency.toFixed(1)}ms
              </p>
            </div>
            <div className="text-blue-500">📖</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">平均写入延迟</p>
              <p className="text-2xl font-bold text-red-600">
                {data.storage.avgWriteLatency.toFixed(1)}ms
              </p>
            </div>
            <div className="text-red-500">✏️</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">缓存命中率</p>
              <p className="text-2xl font-bold text-green-600">
                {(data.storage.cacheHitRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-green-500">🎯</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">活跃文档</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.collaboration.documentsInMemory}
              </p>
            </div>
            <div className="text-purple-500">📄</div>
          </div>
        </div>
      </div>
      
      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 延迟趋势图 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">读写延迟趋势</h3>
          <div className="h-64">
            <Line data={latencyChartData} options={chartOptions} />
          </div>
        </div>
        
        {/* 缓存命中率趋势 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">缓存命中率趋势</h3>
          <div className="h-64">
            <Line data={cacheChartData} options={chartOptions} />
          </div>
        </div>
        
        {/* 内存使用情况 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">内存使用情况</h3>
          <div className="h-64">
            <Doughnut 
              data={memoryChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }} 
            />
          </div>
        </div>
        
        {/* 协作统计 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">协作统计</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">总更新次数:</span>
              <span className="font-semibold">{data.collaboration.totalUpdates.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">压缩更新:</span>
              <span className="font-semibold">{data.collaboration.compressedUpdates.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">平均更新大小:</span>
              <span className="font-semibold">{data.collaboration.averageUpdateSize.toFixed(0)} bytes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">冲突解决次数:</span>
              <span className="font-semibold">{data.collaboration.conflictResolutions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">操作/秒:</span>
              <span className="font-semibold">{data.collaboration.operationsPerSecond.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 详细统计表格 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">详细性能指标</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  指标
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  当前值
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P95值
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  读取延迟
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {data.storage.avgReadLatency.toFixed(1)}ms
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {data.storage.p95ReadLatency.toFixed(1)}ms
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    data.storage.avgReadLatency < 100 ? 'bg-green-100 text-green-800' :
                    data.storage.avgReadLatency < 500 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {data.storage.avgReadLatency < 100 ? '优秀' :
                     data.storage.avgReadLatency < 500 ? '良好' : '需优化'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  写入延迟
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {data.storage.avgWriteLatency.toFixed(1)}ms
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {data.storage.p95WriteLatency.toFixed(1)}ms
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    data.storage.avgWriteLatency < 200 ? 'bg-green-100 text-green-800' :
                    data.storage.avgWriteLatency < 1000 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {data.storage.avgWriteLatency < 200 ? '优秀' :
                     data.storage.avgWriteLatency < 1000 ? '良好' : '需优化'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  缓存命中率
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(data.storage.cacheHitRate * 100).toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    data.storage.cacheHitRate > 0.8 ? 'bg-green-100 text-green-800' :
                    data.storage.cacheHitRate > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {data.storage.cacheHitRate > 0.8 ? '优秀' :
                     data.storage.cacheHitRate > 0.6 ? '良好' : '需优化'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
