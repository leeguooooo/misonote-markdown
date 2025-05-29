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

        try {
          // 如果是文件重命名，需要处理 .md 扩展名
          let sourceFilePath = source;
          let newFileName = newName;

          // 检查源文件是否存在（先尝试添加 .md）
          if (!fileSystemManager.exists(source) && !source.endsWith('.md')) {
            sourceFilePath = `${source}.md`;
          }

          // 如果新名称不包含扩展名且源文件是 .md 文件，添加 .md
          if (sourceFilePath.endsWith('.md') && !newFileName.endsWith('.md')) {
            newFileName = `${newFileName}.md`;
          }

          const newPath = await fileSystemManager.renameFile(sourceFilePath, newFileName);

          return NextResponse.json({
            success: true,
            message: '文件重命名成功',
            newPath: newPath.replace(/\.md$/, '') // 返回时移除 .md 扩展名
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '重命名失败';
          return NextResponse.json(
            { error: errorMessage },
            { status: 400 }
          );
        }

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
