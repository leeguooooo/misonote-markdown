/**
 * 速率限制器
 * 防止暴力破解和API滥用
 */

import { SecurityAuditLogger } from './security-audit';
import { SecurityConfigManager } from './security-config';

export interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  blockDurationMs?: number; // 阻塞时长（毫秒）
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // 秒
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
  blockedUntil?: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private store = new Map<string, RateLimitEntry>();
  private auditLogger = SecurityAuditLogger.getInstance();
  private configManager = SecurityConfigManager.getInstance();
  private configs: Record<string, RateLimitConfig>;

  constructor() {
    // 从配置管理器获取配置
    const securityConfig = this.configManager.getConfig();
    this.configs = {
      license_validation: securityConfig.rateLimiting.licenseValidation,
      api_general: securityConfig.rateLimiting.apiGeneral,
      license_generation: securityConfig.rateLimiting.licenseGeneration
    };
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * 检查是否允许请求
   */
  checkLimit(identifier: string, type: string = 'api_general', request?: any): RateLimitResult {
    const config = this.configs[type] || this.configs.api_general;
    const now = Date.now();
    const key = `${type}:${identifier}`;
    
    let entry = this.store.get(key);

    // 检查是否在阻塞期内
    if (entry?.blockedUntil && now < entry.blockedUntil) {
      const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
      
      this.auditLogger.logRateLimitExceeded(identifier, config.maxRequests, request);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(entry.blockedUntil),
        retryAfter
      };
    }

    // 初始化或重置窗口
    if (!entry || now - entry.windowStart >= config.windowMs) {
      entry = {
        count: 0,
        windowStart: now
      };
      this.store.set(key, entry);
    }

    // 增加计数
    entry.count++;

    // 检查是否超出限制
    if (entry.count > config.maxRequests) {
      // 设置阻塞时间
      if (config.blockDurationMs) {
        entry.blockedUntil = now + config.blockDurationMs;
      }

      this.auditLogger.logRateLimitExceeded(identifier, config.maxRequests, request);

      const retryAfter = config.blockDurationMs ? 
        Math.ceil(config.blockDurationMs / 1000) : 
        Math.ceil((config.windowMs - (now - entry.windowStart)) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(entry.windowStart + config.windowMs),
        retryAfter
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: new Date(entry.windowStart + config.windowMs)
    };
  }

  /**
   * 重置特定标识符的限制
   */
  resetLimit(identifier: string, type: string = 'api_general'): void {
    const key = `${type}:${identifier}`;
    this.store.delete(key);
  }

  /**
   * 获取当前限制状态
   */
  getStatus(identifier: string, type: string = 'api_general'): RateLimitResult | null {
    const config = this.configs[type] || this.configs.api_general;
    const key = `${type}:${identifier}`;
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: new Date(now + config.windowMs)
      };
    }

    // 检查是否在阻塞期内
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(entry.blockedUntil),
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
      };
    }

    // 检查窗口是否过期
    if (now - entry.windowStart >= config.windowMs) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: new Date(now + config.windowMs)
      };
    }

    return {
      allowed: entry.count < config.maxRequests,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: new Date(entry.windowStart + config.windowMs)
    };
  }

  /**
   * 设置自定义配置
   */
  setConfig(type: string, config: RateLimitConfig): void {
    this.configs[type] = config;
  }

  /**
   * 获取配置
   */
  getConfig(type: string): RateLimitConfig | undefined {
    return this.configs[type];
  }

  /**
   * 清理过期条目
   */
  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.store) {
      const config = this.getConfigForKey(key);
      if (!config) continue;

      // 清理过期的窗口和阻塞
      const windowExpired = now - entry.windowStart >= config.windowMs;
      const blockExpired = !entry.blockedUntil || now >= entry.blockedUntil;

      if (windowExpired && blockExpired) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.store.delete(key));
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalEntries: number;
    blockedEntries: number;
    configTypes: string[];
  } {
    const now = Date.now();
    let blockedEntries = 0;

    for (const entry of this.store.values()) {
      if (entry.blockedUntil && now < entry.blockedUntil) {
        blockedEntries++;
      }
    }

    return {
      totalEntries: this.store.size,
      blockedEntries,
      configTypes: Object.keys(this.configs)
    };
  }

  /**
   * 根据key获取配置
   */
  private getConfigForKey(key: string): RateLimitConfig | undefined {
    const type = key.split(':')[0];
    return this.configs[type];
  }

  /**
   * 创建中间件函数
   */
  createMiddleware(type: string = 'api_general', getIdentifier?: (request: any) => string) {
    return (request: any) => {
      const identifier = getIdentifier ? 
        getIdentifier(request) : 
        this.getDefaultIdentifier(request);

      return this.checkLimit(identifier, type, request);
    };
  }

  /**
   * 获取默认标识符（IP地址）
   */
  private getDefaultIdentifier(request: any): string {
    // 尝试获取真实IP
    const forwarded = request.headers?.['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers?.['x-real-ip'];
    if (realIP) {
      return realIP;
    }

    return request.ip || 
           request.connection?.remoteAddress || 
           request.socket?.remoteAddress ||
           'unknown';
  }
}
