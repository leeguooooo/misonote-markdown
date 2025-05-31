import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import { 
  readMCPHistory, 
  getRecentMCPHistory, 
  getMCPHistoryByServerId,
  getMCPPushStatistics,
  cleanupOldMCPHistory
} from '@/core/mcp/mcp-history';

// GET - 获取推送历史
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

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeStats = searchParams.get('includeStats') === 'true';

    let history;
    
    if (serverId) {
      // 获取指定服务器的历史
      history = getMCPHistoryByServerId(serverId);
    } else {
      // 获取最近的历史记录
      history = getRecentMCPHistory(limit);
    }

    const response: any = {
      success: true,
      data: history,
      total: history.length,
      message: 'MCP 推送历史获取成功'
    };

    // 如果需要统计信息
    if (includeStats) {
      response.statistics = getMCPPushStatistics();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('获取 MCP 推送历史失败:', error);
    return NextResponse.json(
      { error: '获取 MCP 推送历史失败' },
      { status: 500 }
    );
  }
}

// DELETE - 清理历史记录
export async function DELETE(request: NextRequest) {
  try {
    // 验证认证
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const daysToKeep = parseInt(searchParams.get('daysToKeep') || '30');

    const removedCount = cleanupOldMCPHistory(daysToKeep);

    return NextResponse.json({
      success: true,
      data: {
        removedCount,
        daysToKeep,
      },
      message: `清理完成，删除了 ${removedCount} 条历史记录`
    });
  } catch (error) {
    console.error('清理 MCP 推送历史失败:', error);
    return NextResponse.json(
      { error: '清理 MCP 推送历史失败' },
      { status: 500 }
    );
  }
}
