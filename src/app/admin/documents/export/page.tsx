'use client';

import React from 'react';
import DocumentExport from '@/components/admin/DocumentExport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Download, FileText, Package, Zap } from 'lucide-react';

export default function DocumentExportPage() {
  return (
    <div className="px-6 space-y-6">

      {/* Main Export Component */}
      <DocumentExport />

      {/* Feature Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Markdown 格式</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="space-y-2">
              <p>• 纯文本 Markdown 文件</p>
              <p>• 兼容所有 Markdown 编辑器</p>
              <p>• 适合版本控制和分享</p>
              <p>• 轻量级，易于阅读</p>
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">JSON 格式</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="space-y-2">
              <p>• 包含完整元数据</p>
              <p>• 保留文档结构信息</p>
              <p>• 支持程序化处理</p>
              <p>• 完整的系统迁移</p>
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">ZIP 压缩包</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="space-y-2">
              <p>• 批量导出多个文档</p>
              <p>• 保持目录结构</p>
              <p>• 包含所有资源文件</p>
              <p>• 便于整体备份</p>
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            使用建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">最佳实践</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 定期导出备份重要文档</li>
                <li>• 使用 JSON 格式保留完整信息</li>
                <li>• ZIP 格式适合批量备份</li>
                <li>• Markdown 格式便于外部使用</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">注意事项</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 大量文档导出可能需要时间</li>
                <li>• 检查导出文件的完整性</li>
                <li>• 妥善保存导出的备份文件</li>
                <li>• 定期更新备份策略</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}