import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';

// GET - 调试认证状态
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = authenticateRequest(request);
    
    return NextResponse.json({
      success: true,
      data: {
        hasAuthHeader: !!authHeader,
        authHeader: authHeader ? authHeader.substring(0, 20) + '...' : null,
        user: user,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    });
  }
}
