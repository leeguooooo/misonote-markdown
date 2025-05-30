#!/usr/bin/env node

// 调试环境变量加载的脚本

console.log('🔍 环境变量调试工具');
console.log('==================');

// 1. 检查 process.env 中的变量
console.log('\n📋 当前 process.env 中的变量:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('ADMIN_PASSWORD_HASH:', process.env.ADMIN_PASSWORD_HASH ? '已设置' : '未设置');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');

if (process.env.ADMIN_PASSWORD_HASH) {
  console.log('ADMIN_PASSWORD_HASH 长度:', process.env.ADMIN_PASSWORD_HASH.length);
  console.log('ADMIN_PASSWORD_HASH 前缀:', process.env.ADMIN_PASSWORD_HASH.substring(0, 10));
}

// 2. 尝试加载 dotenv
console.log('\n🔧 尝试加载 .env 文件:');
try {
  require('dotenv').config();
  console.log('✅ dotenv 加载成功');
  
  console.log('\n📋 加载 .env 后的变量:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT);
  console.log('ADMIN_PASSWORD_HASH:', process.env.ADMIN_PASSWORD_HASH ? '已设置' : '未设置');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
  
  if (process.env.ADMIN_PASSWORD_HASH) {
    console.log('ADMIN_PASSWORD_HASH 长度:', process.env.ADMIN_PASSWORD_HASH.length);
    console.log('ADMIN_PASSWORD_HASH 前缀:', process.env.ADMIN_PASSWORD_HASH.substring(0, 10));
  }
} catch (error) {
  console.log('❌ dotenv 加载失败:', error.message);
}

// 3. 检查 .env 文件是否存在
const fs = require('fs');
console.log('\n📁 文件系统检查:');
console.log('.env 文件存在:', fs.existsSync('.env'));

if (fs.existsSync('.env')) {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    console.log('.env 文件内容长度:', envContent.length);
    console.log('.env 文件包含 ADMIN_PASSWORD_HASH:', envContent.includes('ADMIN_PASSWORD_HASH'));
    console.log('.env 文件包含 JWT_SECRET:', envContent.includes('JWT_SECRET'));
  } catch (error) {
    console.log('❌ 读取 .env 文件失败:', error.message);
  }
}

// 4. 检查 dotenv 包是否安装
console.log('\n📦 依赖检查:');
try {
  const dotenvVersion = require('dotenv/package.json').version;
  console.log('✅ dotenv 版本:', dotenvVersion);
} catch (error) {
  console.log('❌ dotenv 未安装或无法访问');
}

// 5. 模拟认证逻辑
console.log('\n🔐 模拟认证逻辑:');
const bcrypt = require('bcryptjs');

if (process.env.ADMIN_PASSWORD_HASH) {
  console.log('使用环境变量中的哈希进行验证...');
  
  const testPasswords = ['xiaoli123', 'admin123', 'admin'];
  
  testPasswords.forEach(async (password) => {
    try {
      const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
      console.log(`密码 "${password}": ${isValid ? '✅ 正确' : '❌ 错误'}`);
    } catch (error) {
      console.log(`密码 "${password}": ❌ 验证失败 - ${error.message}`);
    }
  });
} else {
  console.log('❌ 环境变量中没有 ADMIN_PASSWORD_HASH');
  console.log('将使用默认密码 admin123');
}
