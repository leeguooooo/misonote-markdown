# 📦 安装指南

## 🚀 一键安装（推荐）

为了解决部分依赖可能触发的构建脚本提示，我们提供了一键安装脚本：

```bash
# 克隆项目
git clone https://github.com/leeguooooo/misonote-markdown.git
cd misonote-markdown

# 一键安装（自动处理构建脚本）
pnpm run install:full
```

## 🔧 标准安装

如果你更喜欢标准的安装流程：

```bash
# 安装依赖
pnpm install

# 如果看到构建脚本警告（原生模块），执行
pnpm approve-builds
```

## ❓ 为什么需要批准构建脚本？

- 部分依赖包含原生模块或构建步骤（如 esbuild 等）
- pnpm 出于安全考虑，默认不允许包运行构建脚本
- 手动批准后，这些依赖会编译/下载适合你系统的二进制文件

## 🛠️ 我们的解决方案

1. **自动化脚本** - `pnpm run install:full` 自动处理所有步骤
2. **配置文件** - `.pnpmrc` 和 `pnpm-workspace.yaml` 优化安装体验
3. **清晰说明** - README 中提供详细的安装指导

## 🐛 常见问题

### Q: 为什么不直接在 package.json 中自动批准？
A: 出于安全考虑，我们不希望自动批准所有构建脚本，只针对已知安全的包。

### Q: 可以跳过构建脚本吗？
A: 不建议。跳过可能导致部分依赖无法正确安装，从而影响构建或运行。

### Q: Docker 部署需要处理这个问题吗？
A: 不需要。Docker 镜像已经预编译了所有依赖，可以直接使用。

## 📋 总结

- **推荐方式**: `pnpm run install:full` - 一键解决所有问题
- **标准方式**: `pnpm install` + `pnpm approve-builds` - 手动处理
- **Docker 方式**: 无需处理，开箱即用
