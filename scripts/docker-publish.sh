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
    DOCKER_USERNAME=${DOCKER_USERNAME:-"leeguo"}
    IMAGE_NAME="$DOCKER_USERNAME/misonote-markdown"

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
    if ! docker buildx inspect misonote-builder &> /dev/null; then
        log_info "创建新的 buildx builder..."
        docker buildx create --name misonote-builder --driver docker-container --bootstrap
    fi

    # 使用 builder
    docker buildx use misonote-builder

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
# 🐳 Misonote Markdown 2.0 Docker 镜像使用说明

## 📦 预构建镜像

我们提供了预构建的 Docker 镜像，支持多种架构和部署模式：

- **AMD64** (x86_64) - 适用于大多数服务器和桌面环境
- **ARM64** (aarch64) - 适用于 Apple Silicon Mac、树莓派等

## ✨ 新功能亮点

### 🤖 AI 原生集成
- **MCP 协议支持** - 与 Cursor 编辑器深度集成
- **智能记忆系统** - AI 学习用户习惯和偏好
- **自然语言交互** - 通过对话管理文档

### 🔗 地址生成
- **自动链接生成** - 创建文档时自动生成访问地址
- **便于分享** - 一键获取文档分享链接

## 🚀 快速开始

### 1. 标准部署

\`\`\`bash
# 使用默认临时密码 (admin123)
docker run -d -p 3001:3001 --name misonote-markdown $IMAGE_NAME:latest

# 启动时设置自定义密码（推荐）
docker run -d \\
  -p 3001:3001 \\
  -e ADMIN_PASSWORD=admin123 \\
  --name misonote-markdown \\
  $IMAGE_NAME:latest

# 使用特定版本
docker run -d \\
  -p 3001:3001 \\
  -e ADMIN_PASSWORD=admin123 \\
  --name misonote-markdown \\
  $IMAGE_NAME:v$VERSION
\`\`\`

### 2. 使用 Docker Compose (标准模式)

创建 \`docker-compose.yml\` 文件：

\`\`\`yaml
services:
  misonote-markdown:
    image: $IMAGE_NAME:latest
    container_name: misonote-markdown
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
      # 设置管理员密码（推荐修改）
      - ADMIN_PASSWORD=admin123
      # 可选：自定义公开访问地址（也可在管理后台设置）
      # - NEXT_PUBLIC_BASE_URL=https://your-domain.com
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

### 3. MCP 客户端配置（AI 功能）

**重要说明**: MCP 客户端不包含在 Docker 镜像中，需要单独安装到本地。

#### 步骤 1: 克隆 MCP 客户端

\`\`\`bash
# 克隆 MCP 客户端到本地
git clone https://github.com/leeguooooo/misonote-mcp-client.git
cd misonote-mcp-client

# 安装依赖
npm install
\`\`\`

#### 步骤 2: 配置 Cursor

在 Cursor 设置中添加 MCP 服务器配置：

\`\`\`json
{
  "mcpServers": {
    "misonote-markdown": {
      "command": "node",
      "args": ["/path/to/misonote-mcp-client/misonote-mcp-client.js"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:3001",
        "MCP_API_KEY": "your-api-key"
      }
    }
  }
}
\`\`\`

#### 步骤 3: 创建 MCP API 密钥

在管理后台创建 MCP API 密钥：

\`\`\`bash
# 1. 访问管理后台
open http://localhost:3001/admin

# 2. 登录管理员账号
# 3. 进入 "API 密钥管理" 页面
# 4. 点击 "创建新密钥" 按钮
# 5. 设置密钥名称和权限
# 6. 复制生成的 API 密钥
\`\`\`

### 4. 环境变量配置

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| \`NODE_ENV\` | 运行环境 | \`production\` |
| \`PORT\` | 服务端口 | \`3001\` |
| \`ADMIN_PASSWORD\` | 管理员密码（明文，启动时自动加密） | \`admin123\` |
| \`ADMIN_PASSWORD_HASH_BASE64\` | 管理员密码哈希（Base64编码） | 自动生成 |
| \`JWT_SECRET\` | JWT 密钥 | 自动生成 |
| \`NEXT_PUBLIC_BASE_URL\` | 公开访问地址（可选，也可在管理后台设置） | 空 |

> **注意**: MCP API 密钥需要在管理后台创建，不再通过环境变量配置。

### 5. 数据持久化

建议挂载以下目录：

- \`/app/docs\` - Markdown 文档目录
- \`/app/data\` - 应用数据目录
- \`/app/logs\` - 日志文件目录

**注意**: AI 记忆系统数据存储在 \`/app/docs/memories\` 目录中，会随文档一起持久化。

### 6. 健康检查

容器提供健康检查端点：

\`\`\`bash
# 主服务健康检查
curl http://localhost:3001/api/health

# MCP 服务能力检查
curl http://localhost:3001/api/mcp/capabilities
\`\`\`

## 📋 可用标签

- \`latest\` - 最新稳定版本
- \`v$VERSION\` - 当前版本
$(if [ -n "$GIT_HASH" ]; then echo "- \`$GIT_HASH\` - Git 提交版本"; fi)
$(if [ -n "$GIT_TAG" ]; then echo "- \`$GIT_TAG\` - Git 标签版本"; fi)

## 🔧 故障排除

### 查看日志

\`\`\`bash
docker logs misonote-markdown
\`\`\`

### 进入容器

\`\`\`bash
docker exec -it misonote-markdown sh
\`\`\`

### 重启服务

\`\`\`bash
docker restart misonote-markdown
\`\`\`

## 📚 更多信息

- [项目主页](https://github.com/leeguooooo/misonote-markdown)
- [Docker Hub](https://hub.docker.com/r/$DOCKER_USERNAME/misonote-markdown)
- [使用文档](https://github.com/leeguooooo/misonote-markdown#readme)
- [问题反馈](https://github.com/leeguooooo/misonote-markdown/issues)
EOF

    log_success "使用说明已生成: DOCKER-USAGE.md"
}

# 主函数
main() {
    echo "🐳 Misonote Markdown Docker 镜像发布工具"
    echo "========================================="
    echo ""

    # 检查 Docker Hub 用户名
    if [ "$DOCKER_USERNAME" = "your-username" ]; then
        log_error "请设置 DOCKER_USERNAME 环境变量为您的 Docker Hub 用户名"
        log_info "示例: export DOCKER_USERNAME=leeguo"
        exit 1
    fi

    # 检查是否已登录 Docker Hub（兼容 CLI/GUI 登录）
    log_info "检查 Docker 登录状态..."
    docker info 2>/dev/null | grep "Username" || log_info "(docker info 中无 Username 字段)"

    if docker info 2>/dev/null | grep -q "Username:"; then
        log_success "已登录 Docker Hub"
    elif grep -q "index.docker.io" ~/.docker/config.json 2>/dev/null; then
        log_warning "未检测到 CLI 登录，但 config.json 中存在 Docker Hub 凭据，可能已通过 GUI 登录"
    else
        log_error "未登录 Docker Hub，请运行: docker login"
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
