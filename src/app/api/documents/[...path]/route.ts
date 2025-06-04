import { NextRequest, NextResponse } from 'next/server';
import { optimizedDbAdapter } from '../../../../../lib/storage/optimized-database-adapter';

/**
 * 获取单个文档 - 高性能版本
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version');
    const useCache = searchParams.get('cache') !== 'false';

    // 等待params解析
    const resolvedParams = await params;

    // 构建文档路径
    const docPath = resolvedParams.path.join('/');
    const filePath = docPath.endsWith('.md') ? docPath : `${docPath}.md`;

    // 使用优化的适配器获取文档
    const result = await optimizedDbAdapter.getDocument(filePath, {
      version: version ? parseInt(version) : undefined,
      useCache
    });

    if (!result.success) {
      const status = result.error?.code === 'STORAGE_NOT_FOUND' ? 404 : 500;
      return NextResponse.json(
        { error: result.error?.message || 'Failed to get document' },
        { status }
      );
    }

    const document = result.data!;
    const duration = Date.now() - startTime;

    // 构建响应
    const response = {
      success: true,
      document: {
        path: document.path,
        title: document.title,
        content: document.content,
        frontmatter: document.frontmatter,
        version: document.version,
        status: document.status,
        isPublic: document.isPublic,
        lastModified: document.lastModified
      },
      performance: {
        duration: `${duration}ms`,
        cached: result.metadata?.cached || false
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Get document error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get document',
        performance: {
          duration: `${duration}ms`,
          cached: false
        }
      },
      { status: 500 }
    );
  }
}
