'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Wifi,
  WifiOff,
  Activity,
  RefreshCw
} from 'lucide-react';

interface TimeSecurityStatus {
  safe: boolean;
  confidence: 'high' | 'medium' | 'low';
  issues: string[];
  recommendations: string[];
  timeSource: 'network' | 'local' | 'cached';
  drift?: number;
  lastSync?: number;
}

const TimeSecurityMonitor: React.FC = () => {
  const [status, setStatus] = useState<TimeSecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 获取时间安全状态
  const fetchTimeSecurityStatus = async () => {
    try {
      setLoading(true);
      
      // 这里应该调用实际的API
      // const response = await fetch('/api/license/time-security');
      // const data = await response.json();
      
      // 模拟数据
      const mockData: TimeSecurityStatus = {
        safe: Math.random() > 0.3,
        confidence: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
        issues: Math.random() > 0.5 ? [] : [
          '检测到系统时间与网络时间存在较大偏差',
          '最近发现时间跳跃异常'
        ],
        recommendations: Math.random() > 0.5 ? [] : [
          '建议检查系统时间设置',
          '确保网络连接正常'
        ],
        timeSource: ['network', 'local', 'cached'][Math.floor(Math.random() * 3)] as any,
        drift: Math.random() * 10000 - 5000,
        lastSync: Date.now() - Math.random() * 300000
      };
      
      setStatus(mockData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('获取时间安全状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSecurityStatus();
    
    // 每30秒更新一次
    const interval = setInterval(fetchTimeSecurityStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTimeSourceIcon = (source: string) => {
    switch (source) {
      case 'network': return <Wifi className="h-4 w-4 text-green-600" />;
      case 'cached': return <Activity className="h-4 w-4 text-yellow-600" />;
      case 'local': return <WifiOff className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDrift = (drift?: number) => {
    if (drift === undefined) return 'N/A';
    const absDrift = Math.abs(drift);
    if (absDrift < 1000) return `${Math.round(drift)}ms`;
    if (absDrift < 60000) return `${(drift / 1000).toFixed(1)}s`;
    return `${(drift / 60000).toFixed(1)}min`;
  };

  const getDriftSeverity = (drift?: number) => {
    if (drift === undefined) return 'unknown';
    const absDrift = Math.abs(drift);
    if (absDrift < 1000) return 'low';
    if (absDrift < 30000) return 'medium';
    return 'high';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>检查时间安全状态...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            无法获取时间安全状态
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 总体状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            时间安全监控
          </CardTitle>
          <CardDescription>
            监控系统时间完整性，防止时间篡改攻击
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 安全状态 */}
          <div className="flex items-center justify-between">
            <span className="font-medium">安全状态</span>
            <div className="flex items-center gap-2">
              {status.safe ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <Badge variant={status.safe ? "default" : "destructive"}>
                {status.safe ? '安全' : '存在风险'}
              </Badge>
            </div>
          </div>

          {/* 可信度 */}
          <div className="flex items-center justify-between">
            <span className="font-medium">时间可信度</span>
            <Badge className={getConfidenceColor(status.confidence)}>
              {status.confidence === 'high' ? '高' : 
               status.confidence === 'medium' ? '中' : '低'}
            </Badge>
          </div>

          {/* 时间源 */}
          <div className="flex items-center justify-between">
            <span className="font-medium">时间源</span>
            <div className="flex items-center gap-2">
              {getTimeSourceIcon(status.timeSource)}
              <span className="capitalize">
                {status.timeSource === 'network' ? '网络时间' :
                 status.timeSource === 'cached' ? '缓存时间' : '本地时间'}
              </span>
            </div>
          </div>

          {/* 时间偏差 */}
          {status.drift !== undefined && (
            <div className="flex items-center justify-between">
              <span className="font-medium">时间偏差</span>
              <div className="flex items-center gap-2">
                <span className={`font-mono ${
                  getDriftSeverity(status.drift) === 'high' ? 'text-red-600' :
                  getDriftSeverity(status.drift) === 'medium' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {formatDrift(status.drift)}
                </span>
                {getDriftSeverity(status.drift) === 'high' && (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
          )}

          {/* 最后同步时间 */}
          {status.lastSync && (
            <div className="flex items-center justify-between">
              <span className="font-medium">最后同步</span>
              <span className="text-sm text-gray-600">
                {new Date(status.lastSync).toLocaleString('zh-CN')}
              </span>
            </div>
          )}

          {/* 刷新按钮 */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-gray-500">
              {lastUpdate && `最后更新: ${lastUpdate.toLocaleTimeString('zh-CN')}`}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchTimeSecurityStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 问题和建议 */}
      {(status.issues.length > 0 || status.recommendations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              安全提醒
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 问题列表 */}
            {status.issues.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-600 mb-2">检测到的问题:</h4>
                <ul className="space-y-1">
                  {status.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 建议列表 */}
            {status.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">建议措施:</h4>
                <ul className="space-y-1">
                  {status.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 时间篡改防护说明 */}
      <Card>
        <CardHeader>
          <CardTitle>时间篡改防护机制</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">防护措施</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 多源时间验证</li>
                <li>• 时间跳跃检测</li>
                <li>• 网络时间同步</li>
                <li>• 异常行为记录</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">安全保障</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 防止许可证绕过</li>
                <li>• 确保计费准确性</li>
                <li>• 审计日志完整</li>
                <li>• 实时监控告警</li>
              </ul>
            </div>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              系统会持续监控时间完整性。如果检测到可疑的时间篡改行为，
              许可证验证可能会被暂时阻止以保护系统安全。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeSecurityMonitor;
