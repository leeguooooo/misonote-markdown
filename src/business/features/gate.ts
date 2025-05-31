/**
 * 功能门控系统
 * 用于控制功能访问权限
 */

import { FeatureFlag } from '@/types/business/features';
import { LicenseManager } from '../license/manager';

export class FeatureNotAvailableError extends Error {
  constructor(
    message: string,
    public feature: FeatureFlag,
    public upgradeUrl?: string
  ) {
    super(message);
    this.name = 'FeatureNotAvailableError';
  }
}

export function requireFeature(feature: FeatureFlag) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const licenseManager = LicenseManager.getInstance();
      
      if (!licenseManager.hasFeature(feature)) {
        throw new FeatureNotAvailableError(
          `功能 "${feature}" 需要更高级别的许可证`,
          feature,
          '/pricing'
        );
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

export function checkFeature(feature: FeatureFlag): boolean {
  const licenseManager = LicenseManager.getInstance();
  return licenseManager.hasFeature(feature);
}
