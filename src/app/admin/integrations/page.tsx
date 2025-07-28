'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  Server, 
  Globe, 
  Webhook, 
  ExternalLink, 
  Zap, 
  Shield, 
  ArrowRight,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function IntegrationsPage() {
  const integrations = [
    {
      id: 'api-keys',
      title: 'API 密钥管理',
      description: '管理用于系统集成和外部服务访问的 API 密钥',
      icon: Key,
      href: '/admin/integrations/api-keys',
      status: 'active',
      color: 'blue',
      features: ['密钥生成', '权限控制', '使用监控', '自动过期']
    },
    {
      id: 'mcp',
      title: 'MCP 服务器',
      description: '模型上下文协议服务器管理和文档推送',
      icon: Server,
      href: '/admin/integrations/mcp',
      status: 'active',
      color: 'green',
      features: ['服务器配置', '文档推送', '实时同步', '状态监控']
    },
    {
      id: 'webhooks',
      title: 'Webhooks',
      description: '配置 Webhook 端点以实现自动化工作流程',
      icon: Webhook,
      href: '/admin/integrations/webhooks',
      status: 'coming-soon',
      color: 'purple',
      badge: 'Pro',
      features: ['事件触发', '自定义负载', '重试机制', '安全验证']
    },
    {
      id: 'third-party',
      title: '第三方集成',
      description: '与外部服务和平台的集成配置',
      icon: Globe,
      href: '/admin/integrations/third-party',
      status: 'coming-soon',
      color: 'orange',
      badge: 'Enterprise',
      features: ['OAuth 认证', 'SSO 集成', '数据同步', '自定义连接器']
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            可用
          </Badge>
        );
      case 'coming-soon':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            即将推出
          </Badge>
        );
      default:
        return null;
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
      green: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100',
      orange: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="px-6 space-y-6">

      {/* Integration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">活跃集成</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
              <Zap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API 密钥</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
              <Key className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">连接状态</p>
                <p className="text-2xl font-bold text-green-600">正常</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const isActive = integration.status === 'active';
          
          return (
            <Card key={integration.id} className={`relative ${isActive ? 'hover:shadow-md transition-shadow' : 'opacity-75'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(integration.color)}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(integration.status)}
                        {integration.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {integration.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <Link href={integration.href}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {integration.description}
                </CardDescription>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">主要功能</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {integration.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {isActive ? (
                    <Link href={integration.href}>
                      <Button className="w-full mt-4" variant="outline">
                        配置管理
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full mt-4" variant="outline" disabled>
                      即将推出
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>集成指南</CardTitle>
          <CardDescription>如何开始使用系统集成功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <h3 className="font-medium">创建 API 密钥</h3>
              </div>
              <p className="text-sm text-gray-600">
                首先在 API 密钥管理中创建用于认证的密钥，并配置适当的权限范围。
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <h3 className="font-medium">配置集成服务</h3>
              </div>
              <p className="text-sm text-gray-600">
                根据需要配置 MCP 服务器、Webhooks 或第三方服务集成。
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <h3 className="font-medium">测试和监控</h3>
              </div>
              <p className="text-sm text-gray-600">
                测试集成配置，并使用监控工具跟踪使用情况和性能。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Shield className="h-5 w-5" />
            安全提醒
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>• 定期轮换 API 密钥以确保安全性</p>
            <p>• 使用最小权限原则配置集成权限</p>
            <p>• 监控异常的 API 使用模式</p>
            <p>• 及时撤销不再使用的密钥和集成</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}