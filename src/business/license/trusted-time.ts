/**
 * 可信时间服务
 * 防止本地时间篡改，确保许可证时间验证的可靠性
 */

import { log } from '@/core/logger';
import crypto from 'crypto';

export interface TrustedTimeResult {
  timestamp: number;
  source: 'network' | 'local' | 'cached';
  confidence: 'high' | 'medium' | 'low';
  serverTime?: number;
  drift?: number; // 与本地时间的偏差
}

export interface TimeValidationResult {
  isValid: boolean;
  currentTime: number;
  source: string;
  confidence: string;
  drift?: number;
  warning?: string;
  error?: string;
}

export class TrustedTimeService {
  private static instance: TrustedTimeService;
  private lastNetworkTime: number | null = null;
  private lastNetworkCheck: number = 0;
  private timeOffset: number = 0; // 与网络时间的偏差
  private suspiciousDriftCount: number = 0;
  private maxDriftThreshold: number = 5 * 60 * 1000; // 5分钟
  private networkTimeoutMs: number = 5000; // 5秒超时

  // 可信的时间服务器列表
  private timeServers = [
    'https://worldtimeapi.org/api/timezone/Etc/UTC',
    'https://license-api.misonote.com/api/v1/time', // 我们自己的时间服务
    'http://worldclockapi.com/api/json/utc/now'
  ];

  private constructor() {}

  public static getInstance(): TrustedTimeService {
    if (!TrustedTimeService.instance) {
      TrustedTimeService.instance = new TrustedTimeService();
    }
    return TrustedTimeService.instance;
  }

  /**
   * 获取可信的当前时间
   */
  public async getTrustedTime(): Promise<TrustedTimeResult> {
    try {
      // 尝试从网络获取时间
      const networkTime = await this.getNetworkTime();
      if (networkTime) {
        return {
          timestamp: networkTime,
          source: 'network',
          confidence: 'high',
          serverTime: networkTime,
          drift: Math.abs(networkTime - Date.now())
        };
      }

      // 网络时间不可用，使用缓存的偏移量
      if (this.lastNetworkTime && this.timeOffset !== 0) {
        const adjustedTime = Date.now() + this.timeOffset;
        return {
          timestamp: adjustedTime,
          source: 'cached',
          confidence: 'medium',
          drift: Math.abs(this.timeOffset)
        };
      }

      // 最后使用本地时间（低可信度）
      return {
        timestamp: Date.now(),
        source: 'local',
        confidence: 'low'
      };

    } catch (error) {
      log.warn('获取可信时间失败:', error);
      return {
        timestamp: Date.now(),
        source: 'local',
        confidence: 'low'
      };
    }
  }

  /**
   * 从网络获取时间
   */
  private async getNetworkTime(): Promise<number | null> {
    const now = Date.now();
    
    // 避免频繁的网络请求（最多每分钟一次）
    if (now - this.lastNetworkCheck < 60000) {
      return null;
    }

    for (const server of this.timeServers) {
      try {
        const timeResult = await this.fetchTimeFromServer(server);
        if (timeResult) {
          this.lastNetworkTime = timeResult;
          this.lastNetworkCheck = now;
          this.timeOffset = timeResult - now;
          
          // 检测可疑的时间偏移
          this.detectSuspiciousDrift(this.timeOffset);
          
          log.debug(`从 ${server} 获取网络时间成功，偏移: ${this.timeOffset}ms`);
          return timeResult;
        }
      } catch (error) {
        log.debug(`从 ${server} 获取时间失败:`, error);
        continue;
      }
    }

    return null;
  }

  /**
   * 从特定服务器获取时间
   */
  private async fetchTimeFromServer(serverUrl: string): Promise<number | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.networkTimeoutMs);

      const response = await fetch(serverUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Misonote-TimeSync/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // 解析不同时间服务的响应格式
      let timestamp: number;
      
      if (serverUrl.includes('worldtimeapi.org')) {
        timestamp = new Date(data.utc_datetime).getTime();
      } else if (serverUrl.includes('license-api.misonote.com')) {
        timestamp = data.timestamp || data.time;
      } else if (serverUrl.includes('worldclockapi.com')) {
        timestamp = new Date(data.currentDateTime).getTime();
      } else {
        // 通用格式
        timestamp = data.timestamp || data.time || new Date(data.datetime || data.utc_datetime).getTime();
      }

      return timestamp;
    } catch (error) {
      return null;
    }
  }

  /**
   * 检测可疑的时间偏移
   */
  private detectSuspiciousDrift(drift: number): void {
    if (Math.abs(drift) > this.maxDriftThreshold) {
      this.suspiciousDriftCount++;
      log.warn(`检测到可疑的时间偏移: ${drift}ms，累计次数: ${this.suspiciousDriftCount}`);
      
      if (this.suspiciousDriftCount >= 3) {
        log.error('多次检测到大幅时间偏移，可能存在时间篡改');
      }
    } else {
      // 重置计数器
      this.suspiciousDriftCount = Math.max(0, this.suspiciousDriftCount - 1);
    }
  }

  /**
   * 验证许可证的时间有效性
   */
  public async validateLicenseTime(
    licenseIssuedAt: Date,
    licenseExpiresAt: Date | null,
    gracePeriodMs: number = 24 * 60 * 60 * 1000 // 24小时宽限期
  ): Promise<TimeValidationResult> {
    try {
      const trustedTime = await this.getTrustedTime();
      const currentTime = trustedTime.timestamp;
      const issuedTime = licenseIssuedAt.getTime();
      const expiresTime = licenseExpiresAt?.getTime();

      // 检查许可证是否还未生效
      if (currentTime < issuedTime) {
        return {
          isValid: false,
          currentTime,
          source: trustedTime.source,
          confidence: trustedTime.confidence,
          drift: trustedTime.drift,
          error: '许可证尚未生效'
        };
      }

      // 检查许可证是否已过期
      if (expiresTime && currentTime > expiresTime) {
        // 在宽限期内仍然有效，但给出警告
        if (currentTime <= expiresTime + gracePeriodMs) {
          return {
            isValid: true,
            currentTime,
            source: trustedTime.source,
            confidence: trustedTime.confidence,
            drift: trustedTime.drift,
            warning: `许可证已过期，但在宽限期内（剩余 ${Math.ceil((expiresTime + gracePeriodMs - currentTime) / (60 * 60 * 1000))} 小时）`
          };
        }

        return {
          isValid: false,
          currentTime,
          source: trustedTime.source,
          confidence: trustedTime.confidence,
          drift: trustedTime.drift,
          error: '许可证已过期'
        };
      }

      // 许可证有效
      let warning: string | undefined;
      
      // 根据时间源的可信度给出警告
      if (trustedTime.confidence === 'low') {
        warning = '无法验证网络时间，使用本地时间（可能不准确）';
      } else if (trustedTime.confidence === 'medium') {
        warning = '使用缓存的时间偏移，建议检查网络连接';
      }

      // 检查是否接近过期
      if (expiresTime) {
        const daysUntilExpiry = (expiresTime - currentTime) / (24 * 60 * 60 * 1000);
        if (daysUntilExpiry <= 7) {
          warning = `许可证将在 ${Math.ceil(daysUntilExpiry)} 天后过期，请及时续费`;
        }
      }

      return {
        isValid: true,
        currentTime,
        source: trustedTime.source,
        confidence: trustedTime.confidence,
        drift: trustedTime.drift,
        warning
      };

    } catch (error) {
      log.error('时间验证失败:', error);
      return {
        isValid: false,
        currentTime: Date.now(),
        source: 'local',
        confidence: 'low',
        error: '时间验证过程中发生错误'
      };
    }
  }

  /**
   * 生成时间证明（用于审计）
   */
  public async generateTimeProof(): Promise<string> {
    const trustedTime = await this.getTrustedTime();
    const proof = {
      timestamp: trustedTime.timestamp,
      source: trustedTime.source,
      confidence: trustedTime.confidence,
      localTime: Date.now(),
      drift: trustedTime.drift,
      suspiciousDriftCount: this.suspiciousDriftCount,
      generatedAt: new Date().toISOString()
    };

    // 生成时间证明的哈希
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(proof))
      .digest('hex');

    return `${Buffer.from(JSON.stringify(proof)).toString('base64')}.${hash}`;
  }

  /**
   * 验证时间证明
   */
  public verifyTimeProof(proof: string): boolean {
    try {
      const [dataBase64, expectedHash] = proof.split('.');
      const data = JSON.parse(Buffer.from(dataBase64, 'base64').toString());
      
      const actualHash = crypto.createHash('sha256')
        .update(JSON.stringify(data))
        .digest('hex');

      return actualHash === expectedHash;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取时间同步状态
   */
  public getTimeSyncStatus(): {
    lastNetworkSync: number | null;
    timeOffset: number;
    suspiciousDriftCount: number;
    isReliable: boolean;
  } {
    return {
      lastNetworkSync: this.lastNetworkTime,
      timeOffset: this.timeOffset,
      suspiciousDriftCount: this.suspiciousDriftCount,
      isReliable: this.suspiciousDriftCount < 3 && Math.abs(this.timeOffset) < this.maxDriftThreshold
    };
  }
}

// 导出单例实例
export const trustedTimeService = TrustedTimeService.getInstance();
