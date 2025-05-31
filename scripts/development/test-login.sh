#!/bin/bash

# 测试登录功能的脚本

echo "🧪 测试登录功能"
echo "==============="
echo ""

# 1. 检查应用是否响应
echo "1. 检查应用是否响应..."
if curl -s -I http://localhost:3001 | grep -q "200 OK"; then
    echo "✅ 应用正在运行"
else
    echo "❌ 应用未响应"
    echo "请检查 PM2 状态: pm2 status"
    exit 1
fi

# 2. 测试登录 API
echo ""
echo "2. 测试登录 API..."

# 测试正确密码
echo "测试密码: xiaoli123"
response=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"xiaoli123"}')

echo "响应: $response"

if echo "$response" | grep -q '"success":true'; then
    echo "✅ 登录成功！密码 xiaoli123 正确"
elif echo "$response" | grep -q '"error"'; then
    echo "❌ 登录失败"
    error_msg=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo "错误信息: $error_msg"
else
    echo "❓ 未知响应格式"
fi

# 3. 测试错误密码
echo ""
echo "3. 测试错误密码..."
echo "测试密码: admin123"
response2=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}')

echo "响应: $response2"

if echo "$response2" | grep -q '"error"'; then
    echo "✅ 错误密码被正确拒绝"
else
    echo "❓ 意外的响应"
fi

# 4. 检查安全状态
echo ""
echo "4. 检查安全状态..."
if echo "$response" | grep -q '"securityStatus"'; then
    echo "安全状态信息:"
    echo "$response" | grep -o '"securityStatus":{[^}]*}' | sed 's/,/\n  /g' | sed 's/{/\n  /g' | sed 's/}//g'
fi

echo ""
echo "🎯 测试完成"
echo ""
echo "如果登录成功，你现在可以："
echo "1. 访问 http://localhost:3001"
echo "2. 使用用户名: admin"
echo "3. 使用密码: xiaoli123"
