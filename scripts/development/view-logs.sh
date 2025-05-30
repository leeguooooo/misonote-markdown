#!/bin/bash

# PM2 日志查看脚本

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

echo "📋 PM2 日志查看工具"
echo "=================="
echo ""

# 检查 PM2 应用状态
log_info "检查应用状态..."
pm2 status | grep docs-platform

echo ""
echo "请选择查看方式:"
echo "1. 实时日志 (pm2 logs)"
echo "2. 最近50行日志"
echo "3. 最近100行日志"
echo "4. 只看错误日志"
echo "5. 只看输出日志"
echo "6. 查看日志文件"
echo "7. 清空日志"
echo "8. 监控模式"
echo "9. 应用详情"
echo ""

read -p "请输入选项 (1-9): " choice

case $choice in
    1)
        log_info "显示实时日志 (按 Ctrl+C 退出)..."
        pm2 logs docs-platform
        ;;
    2)
        log_info "显示最近50行日志..."
        pm2 logs docs-platform --lines 50
        ;;
    3)
        log_info "显示最近100行日志..."
        pm2 logs docs-platform --lines 100
        ;;
    4)
        log_info "显示错误日志..."
        pm2 logs docs-platform --err --lines 50
        ;;
    5)
        log_info "显示输出日志..."
        pm2 logs docs-platform --out --lines 50
        ;;
    6)
        echo ""
        log_info "日志文件位置:"
        echo "输出日志: ./logs/out.log"
        echo "错误日志: ./logs/err.log"
        echo "合并日志: ./logs/combined.log"
        echo ""
        echo "选择要查看的日志文件:"
        echo "a. 输出日志"
        echo "b. 错误日志"
        echo "c. 合并日志"
        echo ""
        read -p "请选择 (a/b/c): " file_choice
        
        case $file_choice in
            a)
                if [ -f "./logs/out.log" ]; then
                    log_info "查看输出日志文件..."
                    tail -50 ./logs/out.log
                else
                    log_error "输出日志文件不存在"
                fi
                ;;
            b)
                if [ -f "./logs/err.log" ]; then
                    log_info "查看错误日志文件..."
                    tail -50 ./logs/err.log
                else
                    log_error "错误日志文件不存在"
                fi
                ;;
            c)
                if [ -f "./logs/combined.log" ]; then
                    log_info "查看合并日志文件..."
                    tail -50 ./logs/combined.log
                else
                    log_error "合并日志文件不存在"
                fi
                ;;
            *)
                log_error "无效选择"
                ;;
        esac
        ;;
    7)
        log_warning "清空日志..."
        pm2 flush docs-platform
        log_success "日志已清空"
        ;;
    8)
        log_info "启动监控模式 (按 q 退出)..."
        pm2 monit
        ;;
    9)
        log_info "显示应用详情..."
        pm2 show docs-platform
        ;;
    *)
        log_error "无效选项"
        ;;
esac

echo ""
log_info "常用命令:"
echo "实时日志: pm2 logs docs-platform"
echo "最近日志: pm2 logs docs-platform --lines 50"
echo "清空日志: pm2 flush docs-platform"
echo "应用状态: pm2 status"
echo "重启应用: pm2 restart docs-platform"
