// 健康检查 API 路由

import { NextResponse } from 'next/server';
import { getDatabaseStats } from '@/core/database';
import { log } from '@/core/logger';

export async function GET() {
  try {
    const startTime = Date.now();

    // 检查数据库连接
    let dbStatus = 'unknown';
    let dbStats = null;

    try {
      dbStats = await getDatabaseStats();
      dbStatus = 'healthy';
    } catch (error) {
      dbStatus = 'error';
      log.error('数据库健康检查失败', error);
    }

    // 检查文件系统
    let fsStatus = 'unknown';
    try {
      const fs = require('fs');
      const path = require('path');
      const testPath = path.join(process.cwd(), 'data');

      // 检查数据目录是否可访问
      fs.accessSync(testPath, fs.constants.R_OK | fs.constants.W_OK);
      fsStatus = 'healthy';
    } catch (error) {
      fsStatus = 'error';
      log.error('文件系统健康检查失败', error);
    }

    const responseTime = Date.now() - startTime;
    const isHealthy = dbStatus === 'healthy' && fsStatus === 'healthy';

    // 检查基本服务状态
    const status = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      checks: {
        server: 'ok',
        database: dbStatus,
        filesystem: fsStatus,
      },
      database: dbStats,
      serverInfo: {
        name: 'misonote-markdown',
        description: 'Markdown documentation system with MCP support',
        version: '1.0.0',
        features: [
          'document-management',
          'mcp-protocol',
          'api-keys',
          'webhook-support',
          'batch-operations'
        ],
        capabilities: {
          supportsBatch: true,
          supportsWebhooks: true,
          supportsMetadata: true,
          supportsVersioning: false,
          maxDocumentSize: 10 * 1024 * 1024, // 10MB
          maxBatchSize: 100,
          supportedFormats: ['markdown', 'md']
        }
      }
    };

    return NextResponse.json(status, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('健康检查失败:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        serverInfo: {
          name: 'misonote-markdown',
          version: '1.0.0'
        }
      },
      { status: 500 }
    );
  }
}
