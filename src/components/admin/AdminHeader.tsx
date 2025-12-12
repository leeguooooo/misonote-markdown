'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, LogOut } from 'lucide-react';
import { useAuthState } from '@/core/auth/useAuthState';
interface AdminHeaderProps {
  onToggleSidebar?: () => void;
}

const displayNames: Record<string, string> = {
  admin: '管理后台',
  dashboard: '仪表盘',
  documents: '文档中心',
  integrations: '集成管理',
  license: '许可证',
  'license-generator': '许可证生成器',
  import: '批量导入',
  export: '出版分发',
  editor: '文档编辑器',
  'api-keys': 'API 密钥',
  mcp: 'MCP 服务器'
};

const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthState();

  const breadcrumbs = useMemo(() => {
    const paths = pathname.split('/').filter(Boolean);
    return paths.map((segment, index) => ({
      name: displayNames[segment] || segment,
      path: '/' + paths.slice(0, index + 1).join('/'),
      current: index === paths.length - 1
    }));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      logout();
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-4 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="rounded-2xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
                aria-label="展开导航"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Docs Console
              </p>
              <nav className="flex flex-wrap items-center text-sm text-slate-500">
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.path} className="flex items-center">
                    {index > 0 && <span className="mx-2 text-slate-300">/</span>}
                    {crumb.current ? (
                      <span className="font-semibold text-slate-900">{crumb.name}</span>
                    ) : (
                      <Link
                        href={crumb.path}
                        className="hover:text-slate-900"
                      >
                        {crumb.name}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => router.push('/admin/documents/editor')}
            >
              新建文档
            </Button>

            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>

      </div>
    </header>
  );
};

export default AdminHeader;
