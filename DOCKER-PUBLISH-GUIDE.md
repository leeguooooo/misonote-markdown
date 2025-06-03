# 🐳 Docker 镜像发布指南

本指南将帮助您将 Misonote Markdown 应用发布到 Docker Hub，让用户可以直接使用预构建的镜像。

## 📋 发布前准备

### 1. 环境要求

- Docker Desktop 或 Docker Engine
- Docker Buildx（多架构构建支持）
- Docker Hub 账户
- Git（可选，用于版本管理）

### 2. 账户设置

#### 创建 Docker Hub 账户

1. 访问 [Docker Hub](https://hub.docker.com/)
2. 注册账户或登录现有账户
3. 记录您的用户名，后续需要使用

#### 本地登录

```bash
docker login
```

输入您的 Docker Hub 用户名和密码。

### 3. 环境变量设置

```bash
# 设置您的 Docker Hub 用户名
export DOCKER_USERNAME=your-dockerhub-username
```

## 🚀 发布流程

### 方法一：使用自动化脚本（推荐）

#### 1. 发布前检查

```bash
# 检查发布环境
pnpm docker:publish:check
```

这个命令会检查：
- Docker 环境是否正常
- 是否已登录 Docker Hub
- 项目文件是否完整
- Git 状态
- 网络连接
- 本地构建测试

#### 2. 执行发布

```bash
# 发布镜像
pnpm docker:publish
```

发布脚本会：
- 创建多架构构建器
- 构建 AMD64 和 ARM64 镜像
- 推送到 Docker Hub
- 生成使用文档

### 方法二：手动发布

#### 1. 设置 Buildx

```bash
# 创建新的构建器
docker buildx create --name misonote-builder --driver docker-container --bootstrap

# 使用构建器
docker buildx use misonote-builder
```

#### 2. 构建并推送

```bash
# 构建多架构镜像并推送
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t leeguo/misonote-markdown:latest \
  -t leeguo/misonote-markdown:v0.1.0 \
  --push \
  .
```

## 📦 标签策略

我们使用以下标签策略：

- `latest` - 最新稳定版本
- `v{version}` - 特定版本（如 v0.1.0）
- `{git-hash}` - Git 提交哈希（可选）
- `{git-tag}` - Git 标签（可选）

## 🔄 自动化发布（GitHub Actions）

### 1. 设置 GitHub Secrets

在您的 GitHub 仓库中设置以下 Secrets：

1. 进入仓库设置 → Secrets and variables → Actions
2. 添加以下 secrets：
   - `DOCKER_USERNAME`: 您的 Docker Hub 用户名
   - `DOCKER_PASSWORD`: 您的 Docker Hub 密码或访问令牌

### 2. 触发自动发布

自动发布会在以下情况触发：

- 推送到 `main` 或 `master` 分支
- 创建新的版本标签（如 `v1.0.0`）
- 手动触发工作流

#### 创建版本标签

```bash
# 创建并推送标签
git tag v0.1.0
git push origin v0.1.0
```

## 📝 发布后验证

### 1. 检查 Docker Hub

访问 `https://hub.docker.com/r/leeguo/misonote-markdown` 确认镜像已发布。

### 2. 测试镜像

```bash
# 拉取并测试镜像
docker run -d -p 3001:3001 --name test-misonote leeguo/misonote-markdown:latest

# 检查健康状态
curl http://localhost:3001/api/health

# 清理测试容器
docker stop test-misonote && docker rm test-misonote
```

### 3. 验证多架构支持

```bash
# 检查镜像清单
docker manifest inspect leeguo/misonote-markdown:latest
```

## 📚 用户使用指南

发布后，用户可以通过以下方式使用您的镜像：

### 快速开始

```bash
# 直接运行
docker run -d -p 3001:3001 leeguo/misonote-markdown:latest

# 使用 Docker Compose
curl -O https://raw.githubusercontent.com/leeguo/misonote-markdown/main/docker-compose.yml
docker-compose up -d
```

### 自定义配置

```bash
# 挂载文档目录
docker run -d \
  -p 3001:3001 \
  -v $(pwd)/docs:/app/docs \
  -v $(pwd)/data:/app/data \
  leeguo/misonote-markdown:latest
```

## 🔧 故障排除

### 常见问题

#### 1. 构建失败

```bash
# 清理构建缓存
docker buildx prune -f

# 重新创建构建器
docker buildx rm misonote-builder
docker buildx create --name misonote-builder --driver docker-container --bootstrap
```

#### 2. 推送失败

```bash
# 重新登录
docker logout
docker login

# 检查网络连接
curl -I https://hub.docker.com
```

#### 3. 多架构构建问题

```bash
# 检查 QEMU 支持
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes

# 检查可用平台
docker buildx ls
```

## 📈 版本管理

### 语义化版本

建议使用语义化版本号：

- `MAJOR.MINOR.PATCH` (如 1.0.0)
- `MAJOR`: 不兼容的 API 更改
- `MINOR`: 向后兼容的功能添加
- `PATCH`: 向后兼容的错误修复

### 发布流程

1. 更新 `package.json` 中的版本号
2. 提交更改
3. 创建 Git 标签
4. 推送标签触发自动发布

```bash
# 更新版本
npm version patch  # 或 minor, major

# 推送更改和标签
git push origin main --tags
```

## 🎯 最佳实践

1. **测试先行**: 发布前在本地充分测试
2. **版本控制**: 使用语义化版本号
3. **文档更新**: 及时更新使用文档
4. **安全扫描**: 定期扫描镜像安全漏洞
5. **大小优化**: 保持镜像大小合理
6. **多架构支持**: 支持 AMD64 和 ARM64

## 🔗 相关资源

- [Docker Hub](https://hub.docker.com/)
- [Docker Buildx 文档](https://docs.docker.com/buildx/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [语义化版本](https://semver.org/)
