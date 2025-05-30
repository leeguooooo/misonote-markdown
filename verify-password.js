#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function verifyPassword() {
  console.log('🔍 密码验证工具');
  console.log('================');
  
  // 从 .env 文件读取哈希
  require('dotenv').config();
  const hashFromEnv = process.env.ADMIN_PASSWORD_HASH;
  
  console.log('从 .env 文件读取的哈希:', hashFromEnv ? '已读取' : '未读取');
  if (hashFromEnv) {
    console.log('哈希长度:', hashFromEnv.length);
    console.log('哈希前缀:', hashFromEnv.substring(0, 10));
  }
  
  return new Promise((resolve) => {
    rl.question('\n请输入要验证的密码: ', async (password) => {
      if (!password) {
        console.log('❌ 密码不能为空');
        rl.close();
        return;
      }
      
      if (!hashFromEnv) {
        console.log('❌ 未找到密码哈希，请检查 .env 文件');
        rl.close();
        return;
      }
      
      try {
        console.log('\n⏳ 验证密码...');
        const isValid = await bcrypt.compare(password, hashFromEnv);
        
        console.log('\n🔍 验证结果:');
        console.log('密码正确:', isValid ? '✅ 是' : '❌ 否');
        
        if (isValid) {
          console.log('\n🎉 密码验证成功！');
          console.log('你可以使用此密码登录管理界面');
        } else {
          console.log('\n❌ 密码验证失败！');
          console.log('请检查密码是否正确，或重新生成密码哈希');
        }
        
        // 额外测试常见密码
        console.log('\n🔍 测试常见密码:');
        const commonPasswords = ['admin123', 'admin', '123456', 'password'];
        
        for (const testPassword of commonPasswords) {
          const testResult = await bcrypt.compare(testPassword, hashFromEnv);
          console.log(`"${testPassword}": ${testResult ? '✅ 匹配' : '❌ 不匹配'}`);
        }
        
      } catch (error) {
        console.error('❌ 验证过程出错:', error.message);
      }
      
      rl.close();
      resolve();
    });
  });
}

// 如果直接运行此脚本
if (require.main === module) {
  verifyPassword().catch(console.error);
}

module.exports = { verifyPassword };
