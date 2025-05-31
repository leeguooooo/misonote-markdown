import { NextRequest, NextResponse } from 'next/server';
import { getMCPSettings } from '@/core/mcp/mcp-config';
import { fileSystemManager } from '@/core/docs/file-operations';
import { MCPWebhookPayload, MCPDocumentRequest } from '@/types/mcp';
import { log } from '@/core/logger';
import crypto from 'crypto';

// POST - 接收 AI 编辑器的 webhook 推送
export async function POST(request: NextRequest) {
  try {
    const settings = getMCPSettings();

    if (!settings.enableWebhooks) {
      return NextResponse.json(
        { error: 'Webhook 功能未启用' },
        { status: 403 }
      );
    }

    // 验证 webhook 签名（如果配置了密钥）
    if (settings.webhookSecret) {
      const signature = request.headers.get('x-webhook-signature');
      if (!signature) {
        return NextResponse.json(
          { error: '缺少 webhook 签名' },
          { status: 401 }
        );
      }

      const body = await request.text();
      const expectedSignature = crypto
        .createHmac('sha256', settings.webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== `sha256=${expectedSignature}`) {
        return NextResponse.json(
          { error: 'Webhook 签名验证失败' },
          { status: 401 }
        );
      }

      // 重新解析 JSON（因为已经读取了 body）
      const payload: MCPWebhookPayload = JSON.parse(body);
      return await processWebhookPayload(payload);
    } else {
      // 没有配置密钥，直接处理
      const payload: MCPWebhookPayload = await request.json();
      return await processWebhookPayload(payload);
    }
  } catch (error) {
    console.error('处理 MCP webhook 失败:', error);
    return NextResponse.json(
      { error: '处理 webhook 失败' },
      { status: 500 }
    );
  }
}

async function processWebhookPayload(payload: MCPWebhookPayload): Promise<NextResponse> {
  try {
    log.info('收到 MCP webhook 推送', {
      source: payload.source,
      documentCount: payload.documents.length,
      editor: payload.metadata?.editor,
    });

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const document of payload.documents) {
      try {
        await processDocument(document);
        results.push({
          path: document.path,
          status: 'success',
        });
        successCount++;
      } catch (error: any) {
        results.push({
          path: document.path,
          status: 'error',
          error: error.message,
        });
        errorCount++;
        log.error(`处理文档失败: ${document.path}`, error);
      }
    }

    const response = {
      success: errorCount === 0,
      message: `处理完成: ${successCount} 成功, ${errorCount} 失败`,
      data: {
        totalCount: payload.documents.length,
        successCount,
        errorCount,
        results,
      },
      timestamp: new Date(),
    };

    log.info('MCP webhook 处理完成', {
      totalCount: payload.documents.length,
      successCount,
      errorCount,
    });

    return NextResponse.json(response);
  } catch (error) {
    log.error('处理 webhook payload 失败', error);
    return NextResponse.json(
      { error: '处理 webhook payload 失败' },
      { status: 500 }
    );
  }
}

async function processDocument(document: MCPDocumentRequest): Promise<void> {
  const { path: docPath, content, operation, metadata } = document;

  // 验证路径安全性 - 使用 exists 方法来间接验证路径
  // 如果路径无效，exists 方法会返回 false
  if (!docPath || typeof docPath !== 'string' || docPath.includes('..') || docPath.startsWith('/')) {
    throw new Error(`无效的文档路径: ${docPath}`);
  }

  const filePath = docPath.endsWith('.md') ? docPath : `${docPath}.md`;

  switch (operation) {
    case 'create':
    case 'update':
      // 创建或更新文档
      await fileSystemManager.writeFile(filePath, content);

      // 如果有元数据，保存元数据
      if (metadata) {
        await saveDocumentMetadata(filePath, metadata);
      }

      log.info(`文档${operation === 'create' ? '创建' : '更新'}成功: ${filePath}`);
      break;

    case 'delete':
      // 删除文档
      await fileSystemManager.deleteFile(filePath);

      // 删除相关元数据
      await deleteDocumentMetadata(filePath);

      log.info(`文档删除成功: ${filePath}`);
      break;

    default:
      throw new Error(`不支持的操作类型: ${operation}`);
  }
}

async function saveDocumentMetadata(filePath: string, metadata: Record<string, any>): Promise<void> {
  try {
    const metadataPath = filePath.replace('.md', '.metadata.json');
    const metadataContent = JSON.stringify({
      ...metadata,
      lastUpdated: new Date(),
    }, null, 2);

    await fileSystemManager.writeFile(metadataPath, metadataContent);
  } catch (error) {
    log.warn(`保存文档元数据失败: ${filePath}`, error);
    // 不抛出错误，元数据保存失败不应该影响文档保存
  }
}

async function deleteDocumentMetadata(filePath: string): Promise<void> {
  try {
    const metadataPath = filePath.replace('.md', '.metadata.json');
    await fileSystemManager.deleteFile(metadataPath);
  } catch (error) {
    log.warn(`删除文档元数据失败: ${filePath}`, error);
    // 不抛出错误，元数据删除失败不应该影响文档删除
  }
}

// GET - 获取 webhook 配置信息
export async function GET() {
  try {
    const settings = getMCPSettings();

    return NextResponse.json({
      success: true,
      data: {
        enabled: settings.enableWebhooks,
        hasSecret: !!settings.webhookSecret,
        endpoint: '/api/mcp/webhook',
      },
      message: 'Webhook 配置获取成功'
    });
  } catch (error) {
    console.error('获取 webhook 配置失败:', error);
    return NextResponse.json(
      { error: '获取 webhook 配置失败' },
      { status: 500 }
    );
  }
}
