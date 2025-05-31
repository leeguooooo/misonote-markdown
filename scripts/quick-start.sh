#!/bin/bash

# 快速启动脚本

echo "🚀 Markdown 文档系统快速启动"
echo "=========================="
echo ""
echo "请选择操作:"
echo "1. 启动应用 (PM2)"
echo "2. 设置管理员密码"
echo "3. 验证密码"
echo "4. 修复环境变量问题"
echo "5. 查看应用状态"
echo ""

read -p "请输入选项 (1-5): " choice

case $choice in
    1)
        echo "启动应用..."
        node deployment/pm2-start.js
        ;;
    2)
        echo "设置管理员密码..."
        bash security/update-security.sh
        ;;
    3)
        echo "验证密码..."
        node security/verify-password.js
        ;;
    4)
        echo "修复环境变量问题..."
        bash security/fix-env-loading.sh
        ;;
    5)
        echo "查看应用状态..."
        pm2 status
        pm2 logs docs-platform --lines 10
        ;;
    *)
        echo "无效选项"
        ;;
esac
