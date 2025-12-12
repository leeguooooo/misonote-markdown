import { NextRequest, NextResponse } from 'next/server';
import { isEnterpriseAvailable, getAvailableFeatures } from '@/business/features/gate';
import { LicenseManager } from '@/business/license/manager';
import { log } from '@/core/logger';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    log.api('获取系统版本信息');

    // 检查企业版是否可用
    const enterpriseAvailable = await isEnterpriseAvailable();
    
    // 获取许可证管理器
    const licenseManager = LicenseManager.getInstance();
    const currentLicense = licenseManager.getCurrentLicense();
    const licenseValid = !!currentLicense && (
      currentLicense.type === 'community' ||
      !currentLicense.expiresAt ||
      currentLicense.expiresAt > new Date()
    );
    
    // 获取可用功能
    const availableFeatures = await getAvailableFeatures();
    
    // 确定版本类型
    let versionType = 'community';
    let versionName = '社区版';
    let versionDescription = '免费开源版本，支持基础文档管理和评论功能';
    
    if (enterpriseAvailable && currentLicense) {
      switch (currentLicense.type) {
        case 'professional':
          versionType = 'professional';
          versionName = '专业版';
          versionDescription = '适合小团队的协作文档平台';
          break;
        case 'enterprise':
          versionType = 'enterprise';
          versionName = '企业版';
          versionDescription = '企业级文档管理和协作平台';
          break;
        default:
          versionType = 'community';
          versionName = '社区版';
      }
    }

    // 构建版本信息
    const versionInfo = {
      type: versionType,
      name: versionName,
      description: versionDescription,
      enterpriseAvailable,
      hasValidLicense: licenseValid,
      licenseInfo: currentLicense ? {
        organization: currentLicense.organization,
        type: currentLicense.type,
        expiresAt: currentLicense.expiresAt,
        maxUsers: currentLicense.maxUsers,
        isValid: licenseValid
      } : null,
      features: {
        available: availableFeatures,
        community: [
          'comments',
          'annotations', 
          'bookmarks',
          'basic_search',
          'file_management',
          'markdown_editing'
        ],
        professional: enterpriseAvailable ? [
          'multi_user',
          'workspaces',
          'advanced_permissions',
          'version_control',
          'advanced_backup'
        ] : [],
        enterprise: enterpriseAvailable ? [
          'sso_integration',
          'audit_logs',
          'compliance_tools',
          'custom_branding',
          'enterprise_support',
          'webhook_integration'
        ] : []
      },
      loginOptions: {
        adminRequired: versionType === 'community',
        supportsUserRegistration: versionType !== 'community',
        supportsSSO: versionType === 'enterprise' && licenseValid,
        guestAccess: true
      }
    };

    log.api(`版本信息: ${versionName} (${versionType})`);
    
    return NextResponse.json({
      success: true,
      version: versionInfo
    });

  } catch (error) {
    log.error('获取版本信息失败:', error);
    
    // 返回默认社区版信息
    return NextResponse.json({
      success: true,
      version: {
        type: 'community',
        name: '社区版',
        description: '免费开源版本，支持基础文档管理和评论功能',
        enterpriseAvailable: false,
        hasValidLicense: false,
        licenseInfo: null,
        features: {
          available: ['comments', 'annotations', 'bookmarks', 'basic_search'],
          community: ['comments', 'annotations', 'bookmarks', 'basic_search'],
          professional: [],
          enterprise: []
        },
        loginOptions: {
          adminRequired: true,
          supportsUserRegistration: false,
          supportsSSO: false,
          guestAccess: true
        }
      }
    });
  }
}
