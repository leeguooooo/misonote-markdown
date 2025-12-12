'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Edit, 
  Download, 
  Upload, 
  Search, 
  Plus, 
  FolderOpen, 
  Clock,
  Eye,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  content: string;
  isNew?: boolean;
  isHidden?: boolean;
  metadata?: Record<string, unknown>;
  type?: 'file' | 'folder';
  lastModified?: Date;
}

export default function DocumentsPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/docs');
      const data = await response.json();
      if (data.docs) {
        setFiles(data.docs);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentFiles = files
    .sort((a, b) => (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0))
    .slice(0, 5);

  const stats = {
    totalFiles: files.length,
    totalFolders: new Set(files.map(f => f.path.split('/').slice(0, -1).join('/')).filter(Boolean)).size,
    newFiles: files.filter(f => f.isNew).length
  };

  return (
    <div className="px-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">文档总数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">文件夹数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFolders}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待保存</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newFiles}</p>
              </div>
              <Edit className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/documents/editor">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200">
                <Edit className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">文档编辑器</h3>
              <p className="text-sm text-gray-600">打开完整的文档编辑界面</p>
              <div className="mt-3 flex items-center justify-center text-blue-600 group-hover:text-blue-700">
                <span className="text-sm">打开编辑器</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/documents/export">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200">
                <Download className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">文档导出</h3>
              <p className="text-sm text-gray-600">导出文档到多种格式</p>
              <div className="mt-3 flex items-center justify-center text-green-600 group-hover:text-green-700">
                <span className="text-sm">开始导出</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/documents/import">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">文档导入</h3>
              <p className="text-sm text-gray-600">从文件导入文档</p>
              <div className="mt-3 flex items-center justify-center text-purple-600 group-hover:text-purple-700">
                <span className="text-sm">开始导入</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/documents/editor?new=true">
          <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100">
                <Plus className="h-6 w-6 text-gray-400 group-hover:text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">创建文档</h3>
              <p className="text-sm text-gray-600">快速创建新的文档</p>
              <div className="mt-3 flex items-center justify-center text-gray-600 group-hover:text-blue-600">
                <span className="text-sm">立即创建</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Documents & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              最近文档
            </CardTitle>
            <CardDescription>最近编辑的文档</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentFiles.length > 0 ? (
              <div className="space-y-3">
                {recentFiles.map((file) => (
                  <Link 
                    key={file.path} 
                    href={`/admin/documents/editor?edit=${encodeURIComponent(file.path)}`}
                    className="block p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.path}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.isNew && <Badge variant="outline" className="text-xs">新</Badge>}
                        <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-blue-600" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>暂无文档</p>
                <Link href="/admin/documents/editor">
                  <Button variant="outline" size="sm" className="mt-3">
                    创建第一个文档
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              文档搜索
            </CardTitle>
            <CardDescription>快速查找文档</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索文档名称或路径..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {searchTerm && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredFiles.length > 0 ? (
                    filteredFiles.slice(0, 10).map((file) => (
                      <Link 
                        key={file.path}
                        href={`/admin/documents/editor?edit=${encodeURIComponent(file.path)}`}
                        className="block p-2 hover:bg-gray-50 rounded text-sm group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3 text-gray-400" />
                            <span className="font-medium text-gray-900">{file.name}</span>
                          </div>
                          <Eye className="h-3 w-3 text-gray-400 group-hover:text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500 ml-5">{file.path}</p>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">未找到匹配的文档</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>快速链接</CardTitle>
          <CardDescription>常用的管理功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/integrations/api-keys">
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">API 密钥管理</p>
                  <p className="text-xs text-gray-500">管理系统集成密钥</p>
                </div>
              </div>
            </Link>
            
            <Link href="/admin/integrations/mcp">
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                  <Upload className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">MCP 服务器</p>
                  <p className="text-xs text-gray-500">推送文档到 AI 助手</p>
                </div>
              </div>
            </Link>
            
            <Link href="/admin/dashboard">
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">返回仪表盘</p>
                  <p className="text-xs text-gray-500">查看系统概览</p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
