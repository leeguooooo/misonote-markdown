#!/bin/bash

# 最终修复方案 - 直接硬编码环境变量

set -e

echo "🔧 最终修复方案"
echo "==============="
echo ""

# 1. 停止应用
echo "1. 停止当前应用..."
pm2 stop docs-platform 2>/dev/null || true
pm2 delete docs-platform 2>/dev/null || true

# 2. 创建新的 ecosystem.config.js，直接硬编码环境变量
echo "2. 创建新的 PM2 配置（硬编码环境变量）..."

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

echo "✅ PM2 配置已更新"

# 3. 显示配置内容
echo ""
echo "3. 验证配置内容..."
echo "ADMIN_PASSWORD_HASH 已设置: $(grep -o 'ADMIN_PASSWORD_HASH.*' ecosystem.config.js | head -1)"

# 4. 启动应用
echo ""
echo "4. 启动应用..."
pm2 start ecosystem.config.js --env production

# 5. 等待启动
echo "5. 等待应用启动..."
sleep 8

# 6. 检查状态
echo ""
echo "6. 检查应用状态..."
pm2 status

# 7. 显示环境变量
echo ""
echo "7. 检查 PM2 环境变量..."
pm2 show docs-platform | grep -A 20 "env:"

# 8. 测试登录
echo ""
echo "8. 测试登录..."
echo "测试密码: xiaoli123"

response=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"xiaoli123"}')

echo "API 响应: $response"

if echo "$response" | grep -q '"success":true'; then
    echo "✅ 登录成功！"
    echo ""
    echo "🎉 修复完成！"
    echo "现在你可以使用以下凭据登录:"
    echo "  地址: http://localhost:3001"
    echo "  用户名: admin"
    echo "  密码: xiaoli123"
elif echo "$response" | grep -q '"error"'; then
    echo "❌ 登录仍然失败"
    error_msg=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo "错误信息: $error_msg"
    echo ""
    echo "🔍 进一步调试..."
    echo "检查应用日志:"
    pm2 logs docs-platform --lines 30
else
    echo "❓ 未知响应格式"
    echo "完整响应: $response"
fi

echo ""
echo "如果仍有问题，请检查:"
echo "1. pm2 logs docs-platform --lines 50"
echo "2. pm2 show docs-platform"
