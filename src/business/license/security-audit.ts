/**
 * 安全审计日志系统
 * 记录许可证验证相关的安全事件
 */

import { log } from '@/core/logger';

export interface SecurityEvent {
  timestamp: Date;
  type: 'license_validation' | 'license_failure' | 'rate_limit_exceeded' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
}

export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger;
  private events: SecurityEvent[] = [];
  private maxEvents = 10000; // 最多保存10000条事件

  static getInstance(): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger();
    }
    return SecurityAuditLogger.instance;
  }

  /**
   * 记录安全事件
   */
  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    this.events.push(fullEvent);

    // 保持事件数量在限制内
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // 根据严重程度决定日志级别
    switch (event.severity) {
      case 'critical':
        log.error(`[SECURITY CRITICAL] ${event.type}:`, event.details);
        break;
      case 'high':
        log.error(`[SECURITY HIGH] ${event.type}:`, event.details);
        break;
      case 'medium':
        log.warn(`[SECURITY MEDIUM] ${event.type}:`, event.details);
        break;
      case 'low':
        log.info(`[SECURITY LOW] ${event.type}:`, event.details);
        break;
    }
  }

  /**
   * 记录许可证验证失败
   */
  logLicenseValidationFailure(reason: string, licenseKey?: string, request?: any): void {
    this.logEvent({
      type: 'license_failure',
      severity: 'medium',
      source: 'license_manager',
      details: {
        reason,
        licenseKeyPrefix: licenseKey ? licenseKey.substring(0, 20) + '...' : 'none',
        timestamp: new Date().toISOString()
      },
      userAgent: request?.headers?.['user-agent'],
      ipAddress: this.getClientIP(request)
    });
  }

  /**
   * 记录许可证验证成功
   */
  logLicenseValidationSuccess(licenseType: string, organization: string, request?: any): void {
    this.logEvent({
      type: 'license_validation',
      severity: 'low',
      source: 'license_manager',
      details: {
        licenseType,
        organization,
        timestamp: new Date().toISOString()
      },
      userAgent: request?.headers?.['user-agent'],
      ipAddress: this.getClientIP(request)
    });
  }

  /**
   * 记录速率限制超出
   */
  logRateLimitExceeded(identifier: string, limit: number, request?: any): void {
    this.logEvent({
      type: 'rate_limit_exceeded',
      severity: 'high',
      source: 'rate_limiter',
      details: {
        identifier,
        limit,
        timestamp: new Date().toISOString()
      },
      userAgent: request?.headers?.['user-agent'],
      ipAddress: this.getClientIP(request)
    });
  }

  /**
   * 记录可疑活动
   */
  logSuspiciousActivity(activity: string, details: Record<string, any>, request?: any): void {
    this.logEvent({
      type: 'suspicious_activity',
      severity: 'high',
      source: 'security_monitor',
      details: {
        activity,
        ...details,
        timestamp: new Date().toISOString()
      },
      userAgent: request?.headers?.['user-agent'],
      ipAddress: this.getClientIP(request)
    });
  }

  /**
   * 获取最近的安全事件
   */
  getRecentEvents(limit: number = 100, type?: SecurityEvent['type']): SecurityEvent[] {
    let events = this.events;
    
    if (type) {
      events = events.filter(event => event.type === type);
    }

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * 检测异常模式
   */
  detectAnomalies(): { detected: boolean; patterns: string[] } {
    const recentEvents = this.getRecentEvents(1000);
    const patterns: string[] = [];

    // 检测短时间内大量失败
    const failureEvents = recentEvents.filter(e => e.type === 'license_failure');
    const recentFailures = failureEvents.filter(e => 
      Date.now() - e.timestamp.getTime() < 5 * 60 * 1000 // 5分钟内
    );

    if (recentFailures.length > 10) {
      patterns.push(`短时间内许可证验证失败次数过多: ${recentFailures.length}次`);
    }

    // 检测来自同一IP的大量请求
    const ipCounts = new Map<string, number>();
    recentEvents.forEach(event => {
      if (event.ipAddress) {
        ipCounts.set(event.ipAddress, (ipCounts.get(event.ipAddress) || 0) + 1);
      }
    });

    for (const [ip, count] of ipCounts) {
      if (count > 50) {
        patterns.push(`来自IP ${ip} 的请求过多: ${count}次`);
      }
    }

    // 检测速率限制频繁触发
    const rateLimitEvents = recentEvents.filter(e => e.type === 'rate_limit_exceeded');
    if (rateLimitEvents.length > 5) {
      patterns.push(`速率限制频繁触发: ${rateLimitEvents.length}次`);
    }

    return {
      detected: patterns.length > 0,
      patterns
    };
  }

  /**
   * 获取客户端IP地址
   */
  private getClientIP(request?: any): string | undefined {
    if (!request) return undefined;

    // 尝试从各种头部获取真实IP
    const forwarded = request.headers?.['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers?.['x-real-ip'];
    if (realIP) {
      return realIP;
    }

    const remoteAddr = request.headers?.['remote-addr'];
    if (remoteAddr) {
      return remoteAddr;
    }

    return request.ip || request.connection?.remoteAddress;
  }

  /**
   * 清理旧事件
   */
  cleanup(): void {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30天前
    this.events = this.events.filter(event => event.timestamp > cutoff);
  }

  /**
   * 导出安全报告
   */
  generateSecurityReport(): {
    summary: Record<string, number>;
    recentEvents: SecurityEvent[];
    anomalies: { detected: boolean; patterns: string[] };
  } {
    const summary: Record<string, number> = {};
    
    // 统计各类事件数量
    this.events.forEach(event => {
      const key = `${event.type}_${event.severity}`;
      summary[key] = (summary[key] || 0) + 1;
    });

    return {
      summary,
      recentEvents: this.getRecentEvents(50),
      anomalies: this.detectAnomalies()
    };
  }
}
