'use client';

import { useState } from 'react';
import { Upload, FolderPlus, FileText, Save, Trash2, Edit3 } from 'lucide-react';

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach(file => {
      if (file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const newFile: FileItem = {
            name: file.name,
            path: file.name.replace('.md', ''),
            content,
            isNew: true
          };
          setFiles(prev => [...prev, newFile]);
        };
        reader.readAsText(file);
      }
    });
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
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              文档管理
            </h1>
            <a
              href="/docs"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              查看文档
            </a>
          </div>
        </div>
      </header>

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
                  <input
                    type="text"
                    placeholder="路径 (例: getting-started 或 api/endpoints)"
                    value={newFilePath}
                    onChange={(e) => setNewFilePath(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
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
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  文件列表
                </h3>
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
                
                <div className="p-4">
                  {isEditing ? (
                    <textarea
                      value={currentFile.content}
                      onChange={(e) => updateFileContent(e.target.value)}
                      className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      placeholder="在这里编写 Markdown 内容..."
                    />
                  ) : (
                    <div className="prose max-w-none dark:prose-invert">
                      <div dangerouslySetInnerHTML={{ __html: currentFile.content }} />
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
  );
}
