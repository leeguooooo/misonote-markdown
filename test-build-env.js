#!/usr/bin/env node

// 测试构建时环境变量的脚本

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 测试构建时环境变量');
console.log('======================');

// 1. 检查当前环境变量
console.log('\n1. 当前环境变量状态:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ADMIN_PASSWORD_HASH:', process.env.ADMIN_PASSWORD_HASH ? '已设置' : '未设置');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');

// 2. 检查 .env 文件
console.log('\n2. .env 文件检查:');
if (fs.existsSync('.env')) {
  const content = fs.readFileSync('.env', 'utf8');
  console.log('.env 文件存在，内容:');
  console.log('---');
  console.log(content);
  console.log('---');
} else {
  console.log('.env 文件不存在');
}

// 3. 手动加载 dotenv
console.log('\n3. 手动加载 dotenv:');
require('dotenv').config();
console.log('加载后 ADMIN_PASSWORD_HASH:', process.env.ADMIN_PASSWORD_HASH ? '已设置' : '未设置');
if (process.env.ADMIN_PASSWORD_HASH) {
  console.log('长度:', process.env.ADMIN_PASSWORD_HASH.length);
  console.log('前缀:', process.env.ADMIN_PASSWORD_HASH.substring(0, 10));
}

// 4. 测试 Next.js 配置加载
console.log('\n4. 测试 Next.js 配置加载:');
try {
  delete require.cache[require.resolve('./next.config.js')];
  const nextConfig = require('./next.config.js');
  console.log('Next.js 配置加载成功');
  console.log('配置中的环境变量:', nextConfig.env);
} catch (error) {
  console.log('Next.js 配置加载失败:', error.message);
}

// 5. 创建测试用的简单 Next.js 页面来验证环境变量
console.log('\n5. 创建测试页面:');
const testPageContent = `
// 测试环境变量的页面
export default function TestEnv() {
  return (
    <div>
      <h1>环境变量测试</h1>
      <p>NODE_ENV: {process.env.NODE_ENV}</p>
      <p>ADMIN_PASSWORD_HASH: {process.env.ADMIN_PASSWORD_HASH ? '已设置' : '未设置'}</p>
      <p>JWT_SECRET: {process.env.JWT_SECRET ? '已设置' : '未设置'}</p>
    </div>
  );
}

export async function getServerSideProps() {
  console.log('服务端环境变量:');
  console.log('ADMIN_PASSWORD_HASH:', process.env.ADMIN_PASSWORD_HASH ? '已设置' : '未设置');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
  
  return {
    props: {
      adminHashSet: !!process.env.ADMIN_PASSWORD_HASH,
      jwtSecretSet: !!process.env.JWT_SECRET,
    }
  };
}
`;

// 确保 pages 目录存在
if (!fs.existsSync('src/pages')) {
  fs.mkdirSync('src/pages', { recursive: true });
}

fs.writeFileSync('src/pages/test-env.js', testPageContent);
console.log('测试页面已创建: src/pages/test-env.js');

// 6. 运行简单的构建测试
console.log('\n6. 运行构建测试:');
try {
  console.log('开始构建...');
  const output = execSync('pnpm build:force', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('构建成功');
  
  // 查找构建输出中的环境变量信息
  const lines = output.split('\n');
  const envLines = lines.filter(line => 
    line.includes('ENV:') || 
    line.includes('ADMIN_PASSWORD_HASH') || 
    line.includes('JWT_SECRET')
  );
  
  if (envLines.length > 0) {
    console.log('\n构建过程中的环境变量信息:');
    envLines.forEach(line => console.log(line));
  }
  
} catch (error) {
  console.log('构建失败:', error.message);
  
  // 显示错误输出中的环境变量相关信息
  if (error.stdout) {
    const lines = error.stdout.split('\n');
    const envLines = lines.filter(line => 
      line.includes('ENV:') || 
      line.includes('ADMIN_PASSWORD_HASH') || 
      line.includes('JWT_SECRET')
    );
    
    if (envLines.length > 0) {
      console.log('\n构建错误中的环境变量信息:');
      envLines.forEach(line => console.log(line));
    }
  }
}

console.log('\n✅ 测试完成');
console.log('\n💡 建议:');
console.log('1. 检查 .env 文件是否正确');
console.log('2. 确保 dotenv 包已安装');
console.log('3. 检查 next.config.js 是否正确配置');
console.log('4. 尝试在构建前手动设置环境变量');
