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

    const { operation, source, target, newName } = await request.json();

    switch (operation) {
      case 'move':
        if (!source || !target) {
          return NextResponse.json(
            { error: '缺少必要参数' },
            { status: 400 }
          );
        }
        await fileSystemManager.moveFile(source, target);
        return NextResponse.json({
          success: true,
          message: '文件移动成功'
        });

      case 'rename':
        if (!source || !newName) {
          return NextResponse.json(
            { error: '缺少必要参数' },
            { status: 400 }
          );
        }

        // 验证文件名
        if (!fileSystemManager.validateFileName(newName)) {
          return NextResponse.json(
            { error: '文件名包含非法字符' },
            { status: 400 }
          );
        }

        const newPath = await fileSystemManager.renameFile(source, newName);
        return NextResponse.json({
          success: true,
          message: '文件重命名成功',
          newPath
        });

      case 'copy':
        if (!source || !target) {
          return NextResponse.json(
            { error: '缺少必要参数' },
            { status: 400 }
          );
        }
        await fileSystemManager.copyFile(source, target);
        return NextResponse.json({
          success: true,
          message: '文件复制成功'
        });

      case 'create-directory':
        if (!target) {
          return NextResponse.json(
            { error: '缺少目录路径' },
            { status: 400 }
          );
        }
        await fileSystemManager.createDirectory(target);
        return NextResponse.json({
          success: true,
          message: '目录创建成功'
        });

      case 'toggle-hidden':
        if (!source) {
          return NextResponse.json(
            { error: '缺少文件路径' },
            { status: 400 }
          );
        }
        await fileSystemManager.toggleHidden(source);
        const isHidden = fileSystemManager.isHidden(source);
        return NextResponse.json({
          success: true,
          message: isHidden ? '文件已隐藏' : '文件已显示',
          isHidden
        });

      default:
        return NextResponse.json(
          { error: '不支持的操作类型' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('文件操作错误:', error);

    const errorMessage = error instanceof Error ? error.message : '操作失败';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
