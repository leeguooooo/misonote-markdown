#!/bin/bash

# 快速修复环境变量加载问题
# 解决 PM2 不读取 .env 文件的问题

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

echo "🔧 环境变量加载修复脚本"
echo "========================"
echo ""

# 检查 .env 文件
if [ ! -f ".env" ]; then
    log_error ".env 文件不存在"
    exit 1
fi

log_info "检查当前 .env 文件内容..."
cat .env
echo ""

# 读取 .env 文件中的变量
log_info "读取环境变量..."

# 安全地读取环境变量
if [ -f ".env" ]; then
    # 导出环境变量
    export $(grep -v '^#' .env | xargs)
    log_success "环境变量已加载"
else
    log_error ".env 文件不存在"
    exit 1
fi

# 验证关键变量
if [ -z "$ADMIN_PASSWORD_HASH" ]; then
    log_error "ADMIN_PASSWORD_HASH 未设置"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    log_error "JWT_SECRET 未设置"
    exit 1
fi

log_success "关键环境变量验证通过"
echo "ADMIN_PASSWORD_HASH: ${ADMIN_PASSWORD_HASH:0:20}..."
echo "JWT_SECRET: ${JWT_SECRET:0:20}..."
echo ""

# 检查 dotenv 是否安装
log_info "检查 dotenv 依赖..."
if ! npm list dotenv > /dev/null 2>&1; then
    log_warning "dotenv 未安装，正在安装..."
    npm install dotenv
    log_success "dotenv 安装完成"
else
    log_success "dotenv 已安装"
fi

# 备份当前 ecosystem.config.js
if [ -f "ecosystem.config.js" ]; then
    cp ecosystem.config.js ecosystem.config.js.backup.$(date +%Y%m%d_%H%M%S)
    log_success "已备份 ecosystem.config.js"
fi

# 创建新的 ecosystem.config.js
log_info "更新 ecosystem.config.js..."

cat > ecosystem.config.js << 'EOF'
// 加载 .env 文件
require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'docs-platform',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // 从 .env 文件读取环境变量
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
        JWT_SECRET: process.env.JWT_SECRET,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        // 从 .env 文件读取环境变量
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
        JWT_SECRET: process.env.JWT_SECRET,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        // 从 .env 文件读取环境变量
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

log_success "ecosystem.config.js 已更新"

# 重启 PM2 应用
log_info "重启 PM2 应用..."

# 停止现有应用
pm2 stop docs-platform 2>/dev/null || true
pm2 delete docs-platform 2>/dev/null || true

# 启动应用
pm2 start ecosystem.config.js --env production

log_success "应用重启完成"

# 等待应用启动
log_info "等待应用启动..."
sleep 3

# 显示状态
log_info "应用状态:"
pm2 status

echo ""
log_info "最近日志:"
pm2 logs docs-platform --lines 15

echo ""
log_success "=== 修复完成 ==="
log_info "请检查日志中是否显示:"
log_info "🔍 环境变量调试信息:"
log_info "ADMIN_PASSWORD_HASH: 已设置"
echo ""
log_warning "如果仍然显示未设置，请查看完整日志:"
echo "pm2 logs docs-platform --lines 50"
