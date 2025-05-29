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
        ADMIN_PASSWORD_HASH: '$2b$12$0ev5NT6tVv2exHGft217YOCzowqFlw4b1hRQCZx3VBfBL4NXHygAW',
        JWT_SECRET: 'nihaome'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        ADMIN_PASSWORD_HASH: '$2b$12$0ev5NT6tVv2exHGft217YOCzowqFlw4b1hRQCZx3VBfBL4NXHygAW',
        JWT_SECRET: 'nihaome'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        ADMIN_PASSWORD_HASH: '$2b$12$0ev5NT6tVv2exHGft217YOCzowqFlw4b1hRQCZx3VBfBL4NXHygAW',
        JWT_SECRET: 'nihaome'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
