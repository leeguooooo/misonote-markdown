import { NextRequest, NextResponse } from 'next/server';
import { LicenseManager } from '@/business/license/manager';
import { RateLimiter } from '@/business/license/rate-limiter';

export async function GET(request: NextRequest) {
  try {
    const licenseManager = LicenseManager.getInstance();
    const license = licenseManager.getCurrentLicense();
    
    return NextResponse.json({
      success: true,
      data: {
        type: license?.type || 'community',
        maxUsers: license?.maxUsers || 1,
        features: license?.features || [],
        expiresAt: license?.expiresAt
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: '获取许可证信息失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const rateLimiter = RateLimiter.getInstance();
    const rateLimitResult = rateLimiter.checkLimit(
      getClientIP(request),
      'license_validation',
      request
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        success: false,
        error: `请求过于频繁，请在 ${rateLimitResult.retryAfter} 秒后重试`
      }, {
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString()
        }
      });
    }

    const { licenseKey } = await request.json();

    const licenseManager = LicenseManager.getInstance();
    const validation = await licenseManager.validateLicense(licenseKey, request);

    if (validation.valid) {
      return NextResponse.json({
        success: true,
        message: '许可证验证成功',
        data: validation.license
      });
    } else {
      return NextResponse.json({
        success: false,
        error: validation.error || '许可证验证失败'
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: '许可证验证失败' },
      { status: 500 }
    );
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // 从URL中获取IP（如果可用）
  const url = new URL(request.url);
  const host = request.headers.get('host') || url.hostname;

  return host || 'unknown';
}
