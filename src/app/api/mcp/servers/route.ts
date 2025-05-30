import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { 
  getAllMCPServers, 
  addMCPServer, 
  validateServerConfig 
} from '@/lib/mcp-config';
import { MCPServerConfig } from '@/types/mcp';

// GET - 获取所有 MCP 服务器配置
export async function GET(request: NextRequest) {
  try {
    // 验证认证
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const servers = getAllMCPServers();
    
    // 隐藏敏感信息（API 密钥）
    const safeServers = servers.map(server => ({
      ...server,
      apiKey: server.apiKey ? '***' : '',
    }));

    return NextResponse.json({
      success: true,
      data: safeServers,
      total: safeServers.length,
      message: 'MCP 服务器列表获取成功'
    });
  } catch (error) {
    console.error('获取 MCP 服务器列表失败:', error);
    return NextResponse.json(
      { error: '获取 MCP 服务器列表失败' },
      { status: 500 }
    );
  }
}

// POST - 添加新的 MCP 服务器配置
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

    const serverData = await request.json();
    
    // 验证配置
    const validationErrors = validateServerConfig(serverData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: '配置验证失败',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // 设置默认值
    const serverConfig: Omit<MCPServerConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name: serverData.name.trim(),
      url: serverData.url.trim(),
      apiKey: serverData.apiKey.trim(),
      description: serverData.description?.trim() || '',
      isActive: serverData.isActive !== false, // 默认为 true
      connectionStatus: 'disconnected',
    };

    const newServer = addMCPServer(serverConfig);
    
    // 返回时隐藏 API 密钥
    const safeServer = {
      ...newServer,
      apiKey: '***',
    };

    return NextResponse.json({
      success: true,
      data: safeServer,
      message: 'MCP 服务器添加成功'
    });
  } catch (error) {
    console.error('添加 MCP 服务器失败:', error);
    return NextResponse.json(
      { error: '添加 MCP 服务器失败' },
      { status: 500 }
    );
  }
}
