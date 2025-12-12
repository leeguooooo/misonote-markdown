import { NextRequest, NextResponse } from 'next/server';
import matter from 'gray-matter';
import { authenticateApiKey, checkApiPermission, createAuthErrorResponse } from '@/core/api/api-auth';
import { fileSystemManager } from '@/core/docs/file-operations';

interface ReviewFinding {
  title: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  file?: string;
  line?: number;
  details?: string;
  recommendation?: string;
  status?: 'open' | 'closed' | 'accepted' | 'rejected';
}

interface PublishReviewPayload {
  repository: string;
  commit: string;
  branch?: string;
  pullRequest?: number;
  workflow?: string;
  runId?: string;
  summary?: string;
  findings?: ReviewFinding[];
  recommendations?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
  title?: string;
  documentPath?: string;
  content?: string;
  links?: { label: string; url: string }[];
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (!authResult.success) {
    return createAuthErrorResponse(authResult.error || '认证失败');
  }

  if (!checkApiPermission(authResult.apiKey!, 'write')) {
    return createAuthErrorResponse('权限不足', 403);
  }

  try {
    const payload = (await request.json()) as PublishReviewPayload;
    const validationError = validatePayload(payload);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const docPath = buildDocumentPath(payload);
    const frontmatter = buildFrontmatter(payload, authResult.apiKey!.name);
    const markdownBody = payload.content ?? buildMarkdownBody(payload);
    const fileContents = matter.stringify(markdownBody, frontmatter);

    await fileSystemManager.writeFile(docPath, fileContents);

    return NextResponse.json({
      success: true,
      path: docPath,
      url: `/docs/${docPath.replace(/\.md$/, '')}`,
      title: frontmatter.title,
    });
  } catch (error) {
    console.error('[reviews.publish] failed:', error);
    return NextResponse.json(
      { success: false, error: '发布评审文档失败' },
      { status: 500 }
    );
  }
}

function validatePayload(payload: PublishReviewPayload): string | null {
  if (!payload.repository) {
    return 'repository 字段必填';
  }
  if (!payload.commit) {
    return 'commit 字段必填';
  }
  if (!payload.summary && !payload.content && !payload.findings?.length) {
    return '需要提供 summary、findings 或 content';
  }
  return null;
}

function buildFrontmatter(payload: PublishReviewPayload, authorName: string) {
  const now = new Date().toISOString();
  return {
    title: payload.title || defaultTitle(payload),
    repository: payload.repository,
    branch: payload.branch,
    commit: payload.commit,
    pull_request: payload.pullRequest,
    workflow: payload.workflow,
    run_id: payload.runId,
    created: now,
    updated: now,
    tags: payload.tags?.length ? payload.tags : ['codex', 'code-review'],
    source: 'codex-ci',
    author: authorName,
    ...payload.metadata,
  };
}

function buildDocumentPath(payload: PublishReviewPayload) {
  if (payload.documentPath) {
    return ensureMarkdownExtension(payload.documentPath);
  }

  const repoSlug = slugify(payload.repository);
  const commitShort = payload.commit.slice(0, 7);
  const now = new Date();
  const dateSegment = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const fileName = `${commitShort}-${now.getTime()}.md`;
  return `reviews/${repoSlug}/${dateSegment}/${fileName}`;
}

function ensureMarkdownExtension(path: string) {
  return path.endsWith('.md') ? path : `${path}.md`;
}

function defaultTitle(payload: PublishReviewPayload) {
  return `Code Review - ${payload.repository} @ ${payload.commit.slice(0, 7)}`;
}

function buildMarkdownBody(payload: PublishReviewPayload) {
  const lines: string[] = [];
  lines.push(`# ${payload.title || defaultTitle(payload)}`, '');

  lines.push('## 元数据');
  lines.push(`- 仓库：${payload.repository}`);
  lines.push(`- 提交：${payload.commit}`);
  if (payload.branch) lines.push(`- 分支：${payload.branch}`);
  if (payload.pullRequest) lines.push(`- Pull Request：#${payload.pullRequest}`);
  if (payload.workflow) lines.push(`- 工作流：${payload.workflow}${payload.runId ? ` (#${payload.runId})` : ''}`);
  lines.push('');

  if (payload.summary) {
    lines.push('## 摘要', payload.summary.trim(), '');
  }

  if (payload.findings?.length) {
    lines.push('## 发现列表');
    payload.findings.forEach((finding, index) => {
      const badge = finding.severity ? `\`${finding.severity.toUpperCase()}\`` : '';
      lines.push(`### ${index + 1}. ${finding.title} ${badge}`.trim());
      if (finding.file) {
        const location = finding.line ? `${finding.file}:${finding.line}` : finding.file;
        lines.push(`- 位置：\`${location}\``);
      }
      if (finding.status) {
        lines.push(`- 状态：${finding.status}`);
      }
      if (finding.details) {
        lines.push('', finding.details.trim());
      }
      if (finding.recommendation) {
        lines.push('', `**建议**：${finding.recommendation.trim()}`);
      }
      lines.push('');
    });
  }

  if (payload.recommendations?.length) {
    lines.push('## 建议');
    payload.recommendations.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  if (payload.links?.length) {
    lines.push('## 相关链接');
    payload.links.forEach((link) => lines.push(`- [${link.label}](${link.url})`));
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
