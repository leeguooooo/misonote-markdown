#!/usr/bin/env node

// Docker 健康检查脚本

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: '/api/health',
  method: 'GET',
  timeout: 3000
};

const healthCheck = http.request(options, (res) => {
  console.log(`健康检查状态: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

healthCheck.on('error', (err) => {
  console.error('健康检查失败:', err.message);
  process.exit(1);
});

healthCheck.on('timeout', () => {
  console.error('健康检查超时');
  healthCheck.destroy();
  process.exit(1);
});

healthCheck.end();
