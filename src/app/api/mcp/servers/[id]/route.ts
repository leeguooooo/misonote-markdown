import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import {
  getMCPServerById,
  updateMCPServer,
  deleteMCPServer,
  validateServerConfig
} from '@/lib/mcp-config';
import { mcpClientManager } from '@/lib/mcp-client';

// GET - 获取单个 MCP 服务器配置
export async function GET(
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

    // 隐藏敏感信息
    const safeServer = {
      ...server,
      apiKey: server.apiKey ? '***' : '',
    };

    return NextResponse.json({
      success: true,
      data: safeServer,
      message: 'MCP 服务器信息获取成功'
    });
  } catch (error) {
    console.error('获取 MCP 服务器信息失败:', error);
    return NextResponse.json(
      { error: '获取 MCP 服务器信息失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新 MCP 服务器配置
export async function PUT(
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
    const updateData = await request.json();

    // 验证配置（如果提供了完整配置）
    if (updateData.name || updateData.url || updateData.apiKey) {
      const validationErrors = validateServerConfig(updateData);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          {
            error: '配置验证失败',
            details: validationErrors
          },
          { status: 400 }
        );
      }
    }

    const updatedServer = updateMCPServer(id, updateData);
    if (!updatedServer) {
      return NextResponse.json(
        { error: 'MCP 服务器不存在' },
        { status: 404 }
      );
    }

    // 更新客户端管理器中的配置
    if (updateData.url || updateData.apiKey) {
      mcpClientManager.removeClient(id);
    }

    // 返回时隐藏 API 密钥
    const safeServer = {
      ...updatedServer,
      apiKey: updatedServer.apiKey ? '***' : '',
    };

    return NextResponse.json({
      success: true,
      data: safeServer,
      message: 'MCP 服务器更新成功'
    });
  } catch (error) {
    console.error('更新 MCP 服务器失败:', error);
    return NextResponse.json(
      { error: '更新 MCP 服务器失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除 MCP 服务器配置
export async function DELETE(
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
    const success = deleteMCPServer(id);
    if (!success) {
      return NextResponse.json(
        { error: 'MCP 服务器不存在' },
        { status: 404 }
      );
    }

    // 从客户端管理器中移除
    mcpClientManager.removeClient(id);

    return NextResponse.json({
      success: true,
      message: 'MCP 服务器删除成功'
    });
  } catch (error) {
    console.error('删除 MCP 服务器失败:', error);
    return NextResponse.json(
      { error: '删除 MCP 服务器失败' },
      { status: 500 }
    );
  }
}
