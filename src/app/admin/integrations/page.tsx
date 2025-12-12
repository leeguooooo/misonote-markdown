'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, Server, ArrowRight, Shield } from 'lucide-react';

export default function IntegrationsPage() {
  const integrations = [
    {
      id: 'api-keys',
      title: 'API 密钥管理',
      description: '生成、轮换、吊销密钥，并限制作用域与速率。',
      icon: Key,
      href: '/admin/integrations/api-keys',
      features: ['密钥生成', '权限控制', '使用监控', '自动过期']
    },
    {
      id: 'mcp',
      title: 'MCP 服务器',
      description: '配置模型上下文协议服务器并推送文档。',
      icon: Server,
      href: '/admin/integrations/mcp',
      features: ['服务器配置', '文档推送', '实时同步', '状态监控']
    }
  ];

  return (
    <div className="px-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card key={integration.id} className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-50 text-blue-700 border border-blue-100">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{integration.title}</CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {integration.features.map((feature, index) => (
                    <div key={index} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
                <Link href={integration.href}>
                  <Button className="w-full" variant="outline">
                    配置管理
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>集成指南</CardTitle>
          <CardDescription>快速完成密钥和 MCP 配置</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">准备密钥与权限</p>
                <p className="text-gray-600">在 API 密钥页面为不同环境生成独立密钥，并限制作用域。</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">配置 MCP 服务器</p>
                <p className="text-gray-600">录入服务端地址和密钥，先测试连接再执行推送。</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">测试与监控</p>
                <p className="text-gray-600">用最小权限的密钥跑一条发布流水线，确认成功后再推广。</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
