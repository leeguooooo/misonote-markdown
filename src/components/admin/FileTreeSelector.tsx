'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Check, Square, CheckSquare, MinusSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  lastModified?: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: TreeNode[];
  item?: FileItem;
}

interface FileTreeSelectorProps {
  files: FileItem[];
  selectedPaths: string[];
  onSelectionChange: (paths: string[]) => void;
  selectionMode?: 'single' | 'multiple';
  showFiles?: boolean;
  showFolders?: boolean;
  expandAll?: boolean;
  className?: string;
}

export const FileTreeSelector: React.FC<FileTreeSelectorProps> = ({
  files,
  selectedPaths,
  onSelectionChange,
  selectionMode = 'multiple',
  showFiles = true,
  showFolders = true,
  expandAll = false,
  className
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // 构建树形结构
  const buildTree = (items: FileItem[]): TreeNode[] => {
    const tree: TreeNode[] = [];
    const folderMap = new Map<string, TreeNode>();

    // 先创建所有文件夹节点
    items.forEach(item => {
      if (item.type === 'folder' || item.type === 'file') {
        const parts = item.path.split('/').filter(Boolean);
        let currentPath = '';
        
        parts.forEach((part, index) => {
          const parentPath = currentPath;
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          
          if (index < parts.length - 1 || item.type === 'folder') {
            // 这是一个文件夹
            if (!folderMap.has(currentPath)) {
              const node: TreeNode = {
                name: part,
                path: currentPath,
                type: 'folder',
                children: []
              };
              
              folderMap.set(currentPath, node);
              
              if (parentPath) {
                const parentNode = folderMap.get(parentPath);
                if (parentNode) {
                  parentNode.children.push(node);
                }
              } else {
                tree.push(node);
              }
            }
          }
        });
      }
    });

    // 添加文件到对应的文件夹
    items.forEach(item => {
      if (item.type === 'file') {
        const parts = item.path.split('/').filter(Boolean);
        const fileName = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1).join('/');
        
        const fileNode: TreeNode = {
          name: fileName,
          path: item.path,
          type: 'file',
          children: [],
          item
        };
        
        if (parentPath) {
          const parentNode = folderMap.get(parentPath);
          if (parentNode) {
            parentNode.children.push(fileNode);
          }
        } else {
          tree.push(fileNode);
        }
      }
    });

    // 对每个文件夹的子项进行排序（文件夹在前，文件在后）
    const sortChildren = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.children.length > 0) {
          node.children.sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === 'folder' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });
          sortChildren(node.children);
        }
      });
    };

    sortChildren(tree);
    return tree.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const tree = useMemo(() => buildTree(files), [files]);

  // 初始化展开状态
  useEffect(() => {
    if (expandAll) {
      const allFolders = new Set<string>();
      const collectFolders = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'folder') {
            allFolders.add(node.path);
            collectFolders(node.children);
          }
        });
      };
      collectFolders(tree);
      setExpandedFolders(allFolders);
    }
  }, [expandAll, tree]);

  // 搜索过滤
  const filterTree = (nodes: TreeNode[], query: string): TreeNode[] => {
    if (!query) return nodes;
    
    const lowerQuery = query.toLowerCase();
    const filtered: TreeNode[] = [];
    
    nodes.forEach(node => {
      const matchesQuery = node.name.toLowerCase().includes(lowerQuery) || 
                          node.path.toLowerCase().includes(lowerQuery);
      const filteredChildren = filterTree(node.children, query);
      
      if (matchesQuery || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren
        });
      }
    });
    
    return filtered;
  };

  const filteredTree = useMemo(() => filterTree(tree, searchQuery), [tree, searchQuery]);

  // 切换文件夹展开状态
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // 处理选择
  const handleSelect = (path: string, type: 'file' | 'folder') => {
    if (type === 'file' && !showFiles) return;
    if (type === 'folder' && !showFolders) return;

    if (selectionMode === 'single') {
      onSelectionChange([path]);
    } else {
      const isSelected = selectedPaths.includes(path);
      if (isSelected) {
        onSelectionChange(selectedPaths.filter(p => p !== path));
      } else {
        onSelectionChange([...selectedPaths, path]);
      }
    }
  };

  // 获取文件夹下所有文件的路径
  const getAllFilesInFolder = (node: TreeNode): string[] => {
    const paths: string[] = [];
    
    const collect = (n: TreeNode) => {
      if (n.type === 'file' && showFiles) {
        paths.push(n.path);
      } else if (n.type === 'folder') {
        if (showFolders) {
          paths.push(n.path);
        }
        n.children.forEach(collect);
      }
    };
    
    collect(node);
    return paths;
  };

  // 检查文件夹的选择状态
  const getFolderSelectionState = (node: TreeNode): 'none' | 'some' | 'all' => {
    const allFiles = getAllFilesInFolder(node);
    if (allFiles.length === 0) return 'none';
    
    const selectedCount = allFiles.filter(path => selectedPaths.includes(path)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === allFiles.length) return 'all';
    return 'some';
  };

  // 切换文件夹选择
  const toggleFolderSelection = (node: TreeNode) => {
    const allFiles = getAllFilesInFolder(node);
    const selectionState = getFolderSelectionState(node);
    
    if (selectionState === 'all') {
      // 取消选择所有文件
      onSelectionChange(selectedPaths.filter(path => !allFiles.includes(path)));
    } else {
      // 选择所有文件
      const newPaths = [...selectedPaths];
      allFiles.forEach(path => {
        if (!newPaths.includes(path)) {
          newPaths.push(path);
        }
      });
      onSelectionChange(newPaths);
    }
  };

  // 渲染树节点
  const renderNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedPaths.includes(node.path);
    const folderState = node.type === 'folder' ? getFolderSelectionState(node) : 'none';
    
    return (
      <div key={node.path} className="select-none">
        <div 
          className={cn(
            "flex items-center gap-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded",
            isSelected && "bg-blue-50 dark:bg-blue-900/20"
          )}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          {node.type === 'folder' && (
            <button
              onClick={() => toggleFolder(node.path)}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              {isExpanded ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </button>
          )}
          
          {selectionMode === 'multiple' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (node.type === 'folder') {
                  toggleFolderSelection(node);
                } else {
                  handleSelect(node.path, node.type);
                }
              }}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              {node.type === 'folder' && folderState === 'some' ? (
                <MinusSquare className="h-4 w-4 text-blue-600" />
              ) : (node.type === 'folder' ? folderState === 'all' : isSelected) ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4 text-gray-400" />
              )}
            </button>
          )}
          
          <div 
            className="flex items-center gap-2 flex-1 cursor-pointer"
            onClick={() => {
              if (node.type === 'file' || (node.type === 'folder' && showFolders)) {
                handleSelect(node.path, node.type);
              }
              if (node.type === 'folder') {
                toggleFolder(node.path);
              }
            }}
          >
            {node.type === 'folder' ? (
              isExpanded ? 
                <FolderOpen className="h-4 w-4 text-blue-600" /> : 
                <Folder className="h-4 w-4 text-blue-600" />
            ) : (
              <FileText className="h-4 w-4 text-gray-600" />
            )}
            <span className="text-sm">{node.name}</span>
            {node.item?.lastModified && (
              <span className="text-xs text-gray-500 ml-auto">
                {new Date(node.item.lastModified).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        {node.type === 'folder' && isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="搜索文件或文件夹..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allFolders = new Set<string>();
              const collectFolders = (nodes: TreeNode[]) => {
                nodes.forEach(node => {
                  if (node.type === 'folder') {
                    allFolders.add(node.path);
                    collectFolders(node.children);
                  }
                });
              };
              collectFolders(tree);
              setExpandedFolders(allFolders);
            }}
          >
            展开全部
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedFolders(new Set())}
          >
            折叠全部
          </Button>
          
          {selectionMode === 'multiple' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allPaths: string[] = [];
                  const collect = (nodes: TreeNode[]) => {
                    nodes.forEach(node => {
                      if ((node.type === 'file' && showFiles) || 
                          (node.type === 'folder' && showFolders)) {
                        allPaths.push(node.path);
                      }
                      collect(node.children);
                    });
                  };
                  collect(tree);
                  onSelectionChange(allPaths);
                }}
              >
                全选
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectionChange([])}
              >
                清除选择
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="border rounded-md p-2 max-h-96 overflow-y-auto">
        {filteredTree.length > 0 ? (
          filteredTree.map(node => renderNode(node))
        ) : (
          <div className="text-center text-gray-500 py-4">
            {searchQuery ? '没有找到匹配的文件' : '暂无文件'}
          </div>
        )}
      </div>
      
      {selectionMode === 'multiple' && selectedPaths.length > 0 && (
        <div className="text-sm text-gray-600">
          已选择 {selectedPaths.length} 个项目
        </div>
      )}
    </div>
  );
};