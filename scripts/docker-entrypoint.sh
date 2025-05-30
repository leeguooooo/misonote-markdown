#!/bin/bash

# Docker 容器启动脚本

set -e

echo "🐳 启动 Markdown Preview 容器"
echo "============================="

# 检查环境变量配置
if [ ! -f ".env" ] || ! grep -q "ADMIN_PASSWORD_HASH_BASE64" .env; then
    echo "⚠️  检测到环境变量未配置"
    echo "📝 创建默认环境变量配置..."
    
    cat > .env << EOF
# Docker 环境配置
NODE_ENV=production
PORT=3001

# 默认配置 - 请在容器启动后设置管理员密码
# 运行: docker exec -it markdown-preview node scripts/generate-password.js
EOF
    
    echo "✅ 默认环境变量已创建"
    echo "🔐 请运行以下命令设置管理员密码:"
    echo "   docker exec -it markdown-preview node scripts/generate-password.js"
fi

# 创建必要的目录
mkdir -p docs data logs

# 设置权限
chown -R nextjs:nodejs docs data logs 2>/dev/null || true

echo "🚀 启动应用服务器..."

# 启动 Next.js 应用
exec "$@"
