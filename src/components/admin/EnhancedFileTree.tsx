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
  Move,
  FolderPlus,
  MoreHorizontal,
  Check,
  X,
  Eye,
  EyeOff,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Expand,
  Minimize
} from 'lucide-react';

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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedItem, setDraggedItem] = useState<TreeNode | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [renamingItem, setRenamingItem] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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

    // 首先处理所有文件夹
    files.filter(item => item.type === 'folder').forEach(folder => {
      const pathParts = folder.path.split('/');
      let currentPath = '';

      pathParts.forEach((part, index) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!folderMap.has(currentPath)) {
          const folderNode: TreeNode = {
            name: part,
            path: currentPath,
            type: 'folder',
            children: [],
            file: index === pathParts.length - 1 ? folder : undefined, // 只有最后一级才关联文件夹信息
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
      });
    });

    // 然后处理所有文件
    files.filter(item => item.type === 'file' || !item.type).forEach(file => {
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
          // 这是文件路径中的文件夹，如果不存在则创建
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

    // 智能排序
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.sort((a, b) => {
        // 1. 文件夹优先
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }

        // 2. 隐藏文件排在后面
        if (a.file?.isHidden !== b.file?.isHidden) {
          if (a.file?.isHidden) return 1;
          if (b.file?.isHidden) return -1;
        }

        // 3. 新建文件排在前面
        if (a.file?.isNew !== b.file?.isNew) {
          if (a.file?.isNew) return -1;
          if (b.file?.isNew) return 1;
        }

        // 4. 根据排序方式进行排序
        let result = 0;

        switch (sortBy) {
          case 'name':
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();

            // 数字排序（如果名称包含数字）
            const numA = parseInt(nameA.match(/\d+/)?.[0] || '0');
            const numB = parseInt(nameB.match(/\d+/)?.[0] || '0');

            if (numA !== numB && !isNaN(numA) && !isNaN(numB)) {
              result = numA - numB;
            } else {
              result = nameA.localeCompare(nameB, 'zh-CN', {
                numeric: true,
                sensitivity: 'base'
              });
            }
            break;

          case 'date':
            const dateA = a.file?.lastModified ? new Date(a.file.lastModified).getTime() : 0;
            const dateB = b.file?.lastModified ? new Date(b.file.lastModified).getTime() : 0;
            result = dateB - dateA; // 新的在前
            break;

          case 'type':
            if (a.type === b.type) {
              // 同类型按名称排序
              result = a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'zh-CN');
            } else {
              result = a.type === 'folder' ? -1 : 1;
            }
            break;

          default:
            result = a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'zh-CN');
        }

        // 应用排序顺序
        return sortOrder === 'desc' ? -result : result;
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

    // 检查是否试图将文件夹移动到自己的子目录中
    if (draggedItem.type === 'folder') {
      if (targetNode.path.startsWith(draggedItem.path + '/') || targetNode.path === draggedItem.path) {
        alert('不能将文件夹移动到自己的子目录中');
        setDraggedItem(null);
        return;
      }
    }

    try {
      // 构建正确的目标路径
      let newPath: string;

      if (draggedItem.type === 'file') {
        // 文件移动：目标路径应该包含完整的文件名
        const fileName = draggedItem.name;
        newPath = targetNode.path ? `${targetNode.path}/${fileName}` : fileName;
      } else {
        // 文件夹移动：目标路径应该是文件夹名
        const folderName = draggedItem.name;
        newPath = targetNode.path ? `${targetNode.path}/${folderName}` : folderName;
      }

      console.log('Frontend move:', {
        source: draggedItem.path,
        target: newPath,
        type: draggedItem.type
      });

      await onFileMove(draggedItem.path, newPath);
    } catch (error) {
      console.error('移动失败:', error);
      const errorMessage = error instanceof Error ? error.message : '移动失败';
      alert(errorMessage);
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

  // 展开所有文件夹
  const expandAll = () => {
    const allFolderPaths = new Set<string>();

    const collectFolderPaths = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'folder') {
          allFolderPaths.add(node.path);
          if (node.children) {
            collectFolderPaths(node.children);
          }
        }
      });
    };

    collectFolderPaths(buildTree(files));
    setExpandedFolders(allFolderPaths);
  };

  // 折叠所有文件夹
  const collapseAll = () => {
    setExpandedFolders(new Set());
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
            draggable
            onDragStart={(e) => handleDragStart(e, node)}
            onDragOver={(e) => handleDragOver(e, node.path)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, node)}
            onContextMenu={(e) => handleContextMenu(e, node)}
            className={`flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors ${
              isDragOver ? 'bg-green-50 dark:bg-green-900/20 border border-green-300' : ''
            } ${draggedItem?.path === node.path ? 'opacity-50' : ''}`}
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
                  <span className={`text-sm font-medium flex items-center gap-2 ${
                    (node.file?.isHidden ||
                     files.find(f => f.path === node.path && f.type === 'folder')?.isHidden)
                      ? 'text-gray-400 dark:text-gray-500 italic'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {(node.file?.isHidden ||
                      files.find(f => f.path === node.path && f.type === 'folder')?.isHidden) &&
                      <EyeOff className="w-3 h-3" />}
                    {node.name || '根目录'}
                    {(node.file?.isHidden ||
                      files.find(f => f.path === node.path && f.type === 'folder')?.isHidden) && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        隐藏
                      </span>
                    )}
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
      {/* 搜索框和排序控制 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索文件..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm"
          />
        </div>

        {/* 排序和展开控制 */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">排序:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'type')}
              className="px-2 py-1 border border-gray-300 rounded text-xs bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            >
              <option value="name">名称</option>
              <option value="date">日期</option>
              <option value="type">类型</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title={sortOrder === 'asc' ? '升序' : '降序'}
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="w-3 h-3" />
              ) : (
                <SortDesc className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* 展开/折叠控制 */}
          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="展开所有文件夹"
            >
              <Expand className="w-3 h-3" />
            </button>
            <button
              onClick={collapseAll}
              className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="折叠所有文件夹"
            >
              <Minimize className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 文件树 */}
      <div
        className="flex-1 overflow-y-auto p-2"
        onDragOver={(e) => {
          if (draggedItem) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverItem('root');
          }
        }}
        onDragLeave={() => setDragOverItem(null)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragOverItem(null);

          if (draggedItem && draggedItem.path.includes('/')) {
            // 只有在子目录中的项目才能移动到根目录
            try {
              // 构建根目录的目标路径
              let newPath: string;

              if (draggedItem.type === 'file') {
                // 文件移动到根目录：使用完整文件名
                newPath = draggedItem.name;
              } else {
                // 文件夹移动到根目录：使用文件夹名
                newPath = draggedItem.name;
              }

              console.log('Move to root:', {
                source: draggedItem.path,
                target: newPath,
                type: draggedItem.type
              });

              await onFileMove(draggedItem.path, newPath);
            } catch (error) {
              console.error('移动到根目录失败:', error);
              const errorMessage = error instanceof Error ? error.message : '移动失败';
              alert(errorMessage);
            }
            setDraggedItem(null);
          }
        }}
      >
        {filteredTree.length > 0 ? (
          <div className={`space-y-1 ${dragOverItem === 'root' ? 'bg-green-50 dark:bg-green-900/20 border-2 border-dashed border-green-300 rounded-lg p-2' : ''}`}>
            {filteredTree.map(node => renderNode(node))}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            {searchTerm ? '未找到匹配的文件' : '暂无文件'}
          </div>
        )}

        {/* 根目录拖拽提示 */}
        {draggedItem && dragOverItem === 'root' && draggedItem.path.includes('/') && (
          <div className="absolute bottom-4 left-4 right-4 bg-green-100 dark:bg-green-900/30 border border-green-300 rounded-lg p-3 text-center text-sm text-green-700 dark:text-green-300">
            释放以移动到根目录
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
            {(contextMenu.node.file?.isHidden ||
              (contextMenu.node.type === 'folder' &&
               files.find(f => f.path === contextMenu.node.path && f.type === 'folder')?.isHidden)) ? (
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
          💡 点击文件夹展开，拖拽移动文件，右键查看更多选项
        </div>
      </div>
    </div>
  );
}
