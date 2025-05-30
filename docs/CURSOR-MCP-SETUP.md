# Cursor MCP 配置指南

## 🎯 概述

本指南将帮助您在 Cursor 编辑器中配置 misonote-markdown MCP 服务器，实现 AI 与文档系统的无缝集成。

## 📋 前置条件

1. **运行中的 misonote-markdown 服务器**
   ```bash
   # 启动服务器
   pnpm dev  # 开发环境
   # 或
   pnpm build && pnpm start  # 生产环境
   ```

2. **有效的 API 密钥**
   - 访问管理后台：`http://localhost:3000/admin`
   - 点击蓝色钥匙图标 (🔑)
   - 创建新的 API 密钥，确保包含以下权限：
     - `read` - 读取文档
     - `write` - 创建/更新/删除文档
     - `mcp` - MCP 协议访问

3. **Cursor 编辑器**
   - 版本要求：支持 MCP 的版本
   - 下载地址：https://cursor.sh/

## 🚀 快速配置

### 方法 1: 克隆 MCP 客户端（推荐）

1. **克隆 MCP 客户端到本地**
   ```bash
   # 克隆 MCP 客户端项目
   git clone https://github.com/leeguooooo/misonote-mcp-client.git
   cd misonote-mcp-client

   # 安装依赖
   npm install
   ```

2. **配置 Cursor**
   在 Cursor 设置中添加以下配置：
   ```json
   {
     "mcpServers": {
       "misonote-markdown": {
         "command": "node",
         "args": ["/absolute/path/to/misonote-mcp-client/misonote-mcp-client.js"],
         "env": {
           "MCP_SERVER_URL": "http://localhost:3001",
           "MCP_API_KEY": "mcp_your_api_key_here"
         }
       }
     }
   }
   ```

### 方法 2: 使用项目内置版本

如果你已经克隆了 misonote-markdown 项目：

```json
{
  "mcpServers": {
    "misonote-markdown": {
      "command": "node",
      "args": ["/path/to/misonote-markdown/mcp-client/misonote-mcp-client.js"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:3001",
        "MCP_API_KEY": "mcp_your_api_key_here"
      }
    }
  }
}
```

**重要说明**:
- 请将 `/absolute/path/to/` 替换为实际的绝对路径
- 推荐使用独立的 MCP 客户端仓库：`https://github.com/leeguooooo/misonote-mcp-client`
- 如果使用 Docker 部署，服务器地址通常是 `http://localhost:3001`
- 如果使用开发模式，服务器地址通常是 `http://localhost:3000`

## ⚙️ 详细配置步骤

### 1. 获取 API 密钥

1. 启动 misonote-markdown 服务器
2. 访问 `http://localhost:3000/admin`
3. 使用管理员密码登录（默认：`admin123`）
4. 点击蓝色钥匙图标 (🔑) 打开 API 密钥管理
5. 点击"创建 API 密钥"
6. 填写配置：
   - **名称**: `Cursor MCP Client`
   - **权限**: 选择 `read`, `write`, `mcp`
   - **速率限制**: `1000`（每小时）
   - **描述**: `用于 Cursor 编辑器的 MCP 连接`
7. 保存并立即复制生成的密钥（只显示一次）

### 2. 配置 Cursor

1. 打开 Cursor 编辑器
2. 按 `Cmd/Ctrl + ,` 打开设置
3. 搜索 "MCP" 或找到 "MCP Servers" 部分
4. 添加新的服务器配置（使用上面的 JSON 配置）
5. 将 `mcp_your_api_key_here` 替换为实际的 API 密钥
6. 保存设置并重启 Cursor

### 3. 验证连接

重启 Cursor 后，你应该能看到 MCP 服务器连接状态。可以通过以下方式测试：

1. 在 Cursor 中开始新对话
2. 询问 AI："请列出所有文档"
3. AI 应该能够调用 MCP 工具并返回文档列表

## 🛠️ 可用功能

配置完成后，你可以通过自然语言与 AI 交互来管理文档：

### 文档查询
```
请列出所有文档
请显示 docs 目录下的文档
请获取 README.md 的内容
```

### 文档创建
```
请创建一个新文档 docs/api.md，内容是 API 使用说明
帮我创建一个项目介绍文档
```

### 文档更新
```
请更新 docs/README.md，添加安装说明
帮我优化这个文档的结构
```

### 文档删除
```
请删除 docs/old-file.md
清理不需要的临时文档
```

### 服务器信息
```
请显示服务器状态
检查文档系统的健康状况
```

### 知识库搜索
```
搜索包含 "API" 的文档
搜索标题中包含 "配置" 的文档
在 docs 目录下搜索 "安装"
搜索路径中包含 "security" 的文档
帮我找到关于 MCP 的所有文档
搜索包含 "Docker" 的文档并显示摘要
```

## 🔧 高级配置

### 环境变量配置

你可以通过环境变量来配置更多选项：

```json
{
  "mcpServers": {
    "misonote-markdown": {
      "command": "node",
      "args": ["/path/to/misonote-mcp-client/misonote-mcp-client.js"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:3001",
        "MCP_API_KEY": "mcp_your_api_key_here",
        "DEBUG": "1",
        "TIMEOUT": "15000"
      }
    }
  }
}
```

### 多服务器配置

如果你有多个 misonote-markdown 实例：

```json
{
  "mcpServers": {
    "misonote-dev": {
      "command": "node",
      "args": ["/path/to/misonote-mcp-client/misonote-mcp-client.js"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:3000",
        "MCP_API_KEY": "mcp_dev_key_here"
      }
    },
    "misonote-prod": {
      "command": "node",
      "args": ["/path/to/misonote-mcp-client/misonote-mcp-client.js"],
      "env": {
        "MCP_SERVER_URL": "https://docs.yourcompany.com:3001",
        "MCP_API_KEY": "mcp_prod_key_here"
      }
    }
  }
}
```

## 🔍 故障排除

### 常见问题

**Q: Cursor 显示 MCP 服务器连接失败**
A: 检查以下项目：
1. misonote-markdown 服务器是否正在运行
2. API 密钥是否正确且有效
3. 网络连接是否正常
4. 服务器地址是否正确

**Q: AI 无法调用文档工具**
A: 确认：
1. API 密钥具有 `mcp` 权限
2. MCP 服务器在 Cursor 中显示为已连接
3. 重启 Cursor 编辑器

**Q: 权限被拒绝**
A: 检查 API 密钥权限：
- 需要 `read` 权限来读取文档
- 需要 `write` 权限来创建/更新/删除文档
- 需要 `mcp` 权限来访问 MCP API

### 调试技巧

1. **启用调试模式**
   在环境变量中添加 `"DEBUG": "1"`

2. **检查服务器状态**
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
     http://localhost:3000/api/health
   ```

3. **测试 API 连接**
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
     http://localhost:3000/api/mcp/capabilities
   ```

4. **查看 Cursor 日志**
   - 打开 Cursor 开发者工具
   - 查看控制台输出
   - 检查网络请求

## 📚 使用示例

### 示例对话 1: 文档管理
```
用户: 请列出所有文档，然后帮我创建一个新的 API 文档

AI: 我来为你获取文档列表并创建新的 API 文档。

[调用 list_documents 工具]

当前有以下文档：
- README.md
- docs/installation.md
- docs/configuration.md

现在我来创建新的 API 文档：

[调用 create_document 工具]

API 文档已成功创建在 docs/api.md，包含了基本的 API 使用说明。
```

### 示例对话 2: 内容优化
```
用户: 请获取 README.md 的内容，然后帮我优化结构

AI: 我先获取 README.md 的内容：

[调用 get_document 工具]

我看到了你的 README.md 内容。让我为你优化结构：

[调用 update_document 工具]

已经优化了 README.md 的结构，主要改进包括：
1. 添加了清晰的目录结构
2. 改进了安装说明
3. 增加了使用示例
```

### 示例对话 3: 知识库搜索
```
用户: 帮我找到所有关于 API 的文档

AI: 我来为你搜索所有包含 "API" 的文档：

[调用 search_documents 工具]

🔍 搜索结果

关键词: "API"
搜索类型: content
找到 18 个相关文档:

1. **complete-api-reference.md**
   路径: 项目文档/管理后台/直播任务管理/complete-api-reference
   相关性: 18/10
   摘要: # SimuLive API 接口文档...

2. **README.md**
   路径: 示例文档/api/README
   相关性: 8/10
   摘要: # API 文档...

用户: 请获取第一个文档的详细内容

AI: 我来获取 complete-api-reference.md 的详细内容：

[调用 get_document 工具]

这是一个完整的 API 接口文档，包含了...
```

## 🚀 下一步

配置完成后，你可以：

1. **探索更多功能**: 尝试不同的文档操作命令
2. **自定义工作流**: 结合 AI 能力创建文档模板
3. **团队协作**: 分享配置给团队成员
4. **扩展功能**: 根据需要添加更多 MCP 工具

## 📞 支持

如果遇到问题：

1. 查看 [MCP 集成文档](./MCP-INTEGRATION.md)
2. 检查 [服务端设置指南](./MCP-SERVER-SETUP.md)
3. 在项目 GitHub 页面提交 Issue

祝你使用愉快！🎉
