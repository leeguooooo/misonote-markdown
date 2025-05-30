// 高日志输出版本的 PM2 配置
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
      
      // 详细的日志配置
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',
      merge_logs: true,
      
      // 默认环境 - 开发模式以获得更多日志
      env: {
        NODE_ENV: 'development',  // 改为 development 以获得更多日志
        PORT: 3001,
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
        JWT_SECRET: process.env.JWT_SECRET,
        
        // 启用详细日志
        DEBUG: '*',                    // 启用所有调试日志
        VERBOSE: 'true',               // 启用详细模式
        LOG_LEVEL: 'debug',            // 设置日志级别为 debug
        NEXT_DEBUG: '1',               // Next.js 调试模式
        
        // 强制输出到控制台
        FORCE_COLOR: '1',              // 强制彩色输出
        NODE_OPTIONS: '--trace-warnings --trace-deprecation'  // Node.js 警告和弃用追踪
      },
      
      // 开发环境配置（最详细的日志）
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
        JWT_SECRET: process.env.JWT_SECRET,
        
        // 最详细的调试配置
        DEBUG: '*',
        VERBOSE: 'true',
        LOG_LEVEL: 'debug',
        NEXT_DEBUG: '1',
        FORCE_COLOR: '1',
        NODE_OPTIONS: '--trace-warnings --trace-deprecation --trace-uncaught'
      },
      
      // 生产环境配置（适度的日志）
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
        JWT_SECRET: process.env.JWT_SECRET,
        
        // 生产环境也启用一些日志
        LOG_LEVEL: 'info',
        VERBOSE: 'true',
        DEBUG: 'app:*'  // 只启用应用相关的调试日志
      }
    }
  ]
};
