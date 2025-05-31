# 手动配置 license-api.misonote.com DNS记录

## 🎯 目标
为许可证服务器配置自定义域名：`https://license-api.misonote.com`

## 📋 步骤

### 1. 登录Cloudflare Dashboard
访问：https://dash.cloudflare.com

### 2. 选择misonote.com域名
在域名列表中点击 `misonote.com`

### 3. 进入DNS设置
点击左侧菜单的 "DNS" → "Records"

### 4. 添加CNAME记录
点击 "Add record" 按钮，填写以下信息：

```
类型 (Type): CNAME
名称 (Name): license-api
目标 (Target): misonote-license-server.leeguooooo.workers.dev
代理状态 (Proxy status): 已代理 (橙色云朵图标)
TTL: Auto
```

### 5. 保存记录
点击 "Save" 保存DNS记录

## 🧪 验证配置

### 等待DNS传播（通常1-5分钟）
```bash
# 检查DNS解析
nslookup license-api.misonote.com

# 测试API连接
curl https://license-api.misonote.com/health
```

### 预期结果
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-05-31T10:xx:xx.xxxZ",
  "service": {
    "name": "Misonote License Server",
    "version": "1.0.0"
  }
}
```

## 🔧 配置完成后的测试

### 1. 基础API测试
```bash
# 健康检查
curl https://license-api.misonote.com/health

# 服务信息
curl https://license-api.misonote.com/

# 挑战获取
curl -X POST https://license-api.misonote.com/api/v1/challenge
```

### 2. 许可证验证测试
```bash
# 生成测试许可证
LICENSE_KEY="misonote_eyJpZCI6InRlc3QtZW50ZXJwcmlzZS0wMDEiLCJ0eXBlIjoiZW50ZXJwcmlzZSIsIm9yZ2FuaXphdGlvbiI6IlRlc3QgRW50ZXJwcmlzZSIsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJtYXhVc2VycyI6MTAwLCJmZWF0dXJlcyI6WyJtdWx0aV91c2VyIiwiYWR2YW5jZWRfcGVybWlzc2lvbnMiLCJjbG91ZF9zeW5jIl0sImlzc3VlZEF0IjoiMjAyNS0wNS0zMVQxMDo1MDowNy44MTlaIiwiZXhwaXJlc0F0IjoiMjAyNi0wNS0zMVQxMDo1MDowNy44MjBaIiwic2lnbmF0dXJlIjoidGVzdF9zaWduYXR1cmVfMDQ2NDRlZTIwNjA3NjY2NmE2Yjk2YTVlNTk4MzUzMzgxOTZlYWU3MDI2ZWZhMDZlNDQ5ZDI4ZGQ1YTA4Mzk1MSJ9"

# 验证许可证
curl -X POST https://license-api.misonote.com/api/v1/licenses/verify \
  -H "Content-Type: application/json" \
  -d "{\"licenseKey\": \"$LICENSE_KEY\", \"timestamp\": $(date +%s)000, \"nonce\": \"$(openssl rand -hex 8)\"}"
```

### 3. 主项目集成测试
```bash
# 测试主项目的许可证API
curl -X POST http://localhost:3000/api/license/status \
  -H "Content-Type: application/json" \
  -d "{\"licenseKey\": \"$LICENSE_KEY\"}"
```

## 🚨 故障排除

### DNS解析失败
- 等待更长时间（最多24小时）
- 检查CNAME记录是否正确
- 确认代理状态为"已代理"

### API连接失败
- 检查Worker是否正常部署
- 验证路由配置是否正确
- 查看Cloudflare Dashboard中的错误日志

### 许可证验证失败
- 检查许可证格式是否正确
- 验证时间戳是否在有效范围内
- 确认nonce是否唯一

## 📞 技术支持

如果遇到问题，请检查：
1. Cloudflare Dashboard → misonote.com → DNS记录
2. Cloudflare Dashboard → Workers & Pages → misonote-license-server
3. 浏览器开发者工具的网络面板
4. Worker日志：`npx wrangler tail misonote-license-server`

## 🎉 完成标志

当以下命令都返回成功响应时，配置就完成了：

```bash
curl https://license-api.misonote.com/health
# 返回: {"success":true,"status":"healthy",...}

curl https://license-api.misonote.com/
# 返回: {"service":"Misonote License Server",...}
```
