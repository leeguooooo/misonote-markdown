#!/bin/bash

# Docker Hub README 更新脚本
# 用于更新 Docker Hub 仓库的 README 描述

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

# 检查必要的工具
check_requirements() {
    log_info "检查必要的工具..."

    if ! command -v curl &> /dev/null; then
        log_error "curl 未安装或不在 PATH 中"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        log_warning "jq 未安装，将使用基础方法处理 JSON"
        USE_JQ=false
    else
        USE_JQ=true
    fi

    log_success "工具检查完成"
}

# 获取 Docker Hub 令牌
get_docker_hub_token() {
    log_info "获取 Docker Hub 访问令牌..."

    if [ -z "$DOCKER_USERNAME" ] || [ -z "$DOCKER_PASSWORD" ]; then
        log_error "请设置 DOCKER_USERNAME 和 DOCKER_PASSWORD 环境变量"
        log_info "示例:"
        log_info "  export DOCKER_USERNAME=leeguo"
        log_info "  export DOCKER_PASSWORD=your_docker_hub_password"
        exit 1
    fi

    # 获取令牌
    TOKEN_RESPONSE=$(curl -s -H "Content-Type: application/json" \
        -X POST \
        -d "{\"username\": \"$DOCKER_USERNAME\", \"password\": \"$DOCKER_PASSWORD\"}" \
        https://hub.docker.com/v2/users/login/)

    if [ "$USE_JQ" = true ]; then
        TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r .token)
    else
        TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    fi

    if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
        log_error "获取 Docker Hub 令牌失败"
        log_error "响应: $TOKEN_RESPONSE"
        exit 1
    fi

    log_success "Docker Hub 令牌获取成功"
}

# 更新 Docker Hub README
update_docker_hub_readme() {
    local repo_name="misonote-markdown"

    log_info "更新 Docker Hub README..."

    # 检查 README 文件是否存在
    if [ ! -f "DOCKER-HUB-README.md" ]; then
        log_error "DOCKER-HUB-README.md 文件不存在"
        exit 1
    fi

    # 读取 README 内容并转义
    README_CONTENT=$(cat DOCKER-HUB-README.md | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')

    # 构建 JSON 数据
    JSON_DATA="{\"full_description\": \"$README_CONTENT\"}"

    # 发送更新请求
    RESPONSE=$(curl -s -H "Authorization: JWT $TOKEN" \
        -H "Content-Type: application/json" \
        -X PATCH \
        -d "$JSON_DATA" \
        "https://hub.docker.com/v2/repositories/$DOCKER_USERNAME/$repo_name/")

    if echo "$RESPONSE" | grep -q "error"; then
        log_error "更新 Docker Hub README 失败"
        log_error "响应: $RESPONSE"
        exit 1
    fi

    log_success "Docker Hub README 更新成功"
}

# 验证更新结果
verify_update() {
    log_info "验证更新结果..."

    # 获取仓库信息
    REPO_INFO=$(curl -s "https://hub.docker.com/v2/repositories/$DOCKER_USERNAME/misonote-markdown/")

    if echo "$REPO_INFO" | grep -q "leeguooooo/misonote-markdown"; then
        log_success "✓ GitHub 链接已正确更新"
    else
        log_warning "⚠ GitHub 链接可能未正确更新"
    fi

    if echo "$REPO_INFO" | grep -q "leeguo/misonote-markdown"; then
        log_success "✓ Docker Hub 链接已正确更新"
    else
        log_warning "⚠ Docker Hub 链接可能未正确更新"
    fi

    log_info "您可以访问以下链接查看更新结果:"
    log_info "  https://hub.docker.com/r/$DOCKER_USERNAME/misonote-markdown"
}

# 显示使用说明
show_usage() {
    echo "Docker Hub README 更新工具"
    echo ""
    echo "使用方法:"
    echo "  1. 设置环境变量:"
    echo "     export DOCKER_USERNAME=leeguo"
    echo "     export DOCKER_PASSWORD=your_docker_hub_password"
    echo ""
    echo "  2. 运行脚本:"
    echo "     ./scripts/update-docker-hub-readme.sh"
    echo ""
    echo "  3. 或者使用 pnpm 命令:"
    echo "     pnpm docker:update-readme"
    echo ""
}

# 主函数
main() {
    echo "🐳 Docker Hub README 更新工具"
    echo "================================"
    echo ""

    # 检查参数
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_usage
        exit 0
    fi

    check_requirements
    get_docker_hub_token
    update_docker_hub_readme
    verify_update

    echo ""
    log_success "🎉 Docker Hub README 更新完成！"
    log_info "请访问 Docker Hub 查看更新结果"
    echo ""
}

# 运行主函数
main "$@"
