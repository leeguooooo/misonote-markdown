#!/usr/bin/env node

/**
 * 批量更新导入路径脚本
 * 将旧的 lib 路径更新为新的 core/community 路径
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 导入路径映射
const importMappings = {
  '@/lib/auth': '@/core/auth/auth',
  '@/lib/docs': '@/core/docs/docs',
  '@/lib/docs-cache': '@/core/docs/docs-cache',
  '@/lib/database': '@/core/database/database',
  '@/lib/system-settings': '@/core/database/system-settings',
  '@/lib/api-auth': '@/core/api/api-auth',
  '@/lib/api-keys': '@/core/api/api-keys',
  '@/lib/mcp-client': '@/core/mcp/mcp-client',
  '@/lib/mcp-config': '@/core/mcp/mcp-config',
  '@/lib/mcp-history': '@/core/mcp/mcp-history',
  '@/lib/file-operations': '@/core/docs/file-operations',
  '@/lib/rate-limiter': '@/core/api/rate-limiter',
  '@/lib/security-utils': '@/core/auth/security-utils',
  '@/lib/logger': '@/core/logger',
  '@/components/CommentSystem': '@/community/comments/CommentSystem',
  '@/components/SearchDialog': '@/community/search/SearchDialog'
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
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

// 递归查找所有 TypeScript 和 JavaScript 文件
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// 更新文件中的导入路径
function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  for (const [oldPath, newPath] of Object.entries(importMappings)) {
    const oldImportRegex = new RegExp(`from ['"]${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    const oldRequireRegex = new RegExp(`require\\(['"]${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\)`, 'g');
    
    if (oldImportRegex.test(content) || oldRequireRegex.test(content)) {
      content = content.replace(oldImportRegex, `from '${newPath}'`);
      content = content.replace(oldRequireRegex, `require('${newPath}')`);
      updated = true;
    }
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    logSuccess(`更新: ${filePath}`);
    return true;
  }
  
  return false;
}

// 主函数
function main() {
  console.log('🔄 开始更新导入路径...\n');
  
  try {
    const srcDir = path.join(process.cwd(), 'src');
    const files = findFiles(srcDir);
    
    logInfo(`找到 ${files.length} 个文件`);
    
    let updatedCount = 0;
    
    for (const file of files) {
      if (updateImports(file)) {
        updatedCount++;
      }
    }
    
    console.log('');
    logSuccess(`✅ 完成！更新了 ${updatedCount} 个文件`);
    
    if (updatedCount > 0) {
      logInfo('建议运行以下命令检查构建：');
      console.log('  npm run build:community');
    }
    
  } catch (error) {
    log('red', `❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, updateImports };
