#!/bin/bash

# Docker 一键部署脚本

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

echo "🐳 Markdown Preview - Docker 一键部署"
echo "====================================="
echo ""

# 1. 检查 Docker
log_info "检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    log_error "Docker 未安装，请先安装 Docker"
    echo "安装指南: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose 未安装，请先安装 Docker Compose"
    echo "安装指南: https://docs.docker.com/compose/install/"
    exit 1
fi

log_success "Docker 环境检查通过"

# 2. 检查项目目录
log_info "检查项目目录..."
if [ ! -f "package.json" ]; then
    log_error "未找到 package.json，请在项目根目录运行此脚本"
    exit 1
fi

if [ ! -f "Dockerfile" ]; then
    log_error "未找到 Dockerfile"
    exit 1
fi

log_success "项目目录检查通过"

# 3. 创建必要的目录
log_info "创建必要的目录..."
mkdir -p docs data logs
log_success "目录创建完成"

# 4. 检查环境变量
log_info "检查环境变量配置..."
if [ ! -f ".env" ]; then
    log_warning ".env 文件不存在，将创建默认配置"
    cat > .env << EOF
# Docker 环境配置
NODE_ENV=production
PORT=3001

# 管理员密码将在首次启动时设置
# 请在容器启动后运行: docker exec -it markdown-preview node scripts/generate-password.js
EOF
    log_success "默认 .env 文件已创建"
else
    log_success "环境变量配置存在"
fi

# 5. 停止现有容器
log_info "停止现有容器..."
docker-compose down 2>/dev/null || true
log_success "现有容器已停止"

# 6. 构建镜像
log_info "构建 Docker 镜像..."
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    log_success "Docker 镜像构建成功"
else
    log_error "Docker 镜像构建失败"
    exit 1
fi

# 7. 启动容器
log_info "启动容器..."
docker-compose up -d

if [ $? -eq 0 ]; then
    log_success "容器启动成功"
else
    log_error "容器启动失败"
    exit 1
fi

# 8. 等待服务启动
log_info "等待服务启动..."
sleep 10

# 9. 检查服务状态
log_info "检查服务状态..."
if curl -f http://localhost:3001/api/health &> /dev/null; then
    log_success "服务健康检查通过"
else
    log_warning "服务可能还在启动中，请稍后检查"
fi

# 10. 显示部署信息
echo ""
log_success "=== 部署完成 ==="
echo ""
echo "📱 应用地址: http://localhost:3001"
echo "🔧 管理后台: http://localhost:3001/admin"
echo ""
echo "🐳 Docker 管理命令:"
echo "  查看状态: docker-compose ps"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo ""
echo "🔐 设置管理员密码:"
echo "  docker exec -it markdown-preview node scripts/generate-password.js"
echo ""

# 11. 询问是否设置密码
read -p "是否现在设置管理员密码? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "设置管理员密码..."
    docker exec -it markdown-preview node scripts/generate-password.js
    
    if [ $? -eq 0 ]; then
        log_success "密码设置完成"
        log_info "重启容器以应用配置..."
        docker-compose restart
        sleep 5
        log_success "容器重启完成"
    else
        log_warning "密码设置失败，请手动运行上述命令"
    fi
else
    log_info "请稍后手动设置管理员密码"
fi

echo ""
log_success "🎉 Docker 部署完成！访问 http://localhost:3001 开始使用"
