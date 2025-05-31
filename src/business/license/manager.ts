/**
 * 许可证管理器
 * 负责许可证的验证、缓存和管理
 */

import { License, LicenseValidation, LicenseType } from '@/types/business/license';

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
    // TODO: 实现许可证验证逻辑
    // 1. 本地验证签名
    // 2. 在线验证（如果可能）
    // 3. 缓存验证结果
    
    // 临时返回社区版
    return {
      valid: true,
      license: {
        id: 'community',
        type: 'community',
        organization: 'Community User',
        email: '',
        maxUsers: 1,
        features: [],
        issuedAt: new Date(),
        expiresAt: null,
        signature: ''
      }
    };
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
}
