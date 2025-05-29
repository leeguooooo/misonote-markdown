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
};

module.exports = nextConfig;
