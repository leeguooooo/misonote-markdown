'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PageHeader,
  PageContainer,
  SectionCard
} from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import {
  FilePlus2,
  Upload,
  Download,
  Key,
  GitBranch,
  Shield,
  ArrowUpRight
} from 'lucide-react';

const quickCards = [
  {
    id: 'create-doc',
    title: '新建文档',
    description: '在 Markdown 编辑器中立即创建文档',
    href: '/admin/documents/editor',
    icon: <FilePlus2 className="h-5 w-5" />
  },
  {
    id: 'import',
    title: '批量导入',
    description: '上传 Markdown / Notion / Confluence 导出文件',
    href: '/admin/documents/import',
    icon: <Upload className="h-5 w-5" />
  },
  {
    id: 'export',
    title: '导出与同步',
    description: '生成 PDF / ZIP 或推送到 Git 仓库',
    href: '/admin/documents/export',
    icon: <Download className="h-5 w-5" />
  }
];

const integrations = [
  {
    id: 'api',
    title: 'API 密钥',
    desc: '生成、轮换、吊销密钥',
    href: '/admin/integrations/api-keys',
    icon: <Key className="h-4 w-4" />
  },
  {
    id: 'pipelines',
    title: 'CI/CD 集成',
    desc: '连接 GitHub Actions / Codex',
    href: '/admin/integrations',
    icon: <GitBranch className="h-4 w-4" />
  },
  {
    id: 'governance',
    title: '安全与许可证',
    desc: '查看配额、审计与离线密钥',
    href: '/admin/license',
    icon: <Shield className="h-4 w-4" />
  }
];

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="工作台"
        description="聚焦最常用的操作：创建内容、连接自动化、管理许可证。"
        actions={
          <div className="flex gap-2">
            <Button size="sm" onClick={() => router.push('/admin/documents/editor')}>
              新建文档
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/docs/integrations/review-publish-api', '_blank')}
            >
              查看指引
            </Button>
          </div>
        }
      />

      <PageContainer bleed>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
          <SectionCard title="常用操作" description="精简为三个最常用的入口。">
            <div className="grid gap-4 md:grid-cols-3">
              {quickCards.map((card) => (
                <Link
                  key={card.id}
                  href={card.href}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/60"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 group-hover:border-blue-200 group-hover:text-blue-600">
                    {card.icon}
                  </div>
                  <p className="mt-3 text-base font-semibold text-slate-900">
                    {card.title}
                  </p>
                  <p className="text-sm text-slate-500">{card.description}</p>
                  <span className="mt-4 inline-flex items-center text-sm text-blue-600">
                    前往 <ArrowUpRight className="ml-1 h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="关键入口" description="只保留上线相关的能力。">
            <div className="space-y-3">
              {integrations.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </PageContainer>
    </>
  );
}
