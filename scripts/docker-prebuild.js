#!/usr/bin/env node

// Docker 构建前检查脚本 - 简化版本

const fs = require('fs');
const path = require('path');

// 颜色定义
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logInfo(message) {
  log('blue', `[INFO] ${message}`);
}

function logSuccess(message) {
  log('green', `[SUCCESS] ${message}`);
}

function logWarning(message) {
  log('yellow', `[WARNING] ${message}`);
}

function logError(message) {
  log('red', `[ERROR] ${message}`);
}

// 检查环境变量文件
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (fs.existsSync(envPath)) {
    logSuccess('.env 文件存在');
    return true;
  } else {
    logWarning('.env 文件不存在，将在运行时创建');
    return false;
  }
}

// 检查必要的目录
function checkDirectories() {
  const dirs = ['docs', 'data', 'logs'];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logInfo(`创建目录: ${dir}`);
    }
  });
  
  logSuccess('目录检查完成');
}

// 主函数
function main() {
  console.log('🐳 Docker 构建前检查');
  console.log('===================');
  console.log('');
  
  try {
    logInfo('Docker 环境构建检查...');
    
    // 检查环境变量文件
    checkEnvFile();
    
    // 检查必要目录
    checkDirectories();
    
    // Docker 环境下跳过复杂的环境变量验证
    logInfo('Docker 环境下跳过环境变量验证');
    logInfo('环境变量将在容器启动时配置');
    
    logSuccess('✅ Docker 构建前检查通过');
    process.exit(0);
    
  } catch (error) {
    logError('检查过程出错: ' + error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
