'use client';

import LicenseStatus from '@/components/LicenseStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, Shield, BarChart3 } from 'lucide-react';
import React from 'react';

const LicenseManagementPage: React.FC = () => {
  return (
    <div className="px-6 space-y-6">
      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            许可证状态
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            管理工具
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <LicenseStatus />
        </TabsContent>

        <TabsContent value="admin">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  管理指南
                </CardTitle>
                <CardDescription>
                  只保留必须的离线/审计操作，避免无校验的生成器。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <p>• 在部署前通过环境变量提供正式的许可证密钥。</p>
                <p>• 如需离线签发，请使用 misonote-license-server 的脚本并走审核流程，不在前端生成。</p>
                <p>• 关键操作（重置密钥、停用客户）请记录变更单并同步审计日志。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  使用与联系
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="font-semibold">销售咨询</p>
                    <p>📧 sales@misonote.com</p>
                    <p>📞 400-123-4567</p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="font-semibold">技术支持</p>
                    <p>📧 support@misonote.com</p>
                    <p>🌐 文档: https://docs.misonote.com</p>
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
