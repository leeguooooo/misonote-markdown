#!/bin/bash

# Docker 容器启动脚本

set -e

echo "🐳 启动 Misonote Markdown 容器"
echo "=============================="

# 处理管理员密码设置
setup_admin_password() {
    if [ -n "$ADMIN_PASSWORD" ]; then
        echo "🔐 检测到 ADMIN_PASSWORD 环境变量，正在设置管理员密码..."

        # 使用提供的密码生成哈希
        ADMIN_PASSWORD_HASH_BASE64=$(node -e "
            const bcrypt = require('bcryptjs');
            const password = process.env.ADMIN_PASSWORD;
            const hash = bcrypt.hashSync(password, 12);
            const base64Hash = Buffer.from(hash).toString('base64');
            console.log(base64Hash);
        ")

        echo "✅ 管理员密码已设置"
    elif [ -z "$ADMIN_PASSWORD_HASH_BASE64" ]; then
        echo "⚠️  未检测到管理员密码配置"
        echo "💡 您可以通过以下方式设置密码："
        echo "   1. 启动时设置: docker run -e ADMIN_PASSWORD=your_password ..."
        echo "   2. 启动后设置: docker exec -it container_name node scripts/generate-password.js"

        # 生成默认的临时密码
        TEMP_PASSWORD="admin123"
        echo "🔧 生成临时密码: $TEMP_PASSWORD"
        ADMIN_PASSWORD_HASH_BASE64=$(node -e "
            const bcrypt = require('bcryptjs');
            const hash = bcrypt.hashSync('$TEMP_PASSWORD', 12);
            const base64Hash = Buffer.from(hash).toString('base64');
            console.log(base64Hash);
        ")
        echo "⚠️  临时密码已设置，请尽快修改！"
    fi
}

# 生成环境变量配置
generate_env_config() {
    echo "📝 生成环境变量配置..."

    # 生成 JWT 密钥（如果未提供）
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    fi



    cat > .env << EOF
# Docker 环境配置
NODE_ENV=production
PORT=${PORT:-3001}

# 管理员认证
ADMIN_PASSWORD_HASH_BASE64=$ADMIN_PASSWORD_HASH_BASE64
JWT_SECRET=$JWT_SECRET

# 公开访问地址（可选，也可在管理后台设置）
NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL:-}
EOF

    echo "✅ 环境变量配置已生成"
    echo "💡 MCP API Key 需要在管理后台创建"
}

# 检查并设置环境变量
if [ ! -f ".env" ] || ! grep -q "ADMIN_PASSWORD_HASH_BASE64" .env; then
    setup_admin_password
    generate_env_config
else
    echo "✅ 环境变量配置已存在"
fi

# 创建必要的目录
mkdir -p docs data logs

# 设置权限
chown -R nextjs:nodejs docs data logs 2>/dev/null || true

echo "🚀 启动应用服务器..."

# 启动 Next.js 应用
exec "$@"
