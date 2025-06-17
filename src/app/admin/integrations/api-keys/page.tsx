'use client';

import React from 'react';
import ApiKeyManager from '@/components/admin/ApiKeyManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Key, Shield, Globe, Zap, AlertTriangle, Info } from 'lucide-react';

export default function ApiKeysPage() {
  return (
    <div className="px-6 space-y-6">

      {/* Main API Key Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Key Manager */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <ApiKeyManager />
            </CardContent>
          </Card>
        </div>

        {/* Information Panel */}
        <div className="space-y-6">
          {/* Security Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                安全提示
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  定期轮换 API 密钥
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  使用最小权限原则
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  监控密钥使用情况
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  及时撤销不用的密钥
                </p>
              </div>
            </CardContent>
          </Card>

          {/* API Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                API 用途
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                  <Key className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">文档操作</p>
                    <p className="text-xs text-gray-600">创建、更新、删除文档</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                  <Zap className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">系统集成</p>
                    <p className="text-xs text-gray-600">与外部系统集成</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg">
                  <Globe className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Webhook 触发</p>
                    <p className="text-xs text-gray-600">自动化工作流程</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                使用限制
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>每小时请求数</span>
                  <span className="font-mono">1000</span>
                </div>
                <div className="flex justify-between">
                  <span>每日请求数</span>
                  <span className="font-mono">10000</span>
                </div>
                <div className="flex justify-between">
                  <span>并发连接数</span>
                  <span className="font-mono">10</span>
                </div>
                <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                  超出限制将返回 429 错误码
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* API Documentation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              API 端点
            </CardTitle>
            <CardDescription>常用的 API 接口文档</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono bg-blue-100 px-2 py-1 rounded">GET /api/docs</code>
                  <span className="text-xs text-gray-500">获取文档列表</span>
                </div>
                <p className="text-xs text-gray-600">获取系统中所有可访问的文档列表</p>
              </div>
              
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono bg-green-100 px-2 py-1 rounded">POST /api/docs</code>
                  <span className="text-xs text-gray-500">创建文档</span>
                </div>
                <p className="text-xs text-gray-600">创建新的 Markdown 文档</p>
              </div>
              
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono bg-yellow-100 px-2 py-1 rounded">PUT /api/docs/:id</code>
                  <span className="text-xs text-gray-500">更新文档</span>
                </div>
                <p className="text-xs text-gray-600">更新指定文档的内容</p>
              </div>
              
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono bg-red-100 px-2 py-1 rounded">DELETE /api/docs/:id</code>
                  <span className="text-xs text-gray-500">删除文档</span>
                </div>
                <p className="text-xs text-gray-600">删除指定的文档</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>认证示例</CardTitle>
            <CardDescription>如何在请求中使用 API 密钥</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Header 认证</h4>
                <div className="bg-gray-100 rounded-lg p-3">
                  <code className="text-xs">
                    Authorization: Bearer your_api_key_here
                  </code>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">cURL 示例</h4>
                <div className="bg-gray-100 rounded-lg p-3">
                  <code className="text-xs whitespace-pre-wrap">
{`curl -H "Authorization: Bearer your_api_key" \\
     -H "Content-Type: application/json" \\
     https://your-domain.com/api/docs`}
                  </code>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">JavaScript 示例</h4>
                <div className="bg-gray-100 rounded-lg p-3">
                  <code className="text-xs whitespace-pre-wrap">
{`fetch('/api/docs', {
  headers: {
    'Authorization': 'Bearer your_api_key',
    'Content-Type': 'application/json'
  }
})`}
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>最佳实践</CardTitle>
          <CardDescription>API 密钥管理的推荐做法</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2 text-green-700">✅ 推荐做法</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 为不同服务使用不同密钥</li>
                <li>• 定期检查密钥使用情况</li>
                <li>• 设置密钥过期时间</li>
                <li>• 使用环境变量存储密钥</li>
                <li>• 及时撤销泄露的密钥</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-red-700">❌ 避免事项</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 不要在代码中硬编码密钥</li>
                <li>• 不要在客户端暴露密钥</li>
                <li>• 不要共享个人密钥</li>
                <li>• 不要忽略密钥泄露警告</li>
                <li>• 不要使用默认密钥</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-blue-700">🔧 管理工具</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 使用密钥管理服务</li>
                <li>• 实施密钥轮换策略</li>
                <li>• 监控密钥使用模式</li>
                <li>• 设置使用量警报</li>
                <li>• 记录密钥操作日志</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}