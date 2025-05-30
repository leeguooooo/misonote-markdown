/**
 * API 密钥认证中间件
 */

import { NextRequest } from 'next/server';
import { validateApiKey, hasPermission, isApiKeyExpired, ApiKey } from './api-keys';
import { log } from './logger';

export interface ApiAuthResult {
  success: boolean;
  apiKey?: ApiKey;
  error?: string;
}

/**
 * 从请求中提取 API 密钥
 */
function extractApiKey(request: NextRequest): string | null {
  // 优先从 Authorization header 获取
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    // 支持 "Bearer mcp_xxx" 格式
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    // 支持 "mcp_xxx" 格式
    if (authHeader.startsWith('mcp_')) {
      return authHeader;
    }
  }

  // 从 X-API-Key header 获取
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader && apiKeyHeader.startsWith('mcp_')) {
    return apiKeyHeader;
  }

  // 从查询参数获取（不推荐，但支持）
  const { searchParams } = new URL(request.url);
  const apiKeyParam = searchParams.get('api_key');
  if (apiKeyParam && apiKeyParam.startsWith('mcp_')) {
    return apiKeyParam;
  }

  return null;
}

/**
 * 验证 API 密钥认证
 */
export function authenticateApiKey(request: NextRequest): ApiAuthResult {
  try {
    const apiKeyValue = extractApiKey(request);

    if (!apiKeyValue) {
      return {
        success: false,
        error: '缺少 API 密钥'
      };
    }

    const apiKey = validateApiKey(apiKeyValue);

    if (!apiKey) {
      log.warn('无效的 API 密钥', {
        prefix: apiKeyValue.substring(0, 12),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });

      return {
        success: false,
        error: '无效的 API 密钥'
      };
    }

    // 检查密钥是否过期
    if (isApiKeyExpired(apiKey)) {
      log.warn('API 密钥已过期', {
        id: apiKey.id,
        name: apiKey.name,
        expiresAt: apiKey.expiresAt
      });

      return {
        success: false,
        error: 'API 密钥已过期'
      };
    }

    // 检查密钥是否激活
    if (!apiKey.isActive) {
      log.warn('API 密钥未激活', {
        id: apiKey.id,
        name: apiKey.name
      });

      return {
        success: false,
        error: 'API 密钥未激活'
      };
    }

    log.debug('API 密钥认证成功', {
      id: apiKey.id,
      name: apiKey.name,
      permissions: apiKey.permissions
    });

    return {
      success: true,
      apiKey
    };
  } catch (error) {
    log.error('API 密钥认证过程中发生错误', error);

    return {
      success: false,
      error: '认证过程中发生错误'
    };
  }
}

/**
 * 检查 API 密钥权限
 */
export function checkApiPermission(apiKey: ApiKey, permission: string): boolean {
  return hasPermission(apiKey, permission);
}

/**
 * 创建认证错误响应
 */
export function createAuthErrorResponse(error: string, status: number = 401) {
  return new Response(
    JSON.stringify({
      success: false,
      error,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="API", charset="UTF-8"'
      }
    }
  );
}

/**
 * API 密钥认证装饰器
 */
export function requireApiAuth(requiredPermission?: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(request: NextRequest, ...args: any[]) {
      const authResult = authenticateApiKey(request);

      if (!authResult.success) {
        return createAuthErrorResponse(authResult.error || '认证失败');
      }

      // 检查权限
      if (requiredPermission && !checkApiPermission(authResult.apiKey!, requiredPermission)) {
        return createAuthErrorResponse('权限不足', 403);
      }

      // 将 API 密钥信息添加到请求中
      (request as any).apiKey = authResult.apiKey;

      return originalMethod.call(this, request, ...args);
    };

    return descriptor;
  };
}

/**
 * 简单的速率限制检查
 */
export function checkRateLimit(apiKey: ApiKey): boolean {
  // 这里可以实现更复杂的速率限制逻辑
  // 目前只是简单检查，实际应用中可能需要使用 Redis 等

  // 假设每小时的限制
  const hourlyLimit = apiKey.rateLimit;
  const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));

  // 这里应该从缓存中获取当前小时的使用次数
  // 为了简化，暂时返回 true
  return true;
}

/**
 * 记录 API 使用情况
 */
export function logApiUsage(apiKey: ApiKey, request: NextRequest, response?: Response) {
  const logData = {
    apiKeyId: apiKey.id,
    apiKeyName: apiKey.name,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    responseStatus: response?.status,
    timestamp: new Date().toISOString()
  };

  log.info('API 使用记录', logData);
}

/**
 * MCP 专用的认证函数
 */
export function authenticateMcpRequest(request: NextRequest): ApiAuthResult {
  const authResult = authenticateApiKey(request);

  if (!authResult.success) {
    return authResult;
  }

  // 检查是否有 MCP 相关权限
  const apiKey = authResult.apiKey!;
  if (!hasPermission(apiKey, 'mcp') && !hasPermission(apiKey, '*')) {
    return {
      success: false,
      error: '缺少 MCP 权限'
    };
  }

  return authResult;
}
