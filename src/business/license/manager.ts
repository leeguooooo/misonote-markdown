/**
 * 许可证管理器
 * 负责许可证的验证、缓存和管理
 */

import { License, LicenseValidation, LicenseType } from '@/types/business/license';
import { log } from '@/core/logger';

export class LicenseManager {
  private static instance: LicenseManager;
  private currentLicense: License | null = null;
  private lastValidation: Date | null = null;
  
  static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }
  
  async validateLicense(licenseKey?: string): Promise<LicenseValidation> {
    log.info('开始验证许可证');

    try {
      // 如果没有提供许可证密钥，返回社区版
      if (!licenseKey) {
        log.info('未提供许可证密钥，使用社区版');
        const communityLicense = this.createCommunityLicense();
        this.currentLicense = communityLicense;
        this.lastValidation = new Date();
        return { valid: true, license: communityLicense };
      }

      // 解析许可证密钥
      const parsedLicense = this.parseLicenseKey(licenseKey);
      if (!parsedLicense) {
        return {
          valid: false,
          error: '无效的许可证格式'
        };
      }

      // 验证许可证签名
      const signatureValid = await this.verifySignature(parsedLicense);
      if (!signatureValid) {
        return {
          valid: false,
          error: '许可证签名验证失败'
        };
      }

      // 检查许可证是否过期
      if (parsedLicense.expiresAt && parsedLicense.expiresAt < new Date()) {
        return {
          valid: false,
          error: '许可证已过期'
        };
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
  
  hasFeature(feature: string): boolean {
    return this.currentLicense?.features.includes(feature) ?? false;
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
      // TODO: 实现实际的签名验证逻辑
      // 这里应该使用公钥验证许可证签名

      // 临时实现：检查签名是否存在
      return !!(license.signature && license.signature.length > 0);
    } catch (error) {
      log.error('验证许可证签名失败:', error);
      return false;
    }
  }

  /**
   * 在线验证许可证
   */
  private async validateOnline(license: License): Promise<LicenseValidation | null> {
    try {
      // TODO: 实现在线验证逻辑
      // 向许可证服务器发送验证请求

      // 临时实现：跳过在线验证
      return null;
    } catch (error) {
      log.error('在线验证许可证失败:', error);
      return null;
    }
  }
}
