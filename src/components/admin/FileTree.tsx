'use client';

import { useState, useRef } from 'react';
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
  MoreHorizontal
} from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  content: string;
  isNew?: boolean;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  file?: FileItem;
}

interface FileTreeProps {
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
}

export default function FileTree({
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
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedItem, setDraggedItem] = useState<TreeNode | null>(null);
  const [dragOverItem, setDragOverItem] = useState<TreeNode | null>(null);
  const [renamingItem, setRenamingItem] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: TreeNode;
  } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState<{
    parentPath: string;
    type: 'file' | 'directory';
  } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // 构建树结构
  const buildTree = (files: FileItem[]): TreeNode[] => {
    const tree: TreeNode[] = [];
    const folderMap = new Map<string, TreeNode>();

    // 首先创建所有文件夹
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

    // 排序：文件夹在前，文件在后，按名称排序
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

  // 过滤树节点
  const filterTree = (nodes: TreeNode[], searchTerm: string): TreeNode[] => {
    if (!searchTerm) return nodes;

    const filtered: TreeNode[] = [];

    nodes.forEach(node => {
      if (node.type === 'file') {
        if (node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.path.toLowerCase().includes(searchTerm.toLowerCase())) {
          filtered.push(node);
        }
      } else {
        const filteredChildren = filterTree(node.children || [], searchTerm);
        if (filteredChildren.length > 0) {
          filtered.push({
            ...node,
            children: filteredChildren,
          });
        }
      }
    });

    return filtered;
  };

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

    if (node.type === 'file' && node.file) {
      return (
        <div
          key={node.path}
          className={`flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          <div
            className="flex items-center gap-2 flex-1 py-2 cursor-pointer"
            onClick={() => onFileSelect(node.file!)}
          >
            <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
              {node.name}
              {node.file.isNew && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                  新建
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileEdit(node.file!);
              }}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              title="编辑"
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
        </div>
      );
    }

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <div
            className="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {node.name || '根目录'}
              </span>
              <span className="text-xs text-gray-500">
                ({(node.children || []).length})
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateFile(node.path);
              }}
              className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-100 rounded opacity-0 group-hover:opacity-100 transition-opacity mr-2"
              title="在此文件夹创建文件"
            >
              <Plus className="w-3 h-3" />
            </button>
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
  const filteredTree = filterTree(tree, searchTerm);

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

      {/* 统计信息 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        共 {files.length} 个文件
        {searchTerm && ` (显示 ${filteredTree.reduce((count, node) => {
          const countFiles = (n: TreeNode): number => {
            if (n.type === 'file') return 1;
            return (n.children || []).reduce((sum, child) => sum + countFiles(child), 0);
          };
          return count + countFiles(node);
        }, 0)} 个匹配)`}
      </div>
    </div>
  );
}
