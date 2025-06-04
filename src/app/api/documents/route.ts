import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import { DatabaseAdapter } from '../../../../lib/storage/database-adapter';
import { StorageConfig, StorageStrategy } from '../../../../lib/storage/storage-adapter';

// 创建数据库适配器实例
const dbAdapter = new DatabaseAdapter({
  strategy: StorageStrategy.DATABASE_ONLY,
  database: {
    enabled: true,
    storeContent: true,
    storeMetadata: true,
    compression: false
  }
});

/**
 * 获取文档列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/';
    const recursive = searchParams.get('recursive') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const result = await dbAdapter.listFiles(path, {
      recursive,
      limit
    });
    
    return NextResponse.json({
      success: true,
      files: result.files,
      hasMore: result.hasMore
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Failed to get documents' },
      { status: 500 }
    );
  }
}

/**
 * 创建或更新文档
 */
export async function POST(request: NextRequest) {
  try {
    // 验证认证
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { path: docPath, content, title, frontmatter, status, isPublic } = await request.json();

    if (!docPath || content === undefined) {
      return NextResponse.json(
        { error: 'Path and content are required' },
        { status: 400 }
      );
    }

    // 验证内容类型
    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content must be a string' },
        { status: 400 }
      );
    }

    // 确保路径以.md结尾
    const filePath = docPath.endsWith('.md') ? docPath : `${docPath}.md`;
    
    // 构建完整内容（包含frontmatter）
    let fullContent = content;
    if (title || frontmatter || status !== undefined || isPublic !== undefined) {
      const matter = require('gray-matter');
      const { data: existingFrontmatter, content: existingContent } = matter(content);
      
      const newFrontmatter = {
        ...existingFrontmatter,
        ...(frontmatter || {}),
        ...(title && { title }),
        ...(status !== undefined && { status }),
        ...(isPublic !== undefined && { public: isPublic }),
        updated: new Date().toISOString()
      };
      
      fullContent = matter.stringify(existingContent, newFrontmatter);
    }
    
    // 保存文档
    const result = await dbAdapter.writeFile(filePath, fullContent);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document saved successfully',
      path: filePath,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Save document error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save document' },
      { status: 500 }
    );
  }
}

/**
 * 删除文档
 */
export async function DELETE(request: NextRequest) {
  try {
    // 验证认证
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    const success = await dbAdapter.deleteFile(path);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete document' },
      { status: 500 }
    );
  }
}
