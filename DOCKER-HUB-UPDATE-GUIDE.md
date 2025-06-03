# 🐳 Docker Hub README 更新指南

## 问题说明

你遇到的问题是 Docker 镜像上传到 Docker Hub 后，README 内容中包含占位符链接（如 `your-username`），而不是实际的 GitHub 仓库链接。

## 🔍 问题原因

1. **DOCKER-HUB-README.md 文件中的占位符**：
   - GitHub 链接使用了 `your-username` 占位符
   - Docker 镜像名称使用了 `your-username` 占位符

2. **Docker 发布脚本生成的文档也有占位符**：
   - 脚本生成的使用说明中包含占位符链接

## ✅ 已修复的问题

我已经修复了以下文件中的占位符：

### 1. DOCKER-HUB-README.md
- ✅ 修复了 GitHub 仓库链接：`https://github.com/leeguooooo/misonote-markdown`
- ✅ 修复了 Docker 镜像名称：`leeguo/misonote-markdown`
- ✅ 添加了作者信息

### 2. scripts/docker-publish.sh
- ✅ 修复了脚本生成文档中的 GitHub 链接
- ✅ 添加了问题反馈链接

## 🚀 如何更新 Docker Hub README

### 方法一：使用自动化脚本（推荐）

1. **设置环境变量**：
   ```bash
   export DOCKER_USERNAME=leeguo
   export DOCKER_PASSWORD=your_docker_hub_password
   ```

2. **运行更新脚本**：
   ```bash
   pnpm docker:update-readme
   ```

### 方法二：手动更新

1. **登录 Docker Hub**：
   - 访问 https://hub.docker.com
   - 登录你的账号

2. **进入仓库页面**：
   - 访问 https://hub.docker.com/r/leeguo/misonote-markdown

3. **编辑 README**：
   - 点击 "Edit" 按钮
   - 复制 `DOCKER-HUB-README.md` 的内容
   - 粘贴到 Docker Hub 的描述框中
   - 点击 "Save" 保存

## 🔧 重新发布镜像（可选）

如果你想重新发布镜像以确保所有内容都是最新的：

```bash
# 设置 Docker Hub 用户名
export DOCKER_USERNAME=leeguo

# 登录 Docker Hub
docker login

# 发布镜像
pnpm docker:publish
```

## 📋 验证更新结果

更新完成后，访问以下链接验证：

1. **Docker Hub 仓库页面**：
   https://hub.docker.com/r/leeguo/misonote-markdown

2. **检查内容**：
   - ✅ GitHub 链接应该指向：`https://github.com/leeguooooo/misonote-markdown`
   - ✅ 镜像名称应该是：`leeguo/misonote-markdown`
   - ✅ 应该包含完整的使用说明和功能介绍

## 🛠️ 故障排除

### 问题：脚本执行失败
**解决方案**：
```bash
# 检查脚本权限
chmod +x scripts/update-docker-hub-readme.sh

# 检查环境变量
echo $DOCKER_USERNAME
echo $DOCKER_PASSWORD
```

### 问题：Docker Hub API 认证失败
**解决方案**：
1. 确认用户名和密码正确
2. 检查是否启用了两步验证（需要使用访问令牌）
3. 尝试手动登录 Docker Hub 网站验证凭据

### 问题：README 内容格式错误
**解决方案**：
1. 检查 `DOCKER-HUB-README.md` 文件格式
2. 确保 Markdown 语法正确
3. 避免使用特殊字符

## 📚 相关文档

- [Docker Hub API 文档](https://docs.docker.com/docker-hub/api/latest/)
- [项目主 README](./README.md)
- [Docker 部署指南](./DOCKER-QUICKSTART.md)

## 🎯 下次发布建议

为了避免类似问题，建议在发布前：

1. **检查所有占位符**：
   ```bash
   grep -r "your-username" . --exclude-dir=node_modules
   ```

2. **验证链接有效性**：
   ```bash
   # 检查 GitHub 链接
   curl -I https://github.com/leeguooooo/misonote-markdown
   ```

3. **使用发布检查脚本**：
   ```bash
   pnpm docker:publish:check
   ```

---

**总结**：问题已修复，现在你的 Docker Hub README 应该包含正确的 GitHub 链接和完整的项目信息。
