#!/bin/bash

# 修复环境变量截断问题的脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔧 修复环境变量截断问题"
echo "======================="
echo ""

# 1. 检查 .env 文件
if [ ! -f ".env" ]; then
    log_error ".env 文件不存在"
    exit 1
fi

log_info "读取 .env 文件..."

# 安全地读取环境变量，避免 shell 变量展开
ADMIN_PASSWORD_HASH=$(grep "^ADMIN_PASSWORD_HASH=" .env | cut -d'=' -f2)
JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2)
NODE_ENV=$(grep "^NODE_ENV=" .env | cut -d'=' -f2 || echo "production")
PORT=$(grep "^PORT=" .env | cut -d'=' -f2 || echo "3001")

log_success "环境变量读取完成"
echo "ADMIN_PASSWORD_HASH 长度: ${#ADMIN_PASSWORD_HASH}"
echo "ADMIN_PASSWORD_HASH 前缀: ${ADMIN_PASSWORD_HASH:0:10}"
echo "JWT_SECRET 长度: ${#JWT_SECRET}"

# 2. 验证哈希值完整性
if [ ${#ADMIN_PASSWORD_HASH} -ne 60 ]; then
    log_error "ADMIN_PASSWORD_HASH 长度不正确，应该是60个字符，实际是${#ADMIN_PASSWORD_HASH}个字符"
    exit 1
fi

if [[ ! "$ADMIN_PASSWORD_HASH" =~ ^\$2b\$12\$ ]]; then
    log_error "ADMIN_PASSWORD_HASH 格式不正确，应该以 \$2b\$12\$ 开头"
    exit 1
fi

log_success "密码哈希验证通过"

# 3. 停止应用
log_info "停止当前应用..."
pm2 stop docs-platform 2>/dev/null || true
pm2 delete docs-platform 2>/dev/null || true

# 4. 创建新的 ecosystem.config.js，使用安全的方法
log_info "创建新的 PM2 配置..."

# 使用 Node.js 来生成配置文件，避免 shell 变量展开问题
node << EOF
const fs = require('fs');

const config = {
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
        NODE_ENV: '${NODE_ENV}',
        PORT: ${PORT},
        ADMIN_PASSWORD_HASH: '${ADMIN_PASSWORD_HASH}',
        JWT_SECRET: '${JWT_SECRET}',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: ${PORT},
        ADMIN_PASSWORD_HASH: '${ADMIN_PASSWORD_HASH}',
        JWT_SECRET: '${JWT_SECRET}',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};

const configContent = 'module.exports = ' + JSON.stringify(config, null, 2) + ';';
fs.writeFileSync('ecosystem.config.js', configContent);
console.log('✅ PM2 配置文件已生成');
EOF

log_success "PM2 配置已更新"

# 5. 验证生成的配置
log_info "验证生成的配置..."
if grep -q "$ADMIN_PASSWORD_HASH" ecosystem.config.js; then
    log_success "密码哈希在配置文件中完整存在"
else
    log_error "密码哈希在配置文件中不完整"
    exit 1
fi

# 6. 启动应用
log_info "启动应用..."
pm2 start ecosystem.config.js --env production

# 7. 等待启动
log_info "等待应用启动..."
sleep 8

# 8. 检查状态
log_info "检查应用状态..."
pm2 status

# 9. 测试登录
log_info "测试登录..."
echo "测试密码: xiaoli123"

response=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"xiaoli123"}')

echo "API 响应: $response"

if echo "$response" | grep -q '"success":true'; then
    echo ""
    log_success "🎉 修复成功！"
    echo "现在你可以使用以下凭据登录:"
    echo "  地址: http://localhost:3001"
    echo "  用户名: admin"
    echo "  密码: xiaoli123"
elif echo "$response" | grep -q '"error"'; then
    echo ""
    log_error "登录仍然失败"
    error_msg=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo "错误信息: $error_msg"
    
    echo ""
    log_info "显示应用日志进行调试..."
    pm2 logs docs-platform --lines 20
else
    echo ""
    log_warning "未知响应格式"
    echo "完整响应: $response"
fi
