# MCP (Model Context Protocol) 集成功能

## 🎯 功能概述

MCP 集成功能允许 AI 编辑器直接推送文档到私有化的 misonote-markdown 服务器，实现无缝的文档同步和协作。

## ✨ 主要特性

- 🔗 **多服务器支持**: 配置和管理多个 MCP 服务器
- 📤 **批量推送**: 支持单个文档或批量文档推送
- 🔐 **安全认证**: 基于 API 密钥的安全认证机制
- 📊 **推送历史**: 完整的推送历史记录和统计信息
- 🔄 **实时状态**: 服务器连接状态实时监控
- 🎣 **Webhook 支持**: 接收 AI 编辑器的 webhook 推送

## 🚀 快速开始

### 1. 配置 MCP 服务器

1. 登录管理后台 (`/admin`)
2. 点击紫色的服务器图标 (🖥️) 打开 MCP 服务器管理
3. 点击"添加服务器"按钮
4. 填写服务器信息：
   - **服务器名称**: 给服务器起一个易识别的名称
   - **服务器地址**: misonote-markdown 服务器的完整 URL
   - **API 密钥**: 服务器的认证密钥
   - **描述**: 可选的服务器描述
   - **激活状态**: 是否启用该服务器

### 2. 测试连接

配置完成后，点击测试图标 (🧪) 验证服务器连接：
- ✅ **已连接**: 服务器可正常访问
- ❌ **连接错误**: 检查服务器地址和 API 密钥
- ⏳ **测试中**: 正在进行连接测试

### 3. 推送文档

1. 点击橙色的发送图标 (📤) 打开文档推送界面
2. 选择目标服务器
3. 选择要推送的文档（支持多选）
4. 点击"开始推送"

## 📋 API 接口

### 服务器管理

```bash
# 获取所有服务器
GET /api/mcp/servers

# 添加服务器
POST /api/mcp/servers
{
  "name": "My Server",
  "url": "https://my-server.com",
  "apiKey": "your-api-key",
  "description": "My private server",
  "isActive": true
}

# 更新服务器
PUT /api/mcp/servers/{id}

# 删除服务器
DELETE /api/mcp/servers/{id}

# 测试连接
POST /api/mcp/servers/{id}/test
```

### 文档推送

```bash
# 推送文档
POST /api/mcp/push
{
  "serverId": "server-id",
  "documents": [
    {
      "path": "docs/example.md",
      "content": "# Example\n\nContent here...",
      "title": "Example Document",
      "operation": "create",
      "author": "Admin"
    }
  ],
  "operation": "batch"
}
```

### Webhook 接收

```bash
# 接收 AI 编辑器推送
POST /api/mcp/webhook
{
  "source": "ai-editor",
  "documents": [...],
  "metadata": {
    "editor": "cursor",
    "version": "1.0.0",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### 推送历史

```bash
# 获取推送历史
GET /api/mcp/history?limit=20&includeStats=true

# 清理历史记录
DELETE /api/mcp/history?daysToKeep=30
```

## 🔧 配置说明

### 环境变量

```bash
# MCP 相关配置（可选）
MCP_WEBHOOK_SECRET=your-webhook-secret
MCP_MAX_RETRIES=3
MCP_RETRY_DELAY=1000
MCP_CONNECTION_TIMEOUT=10000
```

### 数据存储

MCP 配置和历史数据存储在以下文件中：
- `data/mcp-config.json` - 服务器配置
- `data/mcp-history.json` - 推送历史记录

### Webhook 配置

如果需要接收 AI 编辑器的 webhook 推送：

1. 在 MCP 设置中启用 Webhook 功能
2. 配置 Webhook 密钥（可选，用于验证请求）
3. 将 webhook URL 配置到 AI 编辑器：`https://your-server.com/api/mcp/webhook`

## 🛡️ 安全考虑

1. **API 密钥管理**: 
   - 使用强密码作为 API 密钥
   - 定期更换 API 密钥
   - 不要在客户端代码中硬编码密钥

2. **网络安全**:
   - 使用 HTTPS 进行通信
   - 配置防火墙限制访问
   - 启用 Webhook 签名验证

3. **访问控制**:
   - 只有管理员可以配置 MCP 服务器
   - 推送操作需要认证
   - 定期审查推送历史

## 🔍 故障排除

### 常见问题

**Q: 连接测试失败怎么办？**
A: 检查以下项目：
- 服务器地址是否正确（包含协议 https://）
- API 密钥是否有效
- 目标服务器是否在线
- 网络连接是否正常

**Q: 推送失败怎么办？**
A: 查看推送历史中的错误信息：
- 检查文档格式是否正确
- 确认服务器有足够的存储空间
- 验证文档路径是否合法

**Q: Webhook 接收失败？**
A: 检查以下配置：
- Webhook 功能是否已启用
- 签名验证是否正确
- AI 编辑器的 webhook URL 配置

### 日志查看

查看系统日志获取详细错误信息：
```bash
# PM2 环境
pm2 logs docs-platform

# Docker 环境
docker logs misonote-markdown
```

## 📈 监控和统计

推送历史页面提供以下统计信息：
- 总推送次数和成功率
- 各服务器的推送统计
- 文档推送数量统计
- 错误分析和趋势

## 🔄 版本更新

MCP 功能会随着系统更新而持续改进。主要更新内容：

- v1.0.0: 基础 MCP 集成功能
- v1.1.0: 批量推送和历史记录
- v1.2.0: Webhook 支持和统计功能

## 📞 技术支持

如果遇到问题或需要技术支持，请：
1. 查看系统日志获取错误详情
2. 检查网络连接和服务器状态
3. 参考本文档的故障排除部分
4. 联系系统管理员或技术支持团队
