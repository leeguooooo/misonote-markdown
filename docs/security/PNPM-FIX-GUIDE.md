# 🔧 PNPM 环境修复指南

## 问题描述

你的服务器使用 pnpm 作为包管理器，但 PM2 没有正确读取 `.env` 文件中的环境变量。

## 🚀 快速解决方案

### 步骤 1: 安装 dotenv 依赖

```bash
cd /srv/docs/markdown-site
pnpm add dotenv
```

### 步骤 2: 运行修复脚本

```bash
# 上传更新的文件到服务器后
chmod +x fix-env-loading.sh
./fix-env-loading.sh
```

### 步骤 3: 手动修复（如果脚本失败）

```bash
# 1. 确保 dotenv 已安装
pnpm add dotenv

# 2. 更新 ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
// 加载 .env 文件
require('dotenv').config();

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
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
        JWT_SECRET: process.env.JWT_SECRET,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
        JWT_SECRET: process.env.JWT_SECRET,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
EOF

# 3. 重启 PM2 应用
pm2 stop docs-platform
pm2 delete docs-platform
pm2 start ecosystem.config.js --env production

# 4. 检查状态
pm2 logs docs-platform --lines 20
```

## 🔍 验证步骤

### 1. 检查环境变量加载

```bash
pm2 logs docs-platform | grep "环境变量调试信息" -A 5
```

应该看到：
```
🔍 环境变量调试信息:
NODE_ENV: production
JWT_SECRET: 已设置
ADMIN_PASSWORD_HASH: 已设置
ADMIN_PASSWORD_HASH 长度: 60
```

### 2. 验证密码

```bash
node verify-password.js
# 输入你设置的密码进行验证
```

### 3. 测试登录

- 访问: http://localhost:3001
- 用户名: `admin`
- 密码: 你在 `update-security.sh` 中设置的密码

## 📋 关键修改点

1. **包管理器**: 从 `npm` 改为 `pnpm`
2. **依赖安装**: 使用 `pnpm add dotenv`
3. **PM2 脚本**: 使用 `pnpm start` 而不是 `npm start`

## 🛠️ 故障排除

### 如果 pnpm 未安装

```bash
# 安装 pnpm
npm install -g pnpm
# 或者
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### 如果仍然显示密码错误

1. 检查 .env 文件内容：
   ```bash
   cat .env
   ```

2. 验证密码哈希：
   ```bash
   node verify-password.js
   ```

3. 查看完整日志：
   ```bash
   pm2 logs docs-platform --lines 50
   ```

### 如果应用启动失败

1. 检查 pnpm 依赖：
   ```bash
   pnpm install
   ```

2. 检查构建：
   ```bash
   pnpm build
   ```

3. 手动启动测试：
   ```bash
   pnpm start
   ```

## 🎯 预期结果

修复完成后，你应该能够：

1. ✅ 看到环境变量正确加载的日志
2. ✅ 使用你设置的密码成功登录
3. ✅ 不再看到"设置 ADMIN_PASSWORD_HASH 环境变量"的警告

## 📞 需要帮助？

如果仍然有问题，请提供：
1. `pm2 logs docs-platform --lines 30` 的输出
2. `cat .env` 的内容（隐藏敏感信息）
3. `pnpm list dotenv` 的结果
