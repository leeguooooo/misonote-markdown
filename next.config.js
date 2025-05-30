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

  // 确保环境变量在构建时可用
  env: {
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  },

  // 或者使用 publicRuntimeConfig（运行时可用）
  publicRuntimeConfig: {
    // 这些变量在客户端和服务端都可用，但不要放敏感信息
  },

  // 服务端运行时配置（只在服务端可用）
  serverRuntimeConfig: {
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    JWT_SECRET: process.env.JWT_SECRET,
  },
};

module.exports = nextConfig;
