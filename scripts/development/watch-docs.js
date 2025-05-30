#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const DOCS_DIR = path.join(__dirname, 'docs');
const DEBOUNCE_DELAY = 2000; // 2秒防抖

let buildTimeout = null;
let isBuilding = false;

console.log('📁 开始监控文档目录:', DOCS_DIR);

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 执行命令: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ 命令执行失败: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.warn(`⚠️  警告: ${stderr}`);
      }
      console.log(`✅ 命令执行成功: ${stdout}`);
      resolve(stdout);
    });
  });
}

async function rebuildAndRestart() {
  if (isBuilding) {
    console.log('🔄 构建正在进行中，跳过此次触发');
    return;
  }

  isBuilding = true;
  console.log('🚀 检测到文档变化，开始重新构建...');

  try {
    // 1. 重新构建
    await executeCommand('pnpm build');
    
    // 2. 重启 PM2
    await executeCommand('pm2 restart docs-platform');
    
    console.log('✨ 构建和重启完成！');
  } catch (error) {
    console.error('💥 构建或重启失败:', error.message);
  } finally {
    isBuilding = false;
  }
}

function scheduleRebuild() {
  if (buildTimeout) {
    clearTimeout(buildTimeout);
  }
  
  buildTimeout = setTimeout(() => {
    rebuildAndRestart();
  }, DEBOUNCE_DELAY);
}

function watchDirectory(dir) {
  try {
    fs.watch(dir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      
      // 只监控 .md 文件和目录变化
      if (filename.endsWith('.md') || !path.extname(filename)) {
        console.log(`📝 检测到变化: ${eventType} - ${filename}`);
        scheduleRebuild();
      }
    });
    
    console.log('👀 文档监控已启动');
  } catch (error) {
    console.error('❌ 启动文档监控失败:', error.message);
    process.exit(1);
  }
}

// 检查 docs 目录是否存在
if (!fs.existsSync(DOCS_DIR)) {
  console.error('❌ docs 目录不存在:', DOCS_DIR);
  process.exit(1);
}

// 启动监控
watchDirectory(DOCS_DIR);

// 优雅退出处理
process.on('SIGINT', () => {
  console.log('\n👋 停止文档监控');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 停止文档监控');
  process.exit(0);
});
