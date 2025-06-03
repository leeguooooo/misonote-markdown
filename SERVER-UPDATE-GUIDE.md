# 🚀 服务器更新指南

## 概述

本指南帮助你将服务器上的项目更新到最新版本，包括新的目录结构和修复的环境变量问题。

## 🔧 立即修复密码问题

如果你的服务器上密码仍然是 `admin123`，请立即执行：

### 方法1: 使用 Git 更新（推荐）

```bash
cd /srv/docs/misonote-markdown

# 1. 备份当前配置
cp .env .env.backup
cp ecosystem.config.js ecosystem.config.js.backup

# 2. 拉取最新代码
git pull origin main

# 3. 安装新依赖
pnpm install

# 4. 运行安全配置脚本
bash scripts/security/update-security.sh
```

### 方法2: 手动修复（如果无法使用 Git）

```bash
cd /srv/docs/misonote-markdown

# 1. 安装 dotenv
pnpm add dotenv

# 2. 停止应用
pm2 stop docs-platform
pm2 delete docs-platform

# 3. 创建正确的 ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'docs-platform',
      script: 'pnpm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        ADMIN_PASSWORD_HASH: '$2b$12$wxxmcb0wKzxXrdMFASiOh.7fX2rdeaL8LWxoJ9Z4OhjpKHRKFwNHO',
        JWT_SECRET: '6oec3QAFB4MUj9AHDRoRJDy9mrYqUvJRi6IL8UZHgZs=',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        ADMIN_PASSWORD_HASH: '$2b$12$wxxmcb0wKzxXrdMFASiOh.7fX2rdeaL8LWxoJ9Z4OhjpKHRKFwNHO',
        JWT_SECRET: '6oec3QAFB4MUj9AHDRoRJDy9mrYqUvJRi6IL8UZHgZs=',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
EOF

# 4. 启动应用
pm2 start ecosystem.config.js --env production

# 5. 测试登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"xiaoli123"}'
```

## 🗂️ 目录结构更新

如果你想要整理项目目录结构：

```bash
cd /srv/docs/misonote-markdown

# 1. 创建目录结构
mkdir -p scripts/{deployment,security,development}
mkdir -p docs/{security,deployment,development}

# 2. 移动现有脚本（如果存在）
# 这些脚本可能在根目录中，需要手动移动到对应目录

# 3. 清理根目录
# 移除不需要的临时文件
```

## ✅ 验证更新

更新完成后，验证一切正常：

```bash
# 1. 检查应用状态
pm2 status

# 2. 检查日志
pm2 logs docs-platform --lines 20

# 3. 测试登录
# 访问 http://your-server:3001
# 用户名: admin
# 密码: xiaoli123 (或你设置的新密码)

# 4. 检查环境变量
pm2 show docs-platform | grep -A 10 "env:"
```

## 🔐 安全建议

更新完成后，建议：

1. **更改默认密码**：
   ```bash
   # 如果有新的脚本工具
   bash scripts/security/update-security.sh

   # 或手动生成新密码
   node -e "console.log(require('bcryptjs').hashSync('your-new-password', 12))"
   ```

2. **更新 JWT 密钥**：
   ```bash
   # 生成新的 JWT 密钥
   openssl rand -base64 32
   ```

3. **设置防火墙**：
   ```bash
   # 限制管理界面访问
   ufw allow from your-ip to any port 3001
   ```

## 🆘 故障排除

### 如果应用无法启动

```bash
# 检查依赖
pnpm install

# 重新构建
pnpm build

# 检查端口占用
netstat -tlnp | grep :3001

# 查看详细日志
pm2 logs docs-platform --lines 50
```

### 如果仍然无法登录

```bash
# 检查 .env 文件
cat .env

# 验证密码哈希
node -e "
const bcrypt = require('bcryptjs');
const hash = 'your-hash-here';
console.log('admin123:', bcrypt.compareSync('admin123', hash));
console.log('xiaoli123:', bcrypt.compareSync('xiaoli123', hash));
"
```

### 如果环境变量未生效

```bash
# 重启应用并强制重新加载环境变量
pm2 restart docs-platform --update-env

# 或完全重新启动
pm2 stop docs-platform
pm2 delete docs-platform
pm2 start ecosystem.config.js --env production
```

## 📞 需要帮助？

如果遇到问题：

1. 检查 [安全配置指南](./docs/security/SECURITY-SETUP.md)
2. 查看 [故障排除文档](./docs/security/README-SECURITY.md)
3. 提交 Issue 到 GitHub 仓库

---

**重要提醒**: 更新完成后，请立即测试登录功能，确保密码正确设置！
