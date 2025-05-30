#!/usr/bin/env node

// 详细调试 dotenv 加载问题

const fs = require('fs');
const path = require('path');

console.log('🔍 详细调试 dotenv 加载');
console.log('========================');

// 1. 检查当前工作目录
console.log('\n1. 当前工作目录:');
console.log('process.cwd():', process.cwd());
console.log('__dirname:', __dirname);

// 2. 检查 .env 文件
console.log('\n2. .env 文件详细检查:');
const envPath = path.join(process.cwd(), '.env');
console.log('.env 文件路径:', envPath);
console.log('.env 文件存在:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const stats = fs.statSync(envPath);
  console.log('.env 文件大小:', stats.size, 'bytes');
  console.log('.env 文件修改时间:', stats.mtime);
  
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('.env 文件内容长度:', content.length);
  console.log('.env 文件内容:');
  console.log('---START---');
  console.log(content);
  console.log('---END---');
  
  // 检查每一行
  const lines = content.split('\n');
  console.log('\n逐行分析:');
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      console.log(`第${index + 1}行: "${line}"`);
      console.log(`  - 长度: ${line.length}`);
      console.log(`  - 包含等号: ${line.includes('=')}`);
      
      if (line.includes('ADMIN_PASSWORD_HASH')) {
        console.log(`  - 这是 ADMIN_PASSWORD_HASH 行`);
        const parts = line.split('=');
        console.log(`  - 分割后: key="${parts[0]}", value="${parts.slice(1).join('=')}"`);
        
        const value = parts.slice(1).join('=').trim();
        console.log(`  - 清理后的值: "${value}"`);
        console.log(`  - 值长度: ${value.length}`);
        console.log(`  - 是否有引号: ${value.startsWith('"') || value.startsWith("'")}`);
      }
    }
  });
}

// 3. 手动解析 .env 文件
console.log('\n3. 手动解析 .env 文件:');
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const result = {};
  
  content.split('\n').forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        let value = trimmed.substring(equalIndex + 1).trim();
        
        // 移除引号
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        result[key] = value;
        console.log(`解析: ${key} = "${value}" (长度: ${value.length})`);
      }
    }
  });
  
  return result;
}

const parsedEnv = parseEnvFile(envPath);
console.log('手动解析结果:', Object.keys(parsedEnv));

// 4. 测试 dotenv 加载
console.log('\n4. 测试 dotenv 加载:');

// 清除现有的环境变量
delete process.env.ADMIN_PASSWORD_HASH;
delete process.env.JWT_SECRET;

console.log('清除后的环境变量:');
console.log('ADMIN_PASSWORD_HASH:', process.env.ADMIN_PASSWORD_HASH);
console.log('JWT_SECRET:', process.env.JWT_SECRET);

// 尝试加载 dotenv
try {
  const dotenv = require('dotenv');
  console.log('dotenv 模块加载成功');
  
  const result = dotenv.config();
  console.log('dotenv.config() 结果:', result);
  
  if (result.error) {
    console.log('dotenv 加载错误:', result.error);
  } else {
    console.log('dotenv 加载成功');
    console.log('解析的变量:', Object.keys(result.parsed || {}));
  }
  
} catch (error) {
  console.log('dotenv 模块加载失败:', error.message);
}

console.log('\n加载后的环境变量:');
console.log('ADMIN_PASSWORD_HASH:', process.env.ADMIN_PASSWORD_HASH ? '已设置' : '未设置');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');

if (process.env.ADMIN_PASSWORD_HASH) {
  console.log('ADMIN_PASSWORD_HASH 详情:');
  console.log('  - 长度:', process.env.ADMIN_PASSWORD_HASH.length);
  console.log('  - 前缀:', process.env.ADMIN_PASSWORD_HASH.substring(0, 10));
  console.log('  - 完整值:', process.env.ADMIN_PASSWORD_HASH);
}

// 5. 检查 dotenv 包是否安装
console.log('\n5. 检查 dotenv 包:');
try {
  const packageJson = require('./package.json');
  const hasDotenv = packageJson.dependencies?.dotenv || packageJson.devDependencies?.dotenv;
  console.log('package.json 中有 dotenv:', !!hasDotenv);
  if (hasDotenv) {
    console.log('dotenv 版本:', hasDotenv);
  }
} catch (error) {
  console.log('无法读取 package.json:', error.message);
}

// 6. 测试直接设置环境变量
console.log('\n6. 测试直接设置环境变量:');
if (parsedEnv.ADMIN_PASSWORD_HASH) {
  process.env.ADMIN_PASSWORD_HASH = parsedEnv.ADMIN_PASSWORD_HASH;
  console.log('手动设置 ADMIN_PASSWORD_HASH 成功');
  console.log('设置后的值:', process.env.ADMIN_PASSWORD_HASH ? '已设置' : '未设置');
}

console.log('\n✅ 调试完成');
console.log('\n💡 可能的问题:');
console.log('1. dotenv 包未安装');
console.log('2. .env 文件格式问题');
console.log('3. 文件编码问题');
console.log('4. 权限问题');
console.log('5. 路径问题');
