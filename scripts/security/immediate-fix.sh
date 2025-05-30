#!/bin/bash

# 立即修复环境变量问题的脚本

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

echo "🚀 立即修复环境变量问题"
echo "======================"
echo ""

# 1. 检查当前状态
log_info "检查当前应用状态..."
pm2 status

# 2. 检查 .env 文件
log_info "检查 .env 文件..."
if [ -f ".env" ]; then
    log_success ".env 文件存在"
    echo "内容预览:"
    head -3 .env
else
    log_error ".env 文件不存在"
    exit 1
fi

# 3. 安装 dotenv
log_info "确保 dotenv 已安装..."
pnpm add dotenv
log_success "dotenv 安装完成"

# 4. 停止当前应用
log_info "停止当前应用..."
pm2 stop docs-platform 2>/dev/null || true
pm2 delete docs-platform 2>/dev/null || true
log_success "应用已停止"

# 5. 读取 .env 文件并导出环境变量
log_info "读取环境变量..."
if [ -f ".env" ]; then
    # 安全地读取并导出环境变量
    set -a  # 自动导出所有变量
    source .env
    set +a  # 停止自动导出

    log_success "环境变量已加载"
    echo "ADMIN_PASSWORD_HASH: ${ADMIN_PASSWORD_HASH:0:20}..."
    echo "JWT_SECRET: ${JWT_SECRET:0:20}..."
fi

# 6. 创建新的 ecosystem.config.js
log_info "创建新的 PM2 配置..."

# 转义特殊字符，防止截断
ESCAPED_HASH=$(echo "$ADMIN_PASSWORD_HASH" | sed 's/\$/\\$/g')
ESCAPED_JWT=$(echo "$JWT_SECRET" | sed 's/\$/\\$/g')

cat > ecosystem.config.js << EOF
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
        NODE_ENV: '${NODE_ENV:-production}',
        PORT: '${PORT:-3001}',
        ADMIN_PASSWORD_HASH: '${ESCAPED_HASH}',
        JWT_SECRET: '${ESCAPED_JWT}',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: '${PORT:-3001}',
        ADMIN_PASSWORD_HASH: '${ESCAPED_HASH}',
        JWT_SECRET: '${ESCAPED_JWT}',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
EOF

log_success "PM2 配置已更新"

# 7. 启动应用
log_info "启动应用..."
pm2 start ecosystem.config.js --env production

# 8. 等待启动
log_info "等待应用启动..."
sleep 5

# 9. 检查状态
log_info "检查应用状态..."
pm2 status

# 10. 显示日志
log_info "显示最新日志..."
pm2 logs docs-platform --lines 20

echo ""
log_success "=== 修复完成 ==="
echo ""
log_info "请尝试登录:"
echo "  地址: http://localhost:3001"
echo "  用户名: admin"
echo "  密码: xiaoli123"
echo ""
log_warning "如果仍然无法登录，请运行:"
echo "  pm2 logs docs-platform --lines 50"
