import { NextRequest, NextResponse } from 'next/server';
import { authenticateMcpRequest } from '@/lib/api-auth';
import { fileSystemManager } from '@/lib/file-operations';
import { log } from '@/lib/logger';

// GET - 获取文档列表
export async function GET(request: NextRequest) {
  try {
    // 验证 API 密钥
    const authResult = authenticateMcpRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';

    try {
      // 获取完整的文件系统结构
      const allFiles = fileSystemManager.getFileSystemStructure();

      // 过滤出 markdown 文件
      let markdownFiles = allFiles.filter(file =>
        file.type === 'file' && file.name.endsWith('.md')
      );

      // 如果指定了路径，过滤出该路径下的文件
      if (path) {
        markdownFiles = markdownFiles.filter(file =>
          file.path.startsWith(path)
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          documents: markdownFiles.map(file => ({
            path: file.path,
            name: file.name,
            size: file.size || 0,
            lastModified: file.lastModified,
            type: 'markdown'
          })),
          total: markdownFiles.length,
          path: path
        },
        message: '文档列表获取成功',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      log.error('获取文档列表失败', error);
      return NextResponse.json(
        {
          success: false,
          error: '获取文档列表失败',
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  } catch (error) {
    log.error('MCP 文档列表 API 错误', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器内部错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST - 创建或更新文档
export async function POST(request: NextRequest) {
  try {
    // 验证 API 密钥
    const authResult = authenticateMcpRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    const requestData = await request.json();
    const { path: docPath, content, title, metadata, operation = 'create' } = requestData;

    // 验证必需字段
    if (!docPath || typeof docPath !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: '文档路径不能为空',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (content === undefined || content === null) {
      return NextResponse.json(
        {
          success: false,
          error: '文档内容不能为空',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // 确保路径以 .md 结尾
    const filePath = docPath.endsWith('.md') ? docPath : `${docPath}.md`;

    // 验证路径安全性
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的文档路径',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    try {
      // 检查文件是否存在
      const exists = fileSystemManager.exists(filePath);

      if (operation === 'create' && exists) {
        return NextResponse.json(
          {
            success: false,
            error: '文档已存在，请使用更新操作',
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        );
      }

      // 准备文档内容
      let documentContent = content;

      // 如果提供了标题和元数据，添加 frontmatter
      if (title || metadata) {
        const frontmatter: any = {};
        if (title) frontmatter.title = title;
        if (metadata) Object.assign(frontmatter, metadata);

        const frontmatterString = Object.keys(frontmatter)
          .map(key => `${key}: ${JSON.stringify(frontmatter[key])}`)
          .join('\n');

        documentContent = `---\n${frontmatterString}\n---\n\n${content}`;
      }

      // 写入文件
      await fileSystemManager.writeFile(filePath, documentContent);

      // 获取文件信息
      const fileInfo = await fileSystemManager.getFileInfo(filePath);

      log.info('MCP 文档操作成功', {
        operation,
        path: filePath,
        apiKeyId: authResult.apiKey?.id,
        size: documentContent.length
      });

      return NextResponse.json({
        success: true,
        data: {
          path: filePath,
          operation,
          size: fileInfo?.metadata?.size || documentContent.length,
          lastModified: fileInfo?.metadata?.lastModified || new Date(),
          url: `/docs/${encodeURIComponent(filePath.replace('.md', ''))}`
        },
        message: `文档${operation === 'create' ? '创建' : '更新'}成功`,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      log.error('MCP 文档操作失败', { operation, path: filePath, error });
      return NextResponse.json(
        {
          success: false,
          error: `文档${operation === 'create' ? '创建' : '更新'}失败`,
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  } catch (error) {
    log.error('MCP 文档创建 API 错误', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器内部错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除文档
export async function DELETE(request: NextRequest) {
  try {
    // 验证 API 密钥
    const authResult = authenticateMcpRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    const requestData = await request.json();
    const { path: docPath } = requestData;

    // 验证必需字段
    if (!docPath || typeof docPath !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: '文档路径不能为空',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // 确保路径以 .md 结尾
    const filePath = docPath.endsWith('.md') ? docPath : `${docPath}.md`;

    // 验证路径安全性
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return NextResponse.json(
        {
          success: false,
          error: '无效的文档路径',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    try {
      // 检查文件是否存在
      const exists = fileSystemManager.exists(filePath);

      if (!exists) {
        return NextResponse.json(
          {
            success: false,
            error: '文档不存在',
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // 删除文件
      await fileSystemManager.deleteFile(filePath);

      log.info('MCP 文档删除成功', {
        path: filePath,
        apiKeyId: authResult.apiKey?.id
      });

      return NextResponse.json({
        success: true,
        data: {
          path: filePath,
          operation: 'delete'
        },
        message: '文档删除成功',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      log.error('MCP 文档删除失败', { path: filePath, error });
      return NextResponse.json(
        {
          success: false,
          error: '文档删除失败',
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  } catch (error) {
    log.error('MCP 文档删除 API 错误', error);
    return NextResponse.json(
      {
        success: false,
        error: '服务器内部错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
