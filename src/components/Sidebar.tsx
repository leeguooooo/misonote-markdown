'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, Expand, Minimize } from 'lucide-react';
import { DocTree } from '@/lib/docs';

interface SidebarProps {
  docTree: DocTree;
  currentPath?: string[];
}

interface TreeNodeProps {
  node: DocTree;
  level: number;
  currentPath?: string[];
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
}

function TreeNode({ node, level, currentPath, expandedFolders, onToggleFolder }: TreeNodeProps) {
  const isExpanded = expandedFolders?.has(node.path) || false;
  const isCurrentFile = currentPath && node.file &&
    node.file.slug.join('/') === currentPath.join('/');

  if (node.type === 'file' && node.file) {
    return (
      <Link
        href={`/docs/${node.file.slug.join('/')}`}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${isCurrentFile
          ? 'bg-blue-100 text-blue-900'
          : 'text-gray-700 hover:bg-gray-100'
          }`}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        <FileText className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{node.file.title}</span>
      </Link>
    );
  }

  if (node.type === 'directory' && node.children) {
    return (
      <div>
        <button
          onClick={() => onToggleFolder(node.path)}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          style={{ paddingLeft: `${level * 12 + 12}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && (
          <div className="mt-1">
            {node.children.map((child, index) => (
              <TreeNode
                key={`${child.name}-${index}`}
                node={child}
                level={level + 1}
                currentPath={currentPath}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function Sidebar({ docTree, currentPath }: SidebarProps) {
  // 初始化展开状态：只展开包含当前文档的路径
  const getInitialExpandedFolders = (): Set<string> => {
    const expanded = new Set<string>();

    if (currentPath && currentPath.length > 0) {
      // 如果当前路径有多个部分，展开所有父级文件夹
      // 例如：['项目文档', '管理后台', '直播任务管理', 'complete-api-reference']
      // 应该展开：'项目文档' 和 '项目文档/管理后台' 和 '项目文档/管理后台/直播任务管理'

      // 对于文件路径，我们需要展开除了最后一个部分（文件名）之外的所有文件夹
      const foldersToExpand = currentPath.length > 1 ? currentPath.length - 1 : 0;

      for (let i = 0; i < foldersToExpand; i++) {
        const folderPath = currentPath.slice(0, i + 1).join('/');
        expanded.add(folderPath);
      }
    }

    return expanded;
  };

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(getInitialExpandedFolders);

  // 当 currentPath 变化时，更新展开状态
  useEffect(() => {
    const newExpanded = getInitialExpandedFolders();
    setExpandedFolders(newExpanded);
  }, [currentPath?.join('/')]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  // 展开所有文件夹
  const expandAll = () => {
    const allFolderPaths = new Set<string>();

    const collectFolderPaths = (node: DocTree) => {
      if (node.type === 'directory') {
        allFolderPaths.add(node.path);
        if (node.children) {
          node.children.forEach(collectFolderPaths);
        }
      }
    };

    if (docTree.children) {
      docTree.children.forEach(collectFolderPaths);
    }

    setExpandedFolders(allFolderPaths);
  };

  // 折叠所有文件夹
  const collapseAll = () => {
    setExpandedFolders(new Set());
  };

  return (
    <div className="w-64 bg-transparent h-full overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            文档导航
          </h2>

          {/* 展开/折叠控制 */}
          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors rounded hover:bg-gray-100"
              title="展开所有文件夹"
            >
              <Expand className="w-3 h-3" />
            </button>
            <button
              onClick={collapseAll}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors rounded hover:bg-gray-100"
              title="折叠所有文件夹"
            >
              <Minimize className="w-3 h-3" />
            </button>
          </div>
        </div>

        <nav className="space-y-1">
          {docTree.children?.map((node, index) => (
            <TreeNode
              key={`${node.name}-${index}`}
              node={node}
              level={0}
              currentPath={currentPath}
              expandedFolders={expandedFolders}
              onToggleFolder={toggleFolder}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}
