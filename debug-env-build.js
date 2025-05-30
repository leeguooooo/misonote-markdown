#!/usr/bin/env node

// 调试构建时环境变量读取

console.log('🔍 构建时环境变量调试');
console.log('======================');

// 1. 检查 process.env
console.log('\n📋 process.env 中的变量:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ADMIN_PASSWORD_HASH:', process.env.ADMIN_PASSWORD_HASH ? '已设置' : '未设置');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');

if (process.env.ADMIN_PASSWORD_HASH) {
  console.log('ADMIN_PASSWORD_HASH 长度:', process.env.ADMIN_PASSWORD_HASH.length);
  console.log('ADMIN_PASSWORD_HASH 前缀:', process.env.ADMIN_PASSWORD_HASH.substring(0, 10));
}

// 2. 尝试加载 dotenv
console.log('\n🔧 尝试加载 dotenv:');
try {
  require('dotenv').config();
  console.log('dotenv 加载成功');
  
  console.log('\n📋 加载 dotenv 后的变量:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('ADMIN_PASSWORD_HASH:', process.env.ADMIN_PASSWORD_HASH ? '已设置' : '未设置');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
  
  if (process.env.ADMIN_PASSWORD_HASH) {
    console.log('ADMIN_PASSWORD_HASH 长度:', process.env.ADMIN_PASSWORD_HASH.length);
    console.log('ADMIN_PASSWORD_HASH 前缀:', process.env.ADMIN_PASSWORD_HASH.substring(0, 10));
    console.log('ADMIN_PASSWORD_HASH 完整值:', process.env.ADMIN_PASSWORD_HASH);
  }
} catch (error) {
  console.log('dotenv 加载失败:', error.message);
}

// 3. 检查 .env 文件
const fs = require('fs');
console.log('\n📁 .env 文件检查:');
if (fs.existsSync('.env')) {
  console.log('.env 文件存在');
  const content = fs.readFileSync('.env', 'utf8');
  console.log('.env 文件内容:');
  console.log('---');
  console.log(content);
  console.log('---');
  
  // 解析 .env 文件
  const lines = content.split('\n');
  const hashLine = lines.find(line => line.trim().startsWith('ADMIN_PASSWORD_HASH='));
  if (hashLine) {
    console.log('找到 ADMIN_PASSWORD_HASH 行:', hashLine);
    const value = hashLine.split('=')[1];
    console.log('提取的值:', value);
    console.log('值长度:', value ? value.length : 0);
  }
} else {
  console.log('.env 文件不存在');
}

// 4. 检查其他可能的环境文件
const envFiles = ['.env.local', '.env.production', '.env.production.local'];
envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`${file} 文件存在`);
    const content = fs.readFileSync(file, 'utf8');
    console.log(`${file} 内容:`, content.substring(0, 200));
  }
});

// 5. 模拟 Next.js 环境变量加载
console.log('\n🔄 模拟 Next.js 环境变量加载:');

// Next.js 按以下顺序加载环境变量：
// .env.$(NODE_ENV).local
// .env.local (当 NODE_ENV 不是 test 时)
// .env.$(NODE_ENV)
// .env

const nodeEnv = process.env.NODE_ENV || 'development';
const envFilesToCheck = [
  `.env.${nodeEnv}.local`,
  nodeEnv !== 'test' ? '.env.local' : null,
  `.env.${nodeEnv}`,
  '.env'
].filter(Boolean);

console.log('Next.js 会按以下顺序加载环境文件:');
envFilesToCheck.forEach((file, index) => {
  const exists = fs.existsSync(file);
  console.log(`${index + 1}. ${file}: ${exists ? '存在' : '不存在'}`);
  
  if (exists) {
    const content = fs.readFileSync(file, 'utf8');
    const hashLine = content.split('\n').find(line => line.trim().startsWith('ADMIN_PASSWORD_HASH='));
    if (hashLine) {
      console.log(`   包含 ADMIN_PASSWORD_HASH: ${hashLine}`);
    }
  }
});

console.log('\n✅ 调试完成');
