#!/usr/bin/env node

/**
 * 简化的 PM2 启动脚本
 * 使用方法: node pm2-start.js [dev|prod]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色定义
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 打印带颜色的消息
const log = {
  info: (msg) => console.log(`${colors.green}[INFO]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.blue}[STEP]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.cyan}[SUCCESS]${colors.reset} ${msg}`)
};

// 执行命令
function exec(command, options = {}) {
  try {
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (error) {
    if (!options.ignoreError) {
      log.error(`命令执行失败: ${command}`);
      log.error(error.message);
      process.exit(1);
    }
    return null;
  }
}

// 检查 PM2 是否安装
function checkPM2() {
  try {
    const version = exec('pm2 --version', { silent: true });
    log.info(`PM2 已安装: ${version.trim()}`);
    return true;
  } catch {
    log.warn('PM2 未安装，正在安装...');
    exec('npm install -g pm2');
    log.success('PM2 安装完成');
    return true;
  }
}

// 检查依赖
function checkDependencies() {
  log.step('检查项目依赖...');
  if (!fs.existsSync('node_modules')) {
    log.warn('node_modules 不存在，正在安装依赖...');
    exec('npm install');
    log.success('依赖安装完成');
  } else {
    log.info('依赖已安装');
  }
}

// 构建项目
function buildProject() {
  log.step('构建项目...');
  exec('npm run build');
  log.success('项目构建完成');
}

// 创建日志目录
function createLogDir() {
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs', { recursive: true });
    log.info('创建日志目录: logs/');
  }
}

// 停止现有进程
function stopExisting() {
  log.step('停止现有的 PM2 进程...');
  exec('pm2 stop docs-platform', { ignoreError: true, silent: true });
  exec('pm2 delete docs-platform', { ignoreError: true, silent: true });
  log.info('已清理现有进程');
}

// 启动应用
function startApp(env = 'production') {
  log.step(`启动应用 (环境: ${env})...`);
  
  const envFlag = env === 'dev' || env === 'development' ? '--env development' : '--env production';
  exec(`pm2 start ecosystem.config.js ${envFlag}`);
  
  log.success('应用启动成功');
}

// 显示状态
function showStatus() {
  log.step('应用状态:');
  exec('pm2 status');
  console.log('\n最近日志:');
  exec('pm2 logs docs-platform --lines 10', { ignoreError: true });
}

// 显示帮助
function showHelp() {
  console.log(`
文档平台 PM2 启动脚本

使用方法:
  node pm2-start.js [环境]

环境选项:
  prod, production  - 生产环境 (默认)
  dev, development  - 开发环境

示例:
  node pm2-start.js          # 生产环境启动
  node pm2-start.js prod     # 生产环境启动
  node pm2-start.js dev      # 开发环境启动

常用 PM2 命令:
  pm2 status                 # 查看状态
  pm2 logs docs-platform     # 查看日志
  pm2 monit                  # 监控界面
  pm2 restart docs-platform  # 重启应用
  pm2 stop docs-platform     # 停止应用
  pm2 delete docs-platform   # 删除应用
`);
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const env = args[0] || 'production';
  
  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    return;
  }
  
  console.log(`${colors.cyan}=== 文档平台 PM2 启动脚本 ===${colors.reset}`);
  console.log(`环境: ${env}`);
  console.log(`时间: ${new Date().toLocaleString()}`);
  console.log('');
  
  try {
    // 执行步骤
    checkPM2();
    checkDependencies();
    createLogDir();
    
    if (env !== 'dev' && env !== 'development') {
      buildProject();
    }
    
    stopExisting();
    startApp(env);
    
    console.log('');
    showStatus();
    
    console.log('');
    log.success('=== 启动完成 ===');
    log.info('应用地址: http://localhost:3001');
    log.info('PM2 监控: pm2 monit');
    log.info('查看日志: pm2 logs docs-platform');
    log.info('停止应用: pm2 stop docs-platform');
    log.info('重启应用: pm2 restart docs-platform');
    
  } catch (error) {
    log.error('启动失败:');
    log.error(error.message);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main, log, exec };
