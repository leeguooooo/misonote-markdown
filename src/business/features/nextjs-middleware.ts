/**
 * Next.js API功能门控中间件
 * 用于保护API端点的功能访问
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { FeatureFlag } from './gate';
import { LicenseManager } from '../license/manager';
import { FeatureNotAvailableError } from './gate';

/**
 * API响应类型
 */
interface ApiResponse {
  error?: string;
  code?: string;
  upgradeUrl?: string;
  requiredLicense?: string[];
  missingDependencies?: FeatureFlag[];
}

/**
 * Next.js API处理函数类型
 */
type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

/**
 * 功能门控中间件选项
 */
interface FeatureGateOptions {
  feature: FeatureFlag;
  errorMessage?: string;
  customErrorHandler?: (
    req: NextApiRequest,
    res: NextApiResponse,
    error: FeatureNotAvailableError
  ) => void;
}

/**
 * 创建功能门控中间件
 */
export function requireFeatureMiddleware(options: FeatureGateOptions) {
  return function (handler: NextApiHandler): NextApiHandler {
    return async function (req: NextApiRequest, res: NextApiResponse) {
      try {
        const licenseManager = LicenseManager.getInstance();
        const accessCheck = licenseManager.checkFeatureAccess(options.feature);

        if (!accessCheck.enabled) {
          const error = new FeatureNotAvailableError(
            options.errorMessage || accessCheck.reason || `功能 "${options.feature}" 不可用`,
            options.feature,
            accessCheck.upgradeUrl,
            accessCheck.requiredLicense,
            accessCheck.missingDependencies
          );

          if (options.customErrorHandler) {
            options.customErrorHandler(req, res, error);
            return;
          }

          // 默认错误处理
          const response: ApiResponse = {
            error: error.message,
            code: 'FEATURE_NOT_AVAILABLE',
            upgradeUrl: error.upgradeUrl,
            requiredLicense: error.requiredLicense,
            missingDependencies: error.missingDependencies
          };

          res.status(403).json(response);
          return;
        }

        // 功能可用，继续执行原始处理函数
        return handler(req, res);
      } catch (error) {
        console.error('功能门控中间件错误:', error);
        res.status(500).json({
          error: '服务器内部错误',
          code: 'INTERNAL_ERROR'
        });
      }
    };
  };
}

/**
 * 多功能门控中间件
 */
export function requireMultipleFeaturesMiddleware(
  features: FeatureFlag[],
  mode: 'all' | 'any' = 'all'
) {
  return function (handler: NextApiHandler): NextApiHandler {
    return async function (req: NextApiRequest, res: NextApiResponse) {
      try {
        const licenseManager = LicenseManager.getInstance();
        const results = features.map(feature => ({
          feature,
          access: licenseManager.checkFeatureAccess(feature)
        }));

        let hasAccess = false;
        let errorMessage = '';
        let missingFeatures: FeatureFlag[] = [];

        if (mode === 'all') {
          // 需要所有功能都可用
          hasAccess = results.every(result => result.access.enabled);
          missingFeatures = results
            .filter(result => !result.access.enabled)
            .map(result => result.feature);
          errorMessage = `需要以下所有功能: ${missingFeatures.join(', ')}`;
        } else {
          // 只需要任意一个功能可用
          hasAccess = results.some(result => result.access.enabled);
          missingFeatures = features;
          errorMessage = `需要以下任意一个功能: ${features.join(', ')}`;
        }

        if (!hasAccess) {
          const response: ApiResponse = {
            error: errorMessage,
            code: 'MULTIPLE_FEATURES_REQUIRED',
            missingDependencies: missingFeatures
          };

          res.status(403).json(response);
          return;
        }

        return handler(req, res);
      } catch (error) {
        console.error('多功能门控中间件错误:', error);
        res.status(500).json({
          error: '服务器内部错误',
          code: 'INTERNAL_ERROR'
        });
      }
    };
  };
}

/**
 * 许可证级别门控中间件
 */
export function requireLicenseMiddleware(
  requiredLicenses: ('community' | 'professional' | 'enterprise')[],
  errorMessage?: string
) {
  return function (handler: NextApiHandler): NextApiHandler {
    return async function (req: NextApiRequest, res: NextApiResponse) {
      try {
        const licenseManager = LicenseManager.getInstance();
        const currentLicense = licenseManager.getLicenseType();

        if (!requiredLicenses.includes(currentLicense)) {
          const response: ApiResponse = {
            error: errorMessage || `此功能需要 ${requiredLicenses.join(' 或 ')} 许可证`,
            code: 'LICENSE_REQUIRED',
            requiredLicense: requiredLicenses,
            upgradeUrl: '/pricing'
          };

          res.status(403).json(response);
          return;
        }

        return handler(req, res);
      } catch (error) {
        console.error('许可证门控中间件错误:', error);
        res.status(500).json({
          error: '服务器内部错误',
          code: 'INTERNAL_ERROR'
        });
      }
    };
  };
}

/**
 * 用户数量限制中间件
 */
export function requireUserLimitMiddleware(
  getCurrentUserCount: () => Promise<number> | number,
  errorMessage?: string
) {
  return function (handler: NextApiHandler): NextApiHandler {
    return async function (req: NextApiRequest, res: NextApiResponse) {
      try {
        const licenseManager = LicenseManager.getInstance();
        const maxUsers = licenseManager.getMaxUsers();
        const currentUsers = await getCurrentUserCount();

        if (currentUsers >= maxUsers) {
          const response: ApiResponse = {
            error: errorMessage || `已达到用户数量限制 (${maxUsers})`,
            code: 'USER_LIMIT_EXCEEDED',
            upgradeUrl: '/pricing'
          };

          res.status(403).json(response);
          return;
        }

        return handler(req, res);
      } catch (error) {
        console.error('用户限制中间件错误:', error);
        res.status(500).json({
          error: '服务器内部错误',
          code: 'INTERNAL_ERROR'
        });
      }
    };
  };
}

/**
 * 组合中间件工具函数
 */
export function combineMiddlewares(...middlewares: ((handler: NextApiHandler) => NextApiHandler)[]) {
  return function (handler: NextApiHandler): NextApiHandler {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

/**
 * 功能状态检查API处理函数
 */
export function createFeatureStatusHandler(features: FeatureFlag[]) {
  return function (req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
      res.status(405).json({ error: '方法不允许' });
      return;
    }

    try {
      const licenseManager = LicenseManager.getInstance();
      const featureStatus = features.reduce((acc, feature) => {
        acc[feature] = licenseManager.checkFeatureAccess(feature);
        return acc;
      }, {} as Record<FeatureFlag, any>);

      res.json({
        licenseType: licenseManager.getLicenseType(),
        maxUsers: licenseManager.getMaxUsers(),
        features: featureStatus
      });
    } catch (error) {
      console.error('功能状态检查错误:', error);
      res.status(500).json({
        error: '服务器内部错误',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

// 导出常用的功能组合（使用字符串以确保兼容性）
export const requireProfessionalOrEnterprise = requireLicenseMiddleware(['professional', 'enterprise']);
export const requireEnterprise = requireLicenseMiddleware(['enterprise']);
export const requireMultiUser = requireFeatureMiddleware({ feature: 'multi_user' });
export const requireWorkspaces = requireFeatureMiddleware({ feature: 'workspaces' });
export const requireVersionControl = requireFeatureMiddleware({ feature: 'version_control' });
export const requireRealTimeCollaboration = requireFeatureMiddleware({ feature: 'real_time_collaboration' });
