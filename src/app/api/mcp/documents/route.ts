import { NextRequest, NextResponse } from 'next/server';
import { authenticateMcpRequest } from '@/core/api/api-auth';
import { fileSystemManager } from '@/core/docs/file-operations';
import { log } from '@/core/logger';

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
    const getContent = searchParams.get('content') === 'true';
    const searchQuery = searchParams.get('search');
    const searchType = searchParams.get('searchType') || 'content'; // content, title, path

    try {
      // 如果请求单个文档的内容
      if (getContent && path) {
        const filePath = path.endsWith('.md') ? path : `${path}.md`;

        try {
          // 检查文件是否存在
          if (!fileSystemManager.exists(filePath)) {
            return NextResponse.json({
              success: false,
              error: '文档不存在',
              timestamp: new Date().toISOString()
            }, { status: 404 });
          }

          // 读取文件内容
          const fs = require('fs');
          const pathModule = require('path');
          const fullPath = pathModule.join(process.cwd(), 'docs', filePath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          const fileInfo = await fileSystemManager.getFileInfo(filePath);

          // 生成在线观看地址
          const viewUrl = `/docs/${encodeURIComponent(path)}`;
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          const fullUrl = `${baseUrl}${viewUrl}`;

          return NextResponse.json({
            success: true,
            data: {
              path: path,
              content: content,
              name: filePath.split('/').pop(),
              size: content.length,
              lastModified: fileInfo.metadata?.lastModified || new Date().toISOString(),
              type: 'markdown',
              viewUrl: viewUrl,
              fullUrl: fullUrl
            },
            message: '文档内容获取成功',
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: '文档不存在或无法读取',
            timestamp: new Date().toISOString()
          }, { status: 404 });
        }
      }

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

      // 如果有搜索查询，执行搜索
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();

        markdownFiles = markdownFiles.filter(file => {
          switch (searchType) {
            case 'title':
              return file.name.toLowerCase().includes(query) ||
                     file.path.toLowerCase().includes(query);

            case 'path':
              return file.path.toLowerCase().includes(query);

            case 'content':
            default:
              // 搜索文件名、路径和内容
              const nameMatch = file.name.toLowerCase().includes(query);
              const pathMatch = file.path.toLowerCase().includes(query);
              const contentMatch = file.content && file.content.toLowerCase().includes(query);

              return nameMatch || pathMatch || contentMatch;
          }
        });

        // 为搜索结果添加相关性评分和摘要
        markdownFiles = markdownFiles.map(file => {
          let relevanceScore = 0;
          let matchedSnippets: string[] = [];

          if (file.name.toLowerCase().includes(query)) {
            relevanceScore += 10;
          }
          if (file.path.toLowerCase().includes(query)) {
            relevanceScore += 5;
          }

          if (file.content) {
            const content = file.content.toLowerCase();
            const queryIndex = content.indexOf(query);

            if (queryIndex !== -1) {
              relevanceScore += 3;

              // 提取匹配的文本片段
              const snippetStart = Math.max(0, queryIndex - 50);
              const snippetEnd = Math.min(content.length, queryIndex + query.length + 50);
              const snippet = file.content.substring(snippetStart, snippetEnd);

              matchedSnippets.push(snippet);
            }
          }

          return {
            ...file,
            relevanceScore,
            matchedSnippets: matchedSnippets.slice(0, 3) // 最多3个片段
          };
        });

        // 按相关性排序
        markdownFiles.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      }

      return NextResponse.json({
        success: true,
        data: {
          documents: markdownFiles.map(file => {
            const viewUrl = `/docs/${encodeURIComponent(file.path)}`;
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const fullUrl = `${baseUrl}${viewUrl}`;

            return {
              path: file.path,
              name: file.name,
              size: file.size || 0,
              lastModified: file.lastModified,
              type: 'markdown',
              viewUrl: viewUrl,
              fullUrl: fullUrl,
              // 搜索相关字段
              ...(searchQuery && {
                relevanceScore: file.relevanceScore || 0,
                matchedSnippets: file.matchedSnippets || [],
                excerpt: file.matchedSnippets && file.matchedSnippets.length > 0
                  ? file.matchedSnippets[0]
                  : (file.content ? file.content.substring(0, 200) + '...' : '')
              })
            };
          }),
          total: markdownFiles.length,
          path: path,
          // 搜索元信息
          ...(searchQuery && {
            searchQuery,
            searchType,
            isSearchResult: true
          })
        },
        message: searchQuery ? `搜索到 ${markdownFiles.length} 个相关文档` : '文档列表获取成功',
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

      // 生成在线观看地址
      const docPath = filePath.replace('.md', '');
      const viewUrl = `/docs/${encodeURIComponent(docPath)}`;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const fullUrl = `${baseUrl}${viewUrl}`;

      return NextResponse.json({
        success: true,
        data: {
          path: filePath,
          docPath: docPath,
          operation,
          size: fileInfo?.metadata?.size || documentContent.length,
          lastModified: fileInfo?.metadata?.lastModified || new Date(),
          viewUrl: viewUrl,
          fullUrl: fullUrl,
          // 保持向后兼容
          url: viewUrl
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
