/**
 * 功能门控中间件
 * 用于 API 路由的功能访问控制
 */

import { NextRequest, NextResponse } from 'next/server';
import { FeatureFlag } from '@/types/business/features';
import { LicenseManager } from '../license/manager';
import { LicenseType } from '@/types/business/license';

/**
 * 功能门控中间件
 */
export function requireFeature(feature: FeatureFlag) {
  return async (
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const licenseManager = LicenseManager.getInstance();
    
    // 检查功能是否可用
    if (!licenseManager.hasFeature(feature)) {
      const currentLicense = licenseManager.getCurrentLicense();
      
      return NextResponse.json({
        error: '功能不可用',
        feature,
        message: `功能 "${feature}" 需要更高级别的许可证`,
        currentLicense: currentLicense?.type || 'community',
        upgradeUrl: '/pricing'
      }, { status: 402 }); // Payment Required
    }
    
    return handler(request);
  };
}

/**
 * 许可证类型门控中间件
 */
export function requireLicense(requiredTypes: LicenseType[]) {
  return async (
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const licenseManager = LicenseManager.getInstance();
    const currentLicense = licenseManager.getCurrentLicense();
    const currentType = currentLicense?.type || 'community';
    
    if (!requiredTypes.includes(currentType as LicenseType)) {
      return NextResponse.json({
        error: '许可证级别不足',
        required: requiredTypes,
        current: currentType,
        message: `此功能需要 ${requiredTypes.join(' 或 ')} 许可证`,
        upgradeUrl: '/pricing'
      }, { status: 402 }); // Payment Required
    }
    
    return handler(request);
  };
}

/**
 * 用户数量限制中间件
 */
export function requireUserLimit(requestedUsers: number = 1) {
  return async (
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const licenseManager = LicenseManager.getInstance();
    const maxUsers = licenseManager.getMaxUsers();
    
    if (requestedUsers > maxUsers) {
      const currentLicense = licenseManager.getCurrentLicense();
      
      return NextResponse.json({
        error: '用户数量超出限制',
        maxUsers,
        requested: requestedUsers,
        currentLicense: currentLicense?.type || 'community',
        message: `当前许可证最多支持 ${maxUsers} 个用户`,
        upgradeUrl: '/pricing'
      }, { status: 402 }); // Payment Required
    }
    
    return handler(request);
  };
}

/**
 * 组合多个中间件
 */
export function combineMiddleware(
  ...middlewares: Array<(req: NextRequest, handler: any) => Promise<NextResponse>>
) {
  return async (
    request: NextRequest,
    finalHandler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    let currentHandler = finalHandler;
    
    // 从后往前应用中间件
    for (let i = middlewares.length - 1; i >= 0; i--) {
      const middleware = middlewares[i];
      const nextHandler = currentHandler;
      currentHandler = (req: NextRequest) => middleware(req, nextHandler);
    }
    
    return currentHandler(request);
  };
}

/**
 * 创建受保护的 API 处理器
 */
export function createProtectedHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  ...middlewares: Array<(req: NextRequest, handler: any) => Promise<NextResponse>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const combinedMiddleware = combineMiddleware(...middlewares);
    return combinedMiddleware(request, handler);
  };
}

// 常用的中间件组合
export const enterpriseOnly = requireLicense([LicenseType.ENTERPRISE]);
export const professionalOrEnterprise = requireLicense([LicenseType.PROFESSIONAL, LicenseType.ENTERPRISE]);
export const multiUserFeature = requireFeature(FeatureFlag.MULTI_USER);
export const ssoFeature = requireFeature(FeatureFlag.SSO_INTEGRATION);
export const advancedBackupFeature = requireFeature(FeatureFlag.ADVANCED_BACKUP);
