#!/bin/bash

# Misonote Markdown 一键安装脚本

echo "🚀 开始安装 Misonote Markdown 依赖..."

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm 未安装，请先安装 pnpm:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "📦 安装依赖包..."
pnpm install

echo "✅ 安装完成！"
echo ""
echo "🎯 下一步操作："
echo "   1. 启动开发服务器: pnpm dev"
echo "   2. 或构建生产版本: pnpm build"
echo ""
echo "📖 更多信息请查看 README.md"
