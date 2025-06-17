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
        echo "❌ 无法启动：需要设置管理员密码"
        exit 1
    else
        echo "✅ 使用默认管理员密码配置 (admin123)"
        echo "⚠️  生产环境请及时修改默认密码！"
    fi
}

# 处理许可证配置
setup_license_config() {
    echo "🔐 配置许可证设置..."

    # 设置许可证服务器URL（如果未设置）
    if [ -z "$MISONOTE_LICENSE_SERVER_URL" ]; then
        MISONOTE_LICENSE_SERVER_URL="https://license-api.misonote.com"
        echo "📡 使用默认许可证服务器: $MISONOTE_LICENSE_SERVER_URL"
    else
        echo "📡 使用自定义许可证服务器: $MISONOTE_LICENSE_SERVER_URL"
    fi

    # 检查是否提供了许可证密钥
    if [ -n "$MISONOTE_LICENSE_KEY" ]; then
        echo "🔑 检测到许可证密钥，将在启动后自动验证"
        # 将许可证密钥写入临时文件，供应用启动时读取
        echo "$MISONOTE_LICENSE_KEY" > /tmp/license.key
        echo "✅ 许可证密钥已保存"
    else
        echo "ℹ️  未提供许可证密钥，将以社区版模式启动"
        echo "   如需升级到专业版或企业版，请："
        echo "   1. 联系 sales@misonote.com 购买许可证"
        echo "   2. 重新启动容器并设置 MISONOTE_LICENSE_KEY 环境变量"
        echo "   3. 或在Web界面中手动输入许可证密钥"
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

# 许可证配置
MISONOTE_LICENSE_SERVER_URL=${MISONOTE_LICENSE_SERVER_URL:-https://license-api.misonote.com}

# 公开访问地址（可选，也可在管理后台设置）
NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL:-}
EOF

    echo "✅ 环境变量配置已生成"
    echo "💡 MCP API Key 需要在管理后台创建"
}

# 检查并设置环境变量
if [ ! -f ".env" ] || ! grep -q "ADMIN_PASSWORD_HASH_BASE64" .env; then
    setup_admin_password
    setup_license_config
    generate_env_config
else
    echo "✅ 环境变量配置已存在"
    # 即使配置存在，也要处理许可证设置
    setup_license_config
fi

# 创建必要的目录
mkdir -p docs data logs

# 设置权限
chown -R nextjs:nodejs docs data logs 2>/dev/null || true

echo "🚀 启动应用服务器..."

# 启动 Next.js 应用
exec "$@"
