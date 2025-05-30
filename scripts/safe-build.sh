#!/bin/bash

# 安全构建脚本 - 确保环境变量正确设置后再构建

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

echo "🏗️  安全构建脚本"
echo "================"
echo ""

# 1. 检查当前目录
log_info "检查当前目录..."
if [ ! -f "package.json" ]; then
    log_error "未找到 package.json，请在项目根目录运行此脚本"
    exit 1
fi

log_success "项目目录检查通过"

# 2. 检查依赖
log_info "检查依赖..."
if ! command -v pnpm &> /dev/null; then
    log_error "pnpm 未安装"
    exit 1
fi

log_success "依赖检查通过"

# 3. 运行构建前检查
log_info "运行构建前环境变量检查..."
if ! node scripts/pre-build-check.js; then
    log_error "构建前检查失败"
    exit 1
fi

log_success "构建前检查通过"

# 4. 清理旧的构建文件
log_info "清理旧的构建文件..."
rm -rf .next
log_success "构建文件清理完成"

# 5. 安装依赖
log_info "安装/更新依赖..."
pnpm install
log_success "依赖安装完成"

# 6. 执行构建
log_info "开始构建应用..."
pnpm build

if [ $? -eq 0 ]; then
    log_success "应用构建成功"
else
    log_error "应用构建失败"
    exit 1
fi

# 7. 验证构建结果
log_info "验证构建结果..."
if [ -d ".next" ]; then
    log_success "构建输出目录存在"
else
    log_error "构建输出目录不存在"
    exit 1
fi

# 8. 显示构建信息
echo ""
log_success "=== 构建完成 ==="
echo ""
echo "📁 构建输出: .next/"
echo "🚀 启动命令: pnpm start"
echo "🔧 PM2 启动: pnpm pm2:start"
echo ""

# 9. 询问是否立即启动
read -p "是否立即启动应用? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "启动应用..."
    
    # 停止现有应用
    pnpm pm2:stop 2>/dev/null || true
    pnpm pm2:delete 2>/dev/null || true
    
    # 启动新应用
    pnpm pm2:start
    
    # 显示状态
    sleep 3
    pnpm pm2:status
    
    echo ""
    log_success "应用已启动"
    log_info "查看日志: pnpm pm2:logs"
    log_info "验证密码: pnpm security:verify"
else
    log_info "构建完成，可以手动启动应用"
fi
