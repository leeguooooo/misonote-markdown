import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import { optimizedDbAdapter } from '../../../../../lib/storage/optimized-database-adapter';

/**
 * 获取性能监控数据
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = authenticateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      );
    }
    
    // 获取性能指标
    const metrics = optimizedDbAdapter.getPerformanceMetrics();
    
    // 获取系统信息
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
    
    return NextResponse.json({
      success: true,
      data: {
        storage: metrics,
        system: systemInfo,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('获取性能数据失败:', error);
    return NextResponse.json(
      { error: '获取性能数据失败' },
      { status: 500 }
    );
  }
}

/**
 * 清除缓存
 */
export async function DELETE(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = authenticateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern');
    
    // 清除缓存
    optimizedDbAdapter.clearCache(pattern || undefined);
    
    return NextResponse.json({
      success: true,
      message: pattern ? `已清除匹配 "${pattern}" 的缓存` : '已清除所有缓存'
    });
    
  } catch (error) {
    console.error('清除缓存失败:', error);
    return NextResponse.json(
      { error: '清除缓存失败' },
      { status: 500 }
    );
  }
}
