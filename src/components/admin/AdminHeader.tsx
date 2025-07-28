'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  Home,
  Shield,
  Globe,
  Menu,
  ChevronDown
} from 'lucide-react';

const AdminHeader: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    router.push('/admin');
  };

  // 根据路径生成面包屑
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    for (let i = 0; i < paths.length; i++) {
      const path = '/' + paths.slice(0, i + 1).join('/');
      const name = paths[i];
      
      // 转换路径名为中文显示名
      const displayNames: { [key: string]: string } = {
        'admin': '管理后台',
        'dashboard': '仪表盘',
        'documents': '文档管理',
        'users': '用户管理',
        'analytics': '数据分析',
        'integrations': '集成管理',
        'license': '许可证管理',
        'system': '系统设置',
        'export': '文档导出',
        'import': '文档导入',
        'editor': '文档编辑器',
        'list': '列表',
        'permissions': '权限管理',
        'groups': '用户组',
        'usage': '使用统计',
        'performance': '性能监控',
        'reports': '报告中心',
        'api-keys': 'API 密钥',
        'webhooks': 'Webhooks',
        'mcp': 'MCP 服务器',
        'status': '状态',
        'generator': '生成器',
        'enterprise': '企业功能',
        'general': '常规设置',
        'database': '数据库管理',
        'security': '安全设置',
        'notifications': '通知设置'
      };
      
      breadcrumbs.push({
        name: displayNames[name] || name,
        path: path,
        current: i === paths.length - 1
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Breadcrumbs */}
        <div className="flex items-center space-x-4">
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            <Menu className="h-5 w-5" />
          </button>
          
          <nav className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-gray-400">/</span>
                )}
                {crumb.current ? (
                  <span className="font-medium text-gray-800">{crumb.name}</span>
                ) : (
                  <Link
                    href={crumb.path}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {crumb.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          {/* Quick Search */}
          <div className="hidden sm:block">
            <div className="relative">
              <input
                type="text"
                placeholder="快速搜索..."
                className="w-64 pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* System Status */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600 hidden sm:block">系统正常</span>
            </div>
          </div>

          {/* License Status */}
          <Badge variant="outline" className="hidden sm:flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>社区版</span>
          </Badge>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-800">通知</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-4 text-sm text-gray-600 text-center">
                    暂无新通知
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                管理员
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <Link
                    href="/"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Home className="h-4 w-4 mr-3" />
                    返回前台
                  </Link>
                  <Link
                    href="/admin/system/security"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    账户设置
                  </Link>
                  <div className="border-t border-gray-100"></div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden px-6 pb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;