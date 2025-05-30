# 🚀 部署指南

## 问题分析

你发现的问题非常关键！在 Next.js 中，环境变量在**构建时**就被固化到应用中了。如果构建时 `ADMIN_PASSWORD_HASH` 没有设置，那么运行时即使设置了也不会生效。

## 🔧 解决方案

我们创建了一个构建前检查系统，确保在构建之前所有必需的环境变量都已正确设置。

### 📋 新增的构建流程

#### 1. **构建前检查** (`prebuild`)
- 自动检查 `ADMIN_PASSWORD_HASH` 和 `JWT_SECRET`
- 如果缺失，自动启动交互式设置
- 验证环境变量格式和安全性

#### 2. **安全构建** (`build:safe`)
- 完整的构建流程，包含所有检查
- 清理旧文件、安装依赖、构建应用
- 可选择构建后立即启动

## 🚀 在服务器上的使用方法

### 方法1: 使用安全构建（推荐）

```bash
cd /srv/docs/markdown-site

# 运行安全构建脚本
chmod +x scripts/deployment/safe-build.sh
pnpm build:safe
```

这个脚本会：
1. ✅ 检查环境变量
2. ✅ 如果缺失，启动交互式密码设置
3. ✅ 清理旧构建文件
4. ✅ 安装依赖
5. ✅ 构建应用
6. ✅ 可选择立即启动

### 方法2: 手动步骤

```bash
cd /srv/docs/markdown-site

# 1. 运行构建前检查
node scripts/deployment/pre-build-check.js

# 2. 如果检查失败，设置环境变量
pnpm security:setup

# 3. 重新检查
node scripts/deployment/pre-build-check.js

# 4. 构建应用
pnpm build

# 5. 启动应用
pnpm pm2:verbose
```

### 方法3: 强制构建（跳过检查）

```bash
# 如果你确定环境变量已正确设置
pnpm build:force
```

## 📋 构建前检查功能

### 检查项目
- ✅ `ADMIN_PASSWORD_HASH` 存在且格式正确（60字符，$2b$12$ 开头）
- ✅ `JWT_SECRET` 存在且长度足够（至少32字符）
- ✅ 环境变量值的有效性验证

### 自动修复
- 🔧 缺失环境变量时自动启动交互式设置
- 🔧 验证设置结果
- 🔧 显示详细的环境变量状态

## 🎯 解决的问题

### 问题1: 构建时环境变量缺失
**之前**: 构建时没有 `ADMIN_PASSWORD_HASH`，运行时设置无效
**现在**: 构建前强制检查和设置环境变量

### 问题2: 环境变量格式错误
**之前**: 可能设置了错误格式的哈希值
**现在**: 验证哈希值格式和长度

### 问题3: 部署流程不一致
**之前**: 手动设置，容易遗漏步骤
**现在**: 自动化的安全构建流程

## 📊 构建前检查输出示例

```
🔍 构建前环境变量检查
======================

[INFO] 检查构建前环境变量...
[SUCCESS] ADMIN_PASSWORD_HASH: 已正确设置
[SUCCESS] JWT_SECRET: 已正确设置

📋 环境变量状态:
================
NODE_ENV: production
PORT: 3001
ADMIN_PASSWORD_HASH: 已设置
  - 长度: 60
  - 格式: 正确
  - 前缀: $2b$12$gni
JWT_SECRET: 已设置
  - 长度: 44
  - 安全性: 良好

[SUCCESS] ✅ 所有环境变量已正确设置，可以开始构建
```

## 🔄 完整的部署流程

### 首次部署
```bash
# 1. 克隆代码
git clone <repository>
cd markdown-preview

# 2. 安装依赖
pnpm install

# 3. 安全构建（会自动设置密码）
pnpm build:safe

# 4. 应用已自动启动，或手动启动
pnpm pm2:verbose
```

### 更新部署
```bash
# 1. 拉取最新代码
git pull

# 2. 安全构建（会检查现有环境变量）
pnpm build:safe

# 3. 应用会自动重启
```

## 🛡️ 安全最佳实践

### 1. 环境变量管理
- ✅ 使用强密码（至少12位，包含特殊字符）
- ✅ 定期更换 JWT 密钥
- ✅ 不在代码中硬编码敏感信息

### 2. 构建安全
- ✅ 构建前验证所有环境变量
- ✅ 使用安全构建脚本
- ✅ 验证构建结果

### 3. 部署安全
- ✅ 使用 PM2 管理进程
- ✅ 启用详细日志监控
- ✅ 定期检查应用状态

## 🆘 故障排除

### 如果构建前检查失败
```bash
# 手动设置环境变量
pnpm security:setup

# 重新运行检查
node scripts/deployment/pre-build-check.js
```

### 如果构建失败
```bash
# 清理并重试
pnpm clean
pnpm install
pnpm build:safe
```

### 如果应用无法启动
```bash
# 检查环境变量
pnpm debug:env

# 查看日志
pnpm pm2:logs:verbose

# 重新构建
pnpm build:safe
```

现在你的部署流程更加安全和可靠了！🎉
