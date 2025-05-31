/**
 * 许可证状态API
 * 用于测试许可证验证功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { LicenseManager } from '@/business/license/manager';
import { initializeServer } from '@/lib/server-init';

export async function GET(request: NextRequest) {
  try {
    // 确保服务器已初始化
    await initializeServer();

    const licenseManager = LicenseManager.getInstance();
    const currentLicense = licenseManager.getCurrentLicense();
    
    if (!currentLicense) {
      return NextResponse.json({
        success: true,
        data: {
          hasLicense: false,
          licenseType: 'community',
          features: [],
          maxUsers: 1,
          message: '当前使用社区版'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        hasLicense: true,
        licenseType: currentLicense.type,
        organization: currentLicense.organization,
        features: currentLicense.features,
        maxUsers: currentLicense.maxUsers,
        expiresAt: currentLicense.expiresAt,
        message: '许可证有效'
      }
    });

  } catch (error) {
    console.error('获取许可证状态失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取许可证状态失败'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { licenseKey } = await request.json();
    
    if (!licenseKey) {
      return NextResponse.json({
        success: false,
        error: '请提供许可证密钥'
      }, { status: 400 });
    }

    const licenseManager = LicenseManager.getInstance();

    // 获取客户端IP地址
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() :
               request.headers.get('x-real-ip') || 'unknown';

    const result = await licenseManager.validateLicense(licenseKey, {
      ip,
      headers: Object.fromEntries(request.headers.entries())
    });

    if (!result.valid) {
      return NextResponse.json({
        success: false,
        error: result.error || '许可证验证失败'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        license: {
          id: result.license?.id,
          type: result.license?.type,
          organization: result.license?.organization,
          features: result.license?.features,
          maxUsers: result.license?.maxUsers,
          expiresAt: result.license?.expiresAt
        },
        message: '许可证验证成功'
      }
    });

  } catch (error) {
    console.error('许可证验证失败:', error);
    return NextResponse.json({
      success: false,
      error: '许可证验证过程中发生错误'
    }, { status: 500 });
  }
}
