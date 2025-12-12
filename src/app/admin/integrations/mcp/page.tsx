'use client';

import React, { useState } from 'react';
import MCPServerManager from '@/components/admin/MCPServerManager';
import MCPDocumentPusher from '@/components/admin/MCPDocumentPusher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server, Send, Globe, Zap, Shield, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function MCPPage() {
  const [documents] = useState<
    { name: string; path: string; content: string; type: 'file' | 'folder' }[]
  >([]); // This would normally come from your document store

  return (
    <div className="px-6 space-y-6">

      {/* Tabs for different MCP functions */}
      <Tabs defaultValue="servers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="servers" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            服务器管理
          </TabsTrigger>
          <TabsTrigger value="push" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            文档推送
          </TabsTrigger>
        </TabsList>

        {/* Server Management Tab */}
        <TabsContent value="servers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Server Manager */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  <MCPServerManager />
                </CardContent>
              </Card>
            </div>

            {/* Information Panel */}
            <div className="space-y-6">
              {/* Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    连接状态
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">Claude Desktop</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">已连接</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">自定义服务器</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-600">未配置</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configuration Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    配置指南
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <h4 className="font-medium mb-1">Claude Desktop</h4>
                      <p className="text-gray-600">自动检测并连接到本地 Claude Desktop 应用</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">自定义服务器</h4>
                      <p className="text-gray-600">配置自定义 MCP 服务器地址和认证信息</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">安全连接</h4>
                      <p className="text-gray-600">使用 TLS/SSL 加密确保数据传输安全</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    功能特性
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>实时文档同步</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>批量文档推送</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>自动格式转换</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>元数据保留</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Document Push Tab */}
        <TabsContent value="push" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Document Pusher */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  <MCPDocumentPusher 
                    documents={documents}
                    onClose={() => {}} // No close needed in standalone page
                  />
                </CardContent>
              </Card>
            </div>

            {/* Push Information */}
            <div className="space-y-6">
              {/* Push Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-blue-500" />
                    推送状态
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">待推送文档</span>
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{documents.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">已推送文档</span>
                      <span className="text-sm font-mono bg-green-100 px-2 py-1 rounded">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">推送失败</span>
                      <span className="text-sm font-mono bg-red-100 px-2 py-1 rounded">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Push Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    推送选项
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <h4 className="font-medium mb-1">格式转换</h4>
                      <p className="text-gray-600">自动转换 Markdown 为 MCP 兼容格式</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">元数据处理</h4>
                      <p className="text-gray-600">包含文档标题、标签和修改时间</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">错误处理</h4>
                      <p className="text-gray-600">自动重试失败的推送操作</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Best Practices */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    最佳实践
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>定期清理过时的文档</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>使用描述性的文档标题</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>避免推送敏感信息</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>监控推送状态和错误</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Technical Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              MCP 协议信息
            </CardTitle>
            <CardDescription>模型上下文协议技术详情</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-1">协议版本</h4>
                <p className="text-sm text-gray-600">MCP v1.0 - 标准化模型上下文协议</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">传输方式</h4>
                <p className="text-sm text-gray-600">WebSocket / HTTP/2 双向通信</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">数据格式</h4>
                <p className="text-sm text-gray-600">JSON-RPC 2.0 消息格式</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">安全机制</h4>
                <p className="text-sm text-gray-600">TLS 1.3 加密 + API 密钥认证</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>集成指南</CardTitle>
            <CardDescription>如何在 Claude Desktop 中使用</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">配置文件位置</h4>
                <div className="bg-gray-100 rounded-lg p-3">
                  <code className="text-xs">
                    ~/.config/claude-desktop/config.json
                  </code>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">基本配置</h4>
                <div className="bg-gray-100 rounded-lg p-3">
                  <code className="text-xs whitespace-pre-wrap">
{`{
  "mcpServers": {
    "misonote": {
      "command": "npx",
      "args": ["@misonote/mcp-server"],
      "env": {
        "MISONOTE_API_KEY": "your_api_key"
      }
    }
  }
}`}
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
