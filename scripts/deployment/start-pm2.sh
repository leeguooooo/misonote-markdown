#!/bin/bash

# 文档平台 PM2 启动脚本
# 使用方法: ./start-pm2.sh [dev|prod]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查 PM2 是否安装
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        print_error "PM2 未安装，正在安装..."
        npm install -g pm2
        print_message "PM2 安装完成"
    else
        print_message "PM2 已安装: $(pm2 --version)"
    fi
}

# 检查依赖
check_dependencies() {
    print_step "检查项目依赖..."
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules 不存在，正在安装依赖..."
        npm install
    else
        print_message "依赖已安装"
    fi
}

# 构建项目
build_project() {
    print_step "构建项目..."
    npm run build
    print_message "项目构建完成"
}

# 创建日志目录
create_log_dir() {
    if [ ! -d "logs" ]; then
        mkdir -p logs
        print_message "创建日志目录: logs/"
    fi
}

# 停止现有的 PM2 进程
stop_existing() {
    print_step "停止现有的 PM2 进程..."
    pm2 stop docs-platform 2>/dev/null || true
    pm2 delete docs-platform 2>/dev/null || true
    print_message "已清理现有进程"
}

# 启动应用
start_app() {
    local env=${1:-production}
    
    print_step "启动应用 (环境: $env)..."
    
    if [ "$env" = "dev" ] || [ "$env" = "development" ]; then
        pm2 start ecosystem.config.js --env development
    else
        pm2 start ecosystem.config.js --env production
    fi
    
    print_message "应用启动成功"
}

# 显示状态
show_status() {
    print_step "应用状态:"
    pm2 status
    pm2 logs docs-platform --lines 10
}

# 主函数
main() {
    local env=${1:-production}
    
    print_message "=== 文档平台 PM2 启动脚本 ==="
    print_message "环境: $env"
    print_message "时间: $(date)"
    echo
    
    # 执行步骤
    check_pm2
    check_dependencies
    create_log_dir
    
    if [ "$env" != "dev" ] && [ "$env" != "development" ]; then
        build_project
    fi
    
    stop_existing
    start_app "$env"
    
    echo
    show_status
    
    echo
    print_message "=== 启动完成 ==="
    print_message "应用地址: http://localhost:3001"
    print_message "PM2 监控: pm2 monit"
    print_message "查看日志: pm2 logs docs-platform"
    print_message "停止应用: pm2 stop docs-platform"
    print_message "重启应用: pm2 restart docs-platform"
}

# 帮助信息
show_help() {
    echo "文档平台 PM2 启动脚本"
    echo
    echo "使用方法:"
    echo "  ./start-pm2.sh [环境]"
    echo
    echo "环境选项:"
    echo "  prod, production  - 生产环境 (默认)"
    echo "  dev, development  - 开发环境"
    echo
    echo "示例:"
    echo "  ./start-pm2.sh          # 生产环境启动"
    echo "  ./start-pm2.sh prod     # 生产环境启动"
    echo "  ./start-pm2.sh dev      # 开发环境启动"
    echo
    echo "常用 PM2 命令:"
    echo "  pm2 status              # 查看状态"
    echo "  pm2 logs docs-platform  # 查看日志"
    echo "  pm2 monit               # 监控界面"
    echo "  pm2 restart docs-platform # 重启应用"
    echo "  pm2 stop docs-platform  # 停止应用"
    echo "  pm2 delete docs-platform # 删除应用"
}

# 检查参数
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# 执行主函数
main "$1"
