import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import { optimizedDbAdapter } from '../../../../../lib/storage/optimized-database-adapter';
import { getPool } from '@/core/database/postgres-adapter';
import { log } from '@/core/logger';

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
    
    const metrics: any = optimizedDbAdapter.getPerformanceMetrics();
    const uptimeSeconds = Math.max(1, process.uptime());

    const listStats = metrics.getDocumentList || { count: 0, averageDuration: 0 };
    const getStats = metrics.getDocument || { count: 0, averageDuration: 0 };
    const saveStats = metrics.saveDocument || { count: 0, averageDuration: 0 };

    const readCount = (listStats.count || 0) + (getStats.count || 0);
    const writeCount = saveStats.count || 0;

    const avgReadLatency = readCount > 0
      ? (
        (listStats.averageDuration || 0) * (listStats.count || 0) +
        (getStats.averageDuration || 0) * (getStats.count || 0)
      ) / readCount
      : 0;

    const avgWriteLatency = saveStats.averageDuration || 0;

    const cacheInfo = metrics.cache || {
      listCache: { size: 0, maxSize: 0 },
      documentCache: { size: 0, maxSize: 0 },
      metadataCache: { size: 0, maxSize: 0 }
    };

    const cacheSize =
      (cacheInfo.listCache.size || 0) +
      (cacheInfo.documentCache.size || 0) +
      (cacheInfo.metadataCache.size || 0);

    const storageData = {
      avgReadLatency,
      avgWriteLatency,
      p95ReadLatency: avgReadLatency,
      p95WriteLatency: avgWriteLatency,
      cacheHitRate: 0,
      cacheSize,
      operationsPerSecond: (readCount + writeCount) / uptimeSeconds
    };

    let collaborationData = {
      documentsInMemory: 0,
      totalUpdates: 0,
      compressedUpdates: 0,
      averageUpdateSize: 0,
      memoryUsage: 0,
      operationsPerSecond: 0,
      conflictResolutions: 0
    };

    try {
      const pool = getPool();
      const activeDocsRes = await pool.query(
        `SELECT COUNT(DISTINCT document_id)::int AS count
         FROM collaboration_sessions
         WHERE is_active = true`
      );

      const updatesRes = await pool.query(
        `SELECT COUNT(*)::int AS count,
                COALESCE(AVG(octet_length(update_data)), 0)::float AS avg_size
         FROM yjs_updates`
      );

      const updatesLastMinuteRes = await pool.query(
        `SELECT COUNT(*)::int AS count
         FROM yjs_updates
         WHERE created_at > NOW() - INTERVAL '1 minute'`
      );

      const totalUpdates = updatesRes.rows[0]?.count || 0;
      const avgSize = updatesRes.rows[0]?.avg_size || 0;
      const lastMinuteUpdates = updatesLastMinuteRes.rows[0]?.count || 0;

      collaborationData = {
        ...collaborationData,
        documentsInMemory: activeDocsRes.rows[0]?.count || 0,
        totalUpdates,
        averageUpdateSize: avgSize,
        operationsPerSecond: lastMinuteUpdates / 60
      };
    } catch (error) {
      log.warn('获取协作统计失败，返回默认值', error);
    }

    const mem = process.memoryUsage();
    const memoryUsagePercent = mem.heapTotal > 0
      ? Math.min(100, Math.round((mem.heapUsed / mem.heapTotal) * 100))
      : 0;

    const systemData = {
      cpuUsage: 0,
      memoryUsage: memoryUsagePercent,
      diskUsage: 0,
      networkIO: 0,
      activeConnections: collaborationData.documentsInMemory
    };

    return NextResponse.json({
      success: true,
      data: {
        storage: storageData,
        collaboration: collaborationData,
        system: systemData,
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
