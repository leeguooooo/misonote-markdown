// 手动解析 .env 文件，避免 dotenv 的变量替换问题
const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const result = {};

  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        let value = trimmed.substring(equalIndex + 1).trim();

        // 移除引号，但保持原始值不变
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        result[key] = value;
        // 设置到 process.env 中
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });

  return result;
}

// 手动解析 .env 文件
const envVars = parseEnvFile(path.join(__dirname, '.env'));

console.log('🔧 Next.js 配置加载');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DOCKER_BUILD:', process.env.DOCKER_BUILD);

// 在 Docker 构建时不读取敏感环境变量
if (process.env.DOCKER_BUILD !== 'true') {
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
  console.log('ADMIN_PASSWORD_HASH_BASE64:', process.env.ADMIN_PASSWORD_HASH_BASE64 ? '已设置' : '未设置');
} else {
  console.log('Docker 构建模式：跳过敏感环境变量检查');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 支持配置
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,

  eslint: {
    // 在构建时忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在构建时忽略 TypeScript 错误（如果需要）
    // ignoreBuildErrors: true,
  },

  // Docker 环境配置
  env: {
    DOCKER_ENV: process.env.DOCKER_ENV || 'false',
  },

  // Next.js 会自动加载 .env* 文件，不需要手动配置
};

module.exports = nextConfig;
