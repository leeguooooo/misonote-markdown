import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { fileSystemManager } from '@/lib/file-operations';
import { uploadLimiter } from '@/lib/rate-limiter';
import { getClientIP, getSafeErrorMessage, logSecurityEvent, validateContentType } from '@/lib/security-utils';

export async function POST(request: NextRequest) {
  try {
    // 验证 Content-Type
    if (!validateContentType(request, ['application/json'])) {
      logSecurityEvent('Invalid Content-Type', { contentType: request.headers.get('content-type') }, request);
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // 速率限制检查
    const clientIP = getClientIP(request);
    if (uploadLimiter.isRateLimited(clientIP)) {
      logSecurityEvent('Rate limit exceeded', { clientIP }, request);
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // 验证认证
    const user = authenticateRequest(request);
    if (!user) {
      logSecurityEvent('Unauthorized access attempt', { clientIP }, request);
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

        try {
          // 处理文件移动的路径逻辑
          let sourceFilePath = source;
          let targetFilePath = target;

          // 检查源文件是否存在，如果不存在则尝试添加 .md 扩展名
          if (!fileSystemManager.exists(source)) {
            const sourceWithMd = `${source}.md`;
            if (fileSystemManager.exists(sourceWithMd)) {
              sourceFilePath = sourceWithMd;
            }
          }

          // 如果目标路径以 .md 结尾，说明这是一个文件移动操作
          // 需要确保源文件也是 .md 文件
          if (target.endsWith('.md')) {
            if (!sourceFilePath.endsWith('.md')) {
              sourceFilePath = `${source}.md`;
            }
          }

          console.log('Moving:', { sourceFilePath, targetFilePath });

          await fileSystemManager.moveFile(sourceFilePath, targetFilePath);
          return NextResponse.json({
            success: true,
            message: '移动成功'
          });
        } catch (error) {
          console.error('Move operation error:', error);
          const errorMessage = error instanceof Error ? error.message : '移动失败';

          if (errorMessage === 'Cannot move directory into itself') {
            return NextResponse.json(
              { error: '不能将目录移动到自己的子目录中' },
              { status: 400 }
            );
          }

          if (errorMessage === 'Target file already exists') {
            return NextResponse.json(
              { error: '目标位置已存在同名文件或目录' },
              { status: 400 }
            );
          }

          if (errorMessage === 'Source file does not exist') {
            return NextResponse.json(
              { error: '源文件或目录不存在' },
              { status: 404 }
            );
          }

          return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
          );
        }

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
