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

console.log('🔧 Next.js 配置加载时的环境变量:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ADMIN_PASSWORD_HASH:', process.env.ADMIN_PASSWORD_HASH ? '已设置' : '未设置');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');

// 调试：显示完整的哈希值信息
if (process.env.ADMIN_PASSWORD_HASH) {
  console.log('🔍 详细调试信息:');
  console.log('  - 完整哈希值:', process.env.ADMIN_PASSWORD_HASH);
  console.log('  - 哈希长度:', process.env.ADMIN_PASSWORD_HASH.length);
  console.log('  - 哈希前10位:', process.env.ADMIN_PASSWORD_HASH.substring(0, 10));
  console.log('  - 哈希后10位:', process.env.ADMIN_PASSWORD_HASH.substring(-10));
}

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
