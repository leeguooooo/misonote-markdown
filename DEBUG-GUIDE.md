# 🔧 调试指南

## 🚀 新增的调试脚本

现在你可以使用以下命令来调试问题：

### 开发模式调试
```bash
# 普通开发模式
pnpm dev

# 详细日志开发模式
pnpm dev:verbose

# 调试模式（带 Node.js 调试器）
pnpm dev:debug
```

### 生产模式调试
```bash
# 普通生产模式
pnpm start

# 详细日志生产模式
pnpm start:verbose

# 调试模式生产
pnpm start:debug
```

### PM2 调试
```bash
# PM2 详细模式启动
pnpm pm2:verbose

# 查看详细日志
pnpm pm2:logs:verbose

# 实时跟踪日志
pnpm pm2:logs:follow

# 清空日志
pnpm pm2:flush

# 重新加载应用
pnpm pm2:reload
```

### 环境和认证调试
```bash
# 调试环境变量
pnpm debug:env

# 验证密码
pnpm debug:auth

# 查看日志工具
pnpm debug:logs
```

### 安全配置
```bash
# 设置管理员密码
pnpm security:setup

# 验证密码
pnpm security:verify

# 生成密码哈希
pnpm security:hash
```

### 测试功能
```bash
# 测试登录功能
pnpm test:login

# 快速测试 API
pnpm test:api
```

### 清理和重置
```bash
# 清理构建文件和日志
pnpm clean

# 清理 PM2 进程
pnpm clean:pm2

# 完全重置项目
pnpm reset
```

## 🔍 推荐的调试流程

### 1. 快速诊断
```bash
# 检查环境变量
pnpm debug:env

# 检查应用状态
pnpm pm2:status
```

### 2. 启动详细日志模式
```bash
# 停止当前应用
pnpm pm2:stop

# 启动详细日志模式
pnpm pm2:verbose

# 查看实时日志
pnpm pm2:logs:follow
```

### 3. 测试功能
```bash
# 测试登录
pnpm test:api

# 或使用完整测试
pnpm test:login
```

### 4. 如果还有问题
```bash
# 完全重置
pnpm pm2:delete
pnpm clean
pnpm install

# 重新启动
pnpm pm2:verbose
```

## 🎯 常见问题解决

### 问题1: 看不到日志
```bash
# 解决方案
pnpm pm2:flush          # 清空旧日志
pnpm pm2:delete         # 删除应用
pnpm pm2:verbose        # 重新启动详细模式
pnpm pm2:logs:follow    # 查看实时日志
```

### 问题2: 密码验证失败
```bash
# 解决方案
pnpm debug:env          # 检查环境变量
pnpm security:verify    # 验证密码
pnpm security:setup     # 重新设置密码
```

### 问题3: 应用无法启动
```bash
# 解决方案
pnpm clean              # 清理构建文件
pnpm build              # 重新构建
pnpm start:verbose      # 详细模式启动
```

### 问题4: 端口冲突
```bash
# 检查端口占用
netstat -tlnp | grep :3001
# 或
lsof -i :3001

# 杀死占用进程
kill -9 <PID>
```

## 📋 调试检查清单

- [ ] 环境变量是否正确设置 (`pnpm debug:env`)
- [ ] 密码哈希是否正确 (`pnpm security:verify`)
- [ ] 应用是否正常启动 (`pnpm pm2:status`)
- [ ] 端口是否被占用 (`netstat -tlnp | grep :3001`)
- [ ] 日志是否有错误信息 (`pnpm pm2:logs:verbose`)
- [ ] API 是否响应 (`pnpm test:api`)

## 🚨 紧急修复

如果一切都不工作：

```bash
# 完全重置
pnpm reset

# 重新设置密码
pnpm security:setup

# 启动详细模式
pnpm pm2:verbose

# 测试
pnpm test:api
```

现在你有了完整的调试工具集！🎉
