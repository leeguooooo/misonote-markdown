#!/usr/bin/env node

// 构建前环境变量检查脚本

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// 加载环境变量
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return envVars;
  }
  
  return {};
}

// 检查必需的环境变量
function checkRequiredEnvVars() {
  logInfo('检查构建前环境变量...');
  
  const envVars = loadEnvFile();
  const allEnvVars = { ...envVars, ...process.env };
  
  const requiredVars = [
    {
      name: 'ADMIN_PASSWORD_HASH_BASE64',
      description: '管理员密码哈希 (Base64 编码)',
      validator: (value) => {
        if (!value) return false;
        try {
          const decoded = Buffer.from(value, 'base64').toString('utf8');
          return decoded.length === 60 && decoded.startsWith('$2b$12$');
        } catch {
          return false;
        }
      }
    },
    {
      name: 'JWT_SECRET',
      description: 'JWT 密钥',
      validator: (value) => value && value.length >= 32
    }
  ];
  
  const missing = [];
  const invalid = [];
  
  for (const varConfig of requiredVars) {
    const value = allEnvVars[varConfig.name];
    
    if (!value) {
      missing.push(varConfig);
    } else if (!varConfig.validator(value)) {
      invalid.push({ ...varConfig, value });
    } else {
      logSuccess(`${varConfig.name}: 已正确设置`);
    }
  }
  
  return { missing, invalid, allEnvVars };
}

// 显示环境变量状态
function showEnvStatus(envVars) {
  console.log('\n📋 环境变量状态:');
  console.log('================');
  
  const adminHashBase64 = envVars.ADMIN_PASSWORD_HASH_BASE64;
  const jwtSecret = envVars.JWT_SECRET;
  
  console.log(`NODE_ENV: ${envVars.NODE_ENV || '未设置'}`);
  console.log(`PORT: ${envVars.PORT || '未设置'}`);
  console.log(`ADMIN_PASSWORD_HASH_BASE64: ${adminHashBase64 ? '已设置' : '未设置'}`);
  
  if (adminHashBase64) {
    try {
      const decoded = Buffer.from(adminHashBase64, 'base64').toString('utf8');
      console.log(`  - Base64 长度: ${adminHashBase64.length}`);
      console.log(`  - 解码后长度: ${decoded.length}`);
      console.log(`  - 格式: ${decoded.startsWith('$2b$12$') ? '正确' : '错误'}`);
      console.log(`  - 前缀: ${decoded.substring(0, 10)}`);
    } catch (error) {
      console.log(`  - 解码错误: ${error.message}`);
    }
  }
  
  console.log(`JWT_SECRET: ${jwtSecret ? '已设置' : '未设置'}`);
  
  if (jwtSecret) {
    console.log(`  - 长度: ${jwtSecret.length}`);
    console.log(`  - 安全性: ${jwtSecret.length >= 32 ? '良好' : '不足'}`);
  }
  
  console.log('');
}

// 交互式设置环境变量
async function interactiveSetup() {
  logWarning('检测到缺失或无效的环境变量，启动交互式设置...');
  
  try {
    logInfo('运行密码生成脚本...');
    execSync('node scripts/generate-password.js', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    logSuccess('密码配置完成');
    return true;
  } catch (error) {
    logError('密码配置失败: ' + error.message);
    return false;
  }
}

// 主函数
async function main() {
  console.log('🔍 构建前环境变量检查');
  console.log('======================');
  console.log('');
  
  try {
    const { missing, invalid, allEnvVars } = checkRequiredEnvVars();
    
    showEnvStatus(allEnvVars);
    
    if (missing.length > 0) {
      logError('缺失的环境变量:');
      missing.forEach(varConfig => {
        console.log(`  - ${varConfig.name}: ${varConfig.description}`);
      });
    }
    
    if (invalid.length > 0) {
      logError('无效的环境变量:');
      invalid.forEach(varConfig => {
        console.log(`  - ${varConfig.name}: ${varConfig.description} (当前值无效)`);
      });
    }
    
    if (missing.length > 0 || invalid.length > 0) {
      console.log('');
      logWarning('构建前需要设置环境变量，否则构建后的应用将无法正常工作');
      
      const setupSuccess = await interactiveSetup();
      
      if (setupSuccess) {
        const { missing: newMissing, invalid: newInvalid } = checkRequiredEnvVars();
        if (newMissing.length === 0 && newInvalid.length === 0) {
          logSuccess('✅ 环境变量检查通过，可以开始构建');
          process.exit(0);
        } else {
          logError('❌ 环境变量设置失败');
          process.exit(1);
        }
      } else {
        logError('❌ 环境变量设置失败');
        process.exit(1);
      }
    } else {
      logSuccess('✅ 所有环境变量已正确设置，可以开始构建');
      process.exit(0);
    }
    
  } catch (error) {
    logError('检查过程出错: ' + error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    logError('脚本执行失败: ' + error.message);
    process.exit(1);
  });
}

module.exports = { main, checkRequiredEnvVars };
