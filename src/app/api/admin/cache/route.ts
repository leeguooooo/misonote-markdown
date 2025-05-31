import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import { docsCache } from '@/core/docs/docs-cache';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // 验证认证
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 获取缓存统计信息
    const stats = docsCache.getCacheStats();

    return NextResponse.json({
      success: true,
      stats,
      message: '缓存统计信息获取成功'
    });
  } catch (error) {
    console.error('获取缓存统计失败:', error);
    return NextResponse.json(
      { error: '获取缓存统计失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 验证认证
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('file');

    if (filePath) {
      // 清除特定文件的缓存
      docsCache.clearFileCache(filePath);
      return NextResponse.json({
        success: true,
        message: `文件缓存已清除: ${filePath}`
      });
    } else {
      // 清除所有缓存
      docsCache.clearCache();
      return NextResponse.json({
        success: true,
        message: '所有缓存已清除'
      });
    }
  } catch (error) {
    console.error('清除缓存失败:', error);
    return NextResponse.json(
      { error: '清除缓存失败' },
      { status: 500 }
    );
  }
}
