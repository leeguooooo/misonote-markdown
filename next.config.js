// 确保在 Next.js 配置加载前先加载环境变量
require('dotenv').config();

console.log('🔧 Next.js 配置加载时的环境变量:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ADMIN_PASSWORD_HASH:', process.env.ADMIN_PASSWORD_HASH ? '已设置' : '未设置');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 在构建时忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在构建时忽略 TypeScript 错误（如果需要）
    // ignoreBuildErrors: true,
  },

  // Next.js 会自动加载 .env* 文件，不需要手动配置
};

module.exports = nextConfig;
