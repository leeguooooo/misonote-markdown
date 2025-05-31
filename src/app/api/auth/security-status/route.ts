import { NextResponse } from 'next/server';
import { getSecurityStatus } from '@/core/auth/auth';

export async function GET() {
  try {
    const securityStatus = getSecurityStatus();

    return NextResponse.json({
      success: true,
      ...securityStatus,
    });
  } catch (error) {
    console.error('获取安全状态错误:', error);
    return NextResponse.json(
      { error: '获取安全状态失败' },
      { status: 500 }
    );
  }
}
