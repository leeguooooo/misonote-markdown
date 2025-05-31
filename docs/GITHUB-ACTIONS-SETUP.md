# 🤖 GitHub Actions 自动化配置指南

## 📋 必需的 GitHub Secrets

在 GitHub 仓库中配置以下 Secrets（Settings → Secrets and variables → Actions）：

### 🔑 Docker Hub 认证

| Secret 名称 | 描述 | 获取方式 |
|------------|------|----------|
| `DOCKER_USERNAME` | Docker Hub 用户名 | 你的 Docker Hub 用户名 |
| `DOCKER_PASSWORD` | Docker Hub 访问令牌 | 在 Docker Hub 生成 Access Token |

### 🛠️ 获取 Docker Hub Access Token

1. 登录 [Docker Hub](https://hub.docker.com/)
2. 点击右上角头像 → `Account Settings`
3. 选择 `Security` 标签
4. 点击 `New Access Token`
5. 设置名称（如：`github-actions`）
6. 选择权限：`Read, Write, Delete`
7. 复制生成的 token（只显示一次）

## 🚀 自动化触发条件

当前配置会在以下情况自动构建和发布：

### 📦 自动发布
- **推送到 main/master 分支** → 构建并推送 `latest` 标签
- **创建版本标签** (如 `v1.0.0`) → 构建并推送版本标签
- **手动触发** → 在 Actions 页面手动运行

### 🧪 仅构建（不发布）
- **Pull Request** → 仅构建测试，不推送镜像

## 🏷️ 镜像标签策略

| 触发条件 | 生成的标签 | 示例 |
|---------|-----------|------|
| 推送到 main | `latest`, `main` | `leeguo/misonote-markdown:latest` |
| 版本标签 | `v1.0.0`, `v1.0`, `v1`, `latest` | `leeguo/misonote-markdown:v1.0.0` |
| 分支推送 | `branch-name` | `leeguo/misonote-markdown:feature-branch` |
| Commit SHA | `main-abc1234` | `leeguo/misonote-markdown:main-abc1234` |

## 🔧 多架构支持

自动构建支持以下架构：
- **linux/amd64** - Intel/AMD 处理器
- **linux/arm64** - ARM 处理器（Apple Silicon、树莓派等）

## 📋 发布流程

### 🎯 发布新版本

1. **创建版本标签**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **自动化流程**
   - GitHub Actions 自动触发
   - 构建多架构镜像
   - 推送到 Docker Hub
   - 生成使用文档

### 🔄 日常开发

1. **推送到 main 分支**
   ```bash
   git push origin main
   ```

2. **自动更新 latest 标签**
   - 自动构建最新代码
   - 更新 `latest` 标签

## 🐛 故障排除

### ❌ 常见错误

1. **认证失败**
   ```
   Error: denied: requested access to the resource is denied
   ```
   **解决**: 检查 `DOCKER_USERNAME` 和 `DOCKER_PASSWORD` 是否正确

2. **权限不足**
   ```
   Error: insufficient_scope: authorization failed
   ```
   **解决**: 确保 Docker Hub Access Token 有 `Write` 权限

3. **镜像推送失败**
   ```
   Error: failed to push: unexpected status: 401 Unauthorized
   ```
   **解决**: 重新生成 Docker Hub Access Token

### 🔍 调试步骤

1. **查看 Actions 日志**
   - 进入 GitHub 仓库
   - 点击 `Actions` 标签
   - 查看失败的工作流日志

2. **验证 Secrets**
   - 确保所有必需的 Secrets 都已配置
   - 重新生成 Docker Hub Access Token

3. **本地测试**
   ```bash
   # 本地构建测试
   docker build -t test-image .
   
   # 本地多架构构建测试
   docker buildx build --platform linux/amd64,linux/arm64 -t test-image .
   ```

## ✅ 验证配置

配置完成后，推送一个测试提交验证：

```bash
git commit --allow-empty -m "test: trigger GitHub Actions"
git push origin main
```

然后在 GitHub Actions 页面查看构建状态。
