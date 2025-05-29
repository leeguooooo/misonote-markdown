'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Edit3,
  Save,
  Trash2,
  Plus,
  Search,
  Copy,
  Move3,
  FolderPlus,
  MoreHorizontal,
  Check,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  content: string;
  isNew?: boolean;
  isHidden?: boolean;
  metadata?: any;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  file?: FileItem;
}

interface EnhancedFileTreeProps {
  files: FileItem[];
  currentFile: FileItem | null;
  onFileSelect: (file: FileItem) => void;
  onFileEdit: (file: FileItem) => void;
  onFileSave: (file: FileItem) => void;
  onFileDelete: (file: FileItem) => void;
  onCreateFile: (parentPath: string) => void;
  onFileMove: (sourcePath: string, targetPath: string) => Promise<void>;
  onFileRename: (filePath: string, newName: string) => Promise<void>;
  onCreateDirectory: (parentPath: string, dirName: string) => Promise<void>;
  onToggleHidden: (filePath: string) => Promise<void>;
  showHidden?: boolean;
}

export default function EnhancedFileTree({
  files,
  currentFile,
  onFileSelect,
  onFileEdit,
  onFileSave,
  onFileDelete,
  onCreateFile,
  onFileMove,
  onFileRename,
  onCreateDirectory,
  onToggleHidden,
  showHidden = true,
}: EnhancedFileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedItem, setDraggedItem] = useState<TreeNode | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [renamingItem, setRenamingItem] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: TreeNode;
  } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // 构建树结构
  const buildTree = (files: FileItem[]): TreeNode[] => {
    const tree: TreeNode[] = [];
    const folderMap = new Map<string, TreeNode>();

    files.forEach(file => {
      const pathParts = file.path.split('/');
      let currentPath = '';

      pathParts.forEach((part, index) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (index === pathParts.length - 1) {
          // 这是文件
          const fileNode: TreeNode = {
            name: file.name,
            path: file.path,
            type: 'file',
            file,
          };

          if (parentPath === '') {
            tree.push(fileNode);
          } else {
            const parentFolder = folderMap.get(parentPath);
            if (parentFolder) {
              parentFolder.children = parentFolder.children || [];
              parentFolder.children.push(fileNode);
            }
          }
        } else {
          // 这是文件夹
          if (!folderMap.has(currentPath)) {
            const folderNode: TreeNode = {
              name: part,
              path: currentPath,
              type: 'folder',
              children: [],
            };

            folderMap.set(currentPath, folderNode);

            if (parentPath === '') {
              tree.push(folderNode);
            } else {
              const parentFolder = folderMap.get(parentPath);
              if (parentFolder) {
                parentFolder.children = parentFolder.children || [];
                parentFolder.children.push(folderNode);
              }
            }
          }
        }
      });
    });

    // 排序
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      }).map(node => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined,
      }));
    };

    return sortNodes(tree);
  };

  // 拖拽处理
  const handleDragStart = (e: React.DragEvent, node: TreeNode) => {
    setDraggedItem(node);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(targetPath);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e: React.DragEvent, targetNode: TreeNode) => {
    e.preventDefault();
    setDragOverItem(null);

    if (!draggedItem || draggedItem.path === targetNode.path) {
      setDraggedItem(null);
      return;
    }

    // 只允许拖拽到文件夹
    if (targetNode.type !== 'folder') {
      setDraggedItem(null);
      return;
    }

    try {
      const newPath = `${targetNode.path}/${draggedItem.name}`;
      await onFileMove(draggedItem.path, newPath);
    } catch (error) {
      console.error('移动文件失败:', error);
      alert('移动文件失败');
    }

    setDraggedItem(null);
  };

  // 重命名处理
  const startRename = (node: TreeNode) => {
    setRenamingItem(node.path);
    setNewName(node.name);
    setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 0);
  };

  const handleRename = async () => {
    if (!renamingItem || !newName.trim()) return;

    try {
      await onFileRename(renamingItem, newName.trim());
      setRenamingItem(null);
      setNewName('');
    } catch (error) {
      console.error('重命名失败:', error);
      alert('重命名失败');
    }
  };

  const cancelRename = () => {
    setRenamingItem(null);
    setNewName('');
  };

  // 右键菜单处理
  const handleContextMenu = (e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
    });
  };

  // 关闭右键菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = currentFile?.path === node.path;
    const isDragOver = dragOverItem === node.path;
    const isRenaming = renamingItem === node.path;

    if (node.type === 'file' && node.file) {
      return (
        <div
          key={node.path}
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
          onContextMenu={(e) => handleContextMenu(e, node)}
          className={`flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          } ${isDragOver ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          <div
            className="flex items-center gap-2 flex-1 py-2 cursor-pointer"
            onClick={() => onFileSelect(node.file!)}
          >
            <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
            {isRenaming ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  ref={renameInputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') cancelRename();
                  }}
                  onBlur={handleRename}
                  className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
                />
                <button onClick={handleRename} className="p-1 text-green-600 hover:bg-green-100 rounded">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={cancelRename} className="p-1 text-red-600 hover:bg-red-100 rounded">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span className={`text-sm truncate flex items-center gap-2 ${
                node.file.isHidden
                  ? 'text-gray-400 dark:text-gray-500 italic'
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {node.file.isHidden && <EyeOff className="w-3 h-3" />}
                {node.file.name}
                {node.file.isNew && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                    新建
                  </span>
                )}
                {node.file.isHidden && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                    隐藏
                  </span>
                )}
              </span>
            )}
          </div>
          {!isRenaming && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startRename(node);
                }}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                title="重命名"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFileSave(node.file!);
                }}
                className="p-1 text-green-600 hover:bg-green-100 rounded"
                title="保存"
              >
                <Save className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFileDelete(node.file!);
                }}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
                title="删除"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      );
    }

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <div
            onDragOver={(e) => handleDragOver(e, node.path)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, node)}
            onContextMenu={(e) => handleContextMenu(e, node)}
            className={`flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors ${
              isDragOver ? 'bg-green-50 dark:bg-green-900/20 border border-green-300' : ''
            }`}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
          >
            <div
              className="flex items-center gap-2 flex-1 py-2 cursor-pointer"
              onClick={() => toggleFolder(node.path)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
              {isRenaming ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename();
                      if (e.key === 'Escape') cancelRename();
                    }}
                    onBlur={handleRename}
                    className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
                  />
                  <button onClick={handleRename} className="p-1 text-green-600 hover:bg-green-100 rounded">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={cancelRename} className="p-1 text-red-600 hover:bg-red-100 rounded">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {node.name || '根目录'}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({(node.children || []).length})
                  </span>
                </>
              )}
            </div>
            {!isRenaming && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFile(node.path);
                  }}
                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                  title="创建文件"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(node);
                  }}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  title="重命名"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const tree = buildTree(files);
  const filteredTree = searchTerm ? tree.filter(node =>
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (node.file && node.file.content.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : tree;

  return (
    <div className="h-full flex flex-col">
      {/* 搜索框 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索文件..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
          />
        </div>
      </div>

      {/* 文件树 */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredTree.length > 0 ? (
          <div className="space-y-1">
            {filteredTree.map(node => renderNode(node))}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            {searchTerm ? '未找到匹配的文件' : '暂无文件'}
          </div>
        )}
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              startRename(contextMenu.node);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            重命名
          </button>
          {contextMenu.node.type === 'folder' && (
            <button
              onClick={() => {
                onCreateFile(contextMenu.node.path);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              创建文件
            </button>
          )}
          <button
            onClick={() => {
              onToggleHidden(contextMenu.node.path);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            {contextMenu.node.file?.isHidden ? (
              <>
                <Eye className="w-4 h-4" />
                显示
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                隐藏
              </>
            )}
          </button>
          <button
            onClick={() => {
              if (contextMenu.node.file) {
                onFileDelete(contextMenu.node.file);
              }
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
        </div>
      )}

      {/* 统计信息 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        共 {files.length} 个文件
        {searchTerm && ` (显示 ${filteredTree.length} 个匹配)`}
        <div className="mt-1 text-xs text-gray-400">
          💡 拖拽文件到文件夹可移动，右键查看更多选项
        </div>
      </div>
    </div>
  );
}
