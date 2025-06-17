'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FileTreeSelector } from '@/components/admin/FileTreeSelector';
import {
  Upload,
  FileText,
  Package,
  Database,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  FolderPlus,
  Info
} from 'lucide-react';

interface ImportOptions {
  overwriteExisting: boolean;
  preservePaths: boolean;
  targetFolder: string;
  importMetadata: boolean;
}

interface ImportResult {
  importedFiles: number;
  skippedFiles: number;
  overwrittenFiles: number;
  files: Array<{
    path: string;
    action: 'created' | 'overwritten' | 'skipped' | 'error';
    error?: string;
  }>;
}

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  lastModified?: string;
}

const DocumentImport: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    overwriteExisting: false,
    preservePaths: true,
    targetFolder: '',
    importMetadata: true
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [folders, setFolders] = useState<FileItem[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin-token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const loadFolders = async () => {
    setIsLoadingFolders(true);
    try {
      const response = await fetch('/api/admin/docs', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        // 加载所有项目以显示完整的目录结构
        setFolders(data.docs);
      }
    } catch (err) {
      console.error('加载文件夹列表失败:', err);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setImportResult(null);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setImportResult(null);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setError(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'md': return <FileText className="h-8 w-8 text-blue-500" />;
      case 'json': return <Database className="h-8 w-8 text-green-500" />;
      case 'zip': return <Package className="h-8 w-8 text-purple-500" />;
      default: return <FileText className="h-8 w-8 text-gray-400" />;
    }
  };

  const isValidFileType = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    return ['md', 'json', 'zip'].includes(ext || '');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('请选择要导入的文件');
      return;
    }

    if (!isValidFileType(selectedFile.name)) {
      setError('不支持的文件格式。支持的格式：.md, .json, .zip');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setImportResult(null);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('options', JSON.stringify(importOptions));

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        setImportResult(result);
        // 清除选中的文件
        removeSelectedFile();
      } else {
        const errorData = await response.json();
        setError(errorData.error || '导入失败');
      }
    } catch (err) {
      setError('导入过程中发生错误');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            文档导入
          </CardTitle>
          <CardDescription>
            从不同格式导入文档，支持 Markdown、JSON 和 ZIP 文件
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 文件选择区域 */}
          <div>
            <Label className="text-sm font-medium">选择文件</Label>
            <div
              className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.json,.zip"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    {getFileIcon(selectedFile.name)}
                  </div>
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSelectedFile();
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    移除
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-medium">拖拽文件到此处或点击选择</p>
                    <p className="text-sm text-gray-500">
                      支持 .md, .json, .zip 格式，最大 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {selectedFile && !isValidFileType(selectedFile.name) && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  不支持的文件格式。请选择 .md, .json 或 .zip 文件
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* 导入选项 */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">导入选项</Label>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.overwriteExisting}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    overwriteExisting: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm">覆盖已存在的文档</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.preservePaths}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    preservePaths: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm">保持原始路径结构</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={importOptions.importMetadata}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    importMetadata: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm">导入元数据信息</span>
              </label>
            </div>

            {/* 目标文件夹 */}
            <div>
              <Label className="text-sm font-medium">
                目标文件夹 (可选)
              </Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <FolderPlus className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="输入路径或点击下方选择"
                    value={importOptions.targetFolder}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      targetFolder: e.target.value
                    }))}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowFolderSelector(!showFolderSelector);
                      if (!showFolderSelector && folders.length === 0) {
                        loadFolders();
                      }
                    }}
                  >
                    {showFolderSelector ? '隐藏' : '选择文件夹'}
                  </Button>
                </div>
                
                {showFolderSelector && (
                  <div className="border rounded-md p-2">
                    {isLoadingFolders ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm">加载文件夹...</span>
                      </div>
                    ) : (
                      <FileTreeSelector
                        files={[
                          // 添加根目录选项
                          { name: '/ (根目录)', path: '', type: 'folder' as const },
                          ...folders
                        ]}
                        selectedPaths={importOptions.targetFolder ? [importOptions.targetFolder] : []}
                        onSelectionChange={(paths) => {
                          setImportOptions(prev => ({
                            ...prev,
                            targetFolder: paths[0] || ''
                          }));
                        }}
                        selectionMode="single"
                        showFiles={false}
                        showFolders={true}
                        expandAll={false}
                        className="max-h-60"
                      />
                    )}
                  </div>
                )}
                
                <p className="text-xs text-gray-500">
                  留空表示导入到根目录
                </p>
              </div>
            </div>
          </div>

          {/* 格式说明 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Markdown (.md):</strong> 导入单个文档文件</p>
                <p><strong>JSON (.json):</strong> 导入包含多个文档的结构化数据</p>
                <p><strong>ZIP (.zip):</strong> 导入包含多个文档的压缩包</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* 错误消息 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 导入结果 */}
          {importResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">导入完成</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <Badge variant="outline" className="mr-1">新建</Badge>
                      {importResult.importedFiles} 个
                    </div>
                    <div>
                      <Badge variant="outline" className="mr-1">覆盖</Badge>
                      {importResult.overwrittenFiles} 个
                    </div>
                    <div>
                      <Badge variant="outline" className="mr-1">跳过</Badge>
                      {importResult.skippedFiles} 个
                    </div>
                  </div>
                  
                  {importResult.files.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium">
                        查看详细信息
                      </summary>
                      <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                        {importResult.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <span className="truncate flex-1">{file.path}</span>
                            <Badge 
                              variant={
                                file.action === 'created' ? 'default' :
                                file.action === 'overwritten' ? 'secondary' :
                                file.action === 'error' ? 'destructive' : 'outline'
                              }
                              className="ml-2"
                            >
                              {file.action}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 上传进度 */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">导入进度</span>
                <span className="text-sm text-gray-500">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* 导入按钮 */}
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isUploading || !isValidFileType(selectedFile?.name || '')}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                导入中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                开始导入
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentImport;