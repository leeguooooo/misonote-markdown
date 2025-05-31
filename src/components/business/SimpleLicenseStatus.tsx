'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  Building,
  Calendar,
  CheckCircle,
  Crown,
  Key,
  Shield,
  Star,
  Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface LicenseInfo {
  hasLicense: boolean;
  licenseType: 'community' | 'professional' | 'enterprise';
  organization?: string;
  features: string[];
  maxUsers: number;
  expiresAt?: string;
  message: string;
}

const SimpleLicenseStatus: React.FC = () => {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [validating, setValidating] = useState(false);

  // 获取许可证状态
  const fetchLicenseStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/license/status');
      const data = await response.json();

      if (data.success) {
        setLicenseInfo(data.data);
      } else {
        setError(data.error || '获取许可证状态失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 验证许可证
  const validateLicense = async () => {
    if (!licenseKey.trim()) {
      setError('请输入许可证密钥');
      return;
    }

    try {
      setValidating(true);
      setError(null);

      const response = await fetch('/api/license/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseKey }),
      });

      const data = await response.json();

      if (data.success) {
        setLicenseInfo(data.data);
        setLicenseKey('');
        setError(null);
      } else {
        setError(data.error || '许可证验证失败');
      }
    } catch (err) {
      setError('验证过程中发生错误');
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    fetchLicenseStatus();
  }, []);

  // 许可证类型配置
  const licenseConfig = {
    community: {
      name: '社区版',
      icon: Shield,
      color: 'bg-gray-100 text-gray-800',
      description: '免费使用，基础功能'
    },
    professional: {
      name: '专业版',
      icon: Star,
      color: 'bg-blue-100 text-blue-800',
      description: '适合小团队，高级功能'
    },
    enterprise: {
      name: '企业版',
      icon: Crown,
      color: 'bg-purple-100 text-purple-800',
      description: '企业级功能，无限用户'
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">加载许可证信息...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentConfig = licenseInfo ? licenseConfig[licenseInfo.licenseType] : licenseConfig.community;
  const IconComponent = currentConfig.icon;

  return (
    <div className="space-y-6">
      {/* 当前许可证状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            许可证状态
          </CardTitle>
          <CardDescription>
            当前系统的许可证信息和功能权限
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {licenseInfo && (
            <>
              {/* 许可证类型 */}
              <div className="flex items-center justify-between">
                <span className="font-medium">许可证类型</span>
                <Badge className={currentConfig.color}>
                  {currentConfig.name}
                </Badge>
              </div>

              {/* 组织信息 */}
              {licenseInfo.organization && (
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    组织
                  </span>
                  <span>{licenseInfo.organization}</span>
                </div>
              )}

              {/* 用户数限制 */}
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  最大用户数
                </span>
                <span>{licenseInfo.maxUsers === -1 ? '无限制' : licenseInfo.maxUsers}</span>
              </div>

              {/* 到期时间 */}
              {licenseInfo.expiresAt && (
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    到期时间
                  </span>
                  <span>{new Date(licenseInfo.expiresAt).toLocaleDateString('zh-CN')}</span>
                </div>
              )}

              {/* 功能列表 */}
              <div>
                <span className="font-medium block mb-2">可用功能</span>
                <div className="flex flex-wrap gap-2">
                  {licenseInfo.features.length > 0 ? (
                    licenseInfo.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {feature}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      基础功能
                    </Badge>
                  )}
                </div>
              </div>

              {/* 状态消息 */}
              <Alert variant="success">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{licenseInfo.message}</AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* 许可证验证 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            许可证验证
          </CardTitle>
          <CardDescription>
            输入许可证密钥来升级您的账户
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="license-key">许可证密钥</Label>
            <Input
              id="license-key"
              type="text"
              placeholder="misonote_..."
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              disabled={validating}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={validateLicense}
            disabled={validating || !licenseKey.trim()}
            className="w-full"
          >
            {validating ? '验证中...' : '验证许可证'}
          </Button>
        </CardContent>
      </Card>

      {/* 购买提示 */}
      <Card>
        <CardHeader>
          <CardTitle>升级许可证</CardTitle>
          <CardDescription>
            解锁更多功能和更高的用户限制
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(licenseConfig).map(([type, config]) => {
              const IconComp = config.icon;
              const isCurrent = licenseInfo?.licenseType === type;

              return (
                <div
                  key={type}
                  className={`border rounded-lg p-4 ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <IconComp className="h-5 w-5" />
                    <h3 className="font-semibold">{config.name}</h3>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">当前</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{config.description}</p>

                  {!isCurrent && type !== 'community' && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        window.open(`/purchase?type=${type}`, '_blank');
                      }}
                    >
                      立即购买
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleLicenseStatus;
