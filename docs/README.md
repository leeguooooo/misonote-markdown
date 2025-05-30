# 🚀 Misonote Markdown - 智能文档管理系统

> 一个功能强大的 Markdown 文档管理系统，支持 AI 集成、智能搜索和记忆功能

## ✨ 核心特性

### 📚 **文档管理**
- **Markdown 支持** - 完整的 Markdown 语法支持
- **实时预览** - 所见即所得的编辑体验
- **文件系统** - 灵活的目录结构管理
- **在线查看** - 自动生成文档访问地址

### 🤖 **AI 集成 (MCP 协议)**
- **Cursor 集成** - 通过 MCP 协议与 Cursor 编辑器无缝集成
- **智能助手** - AI 可以直接管理和操作文档
- **自然语言** - 通过对话方式管理文档系统
- **自动化操作** - AI 主动记录用户习惯和偏好

### 🧠 **智能记忆系统**
- **用户习惯** - 自动记录和学习用户的工作习惯
- **偏好管理** - 记住用户的技术偏好和选择
- **复盘记录** - 保存经验教训和问题解决方案
- **洞察学习** - 积累知识和最佳实践
- **多项目支持** - 为不同项目维护独立的记忆空间

### 🔍 **智能搜索**
- **全文搜索** - 搜索文档内容、标题和路径
- **相关性评分** - 智能排序搜索结果
- **文本片段** - 显示匹配的文本摘要
- **记忆搜索** - 搜索历史经验和学习记录

### 🔗 **地址生成**
- **自动地址** - 创建文档时自动生成访问链接
- **便于分享** - 一键获取文档分享地址
- **URL 编码** - 自动处理特殊字符

## 🎯 使用场景

### 👨‍💻 **开发者**
- **技术文档** - 管理 API 文档、架构设计等
- **学习笔记** - 记录技术学习和实践经验
- **项目记录** - 保存项目开发过程和决策
- **AI 辅助** - 让 AI 帮助整理和查找技术资料

### 📝 **内容创作者**
- **写作管理** - 组织文章、草稿和素材
- **知识库** - 建立个人或团队知识库
- **经验积累** - 记录创作经验和技巧

### 🏢 **团队协作**
- **文档共享** - 团队文档的集中管理
- **知识传承** - 保存团队的经验和最佳实践
- **项目文档** - 维护项目相关的所有文档

## 🛠️ 快速开始

### 1. 安装部署
```bash
# 克隆项目
git clone <repository-url>
cd misonote-markdown

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 2. 配置 Cursor MCP 集成
详细配置请参考：[Cursor MCP 配置指南](docs/CURSOR-MCP-SETUP)

### 3. 开始使用
- 访问 `http://localhost:3000` 使用 Web 界面
- 在 Cursor 中通过自然语言管理文档
- 让 AI 学习您的习惯并提供个性化服务

## 📁 文档目录

### 🔧 **配置指南**
- [`CURSOR-MCP-SETUP.md`](docs/CURSOR-MCP-SETUP) - Cursor MCP 集成配置
- [`QUICK-AI-SETUP.md`](docs/QUICK-AI-SETUP) - AI 助手快速配置
- [`cursor-ai-config.md`](docs/cursor-ai-config) - 详细的 AI 配置指南

### 🚀 **功能介绍**
- [`MCP-INTEGRATION.md`](docs/MCP-INTEGRATION) - MCP 协议集成说明
- [`URL-GENERATION-FEATURE.md`](docs/URL-GENERATION-FEATURE) - 地址生成功能
- [`ai-prompts/smart-mcp-assistant.md`](docs/ai-prompts/smart-mcp-assistant) - 智能助手提示词

### 🧠 **记忆系统**
- [`memories/`](docs/memories) - 记忆系统示例
- 支持多项目记忆管理
- 自动学习用户习惯和偏好

### 🔒 **安全配置**
- [`security/SECURITY-SETUP.md`](docs/security/SECURITY-SETUP) - 安全配置指南
- [`security/README-SECURITY.md`](docs/security/README-SECURITY) - 快速安全配置

### 📦 **部署相关**
- [`deployment/`](docs/deployment) - 部署指南和最佳实践

## 🎉 特色功能演示

### AI 对话管理文档
```
用户: 请创建一个 API 文档，包含用户认证部分
AI: 我来为您创建 API 文档...
    文档创建成功！
    在线地址: http://localhost:3000/docs/api-guide
    📖 点击地址即可查看文档
```

### 智能记忆学习
```
用户: 我发现使用 TypeScript 比 JavaScript 更好维护
AI: 这是个很好的洞察！让我记录到您的偏好中...
    已记录到 preferences - misonote 项目
```

### 智能搜索
```
用户: 搜索所有关于部署的文档
AI: 🔍 找到 5 个相关文档:
    1. deployment-guide.md - 相关性: 9/10
       在线地址: http://localhost:3000/docs/deployment-guide
    ...
```

## 🌟 为什么选择 Misonote Markdown？

1. **AI 原生设计** - 专为 AI 时代设计的文档系统
2. **学习能力** - 系统会学习并记住您的习惯
3. **无缝集成** - 与现代开发工具完美集成
4. **智能搜索** - 快速找到需要的信息
5. **便于分享** - 一键生成分享链接
6. **开源免费** - 完全开源，可自由定制

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**让 AI 成为您的文档管理助手，开启智能化的知识管理新时代！** 🚀