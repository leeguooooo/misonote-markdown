# Misonote Markdown MCP Client

这是一个 MCP (Model Context Protocol) 客户端，用于连接 misonote-markdown 服务器，为 AI 编辑器（如 Cursor）提供文档管理功能。

## 功能特性

- 📄 文档列表查询
- 📝 创建和更新文档
- 🗑️ 删除文档
- 📊 服务器状态查询
- 🔍 文档内容获取

## 安装

```bash
npm install misonote-mcp-client
```

## 配置

### 环境变量

```bash
# 必需：API 密钥
export MCP_API_KEY="mcp_your_api_key_here"

# 可选：服务器地址（默认 http://localhost:3000）
export MCP_SERVER_URL="https://your-server.com"
```

### Cursor 配置

在 Cursor 的设置中添加 MCP 服务器配置：

1. 打开 Cursor 设置
2. 找到 "MCP Servers" 部分
3. 添加新的服务器配置：

```json
{
  "mcpServers": {
    "misonote-markdown": {
      "command": "npx",
      "args": ["misonote-mcp-client"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:3000",
        "MCP_API_KEY": "mcp_your_api_key_here"
      }
    }
  }
}
```

或者如果你全局安装了：

```json
{
  "mcpServers": {
    "misonote-markdown": {
      "command": "misonote-mcp",
      "env": {
        "MCP_SERVER_URL": "http://localhost:3000",
        "MCP_API_KEY": "mcp_your_api_key_here"
      }
    }
  }
}
```

## 获取 API 密钥

1. 访问你的 misonote-markdown 管理后台：`http://localhost:3000/admin`
2. 登录管理员账户
3. 点击蓝色钥匙图标 (🔑) 打开 API 密钥管理
4. 点击"创建 API 密钥"
5. 配置权限（至少需要 `read`, `write`, `mcp` 权限）
6. 保存并复制生成的密钥

## 可用工具

### list_documents
获取文档列表

**参数:**
- `path` (可选): 指定路径下的文档

**示例:**
```
请列出所有文档
```

### get_document
获取文档内容

**参数:**
- `path`: 文档路径

**示例:**
```
请获取 docs/README.md 的内容
```

### create_document
创建新文档

**参数:**
- `path`: 文档路径
- `content`: 文档内容
- `title` (可选): 文档标题
- `metadata` (可选): 元数据

**示例:**
```
请创建一个新文档 docs/example.md，内容是 "# Hello World"
```

### update_document
更新现有文档

**参数:**
- `path`: 文档路径
- `content`: 新的文档内容
- `title` (可选): 文档标题
- `metadata` (可选): 元数据

**示例:**
```
请更新 docs/example.md 的内容
```

### delete_document
删除文档

**参数:**
- `path`: 文档路径

**示例:**
```
请删除 docs/example.md
```

### get_server_info
获取服务器信息和能力

**示例:**
```
请显示服务器信息
```

### search_documents
搜索文档内容、标题或路径

**参数:**
- `query`: 搜索关键词
- `searchType` (可选): 搜索类型 - content（内容）、title（标题）、path（路径）
- `path` (可选): 限制搜索范围的路径

**示例:**
```
搜索包含 "API" 的文档
搜索标题中包含 "配置" 的文档
在 docs 目录下搜索 "安装"
搜索路径中包含 "security" 的文档
```

## 🧠 记忆系统

### add_memory
添加记忆条目（用户习惯、偏好、复盘等）

**参数:**
- `type`: 记忆类型 - habits（习惯）、preferences（偏好）、retrospectives（复盘）、insights（洞察）
- `content`: 记忆内容
- `project` (可选): 项目名称，默认为 default
- `tags` (可选): 标签，用逗号分隔

**示例:**
```
记录一个习惯：我喜欢在代码中使用详细的注释
记录偏好：我更喜欢使用 TypeScript 而不是 JavaScript
添加复盘：今天的部署出现了问题，原因是环境变量配置错误
记录洞察：使用 MCP 可以大大提高开发效率
```

### get_memories
获取记忆内容

**参数:**
- `project` (可选): 项目名称，默认为 default
- `type` (可选): 记忆类型，不指定则获取所有类型

**示例:**
```
获取我的所有记忆
获取 misonote 项目的记忆
获取我的编程习惯
获取项目复盘记录
```

### search_memories
搜索记忆内容

**参数:**
- `query`: 搜索关键词
- `project` (可选): 项目名称
- `type` (可选): 记忆类型

**示例:**
```
搜索关于 "TypeScript" 的记忆
在 misonote 项目中搜索 "部署" 相关的记忆
搜索所有复盘记录中的 "错误"
```

### list_memory_projects
列出所有记忆项目

**示例:**
```
显示所有记忆项目
列出我记录过的项目
```

## 使用示例

配置完成后，你可以在 Cursor 中直接与 AI 对话来管理文档：

```
用户: 请列出所有文档
AI: 我来为你获取文档列表...

用户: 创建一个新的 API 文档，路径是 docs/api.md
AI: 我来为你创建这个文档...

用户: 请获取 docs/README.md 的内容并帮我优化
AI: 我先获取文档内容，然后为你提供优化建议...

用户: 记录我的编程习惯：我喜欢使用函数式编程风格
AI: 我来为你记录这个编程习惯...

用户: 获取我在 misonote 项目的所有记忆
AI: 我来获取你在 misonote 项目的记忆记录...

用户: 搜索关于 "部署" 的复盘记录
AI: 我来搜索你的部署相关复盘记录...
```

## 故障排除

### 常见问题

**Q: 连接失败**
A: 检查以下项目：
- 服务器是否正在运行
- API 密钥是否正确
- 网络连接是否正常
- 服务器地址是否正确

**Q: 权限不足**
A: 确保 API 密钥具有必要的权限：
- `read`: 读取文档
- `write`: 创建/更新/删除文档
- `mcp`: MCP 协议访问

**Q: Cursor 无法识别 MCP 服务器**
A: 检查配置格式是否正确，重启 Cursor

### 调试

启用调试模式：

```bash
DEBUG=1 npx misonote-mcp-client
```

## 开发

```bash
# 克隆项目
git clone https://github.com/misonote/markdown-preview
cd markdown-preview/mcp-client

# 安装依赖
npm install

# 运行
npm start
```

## 许可证

MIT License
