import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { fileSystemManager } from '@/lib/file-operations';

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

    const { path: docPath } = await request.json();

    if (!docPath) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    // 使用文件系统管理器删除文件
    try {
      // 如果路径不以 .md 结尾，添加 .md 扩展名
      const filePath = docPath.endsWith('.md') ? docPath : `${docPath}.md`;
      await fileSystemManager.deleteFile(filePath);

      return NextResponse.json({
        success: true,
        message: '文档删除成功'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除失败';

      if (errorMessage === 'File does not exist') {
        return NextResponse.json(
          { error: '文件不存在' },
          { status: 404 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: '删除文档失败' },
      { status: 500 }
    );
  }
}
