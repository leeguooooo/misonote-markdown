'use client';

import { useState, useEffect } from 'react';
import { Upload, Plus, FolderPlus, Server, Send, Key, Shield } from 'lucide-react';
import AdminAuth from '@/components/auth/AdminAuth';
import EnhancedFileTree from '@/components/admin/EnhancedFileTree';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import CreateFileDialog from '@/components/admin/CreateFileDialog';
import DragDropUpload from '@/components/admin/DragDropUpload';
import MCPServerManager from '@/components/admin/MCPServerManager';
import MCPDocumentPusher from '@/components/admin/MCPDocumentPusher';
import ApiKeyManager from '@/components/admin/ApiKeyManager';
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

export default function AdminPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availablePaths, setAvailablePaths] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createDialogPath, setCreateDialogPath] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMCPManager, setShowMCPManager] = useState(false);
  const [showMCPPusher, setShowMCPPusher] = useState(false);
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);
  const [showLicenseManager, setShowLicenseManager] = useState(false);

  // Load existing documents on component mount
  useEffect(() => {
    loadExistingDocs();
  }, []);

  // 处理 URL 参数中的编辑请求
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editPath = urlParams.get('edit');

    if (editPath && files.length > 0) {
      const fileToEdit = files.find(f => f.path === editPath);
      if (fileToEdit) {
        setCurrentFile(fileToEdit);
        // 清除 URL 参数
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
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

  return (
    <AdminAuth>
      <div className="min-h-screen bg-gray-50 flex relative">
        {/* 管理页面背景网格 */}
        <div className="fixed inset-0 bg-grid-slate-200 bg-grid-lg opacity-25 pointer-events-none"></div>
        <div className="fixed inset-0 bg-grid-dots-purple opacity-15 pointer-events-none"></div>

        {/* 左侧文件树 */}
        <div className="w-80 bg-white/95 backdrop-blur-sm border-r border-gray-200 relative z-10">
          <div className="p-4 border-b border-gray-200  ">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900  ">
                文件管理
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLicenseManager(true)}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                  title="许可证管理"
                >
                  <Shield className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowApiKeyManager(true)}
                  className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                  title="API 密钥管理"
                >
                  <Key className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowMCPManager(true)}
                  className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                  title="MCP 服务器管理"
                >
                  <Server className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowMCPPusher(true)}
                  className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                  title="推送到 MCP 服务器"
                >
                  <Send className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const dirName = prompt('请输入文件夹名称:');
                    if (dirName && dirName.trim()) {
                      handleCreateDirectory('', dirName.trim());
                    }
                  }}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                  title="创建根目录文件夹"
                >
                  <FolderPlus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="创建新文件"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 上传区域 */}
            <div className="mb-4">
              <DragDropUpload
                onFilesUpload={handleFileUpload}
                uploadStatus={uploadStatus}
                accept=".md"
                multiple={true}
              />
            </div>
          </div>

          {/* 文件树 */}
          <EnhancedFileTree
            files={files}
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
        </div>

        {/* 右侧编辑器 */}
        <div className="flex-1 flex flex-col relative z-10">
          {currentFile ? (
            <div className="flex-1 bg-white/90 backdrop-blur-sm">
              <MarkdownEditor
                file={currentFile}
                onContentChange={handleContentChange}
                onSave={() => handleSaveFile(currentFile)}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white/90 backdrop-blur-sm relative">
              {/* 空状态的微妙网格背景 */}
              <div className="absolute inset-0 bg-grid-blue-100 bg-grid-sm opacity-30 pointer-events-none"></div>
              <div className="text-center text-gray-500 relative z-10">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-gray-200/50">
                  <Upload className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                  <h3 className="text-lg font-medium mb-2">选择文件开始编辑</h3>
                  <p>从左侧选择文件或创建新文件来开始编辑</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 创建文件对话框 */}
        <CreateFileDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreateFile={handleCreateFile}
          initialPath={createDialogPath}
          availablePaths={availablePaths}
        />

        {/* MCP 服务器管理对话框 */}
        {showMCPManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <MCPServerManager onClose={() => setShowMCPManager(false)} />
              </div>
            </div>
          </div>
        )}

        {/* MCP 文档推送对话框 */}
        {showMCPPusher && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <MCPDocumentPusher
                  documents={files.map(file => ({
                    ...file,
                    type: file.type || 'file' as 'file' | 'folder'
                  }))}
                  onClose={() => setShowMCPPusher(false)}
                />
              </div>
            </div>
          </div>
        )}

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

        {/* API 密钥管理对话框 */}
        {showApiKeyManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <ApiKeyManager onClose={() => setShowApiKeyManager(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminAuth>
  );
}
