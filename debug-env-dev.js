#!/usr/bin/env node

// 调试开发环境的环境变量

console.log('🔍 开发环境变量调试');
console.log('==================');

// 1. 检查原始环境变量
console.log('\n📋 原始 process.env:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ADMIN_PASSWORD_HASH:', process.env.ADMIN_PASSWORD_HASH ? '已设置' : '未设置');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');

if (process.env.ADMIN_PASSWORD_HASH) {
  console.log('ADMIN_PASSWORD_HASH 长度:', process.env.ADMIN_PASSWORD_HASH.length);
  console.log('ADMIN_PASSWORD_HASH 前缀:', process.env.ADMIN_PASSWORD_HASH.substring(0, 10));
}

// 2. 加载 dotenv
console.log('\n🔧 加载 dotenv...');
require('dotenv').config();

console.log('\n📋 加载 dotenv 后:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ADMIN_PASSWORD_HASH:', process.env.ADMIN_PASSWORD_HASH ? '已设置' : '未设置');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');

if (process.env.ADMIN_PASSWORD_HASH) {
  console.log('ADMIN_PASSWORD_HASH 长度:', process.env.ADMIN_PASSWORD_HASH.length);
  console.log('ADMIN_PASSWORD_HASH 前缀:', process.env.ADMIN_PASSWORD_HASH.substring(0, 10));
  console.log('ADMIN_PASSWORD_HASH 完整值:', process.env.ADMIN_PASSWORD_HASH);
}

// 3. 检查文件存在性
const fs = require('fs');
console.log('\n📁 文件检查:');
console.log('.env 存在:', fs.existsSync('.env'));
console.log('.env.local 存在:', fs.existsSync('.env.local'));
console.log('.env.development 存在:', fs.existsSync('.env.development'));

// 4. 读取 .env 文件内容
if (fs.existsSync('.env')) {
  console.log('\n📄 .env 文件内容:');
  const envContent = fs.readFileSync('.env', 'utf8');
  console.log(envContent);
  
  // 检查是否包含引号
  const hashLine = envContent.split('\n').find(line => line.startsWith('ADMIN_PASSWORD_HASH='));
  if (hashLine) {
    console.log('\n🔍 密码哈希行分析:');
    console.log('原始行:', hashLine);
    console.log('包含双引号:', hashLine.includes('"'));
    console.log('包含单引号:', hashLine.includes("'"));
  }
}

// 5. 测试密码验证
console.log('\n🔐 测试密码验证:');
if (process.env.ADMIN_PASSWORD_HASH) {
  const bcrypt = require('bcryptjs');
  
  const testPasswords = ['admin123', 'xiaoli123', 'your-password'];
  
  testPasswords.forEach(async (password) => {
    try {
      const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
      console.log(`密码 "${password}": ${isValid ? '✅ 正确' : '❌ 错误'}`);
    } catch (error) {
      console.log(`密码 "${password}": ❌ 验证失败 - ${error.message}`);
    }
  });
} else {
  console.log('❌ 无法测试，ADMIN_PASSWORD_HASH 未设置');
}

// 6. 建议
console.log('\n💡 建议:');
if (!process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD_HASH.length !== 60) {
  console.log('1. 检查 .env 文件中是否有引号');
  console.log('2. 确保没有多余的空格');
  console.log('3. 考虑使用 .env.local 文件');
  console.log('4. 或者使用 PM2 启动开发模式');
}

console.log('\n🚀 启动建议:');
console.log('开发模式: pnpm dev (需要正确的 .env 文件)');
console.log('PM2 开发: pm2 start ecosystem.config.js --env development');
console.log('PM2 生产: pm2 start ecosystem.config.js --env production');
