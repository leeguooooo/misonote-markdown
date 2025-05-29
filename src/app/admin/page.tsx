'use client';

import { useState, useEffect } from 'react';
import { Upload, Plus, FolderPlus } from 'lucide-react';
import AdminAuth from '@/components/auth/AdminAuth';
import EnhancedFileTree from '@/components/admin/EnhancedFileTree';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import CreateFileDialog from '@/components/admin/CreateFileDialog';
import DragDropUpload from '@/components/admin/DragDropUpload';

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        {/* 左侧文件树 */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                文件管理
              </h2>
              <div className="flex items-center gap-2">
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
        <div className="flex-1 flex flex-col">
          {currentFile ? (
            <MarkdownEditor
              file={currentFile}
              onContentChange={handleContentChange}
              onSave={() => handleSaveFile(currentFile)}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Upload className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">选择文件开始编辑</h3>
                <p>从左侧选择文件或创建新文件来开始编辑</p>
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
      </div>
    </AdminAuth>
  );
}
