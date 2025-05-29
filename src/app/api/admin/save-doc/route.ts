import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { fileSystemManager } from '@/lib/file-operations';

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

    const { path: docPath, content, name } = await request.json();

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

    // 使用安全的文件写入方法
    const filePath = docPath.endsWith('.md') ? docPath : `${docPath}.md`;
    await fileSystemManager.writeFile(filePath, content);

    return NextResponse.json({
      success: true,
      message: 'Document saved successfully',
      path: filePath
    });
  } catch (error) {
    console.error('Save document error:', error);
    return NextResponse.json(
      { error: 'Failed to save document' },
      { status: 500 }
    );
  }
}
