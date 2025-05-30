# 🐳 Docker 部署支持

## 🎯 为什么选择 Docker 而不是 Cloudflare？

### 优势对比

| 特性 | Docker | Cloudflare 双模式 |
|------|--------|-------------------|
| **维护成本** | 低 | 高 |
| **部署简单度** | 极简 | 复杂 |
| **兼容性** | 完美 | 需适配 |
| **学习曲线** | 平缓 | 陡峭 |
| **用户覆盖** | 广泛 | 特定群体 |

## 🚀 实现方案

### 1. 多阶段 Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM base AS builder
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001
CMD ["npm", "start"]
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  misonote-markdown:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - ./docs:/app/docs
      - ./data:/app/data
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### 3. 一键部署脚本

```bash
#!/bin/bash
# scripts/docker-deploy.sh

echo "🐳 Docker 一键部署"
echo "=================="

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 请先安装 Docker"
    exit 1
fi

# 构建镜像
echo "📦 构建 Docker 镜像..."
docker build -t misonote-markdown .

# 启动容器
echo "🚀 启动容器..."
docker-compose up -d

echo "✅ 部署完成！"
echo "📱 访问: http://localhost:3001"
```

## 📋 新增命令

```json
{
  "scripts": {
    "docker:build": "docker build -t misonote-markdown .",
    "docker:run": "docker run -p 3001:3001 misonote-markdown",
    "docker:compose": "docker-compose up -d",
    "docker:deploy": "bash scripts/docker-deploy.sh"
  }
}
```

## 🎯 用户体验

### 超简单部署
```bash
# 用户只需要三条命令
git clone https://github.com/leeguooooo/markdown-site.git
cd markdown-site
pnpm docker:deploy
```

### 支持多种环境
- ✅ 本地开发
- ✅ 云服务器
- ✅ VPS
- ✅ 企业内网
- ✅ 树莓派

## 📊 工作量对比

| 方案 | 开发时间 | 维护成本 | 用户受益 |
|------|----------|----------|----------|
| **Docker** | 0.5天 | 极低 | 高 |
| **Cloudflare** | 4-5天 | 高 | 中等 |

## 🚀 实施建议

1. **立即实现 Docker 支持** (半天)
2. **完善现有功能** (持续)
3. **收集用户反馈** (观察 Cloudflare 需求)
4. **未来再考虑 Cloudflare** (如果需求强烈)
