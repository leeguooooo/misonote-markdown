import { NextRequest } from 'next/server';

/**
 * 获取客户端IP地址
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (remoteAddr) {
    return remoteAddr;
  }

  return 'unknown';
}

/**
 * 安全的错误消息处理
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // 只返回安全的错误消息，避免泄露系统信息
    const safeMessages = [
      'Invalid file path',
      'File extension not allowed',
      'Content size exceeds maximum allowed',
      'Invalid text content detected',
      'Directory depth exceeds maximum allowed',
      'File with new name already exists',
      'File does not exist',
      'Invalid path',
      'File name contains invalid characters'
    ];

    if (safeMessages.includes(error.message)) {
      return error.message;
    }
  }

  // 对于其他错误，返回通用消息
  return 'Operation failed';
}

/**
 * 验证请求来源
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // 允许的域名列表
  const allowedOrigins = [
    `http://localhost:3001`,
    `https://localhost:3001`,
    process.env.NEXT_PUBLIC_BASE_URL
  ].filter(Boolean);

  // 检查 Origin 头
  if (origin && !allowedOrigins.includes(origin)) {
    return false;
  }

  // 检查 Referer 头
  if (referer) {
    const refererUrl = new URL(referer);
    const isAllowed = allowedOrigins.some(allowed => {
      try {
        if (!allowed) return false;
        const allowedUrl = new URL(allowed);
        return refererUrl.origin === allowedUrl.origin;
      } catch {
        return false;
      }
    });

    if (!isAllowed) {
      return false;
    }
  }

  return true;
}

/**
 * 记录安全事件
 */
export function logSecurityEvent(event: string, details: any, request: NextRequest): void {
  const timestamp = new Date().toISOString();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  console.warn(`[SECURITY] ${timestamp} - ${event}`, {
    clientIP,
    userAgent,
    details,
    url: request.url,
    method: request.method
  });
}

/**
 * 验证 Content-Type
 */
export function validateContentType(request: NextRequest, expectedTypes: string[]): boolean {
  const contentType = request.headers.get('content-type');
  if (!contentType) {
    return false;
  }

  return expectedTypes.some(type => contentType.includes(type));
}
