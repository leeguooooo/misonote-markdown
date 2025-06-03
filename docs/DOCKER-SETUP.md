# 🐳 Docker 部署指南

## 📋 **回答你的问题**

### 1. **Docker 中有自动初始化数据库吗？**
✅ **有！** 通过 Docker Compose 配置：
- PostgreSQL 容器启动时会自动执行 `lib/db/schema.sql`
- 自动创建所有必要的数据库表
- 无需手动运行初始化脚本

### 2. **删除 Docker 后数据还在吗？**
✅ **数据会保留！** 通过 Docker volumes：
- `postgres_data` - 数据库数据持久化
- `docs_data` - 文档数据持久化  
- `logs_data` - 日志数据持久化
- 即使删除容器，数据卷仍然存在

### 3. **如何彻底删除数据？**
```bash
# 停止并删除容器
docker-compose down

# 删除数据卷（⚠️ 会丢失所有数据）
docker-compose down -v
```

## 🚀 **快速启动**

### 方法一：使用现有镜像（推荐）
```bash
# 1. 启动服务（PostgreSQL + Misonote）
docker-compose up -d

# 2. 查看启动状态
docker-compose ps

# 3. 查看日志
docker-compose logs -f misonote-markdown
```

### 方法二：本地构建
```bash
# 1. 构建镜像
docker build -t misonote-markdown:postgres .

# 2. 启动服务
docker-compose up -d
```

## 🔧 **环境变量配置**

创建 `.env.docker` 文件：
```bash
# 数据库密码
DB_PASSWORD=your_secure_db_password

# 管理员密码
ADMIN_PASSWORD=your_admin_password

# JWT 密钥
JWT_SECRET=your-super-secret-jwt-key

# 可选：公开访问地址
# NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

然后使用：
```bash
docker-compose --env-file .env.docker up -d
```

## 📊 **服务访问**

启动成功后可以访问：

- **Misonote 应用**: http://localhost:3001
- **管理后台**: http://localhost:3001/admin
- **PostgreSQL**: localhost:5432
- **可选 Nginx**: http://localhost (需要 `--profile nginx`)

## 🔍 **健康检查**

```bash
# 检查所有服务状态
docker-compose ps

# 检查应用健康状态
curl http://localhost:3001/api/health

# 检查数据库连接
docker-compose exec postgres pg_isready -U postgres -d misonote
```

## 📝 **常用命令**

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 进入应用容器
docker-compose exec misonote-markdown sh

# 进入数据库容器
docker-compose exec postgres psql -U postgres -d misonote

# 备份数据库
docker-compose exec postgres pg_dump -U postgres misonote > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres misonote < backup.sql
```

## 🔒 **生产环境建议**

1. **修改默认密码**：
   ```bash
   # 设置强密码
   export ADMIN_PASSWORD="your_very_secure_password"
   export DB_PASSWORD="your_secure_db_password"
   ```

2. **使用 HTTPS**：
   ```bash
   # 启动 Nginx 反向代理
   docker-compose --profile nginx up -d
   ```

3. **定期备份**：
   ```bash
   # 创建备份脚本
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   docker-compose exec postgres pg_dump -U postgres misonote > "backup_${DATE}.sql"
   ```

4. **监控日志**：
   ```bash
   # 持续监控
   docker-compose logs -f --tail=100
   ```

## 🐛 **故障排除**

### 数据库连接失败
```bash
# 检查 PostgreSQL 是否启动
docker-compose ps postgres

# 检查数据库日志
docker-compose logs postgres

# 手动测试连接
docker-compose exec postgres pg_isready -U postgres
```

### 应用启动失败
```bash
# 检查应用日志
docker-compose logs misonote-markdown

# 检查环境变量
docker-compose exec misonote-markdown env | grep DB_
```

### 端口冲突
```bash
# 修改端口映射
# 在 docker-compose.yml 中修改：
ports:
  - "3002:3001"  # 使用 3002 端口
```

## 📈 **扩展配置**

### 添加 Redis 缓存
```yaml
redis:
  image: redis:alpine
  container_name: misonote-redis
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
```

### 添加监控
```yaml
prometheus:
  image: prom/prometheus
  container_name: misonote-prometheus
  ports:
    - "9090:9090"
```

## 🎯 **总结**

✅ **自动初始化**：PostgreSQL 容器会自动创建数据库表
✅ **数据持久化**：使用 Docker volumes 保证数据不丢失
✅ **一键部署**：`docker-compose up -d` 即可启动
✅ **生产就绪**：包含健康检查、重启策略、日志管理

现在你可以放心使用 Docker 部署，数据会安全保存！🎉
