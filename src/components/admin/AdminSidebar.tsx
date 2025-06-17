'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Database,
  Upload,
  Download,
  BarChart3,
  Shield,
  Key,
  MessageSquare,
  Bookmark,
  Search,
  GitBranch,
  Server,
  Bell,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  Crown,
  Zap,
  Globe,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children?: MenuItem[];
  requiresLicense?: 'professional' | 'enterprise';
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: '仪表盘',
    icon: LayoutDashboard,
    href: '/admin/dashboard'
  },
  {
    id: 'documents',
    label: '文档管理',
    icon: FileText,
    href: '/admin/documents',
    children: [
      {
        id: 'doc-editor',
        label: '文档编辑器',
        icon: FileText,
        href: '/admin/documents/editor'
      },
      {
        id: 'doc-export',
        label: '文档导出',
        icon: Download,
        href: '/admin/documents/export'
      },
      {
        id: 'doc-import',
        label: '文档导入',
        icon: Upload,
        href: '/admin/documents/import'
      }
    ]
  },
  {
    id: 'content',
    label: '内容管理',
    icon: MessageSquare,
    href: '/admin/content',
    children: [
      {
        id: 'comments',
        label: '评论管理',
        icon: MessageSquare,
        href: '/admin/content/comments'
      },
      {
        id: 'annotations',
        label: '注释管理',
        icon: Bookmark,
        href: '/admin/content/annotations'
      },
      {
        id: 'search',
        label: '搜索索引',
        icon: Search,
        href: '/admin/content/search'
      }
    ]
  },
  {
    id: 'users',
    label: '用户管理',
    icon: Users,
    href: '/admin/users',
    requiresLicense: 'professional',
    children: [
      {
        id: 'user-list',
        label: '用户列表',
        icon: Users,
        href: '/admin/users/list',
        requiresLicense: 'professional'
      },
      {
        id: 'permissions',
        label: '权限管理',
        icon: Shield,
        href: '/admin/users/permissions',
        requiresLicense: 'enterprise'
      },
      {
        id: 'groups',
        label: '用户组',
        icon: Users,
        href: '/admin/users/groups',
        requiresLicense: 'enterprise'
      }
    ]
  },
  {
    id: 'analytics',
    label: '数据分析',
    icon: BarChart3,
    href: '/admin/analytics',
    requiresLicense: 'professional',
    children: [
      {
        id: 'usage',
        label: '使用统计',
        icon: BarChart3,
        href: '/admin/analytics/usage',
        requiresLicense: 'professional'
      },
      {
        id: 'performance',
        label: '性能监控',
        icon: Zap,
        href: '/admin/analytics/performance',
        requiresLicense: 'enterprise'
      },
      {
        id: 'reports',
        label: '报告中心',
        icon: FileText,
        href: '/admin/analytics/reports',
        requiresLicense: 'enterprise'
      }
    ]
  },
  {
    id: 'integrations',
    label: '集成管理',
    icon: GitBranch,
    href: '/admin/integrations',
    children: [
      {
        id: 'api-keys',
        label: 'API 密钥',
        icon: Key,
        href: '/admin/integrations/api-keys'
      },
      {
        id: 'webhooks',
        label: 'Webhooks',
        icon: Globe,
        href: '/admin/integrations/webhooks',
        requiresLicense: 'professional'
      },
      {
        id: 'mcp',
        label: 'MCP 服务器',
        icon: Server,
        href: '/admin/integrations/mcp'
      }
    ]
  },
  {
    id: 'license',
    label: '许可证管理',
    icon: Crown,
    href: '/admin/license',
    children: [
      {
        id: 'license-status',
        label: '许可证状态',
        icon: Shield,
        href: '/admin/license/status'
      },
      {
        id: 'license-generator',
        label: '许可证生成',
        icon: Key,
        href: '/admin/license/generator'
      },
      {
        id: 'enterprise-features',
        label: '企业功能',
        icon: Crown,
        href: '/admin/license/enterprise',
        requiresLicense: 'enterprise',
        badge: 'Enterprise',
        badgeVariant: 'default'
      }
    ]
  },
  {
    id: 'system',
    label: '系统设置',
    icon: Settings,
    href: '/admin/system',
    children: [
      {
        id: 'general',
        label: '常规设置',
        icon: Settings,
        href: '/admin/system/general'
      },
      {
        id: 'database',
        label: '数据库管理',
        icon: Database,
        href: '/admin/system/database'
      },
      {
        id: 'security',
        label: '安全设置',
        icon: Lock,
        href: '/admin/system/security'
      },
      {
        id: 'notifications',
        label: '通知设置',
        icon: Bell,
        href: '/admin/system/notifications',
        requiresLicense: 'professional'
      }
    ]
  }
];

interface AdminSidebarProps {
  className?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ className }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['documents']));
  const pathname = usePathname();

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const getLicenseBadge = (requiresLicense?: string) => {
    if (!requiresLicense) return null;
    
    const badgeText = requiresLicense === 'enterprise' ? 'Enterprise' : 'Pro';
    const badgeVariant = requiresLicense === 'enterprise' ? 'default' : 'secondary';
    
    return (
      <Badge variant={badgeVariant} className="text-xs">
        {badgeText}
      </Badge>
    );
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const active = isActive(item.href);

    return (
      <div key={item.id}>
        <div
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
            level > 0 && 'ml-4 pl-6 border-l border-gray-200',
            active
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100',
            collapsed && level === 0 && 'justify-center px-2'
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            }
          }}
        >
          <Link
            href={item.href}
            className="flex items-center flex-1 min-w-0"
            onClick={(e) => hasChildren && e.preventDefault()}
          >
            <item.icon className={cn('h-4 w-4 flex-shrink-0', collapsed && level === 0 && 'h-5 w-5')} />
            {(!collapsed || level > 0) && (
              <>
                <span className="ml-3 truncate">{item.label}</span>
                <div className="flex items-center ml-2 space-x-1">
                  {item.badge && (
                    <Badge variant={item.badgeVariant || 'outline'} className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  {getLicenseBadge(item.requiresLicense)}
                </div>
              </>
            )}
          </Link>
          {hasChildren && (!collapsed || level > 0) && (
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform text-gray-400',
                isExpanded && 'transform rotate-90'
              )}
            />
          )}
        </div>

        {hasChildren && isExpanded && (!collapsed || level > 0) && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Misonote</h2>
              <p className="text-xs text-gray-500">管理后台</p>
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Quick Actions */}
        {!collapsed && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              快速操作
            </p>
            <Link
              href="/"
              className="flex items-center px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Home className="h-4 w-4 mr-3" />
              返回前台
            </Link>
          </div>
        )}

        {/* Main Menu */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              主要功能
            </p>
          )}
          {menuItems.map(item => renderMenuItem(item))}
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/admin/help"
            className="flex items-center px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <HelpCircle className="h-4 w-4 mr-3" />
            帮助文档
          </Link>
        </div>
      )}
    </div>
  );
};

export default AdminSidebar;