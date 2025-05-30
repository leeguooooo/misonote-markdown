#!/bin/bash

# Docker 管理脚本

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

show_help() {
    echo "🐳 Docker 管理脚本"
    echo "=================="
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "可用命令:"
    echo "  start     启动容器"
    echo "  stop      停止容器"
    echo "  restart   重启容器"
    echo "  status    查看状态"
    echo "  logs      查看日志"
    echo "  shell     进入容器"
    echo "  update    更新并重新部署"
    echo "  clean     清理容器和镜像"
    echo "  backup    备份数据"
    echo "  restore   恢复数据"
    echo "  password  设置管理员密码"
    echo "  help      显示帮助"
    echo ""
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
}

case "${1:-help}" in
    "start")
        log_info "启动容器..."
        docker-compose up -d
        log_success "容器已启动"
        ;;
        
    "stop")
        log_info "停止容器..."
        docker-compose down
        log_success "容器已停止"
        ;;
        
    "restart")
        log_info "重启容器..."
        docker-compose restart
        log_success "容器已重启"
        ;;
        
    "status")
        log_info "容器状态:"
        docker-compose ps
        echo ""
        log_info "服务健康状态:"
        curl -s http://localhost:3001/api/health | jq . 2>/dev/null || echo "服务未响应"
        ;;
        
    "logs")
        log_info "查看日志 (Ctrl+C 退出):"
        docker-compose logs -f
        ;;
        
    "shell")
        log_info "进入容器..."
        docker exec -it markdown-preview /bin/bash
        ;;
        
    "update")
        log_info "更新并重新部署..."
        git pull
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        log_success "更新完成"
        ;;
        
    "clean")
        log_warning "这将删除所有容器和镜像"
        read -p "确认继续? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down
            docker system prune -f
            log_success "清理完成"
        else
            log_info "取消清理"
        fi
        ;;
        
    "backup")
        log_info "备份数据..."
        BACKUP_DIR="backup/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp -r docs data .env "$BACKUP_DIR/" 2>/dev/null || true
        tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"
        rm -rf "$BACKUP_DIR"
        log_success "备份完成: ${BACKUP_DIR}.tar.gz"
        ;;
        
    "restore")
        if [ -z "$2" ]; then
            log_error "请指定备份文件: $0 restore backup.tar.gz"
            exit 1
        fi
        log_info "恢复数据..."
        tar -xzf "$2"
        RESTORE_DIR=$(basename "$2" .tar.gz)
        cp -r "$RESTORE_DIR"/* ./ 2>/dev/null || true
        rm -rf "$RESTORE_DIR"
        docker-compose restart
        log_success "数据恢复完成"
        ;;
        
    "password")
        log_info "设置管理员密码..."
        docker exec -it markdown-preview node scripts/generate-password.js
        docker-compose restart
        log_success "密码设置完成"
        ;;
        
    "help"|*)
        show_help
        ;;
esac
