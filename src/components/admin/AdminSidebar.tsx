'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, FileText, GitBranch, Shield, X, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  variant?: 'desktop' | 'mobile';
  onClose?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const primaryNav: NavItem[] = [
  {
    id: 'dashboard',
    label: '工作台',
    description: '首选入口 / 待办 / 最近动态',
    href: '/admin/dashboard',
    icon: LayoutDashboard
  },
  {
    id: 'documents',
    label: '文档中心',
    description: '创建、发布与同步内容',
    href: '/admin/documents',
    icon: FileText
  },
  {
    id: 'integrations',
    label: '集成与自动化',
    description: 'API 密钥 · Webhook · MCP',
    href: '/admin/integrations',
    icon: GitBranch
  },
  {
    id: 'license',
    label: '许可证与安全',
    description: '配额 · 授权 · 审计日志',
    href: '/admin/license',
    icon: Shield
  }
];

export default function AdminSidebar({ variant = 'desktop', onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const renderNav = (item: NavItem) => {
    const isActive =
      item.href === '/admin/dashboard'
        ? pathname === '/admin/dashboard'
        : pathname.startsWith(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={onClose}
        className={cn(
          'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition',
          isActive
            ? 'border-blue-200 bg-blue-50/80 text-blue-900'
            : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'
        )}
      >
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl border',
            isActive ? 'border-blue-200 bg-white text-blue-600' : 'border-slate-200 bg-white text-slate-500'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{item.label}</p>
          <p className="text-xs text-slate-500">{item.description}</p>
        </div>
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Misonote</p>
          <p className="text-base font-semibold text-slate-900">Docs 控制台</p>
          <Badge variant="outline" className="mt-2 text-xs text-slate-600">
            社区计划
          </Badge>
        </div>
        {variant === 'mobile' && (
          <button
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            aria-label="关闭菜单"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">主要入口</p>
            <div className="space-y-2">
              {primaryNav.map(renderNav)}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800">遇到问题？</p>
            <p className="text-xs text-slate-500">进入帮助中心或联系支持</p>
          </div>
          <Link
            href="/docs/integrations"
            className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300"
          >
            <LifeBuoy className="h-3.5 w-3.5" />
            支持
          </Link>
        </div>
      </div>
    </div>
  );
}
