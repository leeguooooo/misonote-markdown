#!/usr/bin/env node

/**
 * 商业化架构初始化脚本
 * 创建必要的目录结构和基础文件
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logInfo(message) {
  log('blue', `[INFO] ${message}`);
}

function logSuccess(message) {
  log('green', `[SUCCESS] ${message}`);
}

function logWarning(message) {
  log('yellow', `[WARNING] ${message}`);
}

function logError(message) {
  log('red', `[ERROR] ${message}`);
}

// 目录结构定义
const directories = [
  // 商业功能目录
  'src/business',
  'src/business/license',
  'src/business/features',
  'src/business/plugins',
  'src/business/analytics',
  
  // 企业功能接口目录
  'src/enterprise',
  'src/enterprise/user-management',
  'src/enterprise/permissions',
  'src/enterprise/backup',
  'src/enterprise/integrations',
  
  // 类型定义目录
  'src/types/business',
  
  // API 目录
  'src/app/api/license',
  'src/app/api/enterprise',
  'src/app/api/enterprise/users',
  'src/app/api/enterprise/permissions',
  'src/app/api/enterprise/backup',
  
  // 组件目录
  'src/components/business',
  'src/components/enterprise',
  
  // 文档目录
  'docs/商业化架构/examples',
  'docs/商业化架构/api'
];

// 基础文件模板
const fileTemplates = {
  // 许可证类型定义
  'src/types/business/license.ts': `/**
 * 许可证相关类型定义
 */

export interface License {
  id: string;
  type: 'community' | 'professional' | 'enterprise';
  organization: string;
  email: string;
  maxUsers: number;
  features: string[];
  issuedAt: Date;
  expiresAt: Date | null;
  signature: string;
  metadata?: Record<string, any>;
}

export interface LicenseValidation {
  valid: boolean;
  license?: License;
  error?: string;
  warnings?: string[];
}

export enum LicenseType {
  COMMUNITY = 'community',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}
`,

  // 功能标志定义
  'src/types/business/features.ts': `/**
 * 功能标志和权限定义
 */

export enum FeatureFlag {
  // 用户管理
  MULTI_USER = 'multi_user',
  ADVANCED_PERMISSIONS = 'advanced_permissions',
  SSO_INTEGRATION = 'sso_integration',
  
  // 数据管理
  ADVANCED_BACKUP = 'advanced_backup',
  DATA_MIGRATION = 'data_migration',
  AUDIT_LOGS = 'audit_logs',
  
  // 集成功能
  WEBHOOK_INTEGRATION = 'webhook_integration',
  API_RATE_LIMITING = 'api_rate_limiting',
  CUSTOM_PLUGINS = 'custom_plugins',
  
  // 企业功能
  ENTERPRISE_SUPPORT = 'enterprise_support',
  CUSTOM_BRANDING = 'custom_branding',
  COMPLIANCE_TOOLS = 'compliance_tools'
}

export interface FeatureRequirement {
  license: string[];
  description: string;
  upgradeUrl?: string;
}
`,

  // 许可证管理器
  'src/business/license/manager.ts': `/**
 * 许可证管理器
 * 负责许可证的验证、缓存和管理
 */

import { License, LicenseValidation, LicenseType } from '@/types/business/license';

export class LicenseManager {
  private static instance: LicenseManager;
  private currentLicense: License | null = null;
  private lastValidation: Date | null = null;
  
  static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }
  
  async validateLicense(licenseKey?: string): Promise<LicenseValidation> {
    // TODO: 实现许可证验证逻辑
    // 1. 本地验证签名
    // 2. 在线验证（如果可能）
    // 3. 缓存验证结果
    
    // 临时返回社区版
    return {
      valid: true,
      license: {
        id: 'community',
        type: 'community',
        organization: 'Community User',
        email: '',
        maxUsers: 1,
        features: [],
        issuedAt: new Date(),
        expiresAt: null,
        signature: ''
      }
    };
  }
  
  getCurrentLicense(): License | null {
    return this.currentLicense;
  }
  
  hasFeature(feature: string): boolean {
    return this.currentLicense?.features.includes(feature) ?? false;
  }
  
  getMaxUsers(): number {
    return this.currentLicense?.maxUsers ?? 1;
  }
  
  getLicenseType(): LicenseType {
    return (this.currentLicense?.type as LicenseType) ?? LicenseType.COMMUNITY;
  }
}
`,

  // 功能门控
  'src/business/features/gate.ts': `/**
 * 功能门控系统
 * 用于控制功能访问权限
 */

import { FeatureFlag } from '@/types/business/features';
import { LicenseManager } from '../license/manager';

export class FeatureNotAvailableError extends Error {
  constructor(
    message: string,
    public feature: FeatureFlag,
    public upgradeUrl?: string
  ) {
    super(message);
    this.name = 'FeatureNotAvailableError';
  }
}

export function requireFeature(feature: FeatureFlag) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const licenseManager = LicenseManager.getInstance();
      
      if (!licenseManager.hasFeature(feature)) {
        throw new FeatureNotAvailableError(
          \`功能 "\${feature}" 需要更高级别的许可证\`,
          feature,
          '/pricing'
        );
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

export function checkFeature(feature: FeatureFlag): boolean {
  const licenseManager = LicenseManager.getInstance();
  return licenseManager.hasFeature(feature);
}
`,

  // 许可证 API
  'src/app/api/license/route.ts': `import { NextRequest, NextResponse } from 'next/server';
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
`,

  // 企业用户管理占位 API
  'src/app/api/enterprise/users/route.ts': `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    error: '用户管理功能需要专业版或企业版许可证',
    feature: 'multi_user',
    upgradeUrl: '/pricing',
    description: '多用户管理功能允许您添加团队成员并分配不同的权限'
  }, { status: 402 }); // Payment Required
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: '创建用户功能需要专业版或企业版许可证',
    feature: 'multi_user',
    upgradeUrl: '/pricing'
  }, { status: 402 });
}
`,

  // 升级提示组件
  'src/components/business/UpgradePrompt.tsx': `'use client';

import React from 'react';

interface UpgradePromptProps {
  feature: string;
  description?: string;
  requiredLicense?: string[];
  upgradeUrl?: string;
}

export function UpgradePrompt({
  feature,
  description,
  requiredLicense = ['professional', 'enterprise'],
  upgradeUrl = '/pricing'
}: UpgradePromptProps) {
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-9a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          升级解锁 {feature}
        </h3>
        
        {description && (
          <p className="text-sm text-gray-600 mb-4">
            {description}
          </p>
        )}
        
        <p className="text-sm text-gray-500 mb-4">
          此功能需要 {requiredLicense.join(' 或 ')} 版本
        </p>
        
        <div className="space-y-2">
          <a
            href={upgradeUrl}
            className="w-full inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            查看升级选项
          </a>
          
          <button
            onClick={() => window.history.back()}
            className="w-full inline-flex justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}
`
};

// 创建目录
function createDirectories() {
  logInfo('创建目录结构...');
  
  directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logSuccess(`创建目录: ${dir}`);
    } else {
      logWarning(`目录已存在: ${dir}`);
    }
  });
}

// 创建基础文件
function createFiles() {
  logInfo('创建基础文件...');
  
  Object.entries(fileTemplates).forEach(([filePath, content]) => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      // 确保目录存在
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content, 'utf8');
      logSuccess(`创建文件: ${filePath}`);
    } else {
      logWarning(`文件已存在: ${filePath}`);
    }
  });
}

// 更新 package.json
function updatePackageJson() {
  logInfo('更新 package.json...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // 添加新的构建脚本
  const newScripts = {
    'build:community': 'next build',
    'build:professional': 'npm run build:community && echo "Professional build completed"',
    'build:enterprise': 'npm run build:community && echo "Enterprise build completed"',
    'setup:business': 'node scripts/setup-business-architecture.js'
  };
  
  packageJson.scripts = { ...packageJson.scripts, ...newScripts };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
  logSuccess('package.json 已更新');
}

// 主函数
function main() {
  console.log('🚀 开始设置商业化架构...\n');
  
  try {
    createDirectories();
    console.log('');
    
    createFiles();
    console.log('');
    
    updatePackageJson();
    console.log('');
    
    logSuccess('✅ 商业化架构设置完成！');
    console.log('');
    logInfo('下一步:');
    console.log('  1. 查看 docs/商业化架构/ 目录下的文档');
    console.log('  2. 根据 IMPLEMENTATION-PLAN.md 开始开发');
    console.log('  3. 运行 npm run build:community 测试构建');
    
  } catch (error) {
    logError('设置过程中出现错误: ' + error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
