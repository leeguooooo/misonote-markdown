# MCP 服务端设置指南

## 🎯 概述

misonote-markdown 现在支持作为 MCP (Model Context Protocol) 服务端，为 AI 编辑器提供文档管理服务。本指南将帮助您设置和配置 MCP 服务端功能。

## ✨ 主要功能

### 🔐 API 密钥管理
- 生成和管理 API 密钥
- 权限控制和访问管理
- 使用统计和监控
- 自动过期和清理

### 📄 文档操作 API
- 获取文档列表
- 创建/更新文档
- 删除文档
- 支持元数据和前置内容

### 🔄 批量操作
- 批量文档推送
- 批量操作历史记录
- 错误处理和重试

### 🎣 Webhook 支持
- 接收 AI 编辑器推送
- 签名验证
- 自动文档处理

## 🚀 快速开始

### 1. 启动服务

```bash
# 开发环境
pnpm dev

# 生产环境
pnpm build
pnpm start
```

### 2. 创建 API 密钥

1. 访问管理后台：`http://localhost:3000/admin`
2. 点击蓝色钥匙图标 (🔑) 打开 API 密钥管理
3. 点击"创建 API 密钥"
4. 填写密钥信息：
   - **名称**: 给密钥起一个易识别的名称
   - **权限**: 选择所需权限（read, write, mcp, admin, *）
   - **速率限制**: 设置每小时请求限制
   - **过期时间**: 可选的过期日期
   - **描述**: 可选的描述信息

5. 保存后立即复制密钥（只显示一次）

### 3. 测试 API 连接

```bash
# 健康检查
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/health

# 获取服务器能力
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/mcp/capabilities

# 获取文档列表
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/mcp/documents
```

## 📋 API 接口文档

### 认证方式

支持多种认证方式：

```bash
# 方式 1: Authorization Header (推荐)
Authorization: Bearer mcp_your_api_key_here

# 方式 2: X-API-Key Header
X-API-Key: mcp_your_api_key_here

# 方式 3: 查询参数 (不推荐)
?api_key=mcp_your_api_key_here
```

### 核心端点

#### 1. 健康检查
```http
GET /api/health
```

响应包含服务器状态、数据库状态、服务器能力等信息。

#### 2. 服务器能力
```http
GET /api/mcp/capabilities
```

返回 MCP 服务器支持的功能和限制。

#### 3. 文档管理

**获取文档列表**
```http
GET /api/mcp/documents?path=folder&recursive=true
```

**创建文档**
```http
POST /api/mcp/documents
Content-Type: application/json

{
  "path": "example/document",
  "content": "# Hello World\n\nThis is a test document.",
  "title": "Hello World",
  "operation": "create",
  "metadata": {
    "author": "AI Assistant",
    "tags": ["test", "example"]
  }
}
```

**更新文档**
```http
POST /api/mcp/documents
Content-Type: application/json

{
  "path": "example/document",
  "content": "# Updated Content",
  "operation": "update"
}
```

**删除文档**
```http
DELETE /api/mcp/documents
Content-Type: application/json

{
  "path": "example/document"
}
```

### 响应格式

所有 API 响应都遵循统一格式：

```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

错误响应：
```json
{
  "success": false,
  "error": "错误描述",
  "details": "详细错误信息",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 配置选项

### 环境变量

```bash
# 数据库配置（自动创建 SQLite）
# 无需额外配置

# API 密钥设置
MCP_DEFAULT_RATE_LIMIT=1000  # 默认速率限制

# Webhook 配置
MCP_WEBHOOK_SECRET=your_webhook_secret  # Webhook 签名密钥
```

### 权限系统

API 密钥支持以下权限：

- **read**: 读取文档和列表
- **write**: 创建、更新、删除文档
- **mcp**: MCP 协议相关操作
- **admin**: 管理员权限
- **\***: 所有权限

## 🛡️ 安全考虑

### API 密钥安全
1. 使用强随机密钥（自动生成）
2. 定期轮换密钥
3. 设置合理的过期时间
4. 监控使用情况

### 网络安全
1. 使用 HTTPS 进行通信
2. 配置防火墙限制访问
3. 启用 Webhook 签名验证

### 访问控制
1. 最小权限原则
2. 定期审查权限
3. 监控异常访问

## 📊 监控和日志

### API 使用统计
- 在 API 密钥管理界面查看使用次数
- 最后使用时间
- 错误统计

### 日志记录
系统自动记录：
- API 请求日志
- 错误日志
- 安全事件日志

### 健康监控
定期检查：
- 数据库连接状态
- 文件系统状态
- 服务响应时间

## 🔍 故障排除

### 常见问题

**Q: API 密钥认证失败**
A: 检查密钥格式、权限设置和过期时间

**Q: 文档创建失败**
A: 检查路径格式、文件权限和内容大小限制

**Q: 数据库连接错误**
A: 检查 data 目录权限和磁盘空间

### 调试技巧

1. 查看健康检查端点状态
2. 检查系统日志
3. 验证 API 密钥权限
4. 测试网络连接

## 📚 集成示例

### Cursor 编辑器集成

```json
{
  "mcpServers": {
    "misonote-markdown": {
      "command": "node",
      "args": ["path/to/mcp-client.js"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:3000",
        "MCP_API_KEY": "mcp_your_api_key_here"
      }
    }
  }
}
```

### 自定义客户端

```javascript
const axios = require('axios');

class MisonoteClient {
  constructor(baseURL, apiKey) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createDocument(path, content, metadata = {}) {
    const response = await this.client.post('/api/mcp/documents', {
      path,
      content,
      operation: 'create',
      metadata
    });
    return response.data;
  }

  async getDocuments(path = '') {
    const response = await this.client.get('/api/mcp/documents', {
      params: { path }
    });
    return response.data;
  }
}
```

## 🚀 下一步

1. 配置 AI 编辑器连接
2. 设置 Webhook 集成
3. 配置监控和告警
4. 制定备份策略

更多详细信息请参考 [MCP 集成文档](./MCP-INTEGRATION.md)。
