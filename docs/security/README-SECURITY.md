# 🔐 安全配置快速指南

## 问题描述

你的服务器密码仍然是默认的 `admin123`，这是因为 `ecosystem.config.js` 中硬编码了环境变量。

## 🚀 快速解决方案

### 步骤 1: 上传文件到服务器

将以下文件上传到你的服务器 (`/srv/docs/markdown-site/`)：

- `ecosystem.config.js` (已更新，移除硬编码)
- `update-security.sh` (自动化安全配置脚本)
- `generate-password-hash.js` (密码生成工具)

### 步骤 2: 运行自动化脚本

```bash
# 进入项目目录
cd /srv/docs/markdown-site

# 给脚本添加执行权限
chmod +x update-security.sh

# 运行安全配置脚本
./update-security.sh
```

### 步骤 3: 按提示设置密码

脚本运行时会提示你：

1. **输入新密码**: 至少6位字符
2. **确认密码**: 再次输入相同密码
3. **自动处理**: 脚本会自动生成哈希、更新配置、重启应用

### 步骤 4: 验证登录

- 访问: `http://localhost:3001`
- 用户名: `admin`
- 密码: 你刚才设置的密码

## 🛠️ 手动方式（备选）

如果自动化脚本有问题，可以手动执行：

```bash
# 1. 生成密码哈希
node generate-password-hash.js

# 2. 手动更新 .env 文件
# 将生成的哈希值填入 ADMIN_PASSWORD_HASH

# 3. 重启应用
pm2 restart docs-platform --update-env
```

## 📋 脚本功能

`update-security.sh` 脚本会自动：

- ✅ 备份当前配置
- ✅ 交互式密码设置
- ✅ 生成安全的密码哈希
- ✅ 生成随机 JWT 密钥
- ✅ 更新 .env 文件
- ✅ 设置安全权限
- ✅ 重启 PM2 应用
- ✅ 验证配置状态

## 🔍 故障排除

### 如果脚本执行失败

1. 检查 Node.js 和 PM2 是否安装
2. 确保在正确的目录中运行
3. 检查文件权限

### 如果仍然无法登录

1. 查看 PM2 日志: `pm2 logs docs-platform`
2. 检查 .env 文件内容: `cat .env`
3. 重启应用: `pm2 restart docs-platform --update-env`

### 紧急恢复

如果完全无法访问：

```bash
# 临时启用开发模式（使用默认密码 admin123）
mv .env .env.backup
echo "NODE_ENV=development" > .env
pm2 restart docs-platform
```

## 📞 需要帮助？

查看详细文档: `SECURITY-SETUP.md`

---

**重要提醒**: 设置完成后，请立即测试登录并妥善保管你的密码！
