/**
 * 安全配置管理
 * 集中管理所有安全相关的配置
 */

export interface SecurityConfig {
  rateLimiting: {
    licenseValidation: {
      windowMs: number;
      maxRequests: number;
      blockDurationMs: number;
    };
    apiGeneral: {
      windowMs: number;
      maxRequests: number;
      blockDurationMs: number;
    };
    licenseGeneration: {
      windowMs: number;
      maxRequests: number;
      blockDurationMs: number;
    };
  };
  
  audit: {
    maxEvents: number;
    retentionDays: number;
    enableRealTimeAlerts: boolean;
    alertThresholds: {
      failuresPerMinute: number;
      suspiciousActivitiesPerHour: number;
      rateLimitExceedingsPerHour: number;
    };
  };
  
  fingerprinting: {
    enabled: boolean;
    tolerance: number; // 0-1, 指纹匹配容忍度
    bindingExpirationDays: number;
    requireHardwareBinding: boolean;
  };
  
  encryption: {
    algorithm: string;
    keySize: number;
    hashAlgorithm: string;
  };
  
  validation: {
    requireOnlineValidation: boolean;
    onlineValidationTimeout: number;
    allowOfflineGracePeriod: number; // 小时
    maxOfflineValidations: number;
  };
  
  monitoring: {
    enableAnomalyDetection: boolean;
    anomalyDetectionWindow: number; // 分钟
    enableGeoLocationTracking: boolean;
    enableDeviceTracking: boolean;
  };
}

export class SecurityConfigManager {
  private static instance: SecurityConfigManager;
  private config: SecurityConfig;

  constructor() {
    this.config = this.getDefaultConfig();
  }

  static getInstance(): SecurityConfigManager {
    if (!SecurityConfigManager.instance) {
      SecurityConfigManager.instance = new SecurityConfigManager();
    }
    return SecurityConfigManager.instance;
  }

  /**
   * 获取默认安全配置
   */
  private getDefaultConfig(): SecurityConfig {
    return {
      rateLimiting: {
        licenseValidation: {
          windowMs: 15 * 60 * 1000, // 15分钟
          maxRequests: 10,
          blockDurationMs: 60 * 60 * 1000 // 1小时
        },
        apiGeneral: {
          windowMs: 60 * 1000, // 1分钟
          maxRequests: 60,
          blockDurationMs: 5 * 60 * 1000 // 5分钟
        },
        licenseGeneration: {
          windowMs: 60 * 60 * 1000, // 1小时
          maxRequests: 5,
          blockDurationMs: 24 * 60 * 60 * 1000 // 24小时
        }
      },
      
      audit: {
        maxEvents: 10000,
        retentionDays: 30,
        enableRealTimeAlerts: true,
        alertThresholds: {
          failuresPerMinute: 5,
          suspiciousActivitiesPerHour: 3,
          rateLimitExceedingsPerHour: 10
        }
      },
      
      fingerprinting: {
        enabled: true,
        tolerance: 0.8,
        bindingExpirationDays: 30,
        requireHardwareBinding: false // 暂时关闭，避免影响用户体验
      },
      
      encryption: {
        algorithm: 'aes-256-gcm',
        keySize: 256,
        hashAlgorithm: 'sha256'
      },
      
      validation: {
        requireOnlineValidation: false, // 暂时关闭在线验证
        onlineValidationTimeout: 5000, // 5秒
        allowOfflineGracePeriod: 24, // 24小时
        maxOfflineValidations: 10
      },
      
      monitoring: {
        enableAnomalyDetection: true,
        anomalyDetectionWindow: 60, // 60分钟
        enableGeoLocationTracking: false,
        enableDeviceTracking: true
      }
    };
  }

  /**
   * 获取配置
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * 获取速率限制配置
   */
  getRateLimitConfig(type: keyof SecurityConfig['rateLimiting']) {
    return this.config.rateLimiting[type];
  }

  /**
   * 获取审计配置
   */
  getAuditConfig() {
    return this.config.audit;
  }

  /**
   * 获取指纹配置
   */
  getFingerprintConfig() {
    return this.config.fingerprinting;
  }

  /**
   * 获取验证配置
   */
  getValidationConfig() {
    return this.config.validation;
  }

  /**
   * 获取监控配置
   */
  getMonitoringConfig() {
    return this.config.monitoring;
  }

  /**
   * 检查是否启用某个安全功能
   */
  isFeatureEnabled(feature: string): boolean {
    switch (feature) {
      case 'fingerprinting':
        return this.config.fingerprinting.enabled;
      case 'onlineValidation':
        return this.config.validation.requireOnlineValidation;
      case 'anomalyDetection':
        return this.config.monitoring.enableAnomalyDetection;
      case 'geoLocationTracking':
        return this.config.monitoring.enableGeoLocationTracking;
      case 'deviceTracking':
        return this.config.monitoring.enableDeviceTracking;
      case 'realTimeAlerts':
        return this.config.audit.enableRealTimeAlerts;
      default:
        return false;
    }
  }

  /**
   * 获取环境特定的配置
   */
  getEnvironmentConfig(): Partial<SecurityConfig> {
    const env = process.env.NODE_ENV || 'development';

    if (env === 'production') {
      return {
        rateLimiting: {
          ...this.config.rateLimiting,
          licenseValidation: {
            ...this.config.rateLimiting.licenseValidation,
            maxRequests: 5, // 生产环境更严格
            blockDurationMs: 2 * 60 * 60 * 1000 // 2小时
          }
        },
        fingerprinting: {
          ...this.config.fingerprinting,
          enabled: true,
          requireHardwareBinding: true
        },
        validation: {
          ...this.config.validation,
          requireOnlineValidation: true
        }
      };
    } else if (env === 'test') {
      return {
        rateLimiting: {
          ...this.config.rateLimiting,
          licenseValidation: {
            ...this.config.rateLimiting.licenseValidation,
            maxRequests: 20 // 测试环境更宽松
          }
        }
      };
    } else {
      // development 和其他环境
      return {
        rateLimiting: {
          ...this.config.rateLimiting,
          licenseValidation: {
            ...this.config.rateLimiting.licenseValidation,
            maxRequests: 100, // 开发环境非常宽松
            blockDurationMs: 60 * 1000 // 1分钟
          }
        },
        fingerprinting: {
          ...this.config.fingerprinting,
          enabled: false // 开发环境关闭指纹
        }
      };
    }
  }

  /**
   * 应用环境配置
   */
  applyEnvironmentConfig(): void {
    const envConfig = this.getEnvironmentConfig();
    this.updateConfig(envConfig);
  }

  /**
   * 验证配置有效性
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证速率限制配置
    Object.entries(this.config.rateLimiting).forEach(([key, config]) => {
      if (config.windowMs <= 0) {
        errors.push(`${key}.windowMs 必须大于 0`);
      }
      if (config.maxRequests <= 0) {
        errors.push(`${key}.maxRequests 必须大于 0`);
      }
      if (config.blockDurationMs < 0) {
        errors.push(`${key}.blockDurationMs 不能为负数`);
      }
    });

    // 验证审计配置
    if (this.config.audit.maxEvents <= 0) {
      errors.push('audit.maxEvents 必须大于 0');
    }
    if (this.config.audit.retentionDays <= 0) {
      errors.push('audit.retentionDays 必须大于 0');
    }

    // 验证指纹配置
    if (this.config.fingerprinting.tolerance < 0 || this.config.fingerprinting.tolerance > 1) {
      errors.push('fingerprinting.tolerance 必须在 0-1 之间');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 导出配置为JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 从JSON导入配置
   */
  importConfig(configJson: string): { success: boolean; error?: string } {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = { ...this.getDefaultConfig(), ...importedConfig };
      
      const validation = this.validateConfig();
      if (!validation.valid) {
        return {
          success: false,
          error: `配置验证失败: ${validation.errors.join(', ')}`
        };
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `配置解析失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
}
