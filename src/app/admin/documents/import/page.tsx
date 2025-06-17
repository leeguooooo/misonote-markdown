'use client';

import React from 'react';
import DocumentImport from '@/components/admin/DocumentImport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Upload, FileText, Package, Shield, AlertTriangle } from 'lucide-react';

export default function DocumentImportPage() {
  return (
    <div className="px-6 space-y-6">

      {/* Main Import Component */}
      <DocumentImport />

      {/* Support Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Markdown 文件</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="space-y-2">
              <p>• 支持 .md 和 .markdown 文件</p>
              <p>• 自动解析文档结构</p>
              <p>• 保持原始格式</p>
              <p>• 支持批量导入</p>
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">JSON 数据</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="space-y-2">
              <p>• 完整的元数据恢复</p>
              <p>• 批量导入多个文档</p>
              <p>• 保持目录结构</p>
              <p>• 系统间迁移</p>
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">ZIP 压缩包</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="space-y-2">
              <p>• 自动解压和处理</p>
              <p>• 识别目录结构</p>
              <p>• 批量文件处理</p>
              <p>• 完整备份恢复</p>
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Import Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              导入选项
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-1">目标文件夹</h4>
                <p className="text-sm text-gray-600">指定导入文档的目标位置</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">重复处理</h4>
                <p className="text-sm text-gray-600">选择如何处理重复的文档</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">路径保持</h4>
                <p className="text-sm text-gray-600">是否保持原始的目录结构</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">元数据导入</h4>
                <p className="text-sm text-gray-600">导入文档的附加信息</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              重要提示
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="font-medium text-yellow-800 mb-1">备份建议</h4>
                <p className="text-sm text-yellow-700">导入前建议备份现有数据，避免意外覆盖重要文档。</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-800 mb-1">文件大小限制</h4>
                <p className="text-sm text-blue-700">单个文件最大支持 50MB，ZIP 压缩包最大支持 200MB。</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-medium text-green-800 mb-1">格式支持</h4>
                <p className="text-sm text-green-700">支持标准 Markdown 语法，包括表格、代码块和图片链接。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step by Step Guide */}
      <Card>
        <CardHeader>
          <CardTitle>导入步骤</CardTitle>
          <CardDescription>按照以下步骤完成文档导入</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">1</div>
              <h4 className="font-medium mb-1">选择文件</h4>
              <p className="text-sm text-gray-600">拖拽或点击选择要导入的文件</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">2</div>
              <h4 className="font-medium mb-1">配置选项</h4>
              <p className="text-sm text-gray-600">设置目标文件夹和导入选项</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">3</div>
              <h4 className="font-medium mb-1">开始导入</h4>
              <p className="text-sm text-gray-600">点击导入按钮开始处理文件</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">4</div>
              <h4 className="font-medium mb-1">查看结果</h4>
              <p className="text-sm text-gray-600">检查导入结果和处理报告</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}