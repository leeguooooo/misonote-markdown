'use client';

import React from 'react';
import Link from 'next/link';
import ApiKeyManager from '@/components/admin/ApiKeyManager';
import {
  PageHeader,
  PageContainer,
  SectionCard,
  EmptyState
} from '@/components/admin/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Key,
  Shield,
  Zap,
  Globe,
  FileText,
  Info
} from 'lucide-react';

const apiEndpoints = [
  {
    method: 'GET',
    path: '/api/docs',
    label: '获取文档列表',
    description: '返回可访问的文档基础信息',
    tone: 'blue'
  },
  {
    method: 'POST',
    path: '/api/docs',
    label: '创建文档',
    description: '提交 Markdown 正文并立即入库',
    tone: 'green'
  },
  {
    method: 'PUT',
    path: '/api/docs/:id',
    label: '更新文档',
    description: '覆盖元数据与协作内容',
    tone: 'amber'
  },
  {
    method: 'DELETE',
    path: '/api/docs/:id',
    label: '删除文档',
    description: '软删除并写入审计日志',
    tone: 'red'
  }
] as const;

const bestPractices = {
  good: [
    '为不同系统签发独立密钥并最小化权限',
    '设置密钥过期与轮换策略，保留 7 天灰度窗口',
    '通过环境变量或密钥管家注入密钥，避免硬编码',
    '开启调用审计，异常时自动冻结密钥'
  ],
  avoid: [
    '在浏览器或公开脚本中暴露密钥',
    '多人共用同一密钥，缺少身份追踪',
    '忽略 401/429 告警，持续失败导致封禁',
    '超出速率限制仍重试，放大阻断时间'
  ],
  tooling: [
    '使用密钥仓库（1Password / Vault）分发',
    '结合 CI Secrets Manager 按需注入',
    '通过 Webhook 获取安全事件推送',
    '定期导出审计日志送入 SIEM'
  ]
};

export default function ApiKeysPage() {
  return (
    <>
      <PageHeader
        title="API 与集成密钥"
        description="统一管理生成、轮换、审计密钥，支撑文档写入、CI 发布、Webhook 等自动化工作流。"
        icon={<Key className="h-6 w-6" />}
        badge={
          <Badge variant="outline" className="text-xs text-emerald-600">
            生产环境
          </Badge>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open('/docs/integrations/review-publish-api', '_blank')}>
              查看 API 文档
            </Button>
            <Button size="sm" onClick={() => window.open('/admin/logs/audit', '_blank')}>
              审计日志
            </Button>
          </div>
        }
      />

      <PageContainer bleed>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-6">
            <SectionCard
              title="密钥生命周期"
              description="创建、轮换、吊销 API 密钥，并可实时查看使用记录。"
              icon={<Key className="h-5 w-5" />}
              actions={
                <Button size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  创建密钥
                </Button>
              }
              padding="compact"
              bleed
            >
              <div className="bg-white">
                <ApiKeyManager />
              </div>
            </SectionCard>

            <SectionCard
              title="安全治理检查清单"
              description="确保 API 密钥符合企业安全与合规要求。"
              icon={<Shield className="h-5 w-5 text-emerald-600" />}
            >
              <div className="grid gap-6 lg:grid-cols-3">
                <ChecklistColumn title="✅ 推荐实践" items={bestPractices.good} accent="text-emerald-600" />
                <ChecklistColumn title="⚠️ 危险信号" items={bestPractices.avoid} accent="text-red-600" />
                <ChecklistColumn title="🔧 管理工具" items={bestPractices.tooling} accent="text-slate-700" />
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard
              title="使用指标与限流"
              description="此区域将在接入真实监控后显示调用情况与速率限制。"
              icon={<Zap className="h-5 w-5 text-blue-600" />}
            >
              <EmptyState
                title="尚未接入监控数据"
                description="通过 /api/admin/api-keys/metrics 或 Prometheus 指标写入成功率、限流次数等信息。"
                actions={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/docs/integrations/review-publish-api', '_blank')}
                  >
                    查看监控接入方式
                  </Button>
                }
              />
            </SectionCard>

            <SectionCard
              title="API 文档"
              description="常用端点与请求示例。"
              icon={<FileText className="h-5 w-5 text-slate-600" />}
            >
              <div className="space-y-3">
                {apiEndpoints.map((endpoint) => (
                  <div
                    key={endpoint.path}
                    className="rounded-2xl border border-slate-100 bg-white px-4 py-3"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-semibold',
                          {
                            blue: 'bg-blue-50 text-blue-700',
                            green: 'bg-emerald-50 text-emerald-700',
                            amber: 'bg-amber-50 text-amber-700',
                            red: 'bg-red-50 text-red-700'
                          }[endpoint.tone]
                        )}
                      >
                        {endpoint.method}
                      </span>
                      <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                        {endpoint.path}
                      </code>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {endpoint.label}
                    </p>
                    <p className="text-xs text-slate-500">{endpoint.description}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="CI / CD 集成示例"
              description="将 Codex 或 GitHub Actions 结果写入 Docs 平台。"
              icon={<Globe className="h-5 w-5 text-indigo-600" />}
            >
              <p className="text-sm text-slate-600">
                通过 <code className="rounded-md bg-slate-100 px-1">POST /api/integrations/reviews</code>{' '}
                可同步评审摘要、发现列表与外链。参考文档：
                <Link href="/docs/integrations/review-publish-api" className="text-indigo-600 underline">
                  CI 评审 API
                </Link>
                。
              </p>
              <pre className="mt-4 overflow-auto rounded-2xl bg-slate-900/95 p-4 text-xs text-slate-100">
{`curl -X POST "$DOCS_HOST/api/integrations/reviews" \\
  -H "Authorization: Bearer \${{ secrets.DOCS_API_KEY }}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repository": "\${{ github.repository }}",
    "commit": "\${{ github.sha }}",
    "workflow": "codex-review",
    "summary": "Codex 自动评审结果...",
    "findings": \${{ steps.codex.outputs.findings }}
  }'`}
              </pre>
              <p className="mt-3 text-xs text-slate-500">
                建议为该密钥仅授予 <code className="rounded bg-slate-100 px-1">write</code> 权限，并结合日志审计追踪调用记录。
              </p>
            </SectionCard>

            <SectionCard
              title="问题排查"
              description="常见错误与解决方法。"
              icon={<Info className="h-5 w-5 text-amber-600" />}
            >
              <ul className="space-y-2 text-sm text-slate-600">
                <li>401：检查密钥是否过期或权限不足；若多次失败自动暂停。</li>
                <li>429：触发速率限制，建议实现指数退避或分桶限流。</li>
                <li>TLS/证书：在自托管环境更新根证书或关闭 MITM 代理。</li>
                <li>Webhook 超时：确保回调接口可在 5s 内响应 2xx。</li>
              </ul>
            </SectionCard>
          </div>
        </div>
      </PageContainer>
    </>
  );
}

interface ChecklistColumnProps {
  title: string;
  items: string[];
  accent?: string;
}

function ChecklistColumn({ title, items, accent }: ChecklistColumnProps) {
  return (
    <div>
      <h4 className={cn('text-sm font-semibold', accent)}>{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="select-none text-slate-400">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
