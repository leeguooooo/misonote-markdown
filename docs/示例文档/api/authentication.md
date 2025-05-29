# API 认证

## 概述

本文档描述了 API 的认证机制。

## JWT 认证

系统使用 JWT (JSON Web Token) 进行认证。

### 获取 Token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "password": "your-admin-password"
}
```

### 使用 Token

```bash
GET /api/admin/docs
Authorization: Bearer <your-jwt-token>
```

## 安全注意事项

- Token 有效期为 24 小时
- 请妥善保管 Token
- 不要在客户端存储明文密码
