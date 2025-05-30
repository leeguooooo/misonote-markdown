// 健康检查 API 路由

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 检查基本服务状态
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      checks: {
        server: 'ok',
        // 可以添加更多检查项
        // database: await checkDatabase(),
        // storage: await checkStorage(),
      }
    };

    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error('健康检查失败:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
