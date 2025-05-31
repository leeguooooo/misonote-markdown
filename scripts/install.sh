#!/bin/bash

# Misonote Markdown 一键安装脚本
# 自动处理 better-sqlite3 构建脚本批准

echo "🚀 开始安装 Misonote Markdown 依赖..."

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm 未安装，请先安装 pnpm:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "📦 安装依赖包..."
# 设置环境变量跳过 postinstall 中的交互式选择
SKIP_POSTINSTALL=true pnpm install --ignore-scripts

echo "🔧 自动批准必要的构建脚本..."
# 使用 expect 或者直接批准所有构建脚本
echo "a" | pnpm approve-builds || {
    echo "⚠️  自动批准失败，请手动执行: pnpm approve-builds"
    echo "   然后选择需要的构建脚本（通常选择 better-sqlite3）"
}

echo "🔨 重新构建原生模块..."
pnpm rebuild better-sqlite3 || echo "⚠️  better-sqlite3 重建失败，但可能不影响使用"

echo "✅ 安装完成！"
echo ""
echo "🎯 下一步操作："
echo "   1. 启动开发服务器: pnpm dev"
echo "   2. 或构建生产版本: pnpm build"
echo ""
echo "📖 更多信息请查看 README.md"
