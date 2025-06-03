# 🐳 Misonote Markdown - Docker 快速开始

## 🚀 30 秒快速体验

只需要一条命令，无需安装任何依赖：

```bash
docker run -d --name misonote-markdown -p 3001:3001 leeguo/misonote-markdown:latest
```

然后打开浏览器访问：http://localhost:3001

## 📦 镜像信息

- **镜像名称**: `leeguo/misonote-markdown`
- **支持架构**: AMD64 (Intel/AMD) + ARM64 (Apple Silicon)
- **基础镜像**: Alpine Linux (轻量级)
- **镜像大小**: 约 200MB
- **启动时间**: 通常 < 5 秒

## 🔧 常用命令

### 基础运行

```bash
# 最简单的运行方式
docker run -d -p 3001:3001 leeguo/misonote-markdown:latest

# 指定容器名称
docker run -d --name my-markdown -p 3001:3001 leeguo/misonote-markdown:latest

# 自定义端口
docker run -d -p 8080:3001 leeguo/misonote-markdown:latest
```

### 数据持久化

```bash
# 持久化文档和数据
docker run -d \
  --name misonote-markdown \
  -p 3001:3001 \
  -v $(pwd)/docs:/app/docs \
  -v $(pwd)/data:/app/data \
  leeguo/misonote-markdown:latest

# Windows 用户
docker run -d \
  --name misonote-markdown \
  -p 3001:3001 \
  -v %cd%/docs:/app/docs \
  -v %cd%/data:/app/data \
  leeguo/misonote-markdown:latest
```

### 容器管理

```bash
# 查看运行状态
docker ps

# 查看日志
docker logs misonote-markdown

# 实时查看日志
docker logs -f misonote-markdown

# 停止容器
docker stop misonote-markdown

# 启动容器
docker start misonote-markdown

# 重启容器
docker restart misonote-markdown

# 删除容器
docker rm -f misonote-markdown
```

## 🔐 安全配置

### 默认登录信息

- **管理后台**: http://localhost:3001/admin
- **默认用户名**: admin
- **默认密码**: admin123

### 修改管理员密码

```bash
# 进入容器
docker exec -it misonote-markdown sh

# 运行密码生成工具
node scripts/generate-password.js

# 按提示输入新密码，然后重启容器
exit
docker restart misonote-markdown
```

## 📁 目录结构

容器内重要目录：

```
/app/
├── docs/          # 文档存储目录（建议挂载）
├── data/          # 应用数据目录（建议挂载）
├── logs/          # 日志文件目录
├── public/        # 静态资源
└── .next/         # Next.js 构建文件
```

## 🔧 高级配置

### 环境变量

```bash
docker run -d \
  --name misonote-markdown \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -v $(pwd)/docs:/app/docs \
  leeguo/misonote-markdown:latest
```

### 网络配置

```bash
# 创建自定义网络
docker network create markdown-net

# 在自定义网络中运行
docker run -d \
  --name misonote-markdown \
  --network markdown-net \
  -p 3001:3001 \
  leeguo/misonote-markdown:latest
```

## 🐳 Docker Compose

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  misonote-markdown:
    image: leeguo/misonote-markdown:latest
    container_name: misonote-markdown
    ports:
      - "3001:3001"
    volumes:
      - ./docs:/app/docs
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

运行：

```bash
# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 🔍 故障排除

### 常见问题

**Q: 容器启动失败**
```bash
# 查看详细错误信息
docker logs misonote-markdown

# 检查端口是否被占用
netstat -tulpn | grep 3001
```

**Q: 无法访问管理后台**
```bash
# 确认容器正在运行
docker ps | grep misonote-markdown

# 检查健康状态
curl http://localhost:3001/api/health
```

**Q: 数据丢失**
```bash
# 确保正确挂载了数据目录
docker inspect misonote-markdown | grep -A 10 "Mounts"
```

### 性能优化

```bash
# 限制内存使用
docker run -d \
  --name misonote-markdown \
  --memory=512m \
  -p 3001:3001 \
  leeguo/misonote-markdown:latest

# 设置重启策略
docker run -d \
  --name misonote-markdown \
  --restart=unless-stopped \
  -p 3001:3001 \
  leeguo/misonote-markdown:latest
```

## 📚 更多资源

- [项目主页](https://github.com/leeguooooo/misonote-markdown)
- [Docker Hub](https://hub.docker.com/r/leeguo/misonote-markdown)
- [完整文档](https://github.com/leeguooooo/misonote-markdown/blob/main/README.md)
- [问题反馈](https://github.com/leeguooooo/misonote-markdown/issues)

---

**享受使用 Misonote Markdown！** 🎉
