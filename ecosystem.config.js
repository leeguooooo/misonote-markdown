module.exports = {
  apps: [
    {
      name: 'docs-platform',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // 从 .env 文件读取敏感信息，不在此处硬编码
        // ADMIN_PASSWORD_HASH 和 JWT_SECRET 应该在 .env 文件中设置
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        // 从 .env 文件读取敏感信息，不在此处硬编码
        // ADMIN_PASSWORD_HASH 和 JWT_SECRET 应该在 .env 文件中设置
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        // 从 .env 文件读取敏感信息，不在此处硬编码
        // ADMIN_PASSWORD_HASH 和 JWT_SECRET 应该在 .env 文件中设置
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
