# 🐳 Docker 镜像发布完整方案

## 📋 发布方案概述

我们为 Misonote Markdown 应用创建了完整的 Docker 镜像发布方案，让用户可以直接使用预构建的镜像，无需本地构建。

## 🎯 发布目标

1. **多架构支持**: AMD64 和 ARM64 架构
2. **自动化发布**: GitHub Actions 自动构建和发布
3. **版本管理**: 语义化版本标签
4. **用户友好**: 简单的使用命令

## 📦 已创建的文件

### 1. 发布脚本
- `scripts/docker-publish.sh` - 主发布脚本
- `scripts/docker-publish-check.sh` - 发布前检查脚本

### 2. GitHub Actions
- `.github/workflows/docker-publish.yml` - 自动发布工作流

### 3. 文档
- `DOCKER-PUBLISH-GUIDE.md` - 详细发布指南
- `DOCKER-HUB-README.md` - Docker Hub 页面说明
- `DOCKER-PUBLISH-SUMMARY.md` - 本文档

### 4. 配置更新
- `package.json` - 添加了发布相关命令

## 🚀 发布流程

### 手动发布

1. **环境准备**
   ```bash
   # 设置 Docker Hub 用户名
   export DOCKER_USERNAME=your-dockerhub-username

   # 登录 Docker Hub
   docker login
   ```

2. **发布前检查**
   ```bash
   pnpm docker:publish:check
   ```

3. **执行发布**
   ```bash
   pnpm docker:publish
   ```

### 自动发布（推荐）

1. **设置 GitHub Secrets**
   - `DOCKER_USERNAME`: Docker Hub 用户名
   - `DOCKER_PASSWORD`: Docker Hub 密码或访问令牌

2. **触发发布**
   ```bash
   # 创建版本标签
   git tag v0.1.0
   git push origin v0.1.0

   # 或推送到主分支
   git push origin main
   ```

## 📋 可用命令

```bash
# 发布相关命令
pnpm docker:publish:check     # 发布前检查
pnpm docker:publish:prepare   # 发布准备
pnpm docker:publish           # 发布镜像

# 原有 Docker 命令
pnpm docker:build             # 本地构建
pnpm docker:run               # 本地运行
pnpm docker:compose           # Docker Compose
```

## 🏷️ 标签策略

发布的镜像将包含以下标签：

- `latest` - 最新稳定版本
- `v{version}` - 特定版本（如 v0.1.0）
- `{git-hash}` - Git 提交哈希
- `{git-tag}` - Git 标签

## 👥 用户使用方式

发布后，用户可以通过以下方式使用：

### 1. 直接运行
```bash
docker run -d -p 3001:3001 leeguo/misonote-markdown:latest
```

### 2. Docker Compose
```yaml
services:
  misonote-markdown:
    image: leeguo/misonote-markdown:latest
    ports:
      - "3001:3001"
    volumes:
      - ./docs:/app/docs
```

### 3. 自定义配置
```bash
docker run -d \
  -p 3001:3001 \
  -v $(pwd)/docs:/app/docs \
  -v $(pwd)/data:/app/data \
  -e ADMIN_PASSWORD_HASH_BASE64=your_hash \
  leeguo/misonote-markdown:latest
```

## 🔧 技术特性

### 多架构构建
- 使用 Docker Buildx
- 支持 linux/amd64 和 linux/arm64
- 自动平台检测

### 优化特性
- 多阶段构建减小镜像大小
- Alpine Linux 基础镜像
- 构建缓存优化
- 健康检查内置

### 安全特性
- 非 root 用户运行
- 最小权限原则
- 环境变量安全处理

## 📊 发布效果

### 用户体验提升
- ✅ **零构建时间**: 用户无需等待构建
- ✅ **即开即用**: 一条命令启动应用
- ✅ **跨平台支持**: 支持不同架构
- ✅ **版本选择**: 可选择特定版本

### 维护效率提升
- ✅ **自动化发布**: GitHub Actions 自动处理
- ✅ **版本管理**: 自动标签和版本控制
- ✅ **质量保证**: 发布前自动检查
- ✅ **文档同步**: 自动生成使用文档

## 🎯 下一步行动

### 立即可做
1. **设置 Docker Hub 账户**
2. **配置 GitHub Secrets**
3. **执行首次发布**
4. **更新项目文档**

### 后续优化
1. **添加镜像扫描**: 安全漏洞检测
2. **性能监控**: 镜像大小和构建时间优化
3. **多注册表**: 支持其他容器注册表
4. **自动测试**: 发布前自动化测试

## 📝 使用示例

### 快速开始示例
```bash
# 用户只需要这一条命令就能运行应用
docker run -d \
  --name misonote-markdown \
  -p 3001:3001 \
  -v $(pwd)/docs:/app/docs \
  leeguo/misonote-markdown:latest

# 访问应用
open http://localhost:3001
```

### 生产环境示例
```yaml
# docker-compose.yml
services:
  misonote-markdown:
    image: leeguo/misonote-markdown:v0.1.0
    container_name: misonote-markdown
    ports:
      - "3001:3001"
    volumes:
      - ./docs:/app/docs
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🎉 总结

通过这个完整的发布方案，我们实现了：

1. **用户友好**: 一条命令即可使用
2. **开发高效**: 自动化发布流程
3. **质量保证**: 多重检查和测试
4. **文档完善**: 详细的使用指南

这将大大提升项目的可用性和用户体验！
