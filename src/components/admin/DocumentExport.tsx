'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { FileTreeSelector } from '@/components/admin/FileTreeSelector';
import {
  Download,
  FileText,
  Package,
  Database,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  FolderOpen
} from 'lucide-react';

interface ExportOptions {
  format: 'markdown' | 'json' | 'zip';
  paths: string[];
  includeMetadata: boolean;
  includeComments: boolean;
  includeAnnotations: boolean;
}

interface DocumentItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  lastModified: string;
}

const DocumentExport: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'zip',
    paths: [],
    includeMetadata: true,
    includeComments: false,
    includeAnnotations: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/docs');
      if (response.ok) {
        const data = await response.json();
        // 加载所有项目（文件和文件夹），以显示完整的目录结构
        setDocuments(data.docs);
      } else {
        setError('加载文档列表失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文档列表时发生错误');
    } finally {
      setIsLoading(false);
    }
  };


  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setError(null);
    setSuccess(null);

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const exportData = {
        ...exportOptions,
        paths: selectedPaths.length > 0 ? selectedPaths : []
      };

      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (response.ok) {
        // 处理文件下载
        const contentType = response.headers.get('content-type');
        const disposition = response.headers.get('content-disposition');
        
        let filename = 'export';
        if (disposition) {
          const filenameMatch = disposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setSuccess(`导出成功！已下载 ${selectedPaths.length || documents.length} 个文档`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '导出失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出过程中发生错误');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'markdown': return <FileText className="h-4 w-4" />;
      case 'json': return <Database className="h-4 w-4" />;
      case 'zip': return <Package className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'markdown': return '纯文本格式，适合备份和版本控制';
      case 'json': return '结构化数据格式，包含完整元数据';
      case 'zip': return '压缩包格式，保持目录结构';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            文档导出
          </CardTitle>
          <CardDescription>
            导出文档到不同格式，支持批量操作和多种导出选项
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={exportOptions.format} onValueChange={(value) => 
            setExportOptions(prev => ({ ...prev, format: value as any }))
          }>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="markdown" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Markdown
              </TabsTrigger>
              <TabsTrigger value="json" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                JSON
              </TabsTrigger>
              <TabsTrigger value="zip" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                ZIP
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              {/* 格式说明 */}
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  {getFormatDescription(exportOptions.format)}
                </AlertDescription>
              </Alert>

              {/* 文档选择 */}
              <div>
                <h4 className="font-medium mb-3">选择要导出的文档</h4>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">加载文档列表...</span>
                  </div>
                ) : (
                  <FileTreeSelector
                    files={documents}
                    selectedPaths={selectedPaths}
                    onSelectionChange={setSelectedPaths}
                    selectionMode="multiple"
                    showFiles={true}
                    showFolders={false}
                    expandAll={false}
                  />
                )}
              </div>

              {/* 导出选项 */}
              <div className="space-y-3">
                <h4 className="font-medium">导出选项</h4>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeMetadata}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeMetadata: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm">包含文档元数据</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeComments}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeComments: e.target.checked
                      }))}
                      className="rounded"
                      disabled
                    />
                    <span className="text-sm text-gray-400">包含评论 (即将支持)</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeAnnotations}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeAnnotations: e.target.checked
                      }))}
                      className="rounded"
                      disabled
                    />
                    <span className="text-sm text-gray-400">包含注释 (即将支持)</span>
                  </label>
                </div>
              </div>

              {/* 错误和成功消息 */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* 导出进度 */}
              {isExporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">导出进度</span>
                    <span className="text-sm text-gray-500">{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                </div>
              )}

              {/* 导出按钮 */}
              <Button
                onClick={handleExport}
                disabled={isExporting || documents.length === 0}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    导出中...
                  </>
                ) : (
                  <>
                    {getFormatIcon(exportOptions.format)}
                    <span className="ml-2">
                      导出为 {exportOptions.format.toUpperCase()}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentExport;
