# 脚本目录

本目录包含项目的各种脚本工具。

## 📁 目录结构

### deployment/ - 部署相关脚本
- `pm2-start.js` - PM2 启动脚本（Node.js 版本）
- `start-pm2.sh` - PM2 启动脚本（Shell 版本）

### security/ - 安全相关脚本
- `update-security.sh` - 交互式安全配置脚本
- `generate-password-hash.js` - 密码哈希生成工具
- `verify-password.js` - 密码验证工具
- `fix-env-loading.sh` - 环境变量加载修复脚本
- `fix-truncation.sh` - 修复环境变量截断问题
- `immediate-fix.sh` - 立即修复环境变量问题
- `final-fix.sh` - 最终修复方案

### development/ - 开发相关脚本
- `debug-env.js` - 环境变量调试工具
- `test-login.sh` - 登录功能测试脚本
- `test-cache-performance.js` - 缓存性能测试
- `watch-docs.js` - 文档监控脚本

## 🚀 常用命令

### 部署
```bash
# 启动 PM2 应用
node scripts/deployment/pm2-start.js
# 或
bash scripts/deployment/start-pm2.sh
```

### 安全配置
```bash
# 设置管理员密码
bash scripts/security/update-security.sh

# 验证密码
node scripts/security/verify-password.js

# 修复环境变量问题
bash scripts/security/fix-env-loading.sh
```

### 开发调试
```bash
# 调试环境变量
node scripts/development/debug-env.js

# 测试登录
bash scripts/development/test-login.sh
```
