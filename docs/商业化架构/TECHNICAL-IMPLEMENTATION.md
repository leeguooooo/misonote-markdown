# 商业化技术实施方案

## 🎯 实施目标

建立一个可扩展的商业化技术架构，支持：
- 开源核心 + 商业扩展
- 灵活的许可证管理
- 插件化功能扩展
- 平滑的版本升级

## 🏗️ 核心组件设计

### 1. 许可证系统

#### 许可证数据结构
```typescript
// src/types/license.ts
export interface License {
  id: string;
  type: 'community' | 'professional' | 'enterprise';
  organization: string;
  email: string;
  maxUsers: number;
  features: string[];
  issuedAt: Date;
  expiresAt: Date | null; // null = 永久许可证
  signature: string;
  metadata?: Record<string, any>;
}

export interface LicenseValidation {
  valid: boolean;
  license?: License;
  error?: string;
  warnings?: string[];
}
```

#### 许可证管理器
```typescript
// src/lib/license-manager.ts
export class LicenseManager {
  private static instance: LicenseManager;
  private currentLicense: License | null = null;
  
  static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }
  
  async validateLicense(licenseKey: string): Promise<LicenseValidation> {
    // 1. 本地验证签名
    // 2. 在线验证（如果可能）
    // 3. 缓存验证结果
  }
  
  hasFeature(feature: string): boolean {
    return this.currentLicense?.features.includes(feature) ?? false;
  }
  
  getMaxUsers(): number {
    return this.currentLicense?.maxUsers ?? 1;
  }
}
```

### 2. 功能门控系统

#### 功能定义
```typescript
// src/lib/features.ts
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

export const FEATURE_REQUIREMENTS: Record<FeatureFlag, {
  license: License['type'][];
  description: string;
  upgradeUrl?: string;
}> = {
  [FeatureFlag.MULTI_USER]: {
    license: ['professional', 'enterprise'],
    description: '多用户管理功能',
    upgradeUrl: '/pricing'
  },
  [FeatureFlag.SSO_INTEGRATION]: {
    license: ['enterprise'],
    description: 'SSO 单点登录集成',
    upgradeUrl: '/pricing'
  },
  // ... 其他功能定义
};
```

#### 功能门控装饰器
```typescript
// src/lib/feature-gate.ts
export function requireFeature(feature: FeatureFlag) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const licenseManager = LicenseManager.getInstance();
      
      if (!licenseManager.hasFeature(feature)) {
        const requirement = FEATURE_REQUIREMENTS[feature];
        throw new FeatureNotAvailableError(
          `功能 "${requirement.description}" 需要 ${requirement.license.join(' 或 ')} 许可证`,
          feature,
          requirement.upgradeUrl
        );
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// 使用示例
export class UserService {
  @requireFeature(FeatureFlag.MULTI_USER)
  async createUser(userData: CreateUserRequest) {
    // 创建用户逻辑
  }
}
```

### 3. 插件系统架构

#### 插件接口定义
```typescript
// src/types/plugin.ts
export interface Plugin {
  name: string;
  version: string;
  description: string;
  author: string;
  license: 'community' | 'professional' | 'enterprise';
  requiredFeatures: FeatureFlag[];
  dependencies?: string[];
  
  // 生命周期方法
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  
  // 插件配置
  getConfig?(): PluginConfig;
  setConfig?(config: PluginConfig): Promise<void>;
}

export interface PluginConfig {
  enabled: boolean;
  settings: Record<string, any>;
}
```

#### 插件管理器
```typescript
// src/lib/plugin-manager.ts
export class PluginManager {
  private plugins = new Map<string, Plugin>();
  private activePlugins = new Set<string>();
  
  async loadPlugin(pluginPath: string): Promise<void> {
    const plugin = await import(pluginPath);
    
    // 验证许可证要求
    const licenseManager = LicenseManager.getInstance();
    for (const feature of plugin.requiredFeatures) {
      if (!licenseManager.hasFeature(feature)) {
        throw new Error(`插件 ${plugin.name} 需要功能: ${feature}`);
      }
    }
    
    this.plugins.set(plugin.name, plugin);
  }
  
  async activatePlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`插件 ${name} 未找到`);
    
    await plugin.activate();
    this.activePlugins.add(name);
  }
}
```

### 4. API 中间件

#### 许可证验证中间件
```typescript
// src/middleware/license.ts
export function requireLicense(licenseType: License['type'][]) {
  return async (req: NextRequest, res: NextResponse, next: NextFunction) => {
    const licenseManager = LicenseManager.getInstance();
    const currentLicense = licenseManager.getCurrentLicense();
    
    if (!currentLicense || !licenseType.includes(currentLicense.type)) {
      return NextResponse.json({
        error: '许可证不足',
        required: licenseType,
        current: currentLicense?.type || 'none',
        upgradeUrl: '/pricing'
      }, { status: 402 }); // Payment Required
    }
    
    return next();
  };
}

// 使用示例
export const POST = requireLicense(['professional', 'enterprise'])(
  async (req: NextRequest) => {
    // 需要专业版或企业版的 API 逻辑
  }
);
```

#### 功能使用统计中间件
```typescript
// src/middleware/analytics.ts
export function trackFeatureUsage(feature: FeatureFlag) {
  return async (req: NextRequest, res: NextResponse, next: NextFunction) => {
    // 记录功能使用情况
    await AnalyticsService.trackFeatureUsage({
      feature,
      userId: req.user?.id,
      timestamp: new Date(),
      metadata: {
        userAgent: req.headers.get('user-agent'),
        ip: req.ip
      }
    });
    
    return next();
  };
}
```

## 📁 代码组织结构

### 当前目录结构调整
```
src/
├── core/                           # 核心功能 (开源)
│   ├── auth/                      # 基础认证
│   ├── docs/                      # 文档管理
│   ├── mcp/                       # MCP 支持
│   └── database/                  # 数据库操作
├── community/                     # 社区功能 (开源)
│   ├── comments/                  # 评论系统
│   ├── search/                    # 搜索功能
│   └── sharing/                   # 分享功能
├── business/                      # 商业功能框架 (开源)
│   ├── license/                   # 许可证系统
│   ├── features/                  # 功能门控
│   ├── plugins/                   # 插件系统
│   └── analytics/                 # 使用统计
├── enterprise/                    # 企业功能占位 (开源接口)
│   ├── user-management/           # 用户管理接口
│   ├── advanced-auth/             # 高级认证接口
│   ├── permissions/               # 权限系统接口
│   └── integrations/              # 集成功能接口
└── types/                         # 类型定义
    ├── license.ts                 # 许可证类型
    ├── plugin.ts                  # 插件类型
    └── enterprise.ts              # 企业功能类型
```

### 企业功能实现 (私有仓库)
```
misonote-enterprise/
├── src/
│   ├── modules/
│   │   ├── user-management/       # 用户管理实现
│   │   ├── advanced-auth/         # 高级认证实现
│   │   ├── permissions/           # 权限系统实现
│   │   └── backup/                # 企业备份实现
│   ├── integrations/
│   │   ├── sso/                   # SSO 集成
│   │   ├── ldap/                  # LDAP 集成
│   │   └── webhooks/              # Webhook 集成
│   └── plugins/
│       ├── analytics/             # 分析插件
│       ├── compliance/            # 合规插件
│       └── custom/                # 定制插件
└── build/                         # 构建产物
    ├── modules/                   # 编译后的模块
    └── plugins/                   # 编译后的插件
```

## 🔧 构建和部署

### 构建脚本
```json
// package.json
{
  "scripts": {
    "build:community": "next build",
    "build:professional": "npm run build:community && npm run build:enterprise:basic",
    "build:enterprise": "npm run build:community && npm run build:enterprise:full",
    "build:enterprise:basic": "node scripts/build-enterprise.js --level=professional",
    "build:enterprise:full": "node scripts/build-enterprise.js --level=enterprise"
  }
}
```

### 企业功能构建脚本
```javascript
// scripts/build-enterprise.js
const fs = require('fs');
const path = require('path');

async function buildEnterprise(level) {
  const enterpriseModules = getEnterpriseModules(level);
  
  for (const module of enterpriseModules) {
    await buildModule(module);
    await copyToPublic(module);
  }
  
  await generateLicenseManifest(enterpriseModules);
}

function getEnterpriseModules(level) {
  const modules = {
    professional: ['user-management', 'basic-permissions'],
    enterprise: ['user-management', 'advanced-permissions', 'sso', 'audit-logs']
  };
  
  return modules[level] || [];
}
```

## 🚀 部署策略

### Docker 构建
```dockerfile
# Dockerfile.enterprise
FROM node:18-alpine AS base

# 构建开源版本
FROM base AS community-builder
COPY . .
RUN npm run build:community

# 构建企业版本 (需要许可证)
FROM base AS enterprise-builder
ARG ENTERPRISE_LICENSE_KEY
COPY . .
COPY --from=enterprise-source /enterprise ./enterprise
RUN npm run build:enterprise

# 最终镜像
FROM base AS runner
COPY --from=community-builder /app/.next ./community
COPY --from=enterprise-builder /app/.next ./enterprise
```

### 环境变量配置
```bash
# 社区版
MISONOTE_EDITION=community

# 专业版
MISONOTE_EDITION=professional
MISONOTE_LICENSE_KEY=prof_xxxxxxxx

# 企业版
MISONOTE_EDITION=enterprise
MISONOTE_LICENSE_KEY=ent_xxxxxxxx
MISONOTE_LICENSE_SERVER=https://license.misonote.com
```

## 📊 监控和分析

### 使用情况追踪
```typescript
// src/lib/analytics.ts
export class AnalyticsService {
  static async trackFeatureUsage(data: {
    feature: FeatureFlag;
    userId?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }) {
    // 发送到分析服务
    await fetch('/api/analytics/feature-usage', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  static async trackLicenseValidation(data: {
    licenseType: string;
    success: boolean;
    error?: string;
  }) {
    // 追踪许可证验证情况
  }
}
```

---

**下一步**: 开始实施基础许可证系统和功能门控机制
