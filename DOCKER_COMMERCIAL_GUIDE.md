# Misonote Docker 商业版部署指南

## 🎯 概述

Misonote 支持三种许可证类型，每种都可以通过Docker轻松部署：

- **🏠 社区版 (Community)**: 免费，单用户，基础功能
- **⭐ 专业版 (Professional)**: 付费，最多50用户，高级功能
- **👑 企业版 (Enterprise)**: 付费，无限用户，企业级功能

## 🚀 快速开始

### 1. 社区版部署 (免费)

```bash
# 基础部署
docker run -d \
  --name misonote-community \
  -p 3001:3001 \
  -e ADMIN_PASSWORD=your_secure_password \
  -v misonote-data:/app/data \
  misonote/markdown

# 访问应用
open http://localhost:3001
```

### 2. 专业版部署

```bash
# 专业版部署 (需要许可证)
docker run -d \
  --name misonote-professional \
  -p 3001:3001 \
  -e ADMIN_PASSWORD=your_secure_password \
  -e MISONOTE_LICENSE_KEY=misonote_your_professional_license_key \
  -v misonote-data:/app/data \
  misonote/markdown
```

### 3. 企业版部署

```bash
# 企业版部署 (需要许可证)
docker run -d \
  --name misonote-enterprise \
  -p 3001:3001 \
  -e ADMIN_PASSWORD=your_secure_password \
  -e MISONOTE_LICENSE_KEY=misonote_your_enterprise_license_key \
  -e MISONOTE_LICENSE_SERVER_URL=https://license-api.misonote.com \
  -v misonote-data:/app/data \
  -v misonote-docs:/app/docs \
  misonote/markdown
```

## 🔐 许可证管理

### 获取许可证

1. **联系销售团队**
   - 邮箱: sales@misonote.com
   - 电话: 400-123-4567
   - 微信: misonote-sales

2. **在线购买** (即将推出)
   - 访问: https://misonote.com/purchase
   - 选择适合的许可证类型
   - 完成在线支付

### 许可证验证方式

#### 方式1: 环境变量 (推荐)
```bash
docker run -d \
  -e MISONOTE_LICENSE_KEY=misonote_your_license_key \
  misonote/markdown
```

#### 方式2: Web界面
1. 启动容器 (不设置许可证)
2. 访问 http://localhost:3001
3. 进入 "许可证管理" 页面
4. 输入许可证密钥并验证

#### 方式3: 挂载许可证文件
```bash
# 将许可证保存到文件
echo "misonote_your_license_key" > license.key

# 挂载许可证文件
docker run -d \
  -v $(pwd)/license.key:/tmp/license.key \
  misonote/markdown
```

## 📊 功能对比

| 功能 | 社区版 | 专业版 | 企业版 |
|------|--------|--------|--------|
| 用户数量 | 1 | 50 | 无限制 |
| 基础文档管理 | ✅ | ✅ | ✅ |
| Markdown预览 | ✅ | ✅ | ✅ |
| Mermaid图表 | ✅ | ✅ | ✅ |
| 多用户协作 | ❌ | ✅ | ✅ |
| 高级权限管理 | ❌ | ✅ | ✅ |
| 云端同步 | ❌ | ✅ | ✅ |
| 单点登录 (SSO) | ❌ | ❌ | ✅ |
| 审计日志 | ❌ | ❌ | ✅ |
| API访问 | ❌ | ❌ | ✅ |
| 定制开发 | ❌ | ❌ | ✅ |
| 技术支持 | 社区 | 优先 | 7x24 |

## 🔧 环境变量配置

### 必需变量
```bash
# 管理员密码 (强烈推荐设置)
ADMIN_PASSWORD=your_secure_password

# 许可证密钥 (专业版/企业版)
MISONOTE_LICENSE_KEY=misonote_your_license_key
```

### 可选变量
```bash
# 应用端口 (默认: 3001)
PORT=3001

# 许可证服务器URL (默认: https://license-api.misonote.com)
MISONOTE_LICENSE_SERVER_URL=https://your-license-server.com

# 公开访问地址
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# JWT密钥 (自动生成)
JWT_SECRET=your_jwt_secret
```

## 📁 数据持久化

### 推荐的挂载点
```bash
docker run -d \
  -v misonote-data:/app/data \      # 应用数据 (必需)
  -v misonote-docs:/app/docs \      # 文档文件 (推荐)
  -v misonote-logs:/app/logs \      # 日志文件 (可选)
  misonote/markdown
```

### 数据目录说明
- `/app/data`: 数据库、配置文件、许可证信息
- `/app/docs`: Markdown文档文件
- `/app/logs`: 应用日志文件

## 🌐 网络配置

### 反向代理配置 (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Docker Compose 配置
```yaml
version: '3.8'

services:
  misonote:
    image: misonote/markdown
    container_name: misonote-app
    ports:
      - "3001:3001"
    environment:
      - ADMIN_PASSWORD=your_secure_password
      - MISONOTE_LICENSE_KEY=misonote_your_license_key
      - NEXT_PUBLIC_BASE_URL=https://your-domain.com
    volumes:
      - misonote-data:/app/data
      - misonote-docs:/app/docs
      - misonote-logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 3s
      retries: 3

volumes:
  misonote-data:
  misonote-docs:
  misonote-logs:
```

## 🔍 故障排除

### 常见问题

#### 1. 许可证验证失败
```bash
# 检查许可证密钥格式
echo $MISONOTE_LICENSE_KEY | head -c 20
# 应该显示: misonote_

# 检查许可证服务器连接
curl -s https://license-api.misonote.com/health

# 查看容器日志
docker logs misonote-app
```

#### 2. 无法访问应用
```bash
# 检查容器状态
docker ps | grep misonote

# 检查端口映射
docker port misonote-app

# 检查防火墙设置
sudo ufw status
```

#### 3. 数据丢失
```bash
# 检查数据卷
docker volume ls | grep misonote

# 备份数据
docker run --rm -v misonote-data:/data -v $(pwd):/backup alpine tar czf /backup/misonote-backup.tar.gz -C /data .

# 恢复数据
docker run --rm -v misonote-data:/data -v $(pwd):/backup alpine tar xzf /backup/misonote-backup.tar.gz -C /data
```

### 日志查看
```bash
# 查看应用日志
docker logs -f misonote-app

# 查看许可证相关日志
docker logs misonote-app 2>&1 | grep -i license

# 进入容器调试
docker exec -it misonote-app /bin/bash
```

## 📈 监控和维护

### 健康检查
```bash
# 检查应用健康状态
curl http://localhost:3001/api/health

# 检查许可证状态
curl http://localhost:3001/api/license/status
```

### 备份策略
```bash
#!/bin/bash
# 自动备份脚本

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/misonote"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据
docker run --rm \
  -v misonote-data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/misonote-data-$DATE.tar.gz -C /data .

# 清理旧备份 (保留7天)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## 🎉 升级指南

### 从社区版升级到专业版/企业版
1. 购买相应的许可证
2. 停止当前容器
3. 使用新的许可证密钥重新启动

```bash
# 停止容器
docker stop misonote-app

# 使用新许可证启动
docker run -d \
  --name misonote-app \
  -p 3001:3001 \
  -e ADMIN_PASSWORD=your_password \
  -e MISONOTE_LICENSE_KEY=misonote_your_new_license \
  -v misonote-data:/app/data \
  misonote/markdown
```

### 版本升级
```bash
# 拉取最新镜像
docker pull misonote/markdown:latest

# 重新创建容器
docker-compose up -d --force-recreate
```

## 📞 技术支持

- **社区版**: GitHub Issues
- **专业版**: 邮件支持 (support@misonote.com)
- **企业版**: 7x24专属支持 + 专属客户经理

---

**🎊 恭喜！您现在可以使用Docker轻松部署和管理Misonote的商业版本了！**
