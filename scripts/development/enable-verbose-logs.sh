#!/bin/bash

# 启用详细日志输出的脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

echo "📋 启用详细日志输出"
echo "=================="
echo ""

# 1. 备份当前配置
if [ -f "ecosystem.config.js" ]; then
    log_info "备份当前 PM2 配置..."
    cp ecosystem.config.js ecosystem.config.js.backup.$(date +%Y%m%d_%H%M%S)
    log_success "配置已备份"
fi

# 2. 创建高日志输出配置
log_info "创建高日志输出配置..."

cat > ecosystem.config.js << 'EOF'
// 高日志输出版本的 PM2 配置
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
      
      // 详细的日志配置
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',
      merge_logs: true,
      
      // 默认环境 - 开发模式以获得更多日志
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
        JWT_SECRET: process.env.JWT_SECRET,
        
        // 启用详细日志
        DEBUG: '*',
        VERBOSE: 'true',
        LOG_LEVEL: 'debug',
        NEXT_DEBUG: '1',
        FORCE_COLOR: '1',
        NODE_OPTIONS: '--trace-warnings --trace-deprecation'
      },
      
      // 开发环境配置（最详细的日志）
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
        JWT_SECRET: process.env.JWT_SECRET,
        
        // 最详细的调试配置
        DEBUG: '*',
        VERBOSE: 'true',
        LOG_LEVEL: 'debug',
        NEXT_DEBUG: '1',
        FORCE_COLOR: '1',
        NODE_OPTIONS: '--trace-warnings --trace-deprecation --trace-uncaught'
      },
      
      // 生产环境配置（适度的日志）
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
        JWT_SECRET: process.env.JWT_SECRET,
        
        // 生产环境也启用一些日志
        LOG_LEVEL: 'info',
        VERBOSE: 'true',
        DEBUG: 'app:*'
      }
    }
  ]
};
EOF

log_success "高日志配置已创建"

# 3. 停止当前应用
log_info "停止当前应用..."
pm2 stop docs-platform 2>/dev/null || true
pm2 delete docs-platform 2>/dev/null || true

# 4. 清空日志
log_info "清空旧日志..."
pm2 flush 2>/dev/null || true
rm -f ./logs/*.log 2>/dev/null || true

# 5. 启动应用（开发模式）
log_info "启动应用（开发模式 - 最详细日志）..."
pm2 start ecosystem.config.js --env development

# 6. 等待启动
log_info "等待应用启动..."
sleep 5

# 7. 显示状态
log_info "应用状态:"
pm2 status

# 8. 显示日志
echo ""
log_success "=== 详细日志已启用 ==="
echo ""
log_info "查看日志的方法:"
echo "1. 实时日志: pm2 logs docs-platform"
echo "2. 最近日志: pm2 logs docs-platform --lines 50"
echo "3. 错误日志: pm2 logs docs-platform --err"
echo "4. 输出日志: pm2 logs docs-platform --out"
echo "5. 监控模式: pm2 monit"
echo ""

log_info "启用的调试选项:"
echo "- DEBUG=* (所有调试日志)"
echo "- VERBOSE=true (详细模式)"
echo "- LOG_LEVEL=debug (调试级别)"
echo "- NEXT_DEBUG=1 (Next.js 调试)"
echo "- NODE_OPTIONS=--trace-warnings (Node.js 警告追踪)"
echo ""

log_warning "注意: 详细日志会产生大量输出，可能影响性能"
echo ""

# 9. 显示最近的日志
log_info "显示最近的日志:"
pm2 logs docs-platform --lines 20

echo ""
log_info "要查看实时日志，请运行: pm2 logs docs-platform"
