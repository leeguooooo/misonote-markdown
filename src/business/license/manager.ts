/**
 * 许可证管理器
 * 负责许可证的验证、缓存和管理
 */

import { License, LicenseValidation, LicenseType } from '@/types/business/license';
import { log } from '@/core/logger';
import crypto from 'crypto';
import { SecurityAuditLogger } from './security-audit';
import { RateLimiter } from './rate-limiter';
import { HardwareFingerprint } from './hardware-fingerprint';
import { SecurityConfigManager } from './security-config';
import { trustedTimeService, TimeValidationResult } from './trusted-time';
// 企业版功能将通过动态导入加载

export class LicenseManager {
  private static instance: LicenseManager;
  private currentLicense: License | null = null;
  private lastValidation: Date | null = null;
  private auditLogger = SecurityAuditLogger.getInstance();
  private rateLimiter = RateLimiter.getInstance();
  private hardwareFingerprint = HardwareFingerprint.getInstance();
  private securityConfig = SecurityConfigManager.getInstance();
  private usedNonces = new Set<string>();

  static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  async validateLicense(licenseKey?: string, request?: any): Promise<LicenseValidation> {
    log.info('开始验证许可证');

    try {
      // 速率限制检查
      const clientId = this.getClientIdentifier(request);
      const rateLimitResult = this.rateLimiter.checkLimit(clientId, 'license_validation', request);

      if (!rateLimitResult.allowed) {
        this.auditLogger.logLicenseValidationFailure('速率限制超出', licenseKey, request);
        return {
          valid: false,
          error: `请求过于频繁，请在 ${rateLimitResult.retryAfter} 秒后重试`
        };
      }

      // 如果没有提供许可证密钥，返回社区版
      if (!licenseKey) {
        log.info('未提供许可证密钥，使用社区版');
        const communityLicense = this.createCommunityLicense();
        this.currentLicense = communityLicense;
        this.lastValidation = new Date();
        this.auditLogger.logLicenseValidationSuccess('community', 'Community User', request);
        return { valid: true, license: communityLicense };
      }

      // 解析许可证密钥
      const parsedLicense = this.parseLicenseKey(licenseKey);
      if (!parsedLicense) {
        this.auditLogger.logLicenseValidationFailure('许可证格式无效', licenseKey, request);
        return {
          valid: false,
          error: '无效的许可证格式'
        };
      }

      // 验证许可证签名
      const signatureValid = await this.verifySignature(parsedLicense);
      if (!signatureValid) {
        this.auditLogger.logLicenseValidationFailure('签名验证失败', licenseKey, request);
        return {
          valid: false,
          error: '许可证签名验证失败'
        };
      }

      // 使用可信时间验证许可证有效期
      const timeValidation = await trustedTimeService.validateLicenseTime(
        parsedLicense.issuedAt,
        parsedLicense.expiresAt,
        24 * 60 * 60 * 1000 // 24小时宽限期
      );

      if (!timeValidation.isValid) {
        // 记录时间验证失败的审计日志
        this.auditLogger.logLicenseValidationFailure(
          `时间验证失败: ${timeValidation.error}`,
          this.buildLicenseKey(parsedLicense),
          { timeSource: timeValidation.source, confidence: timeValidation.confidence }
        );

        return {
          valid: false,
          error: timeValidation.error || '许可证时间验证失败'
        };
      }

      // 如果有时间警告，记录到日志
      if (timeValidation.warning) {
        log.warn(`许可证时间警告: ${timeValidation.warning}`);

        // 记录时间警告的审计日志
        log.info(`许可证时间警告已记录: ${parsedLicense.id}`);
      }

      // 检查时间源的可信度
      if (timeValidation.confidence === 'low') {
        log.warn('许可证验证使用低可信度时间源，可能存在时间篡改风险');

        // 在低可信度情况下，增加额外的验证
        const timeSyncStatus = trustedTimeService.getTimeSyncStatus();
        if (!timeSyncStatus.isReliable) {
          return {
            valid: false,
            error: '时间同步不可靠，无法验证许可证有效期'
          };
        }
      }

      // 在线验证（可选）
      const onlineValidation = await this.validateOnline(parsedLicense);
      if (onlineValidation && !onlineValidation.valid) {
        return onlineValidation;
      }

      // 验证成功，缓存许可证
      this.currentLicense = parsedLicense;
      this.lastValidation = new Date();

      log.info(`许可证验证成功: ${parsedLicense.type} - ${parsedLicense.organization}`);
      return { valid: true, license: parsedLicense };

    } catch (error) {
      log.error('许可证验证失败:', error);
      return {
        valid: false,
        error: '许可证验证过程中发生错误'
      };
    }
  }

  getCurrentLicense(): License | null {
    return this.currentLicense;
  }

  /**
   * 检查功能是否可用（向后兼容的简单版本）
   */
  hasFeature(feature: string): boolean {
    return this.currentLicense?.features.includes(feature) ?? false;
  }

  /**
   * 检查功能标志是否可用（企业版功能，社区版中返回false）
   * 注意：此方法在企业版中会被重写
   */
  isFeatureEnabled(_feature: any): boolean {
    // 社区版中，企业版功能标志都不可用
    return false;
  }

  /**
   * 获取当前许可证支持的所有功能（企业版功能）
   * 注意：此方法在企业版中会被重写
   */
  getAvailableFeatures(): any[] {
    // 社区版中，只返回基础功能
    return ['comments', 'annotations', 'bookmarks', 'basic_search'];
  }

  /**
   * 获取功能要求信息（企业版功能）
   * 注意：此方法在企业版中会被重写
   */
  getFeatureRequirement(_feature: any): any {
    // 社区版中，返回空对象
    return {};
  }

  /**
   * 检查功能并返回详细信息（企业版功能）
   * 注意：此方法在企业版中会被重写
   */
  checkFeatureAccess(_feature: any): {
    enabled: boolean;
    reason?: string;
    upgradeUrl?: string;
    requiredLicense?: string[];
    missingDependencies?: any[];
  } {
    // 社区版中，企业版功能都不可用
    return {
      enabled: false,
      reason: '此功能需要企业版许可证',
      upgradeUrl: '/pricing',
      requiredLicense: ['professional', 'enterprise']
    };
  }

  getMaxUsers(): number {
    return this.currentLicense?.maxUsers ?? 1;
  }

  getLicenseType(): LicenseType {
    return (this.currentLicense?.type as LicenseType) ?? LicenseType.COMMUNITY;
  }

  /**
   * 创建社区版许可证
   */
  private createCommunityLicense(): License {
    return {
      id: 'community',
      type: 'community',
      organization: 'Community User',
      email: '',
      maxUsers: 1,
      features: [],
      issuedAt: new Date(),
      expiresAt: null,
      signature: ''
    };
  }

  /**
   * 解析许可证密钥
   */
  private parseLicenseKey(licenseKey: string): License | null {
    try {
      // 许可证格式: misonote_<base64_encoded_license_data>
      if (!licenseKey.startsWith('misonote_')) {
        return null;
      }

      const encodedData = licenseKey.substring(9);
      const decodedData = Buffer.from(encodedData, 'base64').toString('utf8');
      const licenseData = JSON.parse(decodedData);

      // 验证必要字段
      if (!licenseData.id || !licenseData.type || !licenseData.signature) {
        return null;
      }

      return {
        id: licenseData.id,
        type: licenseData.type,
        organization: licenseData.organization || '',
        email: licenseData.email || '',
        maxUsers: licenseData.maxUsers || 1,
        features: licenseData.features || [],
        issuedAt: new Date(licenseData.issuedAt),
        expiresAt: licenseData.expiresAt ? new Date(licenseData.expiresAt) : null,
        signature: licenseData.signature,
        metadata: licenseData.metadata
      };
    } catch (error) {
      log.error('解析许可证密钥失败:', error);
      return null;
    }
  }

  /**
   * 验证许可证签名
   */
  private async verifySignature(license: License): Promise<boolean> {
    try {
      // 检查签名是否存在
      if (!license.signature || license.signature.length === 0) {
        log.error('许可证签名为空');
        return false;
      }

      // 开发环境的测试签名
      if (process.env.NODE_ENV === 'development' && license.signature === 'test_signature_placeholder') {
        log.warn('使用开发环境测试签名');
        return true;
      }

      // 获取公钥
      const publicKey = await this.getPublicKey();
      if (!publicKey) {
        log.error('无法获取RSA公钥');
        return false;
      }

      // 构建待验证的数据
      const dataToVerify = this.buildSignatureData(license);

      // 解码签名
      const signatureBuffer = this.decodeSignature(license.signature);
      if (!signatureBuffer) {
        log.error('签名格式无效');
        return false;
      }

      // 验证RSA-PSS签名
      const isValid = await crypto.subtle.verify(
        {
          name: 'RSA-PSS',
          saltLength: 32
        },
        publicKey,
        signatureBuffer,
        dataToVerify
      );

      if (isValid) {
        log.debug('许可证签名验证成功');
      } else {
        log.error('许可证签名验证失败');
      }

      return isValid;
    } catch (error) {
      log.error('验证许可证签名失败:', error);
      return false;
    }
  }

  /**
   * 获取RSA公钥
   */
  private async getPublicKey(): Promise<CryptoKey | null> {
    try {
      // 从环境变量或配置文件获取公钥
      const publicKeyPem = process.env.MISONOTE_LICENSE_PUBLIC_KEY || this.getDefaultPublicKey();

      if (!publicKeyPem) {
        log.error('未配置许可证公钥');
        return null;
      }

      // 将PEM格式转换为Uint8Array
      const publicKeyBuffer = this.pemToUint8Array(publicKeyPem);

      // 导入公钥
      const publicKey = await crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'RSA-PSS',
          hash: 'SHA-256'
        },
        false,
        ['verify']
      );

      return publicKey;
    } catch (error) {
      log.error('导入RSA公钥失败:', error);
      return null;
    }
  }

  /**
   * 构建签名验证数据
   */
  private buildSignatureData(license: License): Uint8Array {
    // 构建标准化的签名数据
    const signatureData = {
      id: license.id,
      type: license.type,
      organization: license.organization,
      email: license.email,
      maxUsers: license.maxUsers,
      features: license.features.sort(), // 排序确保一致性
      issuedAt: license.issuedAt.toISOString(),
      expiresAt: license.expiresAt?.toISOString() || null
    };

    const dataString = JSON.stringify(signatureData);
    return new TextEncoder().encode(dataString);
  }

  /**
   * 解码签名
   */
  private decodeSignature(signature: string): Uint8Array | null {
    try {
      // 假设签名是Base64编码的
      return new Uint8Array(Buffer.from(signature, 'base64'));
    } catch (error) {
      log.error('解码签名失败:', error);
      return null;
    }
  }

  /**
   * 将PEM格式转换为Uint8Array
   */
  private pemToUint8Array(pem: string): Uint8Array {
    // 移除PEM头尾和换行符
    const pemContents = pem
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s/g, '');

    // Base64解码
    return new Uint8Array(Buffer.from(pemContents, 'base64'));
  }

  /**
   * 获取默认公钥（用于开发和测试）
   */
  private getDefaultPublicKey(): string {
    // 这是生成的真实公钥，对应的私钥用于许可证签名
    // 生产环境应该通过环境变量 MISONOTE_LICENSE_PUBLIC_KEY 配置
    return `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuyX/SyrpOuBBH+U2P4Ob
SLaBsNj6eYRMUm0Jm3wt8smT28PDAxxlcvdjaA7e5td4zd14J4hV7JlEmPOxBe4O
qz5U8wKqHeyiB/uUYa5zWzVWko8XrT9GM4d5f1T85o4SqLkMk0CY0ntGUU2kc/ns
BCZ51tR3oTu183e2ptmuN+jNT3fuQDJ1r0IoV3l0TwCHd6XRzu3Y5Q+n7Kcs0LsK
L20zWSmDlbrY5lDNHBOpGg/NK69VCF51qpMZyM2znV6qlLxIAUpMkfRLCsihtMIU
V8wpOLgmwXxS9Q8s1sbm72ZTY08Tls+V40YGsOVG6HBismBxOFncAh1x7gVzOitH
9QIDAQAB
-----END PUBLIC KEY-----`;
  }

  /**
   * 在线验证许可证
   */
  private async validateOnline(license: License): Promise<LicenseValidation | null> {
    try {
      // 检查是否启用在线验证
      const securityConfig = this.securityConfig.getConfig();
      if (!securityConfig.validation.requireOnlineValidation) {
        log.debug('在线验证已禁用，跳过');
        return null;
      }

      // 获取许可证服务器URL
      const serverUrl = this.getLicenseServerUrl();
      if (!serverUrl) {
        log.warn('许可证服务器URL未配置，跳过在线验证');
        return null;
      }

      log.debug(`开始在线验证许可证: ${license.id}`);

      // 生成设备指纹
      const deviceFingerprint = await this.generateDeviceFingerprint();

      // 构建验证请求
      const verifyRequest = {
        licenseKey: this.buildLicenseKey(license),
        deviceFingerprint,
        timestamp: Date.now(),
        nonce: this.generateNonce()
      };

      // 发送验证请求
      const response = await fetch(`${serverUrl}/api/v1/licenses/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Misonote-Client/1.0'
        },
        body: JSON.stringify(verifyRequest),
        signal: AbortSignal.timeout(securityConfig.validation.onlineValidationTimeout)
      });

      if (!response.ok) {
        log.error(`在线验证失败: HTTP ${response.status}`);
        return {
          valid: false,
          error: `在线验证失败: 服务器返回 ${response.status}`
        };
      }

      const result = await response.json();

      if (!result.success) {
        log.error('在线验证失败:', result.error);
        return {
          valid: false,
          error: result.error || '在线验证失败'
        };
      }

      // 验证服务器响应签名（如果提供）
      if (result.signature) {
        const signatureValid = await this.verifyServerResponseSignature(result);
        if (!signatureValid) {
          log.error('服务器响应签名验证失败');
          return {
            valid: false,
            error: '服务器响应签名验证失败'
          };
        }
      }

      log.info('在线验证成功');
      return { valid: true, license };

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        log.error('在线验证超时');
        return {
          valid: false,
          error: '在线验证超时'
        };
      }

      log.error('在线验证许可证失败:', error);

      // 网络错误时，根据配置决定是否允许离线模式
      const securityConfig = this.securityConfig.getConfig();
      if (securityConfig.validation.allowOfflineGracePeriod > 0) {
        log.warn('在线验证失败，使用离线模式');
        return null; // 允许继续使用本地验证结果
      }

      return {
        valid: false,
        error: '在线验证失败且不允许离线模式'
      };
    }
  }

  /**
   * 获取客户端标识符
   */
  private getClientIdentifier(request?: any): string {
    if (!request) return 'unknown';

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

  /**
   * 获取许可证服务器URL
   */
  private getLicenseServerUrl(): string | null {
    // 优先使用环境变量
    const envUrl = process.env.MISONOTE_LICENSE_SERVER_URL;
    if (envUrl) {
      return envUrl;
    }

    // 根据环境返回默认URL
    const env = process.env.NODE_ENV || 'development';

    if (env === 'production') {
      return 'https://license-api.misonote.com';
    } else if (env === 'development') {
      // 开发环境也使用自定义域名，方便测试
      return 'https://license-api.misonote.com';
    } else {
      // 测试环境使用自定义域名
      return 'https://license-api.misonote.com';
    }
  }

  /**
   * 生成设备指纹
   */
  private async generateDeviceFingerprint(): Promise<string> {
    const result = await this.hardwareFingerprint.generateFingerprint();
    return result.fingerprint;
  }

  /**
   * 构建许可证密钥
   */
  private buildLicenseKey(license: License): string {
    const licenseData = {
      id: license.id,
      type: license.type,
      organization: license.organization,
      email: license.email,
      maxUsers: license.maxUsers,
      features: license.features,
      issuedAt: license.issuedAt.toISOString(),
      expiresAt: license.expiresAt?.toISOString() || null,
      signature: license.signature,
      metadata: license.metadata
    };

    const encodedData = Buffer.from(JSON.stringify(licenseData)).toString('base64');
    return `misonote_${encodedData}`;
  }

  /**
   * 生成随机nonce
   */
  private generateNonce(): string {
    const nonce = crypto.randomBytes(16).toString('hex');

    // 防重放检查
    if (this.usedNonces.has(nonce)) {
      return this.generateNonce(); // 递归生成新的nonce
    }

    this.usedNonces.add(nonce);

    // 清理过期的nonce（保留最近1000个）
    if (this.usedNonces.size > 1000) {
      const noncesArray = Array.from(this.usedNonces);
      this.usedNonces.clear();
      noncesArray.slice(-500).forEach(n => this.usedNonces.add(n));
    }

    return nonce;
  }

  /**
   * 验证服务器响应签名
   */
  private async verifyServerResponseSignature(response: any): Promise<boolean> {
    try {
      // 检查必要的字段
      if (!response.signature || !response.data || typeof response.signature !== 'string') {
        return false;
      }

      // 服务器使用SHA-256哈希签名数据
      // 按照服务器的方式对data进行字符串化
      const dataString = JSON.stringify(response.data);
      
      // 计算数据的SHA-256哈希
      const computedHash = crypto
        .createHash('sha256')
        .update(dataString)
        .digest('hex');
      
      // 比较计算的哈希值与提供的签名
      return computedHash === response.signature;

    } catch (error) {
      log.error('验证服务器响应签名失败:', error);
      return false;
    }
  }
}
