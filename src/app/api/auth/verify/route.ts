import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getSecurityStatus } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const securityStatus = getSecurityStatus();

    return NextResponse.json({
      success: true,
      user,
      securityStatus,
    });
  } catch (error) {
    console.error('验证错误:', error);
    return NextResponse.json(
      { error: '验证失败' },
      { status: 500 }
    );
  }
}
