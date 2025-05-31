/**
 * 功能门控系统
 * 用于控制功能访问权限
 *
 * 注意：此文件必须兼容社区版（enterprise目录可能不存在）
 */

import { LicenseManager } from '../license/manager';

// 社区版功能标志类型定义
export type CommunityFeatureFlag = string;

// 企业版功能标志类型（动态加载）
export type EnterpriseFeatureFlag = any;

// 通用功能标志类型
export type FeatureFlag = CommunityFeatureFlag | EnterpriseFeatureFlag;

// 社区版功能列表
export const COMMUNITY_FEATURES = [
  'comments',
  'annotations',
  'bookmarks',
  'basic_search',
  'file_management',
  'markdown_editing'
] as const;

// 企业版功能检查器
class EnterpriseFeatureChecker {
  private static instance: EnterpriseFeatureChecker;
  private enterpriseModule: any = null;
  private isLoaded = false;

  static getInstance(): EnterpriseFeatureChecker {
    if (!EnterpriseFeatureChecker.instance) {
      EnterpriseFeatureChecker.instance = new EnterpriseFeatureChecker();
    }
    return EnterpriseFeatureChecker.instance;
  }

  async loadEnterpriseFeatures(): Promise<boolean> {
    if (this.isLoaded) {
      return this.enterpriseModule !== null;
    }

    try {
      // 使用动态导入避免编译时错误
      const modulePath = '../../enterprise/types/features';
      this.enterpriseModule = await eval('import')(modulePath);
      this.isLoaded = true;
      console.debug('企业版功能模块加载成功');
      return true;
    } catch (error) {
      this.isLoaded = true;
      this.enterpriseModule = null;
      console.debug('企业版功能模块不可用，运行在社区版模式');
      return false;
    }
  }

  isEnterpriseAvailable(): boolean {
    return this.enterpriseModule !== null;
  }

  getFeatureFlag(): any {
    return this.enterpriseModule?.FeatureFlag || {};
  }

  getFeatureRequirements(): any {
    return this.enterpriseModule?.FEATURE_REQUIREMENTS || {};
  }

  getFeaturesByLicense(): any {
    return this.enterpriseModule?.FEATURES_BY_LICENSE || {};
  }
}

// 全局企业版功能检查器实例
const enterpriseChecker = EnterpriseFeatureChecker.getInstance();

export class FeatureNotAvailableError extends Error {
  constructor(
    message: string,
    public feature: FeatureFlag,
    public upgradeUrl?: string,
    public requiredLicense?: string[],
    public missingDependencies?: FeatureFlag[]
  ) {
    super(message);
    this.name = 'FeatureNotAvailableError';
  }
}

/**
 * 安全的功能检查（兼容社区版和企业版）
 */
export async function checkFeature(feature: FeatureFlag): Promise<boolean> {
  const licenseManager = LicenseManager.getInstance();

  // 检查是否为社区版功能
  if (typeof feature === 'string' && COMMUNITY_FEATURES.includes(feature as any)) {
    return licenseManager.hasFeature(feature);
  }

  // 尝试加载企业版功能
  const checker = EnterpriseFeatureChecker.getInstance();
  const enterpriseAvailable = await checker.loadEnterpriseFeatures();

  if (!enterpriseAvailable) {
    // 企业版不可用，检查是否为社区版功能
    return typeof feature === 'string' && COMMUNITY_FEATURES.includes(feature as any);
  }

  // 使用企业版功能检查
  return licenseManager.isFeatureEnabled ? licenseManager.isFeatureEnabled(feature) : false;
}

/**
 * 同步版本的功能检查（仅用于已知的社区版功能）
 */
export function checkCommunityFeature(feature: CommunityFeatureFlag): boolean {
  const licenseManager = LicenseManager.getInstance();
  return licenseManager.hasFeature(feature);
}

/**
 * 获取功能访问详情（安全版本）
 */
export async function getFeatureAccess(feature: FeatureFlag): Promise<{
  enabled: boolean;
  reason?: string;
  upgradeUrl?: string;
  requiredLicense?: string[];
  missingDependencies?: FeatureFlag[];
}> {
  const licenseManager = LicenseManager.getInstance();

  // 检查是否为社区版功能
  if (typeof feature === 'string' && COMMUNITY_FEATURES.includes(feature as any)) {
    const enabled = licenseManager.hasFeature(feature);
    return {
      enabled,
      reason: enabled ? undefined : '此功能在当前许可证中不可用'
    };
  }

  // 尝试加载企业版功能
  const checker = EnterpriseFeatureChecker.getInstance();
  const enterpriseAvailable = await checker.loadEnterpriseFeatures();

  if (!enterpriseAvailable) {
    return {
      enabled: false,
      reason: '此功能需要企业版',
      upgradeUrl: '/pricing',
      requiredLicense: ['professional', 'enterprise']
    };
  }

  // 使用企业版功能检查
  if (licenseManager.checkFeatureAccess) {
    return licenseManager.checkFeatureAccess(feature);
  }

  return {
    enabled: false,
    reason: '功能检查不可用'
  };
}

/**
 * 功能门控装饰器（安全版本）
 */
export function requireFeature(feature: FeatureFlag) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const accessCheck = await getFeatureAccess(feature);

      if (!accessCheck.enabled) {
        throw new FeatureNotAvailableError(
          accessCheck.reason || `功能 "${feature}" 不可用`,
          feature,
          accessCheck.upgradeUrl,
          accessCheck.requiredLicense,
          accessCheck.missingDependencies
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 向后兼容的简单功能检查
 */
export function checkSimpleFeature(feature: string): boolean {
  const licenseManager = LicenseManager.getInstance();
  return licenseManager.hasFeature(feature);
}

/**
 * 批量检查功能（异步版本）
 */
export async function checkMultipleFeatures(features: FeatureFlag[]): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};

  for (const feature of features) {
    result[String(feature)] = await checkFeature(feature);
  }

  return result;
}

/**
 * 获取所有可用功能（安全版本）
 */
export async function getAvailableFeatures(): Promise<FeatureFlag[]> {
  const licenseManager = LicenseManager.getInstance();
  const communityFeatures: FeatureFlag[] = [...COMMUNITY_FEATURES];

  // 尝试加载企业版功能
  const checker = EnterpriseFeatureChecker.getInstance();
  const enterpriseAvailable = await checker.loadEnterpriseFeatures();

  if (enterpriseAvailable && licenseManager.getAvailableFeatures) {
    const enterpriseFeatures = licenseManager.getAvailableFeatures();
    return [...communityFeatures, ...enterpriseFeatures];
  }

  return communityFeatures;
}

/**
 * 检查企业版是否可用
 */
export async function isEnterpriseAvailable(): Promise<boolean> {
  const checker = EnterpriseFeatureChecker.getInstance();
  return await checker.loadEnterpriseFeatures();
}
