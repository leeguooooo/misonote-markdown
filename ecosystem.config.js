// 加载 .env 文件
require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'docs-platform',
      script: 'pnpm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // 从 .env 文件读取环境变量
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
        JWT_SECRET: process.env.JWT_SECRET,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        // 从 .env 文件读取环境变量
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
        JWT_SECRET: process.env.JWT_SECRET,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        // 从 .env 文件读取环境变量
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
        JWT_SECRET: process.env.JWT_SECRET,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
