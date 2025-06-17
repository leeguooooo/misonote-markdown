'use client';

import LicenseStatus from '@/components/LicenseStatus';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Crown,
  ExternalLink,
  Key,
  Settings,
  Shield,
  Star
} from 'lucide-react';
import React from 'react';

const LicenseManagementPage: React.FC = () => {
  return (
    <div className="px-6 space-y-6">

      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            许可证状态
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            功能对比
          </TabsTrigger>
          <TabsTrigger value="docker" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Docker部署
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            管理工具
          </TabsTrigger>
        </TabsList>

        {/* 许可证状态 */}
        <TabsContent value="status">
          <LicenseStatus />
        </TabsContent>

        {/* 功能对比 */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>功能对比表</CardTitle>
              <CardDescription>
                了解不同许可证类型的功能差异
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">功能</th>
                      <th className="text-center p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Shield className="h-4 w-4" />
                          社区版
                        </div>
                      </th>
                      <th className="text-center p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Star className="h-4 w-4" />
                          专业版
                        </div>
                      </th>
                      <th className="text-center p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Crown className="h-4 w-4" />
                          企业版
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: '用户数量', community: '1', professional: '50', enterprise: '无限制' },
                      { feature: '基础文档管理', community: '✅', professional: '✅', enterprise: '✅' },
                      { feature: 'Markdown预览', community: '✅', professional: '✅', enterprise: '✅' },
                      { feature: 'Mermaid图表', community: '✅', professional: '✅', enterprise: '✅' },
                      { feature: '全局搜索', community: '✅', professional: '✅', enterprise: '✅' },
                      { feature: '多用户协作', community: '❌', professional: '✅', enterprise: '✅' },
                      { feature: '高级权限管理', community: '❌', professional: '✅', enterprise: '✅' },
                      { feature: '云端同步', community: '❌', professional: '✅', enterprise: '✅' },
                      { feature: '数据导出', community: '❌', professional: '✅', enterprise: '✅' },
                      { feature: '自定义主题', community: '❌', professional: '✅', enterprise: '✅' },
                      { feature: '单点登录 (SSO)', community: '❌', professional: '❌', enterprise: '✅' },
                      { feature: '审计日志', community: '❌', professional: '❌', enterprise: '✅' },
                      { feature: 'API访问', community: '❌', professional: '❌', enterprise: '✅' },
                      { feature: '定制开发', community: '❌', professional: '❌', enterprise: '✅' },
                      { feature: '技术支持', community: '社区', professional: '优先邮件', enterprise: '7x24专属' },
                    ].map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{row.feature}</td>
                        <td className="p-4 text-center">{row.community}</td>
                        <td className="p-4 text-center">{row.professional}</td>
                        <td className="p-4 text-center">{row.enterprise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <h3 className="font-semibold mb-1">社区版</h3>
                    <p className="text-2xl font-bold mb-2">免费</p>
                    <p className="text-sm text-gray-600">适合个人使用</p>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <Star className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-semibold mb-1">专业版</h3>
                    <p className="text-2xl font-bold mb-2">¥299/月</p>
                    <p className="text-sm text-gray-600">适合小团队</p>
                    <Button className="mt-2" size="sm" onClick={() => window.open('/purchase?type=professional', '_blank')}>
                      立即购买
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-4 text-center">
                    <Crown className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-semibold mb-1">企业版</h3>
                    <p className="text-2xl font-bold mb-2">¥999/月</p>
                    <p className="text-sm text-gray-600">适合大型企业</p>
                    <Button className="mt-2" size="sm" onClick={() => window.open('/purchase?type=enterprise', '_blank')}>
                      立即购买
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Docker部署 */}
        <TabsContent value="docker">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Docker 商业版部署
                </CardTitle>
                <CardDescription>
                  在Docker环境中部署和管理商业版许可证
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">社区版部署</h4>
                    <div className="bg-gray-100 rounded-lg p-3 text-sm font-mono">
                      <div>docker run -d \</div>
                      <div className="ml-2">--name misonote-community \</div>
                      <div className="ml-2">-p 3001:3001 \</div>
                      <div className="ml-2">-e ADMIN_PASSWORD=your_password \</div>
                      <div className="ml-2">-v misonote-data:/app/data \</div>
                      <div className="ml-2">misonote/markdown</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">专业版/企业版部署</h4>
                    <div className="bg-gray-100 rounded-lg p-3 text-sm font-mono">
                      <div>docker run -d \</div>
                      <div className="ml-2">--name misonote-pro \</div>
                      <div className="ml-2">-p 3001:3001 \</div>
                      <div className="ml-2">-e ADMIN_PASSWORD=your_password \</div>
                      <div className="ml-2 text-blue-600">-e MISONOTE_LICENSE_KEY=misonote_xxx \</div>
                      <div className="ml-2">-v misonote-data:/app/data \</div>
                      <div className="ml-2">misonote/markdown</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Docker 许可证配置提示</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 通过 <code className="bg-blue-100 px-1 rounded">MISONOTE_LICENSE_KEY</code> 环境变量设置许可证</li>
                    <li>• 许可证会自动验证并持久化到数据卷中</li>
                    <li>• 支持在Web界面中手动输入许可证密钥</li>
                    <li>• 可以通过挂载文件的方式提供许可证</li>
                  </ul>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open('/DOCKER_COMMERCIAL_GUIDE.md', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  查看完整Docker部署指南
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>环境变量配置</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'ADMIN_PASSWORD', description: '管理员密码 (必需)', example: 'your_secure_password' },
                    { name: 'MISONOTE_LICENSE_KEY', description: '许可证密钥 (专业版/企业版)', example: 'misonote_your_license_key' },
                    { name: 'MISONOTE_LICENSE_SERVER_URL', description: '许可证服务器URL (可选)', example: 'https://license-api.misonote.com' },
                    { name: 'PORT', description: '应用端口 (默认: 3001)', example: '3001' },
                    { name: 'NEXT_PUBLIC_BASE_URL', description: '公开访问地址 (可选)', example: 'https://your-domain.com' },
                  ].map((env, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <code className="font-semibold text-blue-600">{env.name}</code>
                        <Badge variant="outline" className="text-xs">
                          {env.name.includes('LICENSE_KEY') ? '商业版' :
                            env.name === 'ADMIN_PASSWORD' ? '必需' : '可选'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{env.description}</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{env.example}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 管理工具 */}
        <TabsContent value="admin">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  管理员工具
                </CardTitle>
                <CardDescription>
                  许可证生成和管理工具 (仅管理员可用)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => window.open('/admin/license-generator', '_blank')}
                  >
                    <Key className="h-6 w-6 mb-2" />
                    许可证生成器
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => window.open('/admin/license-stats', '_blank')}
                  >
                    <BarChart3 className="h-6 w-6 mb-2" />
                    使用统计
                  </Button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ 管理员权限说明</h4>
                  <p className="text-sm text-yellow-700">
                    这些工具仅供系统管理员使用，用于生成客户许可证和查看系统使用情况。
                    请确保您有相应的权限后再使用这些功能。
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>联系信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">销售咨询</h4>
                    <div className="text-sm space-y-1">
                      <p>📧 邮箱: sales@misonote.com</p>
                      <p>📞 电话: 400-123-4567</p>
                      <p>💬 微信: misonote-sales</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">技术支持</h4>
                    <div className="text-sm space-y-1">
                      <p>📧 邮箱: support@misonote.com</p>
                      <p>📞 电话: 400-123-4568</p>
                      <p>🌐 文档: https://docs.misonote.com</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LicenseManagementPage;
