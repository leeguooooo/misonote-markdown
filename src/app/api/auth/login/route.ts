import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, generateToken, getSecurityStatus } from '@/core/auth/auth';
import { ADMIN_TOKEN_COOKIE, adminCookieOptions } from '@/lib/server/auth-cookies';
import { log } from '@/core/logger';

export async function POST(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  log.api(`登录请求 - IP: ${clientIP}`);

  try {
    const { password } = await request.json();

    log.debug('接收到登录请求', {
      passwordLength: password?.length || 0,
      clientIP
    });

    if (!password) {
      log.warn('登录失败：密码为空');
      return NextResponse.json(
        { error: '密码不能为空' },
        { status: 400 }
      );
    }

    // 验证密码
    log.auth('开始密码验证流程');
    const isValid = await verifyAdminPassword(password);

    if (!isValid) {
      log.warn(`登录失败：密码错误 - IP: ${clientIP}`);
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }

    // 生成 Token
    const user = {
      id: 'admin',
      username: 'admin',
      role: 'admin' as const,
    };

    log.auth('密码验证成功，生成 Token');
    const token = generateToken(user);
    const securityStatus = getSecurityStatus();

    log.info(`登录成功 - 用户: ${user.username}, IP: ${clientIP}`);

    const response = NextResponse.json({
      success: true,
      token,
      user,
      securityStatus,
    });

    response.cookies.set(ADMIN_TOKEN_COOKIE, token, adminCookieOptions);
    return response;
  } catch (error) {
    log.error('登录处理异常', {
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      clientIP
    });

    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    );
  }
}
