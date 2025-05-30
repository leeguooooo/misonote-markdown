import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getMCPServerById, updateServerConnectionStatus } from '@/lib/mcp-config';
import { mcpClientManager } from '@/lib/mcp-client';
import { addMCPHistoryRecord } from '@/lib/mcp-history';
import { MCPDocumentRequest } from '@/types/mcp';

// POST - 推送文档到 MCP 服务器
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

    const { serverId, documents, operation = 'single' } = await request.json();

    if (!serverId) {
      return NextResponse.json(
        { error: '服务器 ID 不能为空' },
        { status: 400 }
      );
    }

    if (!documents || (!Array.isArray(documents) && !documents.path)) {
      return NextResponse.json(
        { error: '文档数据不能为空' },
        { status: 400 }
      );
    }

    const server = getMCPServerById(serverId);
    if (!server) {
      return NextResponse.json(
        { error: 'MCP 服务器不存在' },
        { status: 404 }
      );
    }

    if (!server.isActive) {
      return NextResponse.json(
        { error: 'MCP 服务器未激活' },
        { status: 400 }
      );
    }

    try {
      const client = mcpClientManager.getClient(server);

      if (operation === 'batch' && Array.isArray(documents)) {
        // 批量推送
        const batchResult = await client.pushDocuments(documents);

        if (batchResult.success) {
          updateServerConnectionStatus(serverId, 'connected');
        } else {
          updateServerConnectionStatus(serverId, 'error', '批量推送失败');
        }

        // 记录推送历史
        addMCPHistoryRecord({
          serverId: server.id,
          serverName: server.name,
          operation: 'batch',
          documentCount: documents.length,
          successCount: batchResult.successCount,
          errorCount: batchResult.errorCount,
          status: batchResult.success ? 'success' : (batchResult.successCount > 0 ? 'partial' : 'failed'),
          details: {
            documents: batchResult.results.map((result, index) => ({
              path: documents[index]?.path || `document_${index}`,
              status: result.success ? 'success' : 'error',
              error: result.error,
            })),
          },
        });

        return NextResponse.json({
          success: batchResult.success,
          data: batchResult,
          message: batchResult.success ? '批量推送成功' : '批量推送失败'
        });
      } else {
        // 单个文档推送
        const document: MCPDocumentRequest = Array.isArray(documents) ? documents[0] : documents;

        if (!document.path || document.content === undefined) {
          return NextResponse.json(
            { error: '文档路径和内容不能为空' },
            { status: 400 }
          );
        }

        const result = await client.pushDocument(document);

        if (result.success) {
          updateServerConnectionStatus(serverId, 'connected');
        } else {
          updateServerConnectionStatus(serverId, 'error', result.error);
        }

        // 记录推送历史
        addMCPHistoryRecord({
          serverId: server.id,
          serverName: server.name,
          operation: 'single',
          documentCount: 1,
          successCount: result.success ? 1 : 0,
          errorCount: result.success ? 0 : 1,
          status: result.success ? 'success' : 'failed',
          details: {
            documents: [{
              path: document.path,
              status: result.success ? 'success' : 'error',
              error: result.error,
            }],
          },
        });

        return NextResponse.json({
          success: result.success,
          data: result,
          message: result.message
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || '推送失败';
      updateServerConnectionStatus(serverId, 'error', errorMessage);

      return NextResponse.json({
        success: false,
        error: errorMessage,
        message: '推送过程中发生错误'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('MCP 文档推送失败:', error);
    return NextResponse.json(
      { error: 'MCP 文档推送失败' },
      { status: 500 }
    );
  }
}
