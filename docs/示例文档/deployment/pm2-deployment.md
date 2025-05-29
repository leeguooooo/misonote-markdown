# PM2 部署指南

## 🚀 快速开始

### 方法一：使用 npm 脚本（推荐）

```bash
# 生产环境启动
npm run pm2:start

# 开发环境启动
npm run pm2:dev

# 查看状态
npm run pm2:status

# 查看日志
npm run pm2:logs

# 重启应用
npm run pm2:restart

# 停止应用
npm run pm2:stop
```

### 方法二：使用启动脚本

```bash
# 使用 Node.js 脚本（推荐）
node pm2-start.js prod    # 生产环境
node pm2-start.js dev     # 开发环境

# 使用 Bash 脚本
./start-pm2.sh prod       # 生产环境
./start-pm2.sh dev        # 开发环境
```

### 方法三：直接使用 PM2

```bash
# 生产环境
pm2 start ecosystem.config.js --env production

# 开发环境
pm2 start ecosystem.config.js --env development
```

## 📋 PM2 配置

### ecosystem.config.js

```javascript
module.exports = {
  apps: [
    {
      name: 'docs-platform',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
```

## 🛠️ 常用命令

### 应用管理

```bash
# 启动应用
pm2 start docs-platform

# 停止应用
pm2 stop docs-platform

# 重启应用
pm2 restart docs-platform

# 删除应用
pm2 delete docs-platform

# 重新加载（零停机时间）
pm2 reload docs-platform
```

### 监控和日志

```bash
# 查看状态
pm2 status

# 查看详细信息
pm2 show docs-platform

# 实时监控
pm2 monit

# 查看日志
pm2 logs docs-platform

# 查看最近 100 行日志
pm2 logs docs-platform --lines 100

# 清空日志
pm2 flush docs-platform
```

### 进程管理

```bash
# 列出所有进程
pm2 list

# 保存当前进程列表
pm2 save

# 重启所有进程
pm2 restart all

# 停止所有进程
pm2 stop all

# 删除所有进程
pm2 delete all
```

## 📊 监控和性能

### Web 监控界面

```bash
# 启动 Web 监控界面
pm2 web

# 访问 http://localhost:9615
```

### 系统监控

```bash
# 实时监控界面
pm2 monit

# 显示内存使用情况
pm2 show docs-platform
```

## 🔧 高级配置

### 集群模式

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'docs-platform',
    script: 'npm',
    args: 'start',
    instances: 'max',  // 使用所有 CPU 核心
    exec_mode: 'cluster'
  }]
};
```

### 自动重启配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'docs-platform',
    script: 'npm',
    args: 'start',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
};
```

## 📁 日志管理

### 日志文件位置

```
logs/
├── err.log        # 错误日志
├── out.log        # 输出日志
└── combined.log   # 合并日志
```

### 日志轮转

```bash
# 安装 pm2-logrotate
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

## 🚨 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   lsof -i :3001
   
   # 杀死占用进程
   kill -9 <PID>
   ```

2. **内存不足**
   ```bash
   # 查看内存使用
   pm2 show docs-platform
   
   # 调整内存限制
   pm2 restart docs-platform --max-memory-restart 2G
   ```

3. **应用无法启动**
   ```bash
   # 查看详细错误
   pm2 logs docs-platform --err
   
   # 查看应用详情
   pm2 show docs-platform
   ```

### 调试模式

```bash
# 启动调试模式
pm2 start ecosystem.config.js --env development

# 查看实时日志
pm2 logs docs-platform --lines 0
```

## 🔄 部署流程

### 生产环境部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 启动/重启应用
npm run pm2:restart
```

### 零停机部署

```bash
# 使用 reload 实现零停机部署
pm2 reload docs-platform
```

## 📈 性能优化

### 启动优化

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'docs-platform',
    script: 'npm',
    args: 'start',
    node_args: '--max-old-space-size=2048',
    instances: 1,
    exec_mode: 'fork'
  }]
};
```

### 内存优化

```bash
# 设置内存限制
pm2 restart docs-platform --max-memory-restart 1G

# 启用内存监控
pm2 install pm2-server-monit
```

---

## 🎯 总结

PM2 为文档平台提供了强大的进程管理能力：

- **自动重启**：应用崩溃时自动重启
- **负载均衡**：支持集群模式
- **日志管理**：统一的日志收集和管理
- **监控界面**：实时监控应用状态
- **零停机部署**：支持热重载

使用 `npm run pm2:start` 即可快速启动生产环境！
