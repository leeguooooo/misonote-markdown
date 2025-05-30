#!/usr/bin/env node

// 验证管理员密码

const bcrypt = require('bcryptjs');
const readline = require('readline');
require('dotenv').config();

// 交互式密码输入
function askPassword() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('请输入要验证的密码: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('🔍 密码验证工具');
  console.log('================');
  
  try {
    // 获取存储的哈希
    const adminHashBase64 = process.env.ADMIN_PASSWORD_HASH_BASE64;
    
    if (!adminHashBase64) {
      console.log('❌ 未找到 ADMIN_PASSWORD_HASH_BASE64 环境变量');
      console.log('请先运行: pnpm security:setup');
      process.exit(1);
    }
    
    console.log('✅ 找到密码哈希配置');
    
    // 解码 Base64
    let decodedHash;
    try {
      decodedHash = Buffer.from(adminHashBase64, 'base64').toString('utf8');
      console.log('✅ Base64 解码成功');
      console.log('哈希长度:', decodedHash.length);
      console.log('哈希前缀:', decodedHash.substring(0, 10));
    } catch (error) {
      console.log('❌ Base64 解码失败:', error.message);
      process.exit(1);
    }
    
    // 询问密码
    const password = await askPassword();
    
    if (!password) {
      console.log('❌ 密码不能为空');
      process.exit(1);
    }
    
    console.log('\n⏳ 验证密码...');
    
    // 验证密码
    const isValid = await bcrypt.compare(password, decodedHash);
    
    if (isValid) {
      console.log('✅ 密码验证成功！');
      console.log('🎉 您可以使用此密码登录管理后台');
    } else {
      console.log('❌ 密码验证失败！');
      console.log('💡 如需重新设置密码，请运行: pnpm security:setup');
    }
    
  } catch (error) {
    console.error('❌ 验证过程出错:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
