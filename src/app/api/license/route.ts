import { NextRequest, NextResponse } from 'next/server';
import { LicenseManager } from '@/business/license/manager';

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
    const { licenseKey } = await request.json();
    
    const licenseManager = LicenseManager.getInstance();
    const validation = await licenseManager.validateLicense(licenseKey);
    
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
