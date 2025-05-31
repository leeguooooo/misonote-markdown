#!/bin/bash

# Docker 发布前检查脚本
# 确保所有必要的条件都满足

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

# 检查 Docker 环境
check_docker() {
    log_info "检查 Docker 环境..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        return 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker 守护进程未运行"
        return 1
    fi

    if ! docker buildx version &> /dev/null; then
        log_error "Docker Buildx 未安装"
        return 1
    fi

    log_success "Docker 环境检查通过"
}

# 检查 Docker Hub 登录状态
check_docker_login() {
    log_info "docker info 输出如下："
    docker info 2>/dev/null | tee /tmp/docker-info.log | grep -E "Username|Registry" || echo "(无 Username 或 Registry 字段)"

    log_info "检查 Docker Hub 登录状态..."

    local username=""
    if docker info 2>/dev/null | grep -q "Username:"; then
        username=$(docker info 2>/dev/null | grep "Username:" | awk '{print $2}')
        log_success "已登录 Docker Hub，用户名: $username"
    elif grep -q "index.docker.io" ~/.docker/config.json 2>/dev/null; then
        log_warning "未检测到 CLI 登录，但 config.json 中存在 Docker Hub 凭据，可能已通过 GUI 登录"
    else
        log_error "未登录 Docker Hub，请运行: docker login"
        return 1
    fi

    # 检查环境变量
    if [ -z "$DOCKER_USERNAME" ] && [ -n "$username" ]; then
        log_warning "DOCKER_USERNAME 环境变量未设置，将使用登录用户名: $username"
        export DOCKER_USERNAME="$username"
    fi
}

# 检查项目状态
check_project() {
    log_info "检查项目状态..."

    # 检查是否在项目根目录
    if [ ! -f "package.json" ]; then
        log_error "未找到 package.json，请在项目根目录运行此脚本"
        return 1
    fi

    # 检查 Dockerfile
    if [ ! -f "Dockerfile" ]; then
        log_error "未找到 Dockerfile"
        return 1
    fi

    # 检查 docker-compose.yml
    if [ ! -f "docker-compose.yml" ]; then
        log_warning "未找到 docker-compose.yml"
    fi

    log_success "项目文件检查通过"
}

# 检查 Git 状态
check_git() {
    log_info "检查 Git 状态..."

    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_warning "不在 Git 仓库中"
        return 0
    fi

    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        log_warning "有未提交的更改，建议先提交"
    fi

    # 获取当前分支
    local branch=$(git rev-parse --abbrev-ref HEAD)
    log_info "当前分支: $branch"

    # 获取最新标签
    local latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "无标签")
    log_info "最新标签: $latest_tag"

    log_success "Git 状态检查完成"
}

# 检查依赖
check_dependencies() {
    log_info "检查项目依赖..."

    if [ ! -d "node_modules" ]; then
        log_warning "node_modules 目录不存在，建议运行: pnpm install"
    fi

    if [ ! -f "pnpm-lock.yaml" ]; then
        log_warning "未找到 pnpm-lock.yaml"
    fi

    log_success "依赖检查完成"
}

# 测试本地构建
test_local_build() {
    log_info "测试本地 Docker 构建..."

    local test_tag="misonote-markdown:test-$(date +%s)"

    if docker build -t "$test_tag" .; then
        log_success "本地构建测试通过"
        docker rmi "$test_tag" > /dev/null 2>&1
    else
        log_error "本地构建失败，请查看上方构建日志了解详细原因"
        return 1
    fi
}

# 检查网络连接
check_network() {
    log_info "检查网络连接..."

    if ! curl -s --connect-timeout 5 https://hub.docker.com > /dev/null; then
        log_error "无法连接到 Docker Hub"
        return 1
    fi

    log_success "网络连接正常"
}

# 显示发布信息
show_publish_info() {
    log_info "发布信息预览..."

    local version=$(node -p "require('./package.json').version")
    local image_name="$DOCKER_USERNAME/misonote-markdown"

    echo ""
    echo "📦 镜像信息:"
    echo "  名称: $image_name"
    echo "  版本: $version"
    echo "  标签: latest, v$version"
    echo ""
    echo "🏗️ 支持架构:"
    echo "  - linux/amd64"
    echo "  - linux/arm64"
    echo ""
    echo "🚀 发布命令:"
    echo "  pnpm docker:publish"
    echo ""
}

# 主函数
main() {
    echo "🔍 Docker 发布前检查"
    echo "===================="
    echo ""

    local errors=0

    check_docker || ((errors++))
    check_docker_login || ((errors++))
    check_project || ((errors++))
    check_git
    check_dependencies
    test_local_build || ((errors++))
    check_network || ((errors++))

    echo ""

    if [ $errors -eq 0 ]; then
        log_success "✅ 所有检查通过，可以开始发布！"
        show_publish_info
        return 0
    else
        log_error "❌ 发现 $errors 个问题，请修复后再发布"
        return 1
    fi
}

# 运行主函数
main "$@"
