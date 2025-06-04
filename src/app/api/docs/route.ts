import { NextRequest, NextResponse } from 'next/server';
import { optimizedDbAdapter } from '../../../../lib/storage/optimized-database-adapter';

// 强制动态渲染，但启用缓存优化
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const includePrivate = searchParams.get('includePrivate') === 'true';
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    let result;

    if (search) {
      // 搜索模式
      result = await optimizedDbAdapter.searchDocuments(search, {
        limit,
        offset,
        includeContent: false
      });
    } else {
      // 列表模式 - 使用高性能查询
      result = await optimizedDbAdapter.getDocumentList({
        includePrivate,
        status,
        limit,
        offset,
        useCache: true
      });
    }

    if (!result.success) {
      console.error('获取文档列表失败:', result.error);
      return NextResponse.json(
        { error: result.error?.message || '获取文档列表失败' },
        { status: 500 }
      );
    }

    const documents = result.data || [];

    // 格式化为兼容的响应格式
    const formattedDocs = documents.map(doc => ({
      name: doc.path,
      path: doc.path.replace(/\.md$/, ''),
      title: doc.title,
      lastModified: doc.lastModified,
      slug: doc.slug,
      excerpt: doc.excerpt,
      status: doc.status,
      fileSize: doc.fileSize
    }));

    const duration = Date.now() - startTime;

    return NextResponse.json({
      docs: formattedDocs,
      total: formattedDocs.length,
      message: '文档列表获取成功',
      performance: {
        duration: `${duration}ms`,
        cached: result.metadata?.cached || false,
        count: formattedDocs.length
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('获取文档列表失败:', error);

    return NextResponse.json(
      {
        error: '获取文档列表失败',
        performance: {
          duration: `${duration}ms`,
          cached: false
        }
      },
      { status: 500 }
    );
  }
}

// 辅助函数
function extractTitleFromContent(content: string): string | null {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.substring(2).trim();
    }
  }
  return null;
}

function getFileNameFromPath(path: string): string {
  const fileName = path.split('/').pop() || path;
  return fileName.replace('.md', '');
}
