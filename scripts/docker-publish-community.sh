#!/bin/bash

# 社区版 Docker 镜像发布脚本
# 只发布社区版，不包含任何企业版代码

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

echo "🚀 社区版 Docker 镜像发布"
echo "=========================="
echo ""

# 检查必要的环境变量
if [ -z "$DOCKER_USERNAME" ]; then
    log_error "DOCKER_USERNAME 环境变量未设置"
    exit 1
fi

if [ -z "$DOCKER_PASSWORD" ]; then
    log_error "DOCKER_PASSWORD 环境变量未设置"
    exit 1
fi

# 设置镜像信息
IMAGE_NAME="misonote-markdown"
REGISTRY="docker.io"
FULL_IMAGE_NAME="$REGISTRY/$DOCKER_USERNAME/$IMAGE_NAME"

# 获取版本信息
VERSION=$(node -p "require('./package.json').version")
GIT_COMMIT=$(git rev-parse --short HEAD)
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

log_info "版本信息:"
log_info "  版本: $VERSION"
log_info "  提交: $GIT_COMMIT"
log_info "  构建时间: $BUILD_DATE"
echo ""

# 🚨 SECURITY: 验证企业版代码已被排除
log_info "🔒 安全检查: 验证企业版代码已被排除..."

if [ -d "enterprise" ]; then
    log_warning "检测到 enterprise/ 目录，将在构建时排除"
fi

if [ -d "misonote-license-server" ]; then
    log_warning "检测到 misonote-license-server/ 目录，将在构建时排除"
fi

# 检查 .dockerignore 是否正确配置
if ! grep -q "enterprise/" .dockerignore; then
    log_error ".dockerignore 未正确配置，企业版代码可能被包含！"
    exit 1
fi

log_success "安全检查通过"
echo ""

# 登录 Docker Hub
log_info "登录 Docker Hub..."
echo "$DOCKER_PASSWORD" | docker login "$REGISTRY" -u "$DOCKER_USERNAME" --password-stdin

# 构建社区版镜像
log_info "构建社区版镜像..."
docker build \
    -f Dockerfile.community \
    -t "$FULL_IMAGE_NAME:community-$VERSION" \
    -t "$FULL_IMAGE_NAME:community-latest" \
    -t "$FULL_IMAGE_NAME:latest" \
    --build-arg VERSION="$VERSION" \
    --build-arg GIT_COMMIT="$GIT_COMMIT" \
    --build-arg BUILD_DATE="$BUILD_DATE" \
    .

log_success "镜像构建完成"

# 🔒 SECURITY: 验证镜像内容
log_info "🔒 安全验证: 检查镜像内容..."

# 创建临时容器检查内容
TEMP_CONTAINER=$(docker create "$FULL_IMAGE_NAME:community-$VERSION")

# 检查是否包含企业版目录
if docker exec "$TEMP_CONTAINER" test -d "/app/enterprise" 2>/dev/null; then
    log_error "🚨 安全警告: 镜像包含企业版目录！"
    docker rm "$TEMP_CONTAINER"
    exit 1
fi

if docker exec "$TEMP_CONTAINER" test -d "/app/misonote-license-server" 2>/dev/null; then
    log_error "🚨 安全警告: 镜像包含许可证服务器代码！"
    docker rm "$TEMP_CONTAINER"
    exit 1
fi

# 清理临时容器
docker rm "$TEMP_CONTAINER"

log_success "镜像内容验证通过"

# 推送镜像
log_info "推送社区版镜像到 Docker Hub..."

docker push "$FULL_IMAGE_NAME:community-$VERSION"
docker push "$FULL_IMAGE_NAME:community-latest"
docker push "$FULL_IMAGE_NAME:latest"

log_success "镜像推送完成"

# 显示发布信息
echo ""
log_success "🎉 社区版镜像发布成功！"
echo ""
log_info "可用的镜像标签:"
log_info "  $FULL_IMAGE_NAME:latest"
log_info "  $FULL_IMAGE_NAME:community-latest"
log_info "  $FULL_IMAGE_NAME:community-$VERSION"
echo ""
log_info "使用方法:"
log_info "  docker run -p 3001:3001 $FULL_IMAGE_NAME:latest"
echo ""
log_info "Docker Compose:"
log_info "  image: $FULL_IMAGE_NAME:latest"
echo ""

# 清理本地镜像（可选）
read -p "是否清理本地构建的镜像? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "清理本地镜像..."
    docker rmi "$FULL_IMAGE_NAME:community-$VERSION" || true
    docker rmi "$FULL_IMAGE_NAME:community-latest" || true
    log_success "本地镜像已清理"
fi

log_success "社区版发布流程完成！"
