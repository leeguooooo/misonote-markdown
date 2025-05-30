---
title: "Misonote Markdown 2.0 发布说明"
---

# 🚀 Misonote Markdown 2.0 发布说明

## 🎉 重大版本升级

**发布日期**: 2025-05-30  
**版本**: 2.0.0  
**代号**: AI Native Revolution

## ✨ 核心新功能

### 🤖 **AI 原生集成**
- **MCP 协议支持**: 通过 Model Context Protocol 与 Cursor 编辑器深度集成
- **自然语言交互**: 通过对话方式管理文档系统
- **智能助手**: AI 可以直接创建、搜索、更新文档

### 🧠 **智能记忆系统**
- **四大记忆类型**:
  - `habits.md` - 用户习惯记录
  - `preferences.md` - 用户偏好管理
  - `retrospectives.md` - 复盘记录
  - `insights.md` - 洞察学习
- **多项目支持**: 为不同项目维护独立的记忆空间
- **自动学习**: AI 主动记录用户的习惯和偏好

### 🔍 **智能搜索增强**
- **全方位搜索**: 支持文档内容、标题、路径搜索
- **相关性评分**: 智能排序搜索结果
- **文本片段提取**: 显示匹配的文本摘要
- **记忆搜索**: 搜索历史经验和学习记录

### 🔗 **文档地址生成**
- **自动地址生成**: 创建文档时自动生成访问链接
- **便于分享**: 一键获取文档分享地址
- **URL 编码**: 自动处理特殊字符

## 🛠️ 技术升级

### 📦 **依赖更新**
- **Next.js**: 升级到 15.3.2
- **React**: 升级到 19.0.0
- **新增依赖**: MCP 协议支持库

### 🐳 **Docker 增强**
- **MCP 客户端支持**: Docker 部署时自动包含 MCP 客户端
- **双服务架构**: 主服务 + MCP 客户端服务
- **新增命令**:
  - `pnpm docker:compose:mcp` - 启动包含 MCP 的完整服务
  - `pnpm docker:deploy:mcp` - 部署 MCP 集成版本
  - `pnpm docker:logs:mcp` - 查看 MCP 服务日志

### 🔧 **配置优化**
- **环境变量**: 新增 MCP 相关配置
- **API 密钥**: 支持 MCP 客户端认证
- **服务发现**: 容器间服务通信优化

## 🎯 新增 API 端点

### MCP 文档管理
- `GET /api/mcp/documents` - 获取文档列表和内容
- `POST /api/mcp/documents` - 创建/更新文档
- `GET /api/mcp/capabilities` - 获取服务器能力

### 搜索功能
- 支持 `search` 参数进行全文搜索
- 支持 `searchType` 参数指定搜索类型
- 返回相关性评分和文本片段

### 地址生成
- 所有文档操作都返回 `viewUrl` 和 `fullUrl`
- 支持特殊字符的 URL 编码
- 自动生成分享链接

## 🎨 界面更新

### 🏠 **主页改版**
- **AI 功能展示**: 突出 MCP 集成和智能记忆功能
- **版本标识**: 更新为 "Misonote Markdown 2.0"
- **技术标签**: 新增 "MCP 协议" 和 "AI 原生" 标签
- **功能演示**: 添加 AI 对话示例

### 📱 **响应式优化**
- 优化移动端 AI 功能展示
- 改进触摸交互体验
- 增强视觉效果

## 🔄 迁移指南

### 从 1.x 升级到 2.0

#### 1. **环境准备**
```bash
# 更新依赖
pnpm install

# 安装 MCP 客户端依赖
cd mcp-client && npm install
```

#### 2. **配置更新**
```bash
# 添加 MCP 相关环境变量
echo "MCP_SERVER_URL=http://localhost:3000" >> .env
echo "MCP_API_KEY=your-api-key" >> .env
```

#### 3. **Cursor 配置**
参考 [Cursor MCP 配置指南](docs/CURSOR-MCP-SETUP) 进行配置

#### 4. **Docker 部署**
```bash
# 标准部署
pnpm docker:compose

# 包含 MCP 的完整部署
pnpm docker:compose:mcp
```

## 🐛 修复问题

- 修复文档搜索的性能问题
- 优化大文件处理
- 改进错误处理和用户反馈
- 修复移动端兼容性问题

## ⚠️ 破坏性变更

### API 变更
- 文档 API 响应格式新增 `viewUrl` 和 `fullUrl` 字段
- 搜索 API 新增相关性评分和文本片段

### 配置变更
- 新增 MCP 相关配置项
- Docker 配置文件结构调整

## 🔮 未来计划

### v2.1 计划功能
- **批量操作**: 支持批量文档管理
- **模板系统**: 智能文档模板
- **协作增强**: 实时协作编辑
- **API 扩展**: 更多 MCP 工具

### v2.2 计划功能
- **插件系统**: 支持第三方插件
- **主题定制**: 可定制的 UI 主题
- **数据分析**: 使用统计和分析
- **移动应用**: 原生移动应用

## 🙏 致谢

感谢所有贡献者和用户的支持！特别感谢：

- **MCP 协议团队**: 提供了优秀的 AI 集成标准
- **Cursor 团队**: 提供了强大的 AI 编辑器
- **社区贡献者**: 提供了宝贵的反馈和建议

## 📞 支持

如果您在升级过程中遇到问题，请：

1. 查看 [配置指南](docs/CURSOR-MCP-SETUP)
2. 提交 [GitHub Issue](https://github.com/your-repo/issues)
3. 加入我们的讨论群

---

**🚀 欢迎体验 Misonote Markdown 2.0 - AI 原生文档管理的新时代！**