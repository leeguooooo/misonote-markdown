import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getMCPServerById, updateServerConnectionStatus } from '@/lib/mcp-config';
import { mcpClientManager } from '@/lib/mcp-client';

// POST - 测试 MCP 服务器连接
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证认证
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const server = getMCPServerById(id);
    if (!server) {
      return NextResponse.json(
        { error: 'MCP 服务器不存在' },
        { status: 404 }
      );
    }

    // 更新状态为测试中
    updateServerConnectionStatus(id, 'testing');

    try {
      // 创建客户端并测试连接
      const client = mcpClientManager.getClient(server);
      const testResult = await client.testConnection();

      if (testResult.success) {
        // 连接成功
        updateServerConnectionStatus(id, 'connected');

        return NextResponse.json({
          success: true,
          data: {
            connectionStatus: 'connected',
            responseTime: testResult.responseTime,
            serverInfo: testResult.serverInfo,
          },
          message: '连接测试成功'
        });
      } else {
        // 连接失败
        updateServerConnectionStatus(id, 'error', testResult.error);

        return NextResponse.json({
          success: false,
          data: {
            connectionStatus: 'error',
            responseTime: testResult.responseTime,
            error: testResult.error,
          },
          message: '连接测试失败'
        });
      }
    } catch (error: any) {
      // 测试过程中出现异常
      const errorMessage = error.message || '连接测试异常';
      updateServerConnectionStatus(id, 'error', errorMessage);

      return NextResponse.json({
        success: false,
        data: {
          connectionStatus: 'error',
          error: errorMessage,
        },
        message: '连接测试异常'
      });
    }
  } catch (error) {
    console.error('MCP 服务器连接测试失败:', error);
    return NextResponse.json(
      { error: 'MCP 服务器连接测试失败' },
      { status: 500 }
    );
  }
}
