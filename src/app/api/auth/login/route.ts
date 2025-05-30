import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, generateToken, getSecurityStatus } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: '密码不能为空' },
        { status: 400 }
      );
    }

    // 验证密码
    const isValid = await verifyAdminPassword(password);

    if (!isValid) {
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

    const token = generateToken(user);
    const securityStatus = getSecurityStatus();

    return NextResponse.json({
      success: true,
      token,
      user,
      securityStatus,
    });
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    );
  }
}
