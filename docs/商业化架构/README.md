# Misonote Markdown 商业化架构

## 📋 文档概览

本目录包含 Misonote Markdown 商业化转型的完整架构设计和实施方案。

### 📚 文档结构

- **[BUSINESS-ARCHITECTURE.md](./BUSINESS-ARCHITECTURE.md)** - 商业化架构总体设计
- **[TECHNICAL-IMPLEMENTATION.md](./TECHNICAL-IMPLEMENTATION.md)** - 技术实施详细方案
- **[IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)** - 分阶段实施计划

## 🎯 核心理念

### Open Core 模式
```
🆓 Community (开源)     💼 Professional      🏢 Enterprise
├── 核心文档管理        ├── 多用户管理        ├── SSO 集成
├── Markdown 渲染       ├── 基础权限          ├── 高级权限
├── MCP 支持           ├── 数据导出          ├── 审计日志
└── 基础功能           └── 邮件支持          └── 优先支持
```

### 技术架构
```
misonote-markdown (开源仓库)
├── src/core/           # 核心功能 (开源)
├── src/community/      # 社区功能 (开源)
├── src/business/       # 商业框架 (开源)
└── src/enterprise/     # 企业接口 (开源)

misonote-enterprise (私有仓库)
├── modules/            # 企业模块实现
├── integrations/       # 第三方集成
└── plugins/            # 企业插件
```

## 🚀 快速开始

### 1. 初始化商业化架构

```bash
# 运行初始化脚本
node scripts/setup-business-architecture.js

# 或使用 npm 脚本
npm run setup:business
```

### 2. 验证设置

```bash
# 检查目录结构
ls -la src/business/
ls -la src/enterprise/

# 测试构建
npm run build:community
```

### 3. 开始开发

按照 [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) 中的步骤开始开发。

## 📊 版本对比

| 功能 | Community | Professional | Enterprise |
|------|-----------|--------------|------------|
| 用户数 | 1 | 10 | 无限 |
| 基础功能 | ✅ | ✅ | ✅ |
| 多用户管理 | ❌ | ✅ | ✅ |
| 高级权限 | ❌ | ❌ | ✅ |
| SSO 集成 | ❌ | ❌ | ✅ |
| 技术支持 | 社区 | 邮件 | 优先级 |
| 定价 | 免费 | $29/月 | $99/月 |

## 🔧 开发指南

### 添加新的企业功能

1. **定义功能标志**
   ```typescript
   // src/types/business/features.ts
   export enum FeatureFlag {
     NEW_FEATURE = 'new_feature'
   }
   ```

2. **创建功能接口**
   ```typescript
   // src/enterprise/new-feature/interface.ts
   export interface NewFeatureService {
     doSomething(): Promise<void>;
   }
   ```

3. **添加功能门控**
   ```typescript
   // 在相关 API 中
   @requireFeature(FeatureFlag.NEW_FEATURE)
   async function newFeatureHandler() {
     // 功能实现
   }
   ```

4. **创建占位界面**
   ```tsx
   // src/enterprise/new-feature/NewFeaturePage.tsx
   export function NewFeaturePage() {
     return <UpgradePrompt feature="新功能" />;
   }
   ```

### 许可证验证流程

```typescript
// 1. 获取许可证管理器
const licenseManager = LicenseManager.getInstance();

// 2. 验证许可证
const validation = await licenseManager.validateLicense(key);

// 3. 检查功能权限
if (licenseManager.hasFeature('multi_user')) {
  // 执行功能
}
```

## 📈 商业模式

### 收入来源
1. **订阅收费** - 月度/年度订阅
2. **许可证销售** - 永久许可证
3. **技术支持** - 专业服务
4. **定制开发** - 企业定制

### 目标市场
- **个人开发者** → Community (免费)
- **小团队** → Professional ($29/月)
- **企业用户** → Enterprise ($99/月)

## 🛣️ 发展路线图

### 第一阶段 (1-2个月)
- [x] 商业化架构设计
- [ ] 许可证系统实现
- [ ] 基础功能门控
- [ ] 企业功能占位

### 第二阶段 (2-3个月)
- [ ] 多用户管理
- [ ] 基础权限控制
- [ ] 支付系统集成
- [ ] 许可证管理后台

### 第三阶段 (3-6个月)
- [ ] SSO 集成
- [ ] 高级权限管理
- [ ] 企业级备份
- [ ] 技术支持系统

## 🤝 贡献指南

### 开源贡献
- 核心功能和社区功能欢迎开源贡献
- 商业功能框架也接受改进建议
- 请遵循现有的代码规范

### 商业功能开发
- 企业功能在私有仓库开发
- 需要签署商业开发协议
- 遵循企业级代码质量标准

## 📞 支持

- **社区支持**: GitHub Issues
- **商业咨询**: business@misonote.com
- **技术支持**: support@misonote.com

---

**最后更新**: 2024-12-19  
**版本**: v1.0  
**维护者**: Misonote 团队
