# Misonote Markdown - Docker Image

一个功能强大的 Markdown 文档预览和管理系统，支持实时预览、文档搜索、用户认证等功能。

## 🚀 快速开始

### 使用 Docker 运行

```bash
# 拉取并运行最新版本
docker run -d \
  --name misonote-markdown \
  -p 3001:3001 \
  -v $(pwd)/docs:/app/docs \
  -v $(pwd)/data:/app/data \
  your-username/misonote-markdown:latest
```

### 使用 Docker Compose

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  misonote-markdown:
    image: your-username/misonote-markdown:latest
    container_name: misonote-markdown
    ports:
      - "3001:3001"
    volumes:
      # 持久化文档目录
      - ./docs:/app/docs
      # 持久化数据目录
      - ./data:/app/data
      # 持久化日志目录
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      # 可选：自定义管理员密码（Base64 编码的 bcrypt 哈希）
      # - ADMIN_PASSWORD_HASH_BASE64=your_base64_encoded_hash
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  default:
    name: markdown-network
```

然后运行：

```bash
docker-compose up -d
```

## 🌟 主要功能

- **📝 Markdown 预览** - 支持 GitHub Flavored Markdown
- **🔍 全文搜索** - 快速查找文档内容
- **🔐 用户认证** - 安全的管理员登录系统
- **📁 文件管理** - 上传、编辑、删除文档
- **🎨 语法高亮** - 代码块语法高亮显示
- **📱 响应式设计** - 支持移动设备访问
- **🔄 实时预览** - 编辑时实时预览效果
- **📊 Mermaid 图表** - 支持流程图、时序图等

## 🔧 环境变量

| 变量名 | 描述 | 默认值 | 必需 |
|--------|------|--------|------|
| `NODE_ENV` | 运行环境 | `production` | 否 |
| `PORT` | 服务端口 | `3001` | 否 |
| `ADMIN_PASSWORD_HASH_BASE64` | 管理员密码哈希（Base64编码） | 自动生成 | 否 |
| `JWT_SECRET` | JWT 签名密钥 | 自动生成 | 否 |

## 📂 数据卷

建议挂载以下目录以实现数据持久化：

- `/app/docs` - Markdown 文档存储目录
- `/app/data` - 应用数据目录
- `/app/logs` - 日志文件目录

## 🏥 健康检查

容器内置健康检查，访问以下端点查看状态：

```bash
curl http://localhost:3001/api/health
```

响应示例：

```json
{
  "status": "healthy",
  "timestamp": "2025-05-30T10:00:00.000Z",
  "uptime": 3600.123,
  "environment": "production",
  "version": "0.1.0",
  "memory": {
    "used": 45,
    "total": 128
  },
  "checks": {
    "server": "ok"
  }
}
```

## 🔒 安全配置

### 自定义管理员密码

1. 生成密码哈希：

```bash
# 使用 Node.js 生成
node -e "
const bcrypt = require('bcryptjs');
const password = 'your-secure-password';
const hash = bcrypt.hashSync(password, 12);
const base64Hash = Buffer.from(hash).toString('base64');
console.log('ADMIN_PASSWORD_HASH_BASE64=' + base64Hash);
"
```

2. 在环境变量中设置：

```bash
docker run -d \
  --name misonote-markdown \
  -p 3001:3001 \
  -e ADMIN_PASSWORD_HASH_BASE64=your_base64_hash \
  your-username/misonote-markdown:latest
```

## 🏗️ 支持的架构

- `linux/amd64` - x86_64 架构（Intel/AMD 处理器）
- `linux/arm64` - ARM64 架构（Apple Silicon、树莓派等）

## 📋 可用标签

- `latest` - 最新稳定版本
- `v0.1.0` - 特定版本号
- `main` - 主分支最新构建

## 🔗 相关链接

- **GitHub 仓库**: [https://github.com/your-username/misonote-markdown](https://github.com/your-username/misonote-markdown)
- **问题反馈**: [GitHub Issues](https://github.com/your-username/misonote-markdown/issues)
- **文档**: [项目文档](https://github.com/your-username/misonote-markdown#readme)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](https://github.com/your-username/misonote-markdown/blob/main/LICENSE) 文件了解详情。

## 🤝 贡献

欢迎提交 Pull Request 和 Issue！请查看 [贡献指南](https://github.com/your-username/misonote-markdown/blob/main/CONTRIBUTING.md) 了解详情。
