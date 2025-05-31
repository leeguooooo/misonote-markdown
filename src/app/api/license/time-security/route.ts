/**
 * 时间安全状态API
 */

import { NextResponse } from 'next/server';
import { trustedTimeService } from '@/business/license/trusted-time';
import { timeProtectionService } from '@/business/license/time-protection';

export async function GET() {
  try {
    // 检查时间完整性
    const timeIntegrity = await timeProtectionService.checkTimeIntegrity();
    
    // 获取可信时间
    const trustedTime = await trustedTimeService.getTrustedTime();
    
    // 获取时间同步状态
    const timeSyncStatus = trustedTimeService.getTimeSyncStatus();
    
    // 获取保护状态
    const protectionStatus = timeProtectionService.getProtectionStatus();

    return NextResponse.json({
      success: true,
      data: {
        safe: timeIntegrity.safe,
        confidence: timeIntegrity.confidence,
        issues: timeIntegrity.issues,
        recommendations: timeIntegrity.recommendations,
        timeSource: trustedTime.source,
        drift: trustedTime.drift,
        lastSync: timeSyncStatus.lastNetworkSync,
        protectionActive: protectionStatus.active,
        anomalyCount: protectionStatus.stats.totalAnomalies,
        recentAnomalies: protectionStatus.stats.recentAnomalies
      }
    });

  } catch (error) {
    console.error('获取时间安全状态失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取时间安全状态失败'
    }, { status: 500 });
  }
}
