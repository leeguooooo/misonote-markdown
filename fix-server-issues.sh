#!/bin/bash

# 修复服务器上的问题

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

echo "🔧 修复服务器问题"
echo "================"
echo ""

# 1. 检查当前状态
log_info "检查当前状态..."
echo "当前目录: $(pwd)"
echo ".env 文件存在: $([ -f .env ] && echo '是' || echo '否')"
echo "ecosystem.config.js 存在: $([ -f ecosystem.config.js ] && echo '是' || echo '否')"

# 2. 读取 .env 文件中的密钥
if [ -f ".env" ]; then
    log_info "读取 .env 文件中的密钥..."
    NEW_HASH=$(grep "^ADMIN_PASSWORD_HASH=" .env | cut -d'=' -f2)
    NEW_JWT=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2)
    
    echo "新的密码哈希: ${NEW_HASH:0:20}..."
    echo "新的JWT密钥: ${NEW_JWT:0:20}..."
    
    if [ -z "$NEW_HASH" ] || [ -z "$NEW_JWT" ]; then
        log_error "无法从 .env 文件读取密钥"
        exit 1
    fi
else
    log_error ".env 文件不存在"
    exit 1
fi

# 3. 更新 ecosystem.config.js
log_info "更新 ecosystem.config.js..."

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
        NODE_ENV: 'production',
        PORT: 3001,
        ADMIN_PASSWORD_HASH: '${NEW_HASH}',
        JWT_SECRET: '${NEW_JWT}',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        ADMIN_PASSWORD_HASH: '${NEW_HASH}',
        JWT_SECRET: '${NEW_JWT}',
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

# 4. 修复快速启动脚本路径（如果存在）
if [ -f "scripts/quick-start.sh" ]; then
    log_info "修复快速启动脚本路径..."
    
    # 备份原文件
    cp scripts/quick-start.sh scripts/quick-start.sh.backup
    
    # 修复路径
    sed -i 's|deployment/pm2-start.js|scripts/deployment/pm2-start.js|g' scripts/quick-start.sh
    sed -i 's|security/|scripts/security/|g' scripts/quick-start.sh
    sed -i 's|development/|scripts/development/|g' scripts/quick-start.sh
    
    log_success "快速启动脚本路径已修复"
else
    log_warning "scripts/quick-start.sh 不存在，跳过路径修复"
fi

# 5. 重启 PM2 应用
log_info "重启 PM2 应用..."
pm2 restart docs-platform --update-env

# 6. 等待启动
log_info "等待应用启动..."
sleep 5

# 7. 验证修复
log_info "验证修复结果..."

# 检查应用状态
pm2 status | grep docs-platform

# 测试登录（需要知道密码）
echo ""
log_info "测试登录功能..."
echo "请手动测试登录："
echo "1. 访问 http://localhost:3001"
echo "2. 使用用户名: admin"
echo "3. 使用你刚才设置的密码"

# 8. 显示配置摘要
echo ""
log_success "=== 修复完成 ==="
echo ""
echo "📋 配置摘要:"
echo "- .env 文件: ✅ 包含新密钥"
echo "- ecosystem.config.js: ✅ 已同步更新"
echo "- PM2 应用: ✅ 已重启"
echo "- 快速启动脚本: $([ -f scripts/quick-start.sh ] && echo '✅ 路径已修复' || echo '⚠️ 不存在')"
echo ""
echo "🔍 验证步骤:"
echo "1. pm2 logs docs-platform --lines 20"
echo "2. curl -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{\"password\":\"your-password\"}'"
echo "3. 访问 http://localhost:3001 测试登录"

echo ""
log_warning "请确保使用正确的密码进行测试！"
