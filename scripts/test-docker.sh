#!/bin/bash

# Docker 配置测试脚本

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

echo "🐳 Docker 配置测试"
echo "=================="
echo ""

# 1. 检查 Docker 文件
log_info "检查 Docker 配置文件..."

files_to_check=(
    "Dockerfile"
    "docker-compose.yml"
    ".dockerignore"
    "healthcheck.js"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        log_success "✅ $file 存在"
    else
        log_error "❌ $file 不存在"
    fi
done

# 2. 检查脚本文件
log_info "检查 Docker 脚本..."

scripts_to_check=(
    "scripts/docker-deploy.sh"
    "scripts/docker-manage.sh"
)

for script in "${scripts_to_check[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            log_success "✅ $script 存在且可执行"
        else
            log_warning "⚠️  $script 存在但不可执行"
        fi
    else
        log_error "❌ $script 不存在"
    fi
done

# 3. 检查 package.json 命令
log_info "检查 package.json Docker 命令..."

docker_commands=(
    "docker:build"
    "docker:run"
    "docker:compose"
    "docker:deploy"
    "docker:manage"
    "docker:logs"
    "docker:stop"
    "docker:restart"
)

for cmd in "${docker_commands[@]}"; do
    if grep -q "\"$cmd\":" package.json; then
        log_success "✅ $cmd 命令已配置"
    else
        log_error "❌ $cmd 命令未配置"
    fi
done

# 4. 检查健康检查 API
log_info "检查健康检查 API..."

if [ -f "src/app/api/health/route.ts" ]; then
    log_success "✅ 健康检查 API 存在"
else
    log_error "❌ 健康检查 API 不存在"
fi

# 5. 检查 Next.js 配置
log_info "检查 Next.js Docker 配置..."

if grep -q "DOCKER_BUILD" next.config.js; then
    log_success "✅ Next.js Docker 配置已添加"
else
    log_warning "⚠️  Next.js Docker 配置可能缺失"
fi

# 6. 检查 Docker 环境
log_info "检查 Docker 环境..."

if command -v docker &> /dev/null; then
    log_success "✅ Docker 已安装"
    
    if docker info &> /dev/null; then
        log_success "✅ Docker daemon 正在运行"
        
        # 显示 Docker 版本
        docker_version=$(docker --version)
        log_info "Docker 版本: $docker_version"
        
    else
        log_warning "⚠️  Docker daemon 未运行"
        log_info "请启动 Docker Desktop 或 Docker 服务"
    fi
else
    log_warning "⚠️  Docker 未安装"
    log_info "请安装 Docker: https://docs.docker.com/get-docker/"
fi

if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    log_success "✅ Docker Compose 已安装"
else
    log_warning "⚠️  Docker Compose 未安装"
fi

echo ""
log_info "=== 测试总结 ==="

if [ -f "Dockerfile" ] && [ -f "docker-compose.yml" ] && [ -f "scripts/docker-deploy.sh" ]; then
    log_success "🎉 Docker 配置完整！"
    echo ""
    echo "📋 下一步："
    echo "1. 确保 Docker 正在运行"
    echo "2. 运行: pnpm docker:deploy"
    echo "3. 访问: http://localhost:3001"
else
    log_error "❌ Docker 配置不完整"
    echo ""
    echo "📋 需要修复的问题："
    echo "- 检查缺失的文件"
    echo "- 重新运行配置脚本"
fi
