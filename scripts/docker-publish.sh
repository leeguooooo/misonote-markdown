#!/bin/bash

# Docker 镜像发布脚本
# 支持多架构构建和发布到 Docker Hub

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
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装或不在 PATH 中"
        exit 1
    fi
    
    if ! docker buildx version &> /dev/null; then
        log_error "Docker Buildx 未安装"
        exit 1
    fi
    
    log_success "所有必要工具已安装"
}

# 获取版本信息
get_version() {
    # 从 package.json 获取版本
    VERSION=$(node -p "require('./package.json').version")
    
    # 获取 Git 提交哈希（如果在 Git 仓库中）
    if git rev-parse --git-dir > /dev/null 2>&1; then
        GIT_HASH=$(git rev-parse --short HEAD)
        GIT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "")
    else
        GIT_HASH=""
        GIT_TAG=""
    fi
    
    log_info "版本信息:"
    log_info "  Package 版本: $VERSION"
    log_info "  Git 哈希: ${GIT_HASH:-'N/A'}"
    log_info "  Git 标签: ${GIT_TAG:-'N/A'}"
}

# 设置镜像名称和标签
setup_image_tags() {
    # 默认镜像名称（用户需要修改为自己的 Docker Hub 用户名）
    DOCKER_USERNAME=${DOCKER_USERNAME:-"your-username"}
    IMAGE_NAME="$DOCKER_USERNAME/markdown-preview"
    
    # 构建标签列表
    TAGS=()
    TAGS+=("$IMAGE_NAME:latest")
    TAGS+=("$IMAGE_NAME:v$VERSION")
    
    if [ -n "$GIT_HASH" ]; then
        TAGS+=("$IMAGE_NAME:$GIT_HASH")
    fi
    
    if [ -n "$GIT_TAG" ]; then
        TAGS+=("$IMAGE_NAME:$GIT_TAG")
    fi
    
    log_info "将构建以下标签:"
    for tag in "${TAGS[@]}"; do
        log_info "  - $tag"
    done
}

# 创建 buildx builder
setup_buildx() {
    log_info "设置 Docker Buildx..."
    
    # 创建新的 builder 实例（如果不存在）
    if ! docker buildx inspect markdown-builder &> /dev/null; then
        log_info "创建新的 buildx builder..."
        docker buildx create --name markdown-builder --driver docker-container --bootstrap
    fi
    
    # 使用 builder
    docker buildx use markdown-builder
    
    log_success "Buildx 设置完成"
}

# 构建多架构镜像
build_multiarch() {
    log_info "开始构建多架构镜像..."
    
    # 构建标签参数
    TAG_ARGS=""
    for tag in "${TAGS[@]}"; do
        TAG_ARGS="$TAG_ARGS -t $tag"
    done
    
    # 构建命令
    BUILD_CMD="docker buildx build \
        --platform linux/amd64,linux/arm64 \
        $TAG_ARGS \
        --push \
        ."
    
    log_info "执行构建命令:"
    log_info "$BUILD_CMD"
    
    # 执行构建
    eval $BUILD_CMD
    
    log_success "多架构镜像构建完成"
}

# 验证镜像
verify_images() {
    log_info "验证发布的镜像..."
    
    for tag in "${TAGS[@]}"; do
        log_info "检查镜像: $tag"
        if docker manifest inspect "$tag" &> /dev/null; then
            log_success "✓ $tag"
        else
            log_error "✗ $tag"
        fi
    done
}

# 生成使用说明
generate_usage_info() {
    log_info "生成使用说明..."
    
    cat > DOCKER-USAGE.md << EOF
# 🐳 Docker 镜像使用说明

## 📦 预构建镜像

我们提供了预构建的 Docker 镜像，支持多种架构：

- **AMD64** (x86_64) - 适用于大多数服务器和桌面环境
- **ARM64** (aarch64) - 适用于 Apple Silicon Mac、树莓派等

## 🚀 快速开始

### 1. 直接运行

\`\`\`bash
# 使用最新版本
docker run -d -p 3001:3001 --name markdown-preview $IMAGE_NAME:latest

# 使用特定版本
docker run -d -p 3001:3001 --name markdown-preview $IMAGE_NAME:v$VERSION
\`\`\`

### 2. 使用 Docker Compose

创建 \`docker-compose.yml\` 文件：

\`\`\`yaml
services:
  markdown-preview:
    image: $IMAGE_NAME:latest
    container_name: markdown-preview
    ports:
      - "3001:3001"
    volumes:
      # 持久化文档目录
      - ./docs:/app/docs
      # 持久化数据目录
      - ./data:/app/data
      # 持久化日志目录
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      # 可选：自定义管理员密码（Base64 编码的 bcrypt 哈希）
      # - ADMIN_PASSWORD_HASH_BASE64=your_base64_encoded_hash
    restart: unless-stopped
    networks:
      - markdown-network

networks:
  markdown-network:
    driver: bridge
\`\`\`

然后运行：

\`\`\`bash
docker-compose up -d
\`\`\`

### 3. 环境变量配置

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| \`NODE_ENV\` | 运行环境 | \`production\` |
| \`PORT\` | 服务端口 | \`3001\` |
| \`ADMIN_PASSWORD_HASH_BASE64\` | 管理员密码哈希（Base64编码） | 自动生成 |
| \`JWT_SECRET\` | JWT 密钥 | 自动生成 |

### 4. 数据持久化

建议挂载以下目录：

- \`/app/docs\` - Markdown 文档目录
- \`/app/data\` - 应用数据目录
- \`/app/logs\` - 日志文件目录

### 5. 健康检查

容器提供健康检查端点：

\`\`\`bash
curl http://localhost:3001/api/health
\`\`\`

## 📋 可用标签

- \`latest\` - 最新稳定版本
- \`v$VERSION\` - 当前版本
$(if [ -n "$GIT_HASH" ]; then echo "- \`$GIT_HASH\` - Git 提交版本"; fi)
$(if [ -n "$GIT_TAG" ]; then echo "- \`$GIT_TAG\` - Git 标签版本"; fi)

## 🔧 故障排除

### 查看日志

\`\`\`bash
docker logs markdown-preview
\`\`\`

### 进入容器

\`\`\`bash
docker exec -it markdown-preview sh
\`\`\`

### 重启服务

\`\`\`bash
docker restart markdown-preview
\`\`\`

## 📚 更多信息

- [项目主页](https://github.com/your-username/markdown-preview)
- [Docker Hub](https://hub.docker.com/r/$DOCKER_USERNAME/markdown-preview)
- [使用文档](./README.md)
EOF

    log_success "使用说明已生成: DOCKER-USAGE.md"
}

# 主函数
main() {
    echo "🐳 Markdown Preview Docker 镜像发布工具"
    echo "========================================"
    echo ""
    
    # 检查 Docker Hub 用户名
    if [ "$DOCKER_USERNAME" = "your-username" ]; then
        log_error "请设置 DOCKER_USERNAME 环境变量为您的 Docker Hub 用户名"
        log_info "示例: export DOCKER_USERNAME=your-dockerhub-username"
        exit 1
    fi
    
    # 检查是否已登录 Docker Hub
    if ! docker info | grep -q "Username"; then
        log_warning "请先登录 Docker Hub: docker login"
        exit 1
    fi
    
    check_requirements
    get_version
    setup_image_tags
    setup_buildx
    build_multiarch
    verify_images
    generate_usage_info
    
    echo ""
    log_success "🎉 镜像发布完成！"
    log_info "您现在可以使用以下命令运行应用："
    log_info "  docker run -d -p 3001:3001 $IMAGE_NAME:latest"
    echo ""
}

# 运行主函数
main "$@"
