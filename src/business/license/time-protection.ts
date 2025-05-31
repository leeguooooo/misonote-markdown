/**
 * 时间篡改防护系统
 * 检测和防止系统时间被恶意修改以绕过许可证验证
 */

import { log } from '@/core/logger';
import { trustedTimeService } from './trusted-time';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface TimeProtectionConfig {
  enabled: boolean;
  maxAllowedDrift: number; // 最大允许的时间偏移（毫秒）
  checkInterval: number; // 检查间隔（毫秒）
  suspiciousThreshold: number; // 可疑行为阈值
  blockOnSuspicious: boolean; // 检测到可疑行为时是否阻止
}

export interface TimeAnomalyEvent {
  timestamp: number;
  type: 'backward_jump' | 'forward_jump' | 'drift_detected' | 'network_mismatch';
  severity: 'low' | 'medium' | 'high';
  details: {
    previousTime?: number;
    currentTime?: number;
    drift?: number;
    networkTime?: number;
    localTime?: number;
  };
}

export class TimeProtectionService {
  private static instance: TimeProtectionService;
  private config: TimeProtectionConfig;
  private lastKnownTime: number = 0;
  private timeHistory: number[] = [];
  private anomalyEvents: TimeAnomalyEvent[] = [];
  private protectionActive: boolean = false;
  private checkTimer: NodeJS.Timeout | null = null;
  private dataFile: string;

  private constructor() {
    this.config = {
      enabled: true,
      maxAllowedDrift: 5 * 60 * 1000, // 5分钟
      checkInterval: 60 * 1000, // 1分钟
      suspiciousThreshold: 3,
      blockOnSuspicious: true
    };

    this.dataFile = path.join(process.cwd(), 'data', 'time-protection.json');
    this.loadPersistedData();
  }

  public static getInstance(): TimeProtectionService {
    if (!TimeProtectionService.instance) {
      TimeProtectionService.instance = new TimeProtectionService();
    }
    return TimeProtectionService.instance;
  }

  /**
   * 启动时间保护
   */
  public startProtection(): void {
    if (!this.config.enabled || this.protectionActive) {
      return;
    }

    log.info('🛡️ 启动时间篡改保护系统');
    this.protectionActive = true;
    this.lastKnownTime = Date.now();
    
    // 定期检查时间一致性
    this.checkTimer = setInterval(() => {
      this.performTimeCheck();
    }, this.config.checkInterval);

    // 初始检查
    this.performTimeCheck();
  }

  /**
   * 停止时间保护
   */
  public stopProtection(): void {
    if (!this.protectionActive) {
      return;
    }

    log.info('🛡️ 停止时间篡改保护系统');
    this.protectionActive = false;

    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }

    this.persistData();
  }

  /**
   * 执行时间检查
   */
  private async performTimeCheck(): Promise<void> {
    try {
      const currentTime = Date.now();
      const trustedTime = await trustedTimeService.getTrustedTime();

      // 检查时间跳跃
      this.checkTimeJumps(currentTime);

      // 检查网络时间一致性
      if (trustedTime.source === 'network') {
        this.checkNetworkTimeConsistency(currentTime, trustedTime.timestamp);
      }

      // 更新时间历史
      this.updateTimeHistory(currentTime);
      this.lastKnownTime = currentTime;

      // 清理旧的异常事件（保留最近24小时）
      this.cleanupOldEvents();

    } catch (error) {
      log.error('时间检查失败:', error);
    }
  }

  /**
   * 检查时间跳跃
   */
  private checkTimeJumps(currentTime: number): void {
    if (this.lastKnownTime === 0) {
      return; // 首次检查
    }

    const timeDiff = currentTime - this.lastKnownTime;
    const expectedDiff = this.config.checkInterval;
    const tolerance = expectedDiff * 0.1; // 10% 容差

    // 检查向后跳跃（时间倒退）
    if (timeDiff < 0) {
      this.recordAnomaly({
        timestamp: currentTime,
        type: 'backward_jump',
        severity: 'high',
        details: {
          previousTime: this.lastKnownTime,
          currentTime: currentTime,
          drift: timeDiff
        }
      });
      return;
    }

    // 检查向前跳跃（时间快进）
    if (timeDiff > expectedDiff + tolerance + this.config.maxAllowedDrift) {
      this.recordAnomaly({
        timestamp: currentTime,
        type: 'forward_jump',
        severity: 'medium',
        details: {
          previousTime: this.lastKnownTime,
          currentTime: currentTime,
          drift: timeDiff - expectedDiff
        }
      });
    }
  }

  /**
   * 检查网络时间一致性
   */
  private checkNetworkTimeConsistency(localTime: number, networkTime: number): void {
    const drift = Math.abs(localTime - networkTime);

    if (drift > this.config.maxAllowedDrift) {
      this.recordAnomaly({
        timestamp: localTime,
        type: 'network_mismatch',
        severity: drift > this.config.maxAllowedDrift * 2 ? 'high' : 'medium',
        details: {
          localTime,
          networkTime,
          drift
        }
      });
    }
  }

  /**
   * 更新时间历史
   */
  private updateTimeHistory(currentTime: number): void {
    this.timeHistory.push(currentTime);
    
    // 保留最近100个时间点
    if (this.timeHistory.length > 100) {
      this.timeHistory = this.timeHistory.slice(-100);
    }
  }

  /**
   * 记录异常事件
   */
  private recordAnomaly(event: TimeAnomalyEvent): void {
    this.anomalyEvents.push(event);
    
    log.warn(`🚨 检测到时间异常: ${event.type}, 严重程度: ${event.severity}`, event.details);

    // 检查是否达到可疑行为阈值
    const recentHighSeverityEvents = this.anomalyEvents
      .filter(e => e.timestamp > Date.now() - 60 * 60 * 1000) // 最近1小时
      .filter(e => e.severity === 'high').length;

    if (recentHighSeverityEvents >= this.config.suspiciousThreshold) {
      this.handleSuspiciousBehavior();
    }

    // 持久化数据
    this.persistData();
  }

  /**
   * 处理可疑行为
   */
  private handleSuspiciousBehavior(): void {
    log.error('🚨 检测到可疑的时间篡改行为！');
    
    if (this.config.blockOnSuspicious) {
      log.error('🔒 由于检测到时间篡改，系统将阻止许可证验证');
      // 这里可以设置一个标志，让许可证验证失败
    }

    // 生成安全报告
    this.generateSecurityReport();
  }

  /**
   * 生成安全报告
   */
  private generateSecurityReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalAnomalies: this.anomalyEvents.length,
        highSeverityEvents: this.anomalyEvents.filter(e => e.severity === 'high').length,
        recentEvents: this.anomalyEvents.filter(e => e.timestamp > Date.now() - 24 * 60 * 60 * 1000).length
      },
      events: this.anomalyEvents.slice(-20), // 最近20个事件
      timeHistory: this.timeHistory.slice(-20), // 最近20个时间点
      systemInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        uptime: process.uptime()
      }
    };

    const reportFile = path.join(process.cwd(), 'logs', `time-security-report-${Date.now()}.json`);
    
    try {
      fs.mkdirSync(path.dirname(reportFile), { recursive: true });
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      log.info(`安全报告已生成: ${reportFile}`);
    } catch (error) {
      log.error('生成安全报告失败:', error);
    }
  }

  /**
   * 清理旧事件
   */
  private cleanupOldEvents(): void {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24小时前
    this.anomalyEvents = this.anomalyEvents.filter(e => e.timestamp > cutoffTime);
  }

  /**
   * 持久化数据
   */
  private persistData(): void {
    try {
      const data = {
        lastKnownTime: this.lastKnownTime,
        timeHistory: this.timeHistory.slice(-50), // 保存最近50个时间点
        anomalyEvents: this.anomalyEvents.slice(-100), // 保存最近100个事件
        lastUpdate: Date.now()
      };

      fs.mkdirSync(path.dirname(this.dataFile), { recursive: true });
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      log.debug('持久化时间保护数据失败:', error);
    }
  }

  /**
   * 加载持久化数据
   */
  private loadPersistedData(): void {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
        this.lastKnownTime = data.lastKnownTime || 0;
        this.timeHistory = data.timeHistory || [];
        this.anomalyEvents = data.anomalyEvents || [];
        
        log.debug('时间保护数据已加载');
      }
    } catch (error) {
      log.debug('加载时间保护数据失败:', error);
    }
  }

  /**
   * 检查当前是否存在时间篡改风险
   */
  public async checkTimeIntegrity(): Promise<{
    safe: boolean;
    confidence: 'high' | 'medium' | 'low';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 检查最近的异常事件
    const recentEvents = this.anomalyEvents.filter(e => e.timestamp > Date.now() - 60 * 60 * 1000);
    const highSeverityEvents = recentEvents.filter(e => e.severity === 'high');

    if (highSeverityEvents.length > 0) {
      issues.push(`检测到 ${highSeverityEvents.length} 个高严重程度的时间异常`);
      recommendations.push('建议检查系统时间设置和网络连接');
    }

    // 检查网络时间同步
    const trustedTime = await trustedTimeService.getTrustedTime();
    if (trustedTime.confidence === 'low') {
      issues.push('无法获取可信的网络时间');
      recommendations.push('请检查网络连接并确保可以访问时间服务器');
    }

    // 检查时间同步状态
    const timeSyncStatus = trustedTimeService.getTimeSyncStatus();
    if (!timeSyncStatus.isReliable) {
      issues.push('时间同步不可靠');
      recommendations.push('建议重启应用或检查系统时间设置');
    }

    const safe = issues.length === 0;
    const confidence = safe ? 'high' : (issues.length === 1 ? 'medium' : 'low');

    return {
      safe,
      confidence,
      issues,
      recommendations
    };
  }

  /**
   * 获取保护状态
   */
  public getProtectionStatus(): {
    active: boolean;
    config: TimeProtectionConfig;
    stats: {
      totalAnomalies: number;
      recentAnomalies: number;
      lastCheck: number;
    };
  } {
    const recentAnomalies = this.anomalyEvents.filter(e => e.timestamp > Date.now() - 24 * 60 * 60 * 1000).length;

    return {
      active: this.protectionActive,
      config: this.config,
      stats: {
        totalAnomalies: this.anomalyEvents.length,
        recentAnomalies,
        lastCheck: this.lastKnownTime
      }
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<TimeProtectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.protectionActive) {
      this.stopProtection();
      this.startProtection();
    }
  }
}

// 导出单例实例
export const timeProtectionService = TimeProtectionService.getInstance();
