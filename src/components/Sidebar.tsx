'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react';
import { DocTree } from '@/lib/docs';

interface SidebarProps {
  docTree: DocTree;
  currentPath?: string[];
}

interface TreeNodeProps {
  node: DocTree;
  level: number;
  currentPath?: string[];
}

function TreeNode({ node, level, currentPath }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isCurrentFile = currentPath && node.file && 
    node.file.slug.join('/') === currentPath.join('/');

  if (node.type === 'file' && node.file) {
    return (
      <Link
        href={`/docs/${node.file.slug.join('/')}`}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
          isCurrentFile
            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
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
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          文档导航
        </h2>
        <nav className="space-y-1">
          {docTree.children?.map((node, index) => (
            <TreeNode
              key={`${node.name}-${index}`}
              node={node}
              level={0}
              currentPath={currentPath}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}
