'use client';

import { useState, useEffect } from 'react';
import { Upload, Plus, FolderPlus, Shield, FileText, Search, Filter, Download } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import EnhancedFileTree from '@/components/admin/EnhancedFileTree';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import CreateFileDialog from '@/components/admin/CreateFileDialog';
import DragDropUpload from '@/components/admin/DragDropUpload';
import SimpleLicenseStatus from '@/components/business/SimpleLicenseStatus';

interface FileItem {
  name: string;
  path: string;
  content: string;
  isNew?: boolean;
  isHidden?: boolean;
  metadata?: any;
  type?: 'file' | 'folder';
  lastModified?: Date;
}

export default function DocumentsPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availablePaths, setAvailablePaths] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createDialogPath, setCreateDialogPath] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLicenseManager, setShowLicenseManager] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load existing documents on component mount
  useEffect(() => {
    loadExistingDocs();
  }, []);

  // 处理 URL 参数中的编辑请求和新建请求
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editPath = urlParams.get('edit');
    const isNew = urlParams.get('new');

    if (editPath && files.length > 0) {
      const fileToEdit = files.find(f => f.path === editPath);
      if (fileToEdit) {
        setCurrentFile(fileToEdit);
        // 清除 URL 参数
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    } else if (isNew === 'true') {
      // 打开创建文件对话框
      setShowCreateDialog(true);
      // 清除 URL 参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [files]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin-token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const loadExistingDocs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/docs', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.docs) {
        setFiles(data.docs);

        // 提取所有可用的路径
        const paths = new Set<string>();
        data.docs.forEach((doc: FileItem) => {
          const pathParts = doc.path.split('/');
          for (let i = 0; i < pathParts.length; i++) {
            const partialPath = pathParts.slice(0, i + 1).join('/');
            if (partialPath) {
              paths.add(partialPath);
            }
          }
          // 添加目录路径
          if (pathParts.length > 1) {
            const dirPath = pathParts.slice(0, -1).join('/');
            if (dirPath) {
              paths.add(dirPath);
            }
          }
        });

        // 添加一些常用路径
        paths.add('api');
        paths.add('tutorials');
        paths.add('getting-started');
        paths.add('guides');
        paths.add('reference');

        setAvailablePaths(Array.from(paths).sort());
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = (uploadedFiles: FileList) => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setUploadStatus('正在上传文件...');

    Array.from(uploadedFiles).forEach((file, index) => {
      if (file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const fileName = file.name;
          const baseName = fileName.replace('.md', '');

          const newFile: FileItem = {
            name: fileName,
            path: baseName,
            content,
            isNew: true
          };

          setFiles(prev => {
            const existingIndex = prev.findIndex(f => f.path === baseName);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = newFile;
              return updated;
            } else {
              return [...prev, newFile];
            }
          });

          if (index === uploadedFiles.length - 1) {
            setUploadStatus('文件上传完成！');
            setTimeout(() => setUploadStatus(''), 3000);
          }
        };
        reader.readAsText(file);
      } else {
        setUploadStatus('请上传 .md 格式的文件');
        setTimeout(() => setUploadStatus(''), 3000);
      }
    });
  };

  // 创建新文件
  const handleCreateFile = (fileName: string, filePath: string, template: string) => {
    const newFile: FileItem = {
      name: fileName,
      path: filePath,
      content: template,
      isNew: true
    };

    setFiles(prev => [...prev, newFile]);
    setCurrentFile(newFile);
  };

  // 保存文件
  const handleSaveFile = async (file: FileItem) => {
    try {
      const response = await fetch('/api/admin/save-doc', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          path: file.path,
          content: file.content,
          name: file.name
        }),
      });

      if (response.ok) {
        setFiles(prev => prev.map(f =>
          f.path === file.path ? { ...f, isNew: false } : f
        ));
        alert('文件保存成功！');
      } else {
        alert('保存失败，请重试');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('保存失败，请重试');
    }
  };

  // 删除文件
  const handleDeleteFile = async (file: FileItem) => {
    if (!confirm(`确定要删除 "${file.name}" 吗？`)) return;

    try {
      const response = await fetch('/api/admin/delete-doc', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ path: file.path }),
      });

      if (response.ok) {
        setFiles(prev => prev.filter(f => f.path !== file.path));
        if (currentFile?.path === file.path) {
          setCurrentFile(null);
        }
        alert('文件删除成功！');
      } else {
        alert('删除失败，请重试');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('删除失败，请重试');
    }
  };

  // 更新文件内容
  const handleContentChange = (content: string) => {
    if (!currentFile) return;

    const updatedFile = { ...currentFile, content };
    setCurrentFile(updatedFile);
    setFiles(prev => prev.map(f =>
      f.path === currentFile.path ? updatedFile : f
    ));
  };

  // 处理创建文件对话框中的路径选择
  const handleCreateFileFromPath = (parentPath: string) => {
    setCreateDialogPath(parentPath);
    setShowCreateDialog(true);
  };

  // 处理文件移动
  const handleFileMove = async (sourcePath: string, targetPath: string) => {
    try {
      const response = await fetch('/api/admin/file-operations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          operation: 'move',
          source: sourcePath,
          target: targetPath,
        }),
      });

      if (response.ok) {
        await loadExistingDocs(); // 重新加载文件列表
        alert('文件移动成功！');
      } else {
        const error = await response.json();
        throw new Error(error.error || '移动失败');
      }
    } catch (error) {
      console.error('移动文件失败:', error);
      throw error;
    }
  };

  // 处理文件重命名
  const handleFileRename = async (filePath: string, newName: string) => {
    try {
      const response = await fetch('/api/admin/file-operations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          operation: 'rename',
          source: filePath,
          newName: newName,
        }),
      });

      if (response.ok) {
        await loadExistingDocs(); // 重新加载文件列表
        alert('文件重命名成功！');
      } else {
        const error = await response.json();
        throw new Error(error.error || '重命名失败');
      }
    } catch (error) {
      console.error('重命名文件失败:', error);
      throw error;
    }
  };

  // 处理创建目录
  const handleCreateDirectory = async (parentPath: string, dirName: string) => {
    try {
      const response = await fetch('/api/admin/file-operations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          operation: 'create-directory',
          target: parentPath ? `${parentPath}/${dirName}` : dirName,
        }),
      });

      if (response.ok) {
        await loadExistingDocs(); // 重新加载文件列表
        alert('目录创建成功！');
      } else {
        const error = await response.json();
        throw new Error(error.error || '创建目录失败');
      }
    } catch (error) {
      console.error('创建目录失败:', error);
      throw error;
    }
  };

  // 处理隐藏/显示切换
  const handleToggleHidden = async (filePath: string) => {
    try {
      const response = await fetch('/api/admin/file-operations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          operation: 'toggle-hidden',
          source: filePath,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        await loadExistingDocs(); // 重新加载文件列表
        alert(result.message);
      } else {
        const error = await response.json();
        throw new Error(error.error || '切换隐藏状态失败');
      }
    } catch (error) {
      console.error('切换隐藏状态失败:', error);
      throw error;
    }
  };

  // 过滤文件
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalFiles: files.length,
    totalFolders: new Set(files.map(f => f.path.split('/').slice(0, -1).join('/')).filter(Boolean)).size,
    hiddenFiles: files.filter(f => f.isHidden).length,
    newFiles: files.filter(f => f.isNew).length
  };

  return (
    <div className="px-4 space-y-4">
      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* File Management Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">文件浏览器</CardTitle>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateDialog(true)}
                    title="新建文档"
                    className="h-8 px-2"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const dirName = prompt('请输入文件夹名称:');
                      if (dirName && dirName.trim()) {
                        handleCreateDirectory('', dirName.trim());
                      }
                    }}
                    title="新建文件夹"
                    className="h-8 px-2"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="space-y-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索文档..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Upload Area */}
                <DragDropUpload
                  onFilesUpload={handleFileUpload}
                  uploadStatus={uploadStatus}
                  accept=".md"
                  multiple={true}
                />
              </div>

              {/* File Tree */}
              <EnhancedFileTree
                files={filteredFiles}
                currentFile={currentFile}
                onFileSelect={setCurrentFile}
                onFileEdit={setCurrentFile}
                onFileSave={handleSaveFile}
                onFileDelete={handleDeleteFile}
                onCreateFile={handleCreateFileFromPath}
                onFileMove={handleFileMove}
                onFileRename={handleFileRename}
                onCreateDirectory={handleCreateDirectory}
                onToggleHidden={handleToggleHidden}
                showHidden={true}
              />
              
              {/* Compact Stats Footer */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  <span>{stats.totalFiles} 文件</span>
                  <span>·</span>
                  <span>{stats.totalFolders} 文件夹</span>
                  {stats.hiddenFiles > 0 && (
                    <>
                      <span>·</span>
                      <span>{stats.hiddenFiles} 隐藏</span>
                    </>
                  )}
                </div>
                {stats.newFiles > 0 && (
                  <Badge variant="outline" className="text-xs h-5">
                    {stats.newFiles} 待保存
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editor Panel */}
        <div className="lg:col-span-3">
          {currentFile ? (
            <Card>
              <CardContent className="p-0">
                <MarkdownEditor
                  file={currentFile}
                  onContentChange={handleContentChange}
                  onSave={() => handleSaveFile(currentFile)}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12">
                <div className="text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <h3 className="text-base font-medium mb-1">未选择文档</h3>
                  <p className="text-sm text-gray-400">从左侧选择文件或点击 + 创建新文档</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog Components */}
      <CreateFileDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreateFile={handleCreateFile}
        initialPath={createDialogPath}
        availablePaths={availablePaths}
      />


      {/* 许可证管理对话框 */}
      {showLicenseManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">许可证管理</h2>
                <button
                  onClick={() => setShowLicenseManager(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <SimpleLicenseStatus />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}