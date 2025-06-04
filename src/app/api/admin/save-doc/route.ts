import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import { fileSystemManager } from '@/core/docs/file-operations';

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

    const { path: docPath, content, title } = await request.json();

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
    if (title) {
      const matter = require('gray-matter');
      const { data: existingFrontmatter, content: existingContent } = matter(content);

      const newFrontmatter = {
        ...existingFrontmatter,
        title,
        updated: new Date().toISOString()
      };

      fullContent = matter.stringify(existingContent, newFrontmatter);
    }

    // 使用文件系统管理器保存（临时方案）
    await fileSystemManager.writeFile(filePath, fullContent);

    return NextResponse.json({
      success: true,
      message: 'Document saved successfully',
      path: filePath
    });
  } catch (error) {
    console.error('Save document error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save document' },
      { status: 500 }
    );
  }
}
