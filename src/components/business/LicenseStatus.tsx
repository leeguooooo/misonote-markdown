'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface License {
  type: string;
  maxUsers: number;
  features: string[];
  expiresAt?: string;
}

interface LicenseStatusProps {
  className?: string;
}

export function LicenseStatus({ className = '' }: LicenseStatusProps) {
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLicenseStatus();
  }, []);

  const fetchLicenseStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/license');
      const result = await response.json();
      
      if (result.success) {
        setLicense(result.data);
      } else {
        setError('获取许可证信息失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const getLicenseDisplayName = (type: string) => {
    switch (type) {
      case 'community':
        return '社区版';
      case 'professional':
        return '专业版';
      case 'enterprise':
        return '企业版';
      default:
        return type;
    }
  };

  const getLicenseColor = (type: string) => {
    switch (type) {
      case 'community':
        return 'text-gray-600 bg-gray-100';
      case 'professional':
        return 'text-blue-600 bg-blue-100';
      case 'enterprise':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const expireDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!license) {
    return null;
  }

  const expired = isExpired(license.expiresAt);
  const expiringSoon = isExpiringSoon(license.expiresAt);

  return (
    <div className={`p-4 bg-white border rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-gray-500 mr-2" />
          <span className="text-sm font-medium text-gray-700">许可证状态</span>
        </div>
        
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLicenseColor(license.type)}`}>
          {getLicenseDisplayName(license.type)}
        </span>
      </div>

      <div className="space-y-2">
        {/* 用户数量 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-gray-600">最大用户数</span>
          </div>
          <span className="font-medium">
            {license.maxUsers === -1 ? '无限' : license.maxUsers}
          </span>
        </div>

        {/* 过期时间 */}
        {license.expiresAt && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-600">过期时间</span>
            </div>
            <div className="flex items-center">
              {expired ? (
                <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
              ) : expiringSoon ? (
                <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              )}
              <span className={`font-medium ${
                expired ? 'text-red-600' : 
                expiringSoon ? 'text-yellow-600' : 
                'text-green-600'
              }`}>
                {new Date(license.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* 功能列表 */}
        {license.features.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2">可用功能</div>
            <div className="flex flex-wrap gap-1">
              {license.features.map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 警告信息 */}
        {expired && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            ⚠️ 许可证已过期，某些功能可能不可用
          </div>
        )}

        {expiringSoon && !expired && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
            ⚠️ 许可证即将过期，请及时续费
          </div>
        )}
      </div>

      {/* 升级按钮 */}
      {license.type === 'community' && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <a
            href="/pricing"
            className="w-full inline-flex justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            升级到专业版
          </a>
        </div>
      )}
    </div>
  );
}
