'use client';

import { useState, useEffect } from 'react';
import { Upload, FolderPlus, FileText, Save, Trash2, Edit3, RefreshCw, ChevronDown } from 'lucide-react';
import { marked } from 'marked';
import AdminAuth from '@/components/auth/AdminAuth';

interface FileItem {
  name: string;
  path: string;
  content: string;
  isNew?: boolean;
}

export default function AdminPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFilePath, setNewFilePath] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [availablePaths, setAvailablePaths] = useState<string[]>([]);
  const [showPathDropdown, setShowPathDropdown] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Load existing documents on component mount
  useEffect(() => {
    loadExistingDocs();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowPathDropdown(false);
    };

    if (showPathDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showPathDropdown]);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

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
            // 检查是否已存在同名文件
            const existingIndex = prev.findIndex(f => f.path === baseName);
            if (existingIndex >= 0) {
              // 替换现有文件
              const updated = [...prev];
              updated[existingIndex] = newFile;
              return updated;
            } else {
              // 添加新文件
              return [...prev, newFile];
            }
          });

          // 如果是最后一个文件，清除状态
          if (index === uploadedFiles.length - 1) {
            setUploadStatus('文件上传完成！');
            setTimeout(() => setUploadStatus(''), 3000);
          }
        };
        reader.readAsText(file);
      }
    });

    // 清空文件输入
    event.target.value = '';
  };

  const createNewFile = () => {
    if (!newFileName.trim()) return;

    const fileName = newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`;
    const filePath = newFilePath.trim() || newFileName.replace('.md', '');

    const newFile: FileItem = {
      name: fileName,
      path: filePath,
      content: `# ${newFileName.replace('.md', '')}\n\n在这里编写你的文档内容...\n`,
      isNew: true
    };

    setFiles(prev => [...prev, newFile]);
    setCurrentFile(newFile);
    setIsEditing(true);
    setNewFileName('');
    setNewFilePath('');
  };

  const saveFile = async (file: FileItem) => {
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

  const deleteFile = async (file: FileItem) => {
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
          setIsEditing(false);
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

  const updateFileContent = (content: string) => {
    if (!currentFile) return;

    const updatedFile = { ...currentFile, content };
    setCurrentFile(updatedFile);
    setFiles(prev => prev.map(f =>
      f.path === currentFile.path ? updatedFile : f
    ));
  };

  return (
    <AdminAuth>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - File Management */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                文件管理
              </h2>

              {/* Upload Files */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  上传 Markdown 文件
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        点击上传或拖拽文件
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".md"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {uploadStatus && (
                  <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                    {uploadStatus}
                  </div>
                )}
              </div>

              {/* Create New File */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  创建新文件
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="文件名 (例: getting-started.md)"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="路径 (例: getting-started 或 api/endpoints)"
                      value={newFilePath}
                      onChange={(e) => setNewFilePath(e.target.value)}
                      onFocus={() => setShowPathDropdown(true)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPathDropdown(!showPathDropdown)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {showPathDropdown && availablePaths.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {availablePaths.map((path, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setNewFilePath(path);
                              setShowPathDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg"
                          >
                            {path}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={createNewFile}
                    disabled={!newFileName.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <FolderPlus className="w-4 h-4" />
                    创建文件
                  </button>
                </div>
              </div>

              {/* File List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    文件列表
                  </h3>
                  <button
                    onClick={loadExistingDocs}
                    disabled={isLoading}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        currentFile?.path === file.path
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
                          : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                      }`}
                    >
                      <div
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                        onClick={() => setCurrentFile(file)}
                      >
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {file.name}
                            {file.isNew && (
                              <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                新建
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {file.path}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setCurrentFile(file);
                            setIsEditing(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => saveFile(file)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteFile(file)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Editor/Preview */}
          <div className="lg:col-span-2">
            {currentFile ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {currentFile.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        isEditing
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {isEditing ? '预览' : '编辑'}
                    </button>
                    <button
                      onClick={() => saveFile(currentFile)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </div>

                <div className="h-[calc(100vh-16rem)] overflow-hidden">
                  {isEditing ? (
                    <textarea
                      value={currentFile.content}
                      onChange={(e) => updateFileContent(e.target.value)}
                      className="w-full h-full p-4 border-0 resize-none font-mono text-sm focus:ring-0 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
                      placeholder="在这里编写 Markdown 内容..."
                    />
                  ) : (
                    <div className="h-full overflow-y-auto p-4">
                      <div className="prose max-w-none dark:prose-invert">
                        <div dangerouslySetInnerHTML={{ __html: marked(currentFile.content) }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">选择一个文件开始编辑</h3>
                  <p>从左侧选择文件或创建新文件来开始编辑</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </AdminAuth>
  );
}
