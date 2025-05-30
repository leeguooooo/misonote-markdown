#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function generatePasswordHash() {
  console.log('🔐 密码哈希生成工具');
  console.log('================');
  
  // 验证当前哈希对应的密码
  const currentHash = '$2b$12$0ev5NT6tVv2exHGft217YOCzowqFlw4b1hRQCZx3VBfBL4NXHygAW';
  console.log('\n🔍 验证当前哈希值:');
  console.log('当前哈希:', currentHash);
  console.log('验证 "admin123":', await bcrypt.compare('admin123', currentHash));
  console.log('验证 "admin":', await bcrypt.compare('admin', currentHash));
  
  return new Promise((resolve) => {
    rl.question('\n请输入新的管理员密码: ', async (password) => {
      if (!password || password.length < 6) {
        console.log('❌ 密码长度至少6位');
        rl.close();
        return;
      }
      
      console.log('\n⏳ 正在生成密码哈希...');
      
      try {
        const saltRounds = 12;
        const hash = await bcrypt.hash(password, saltRounds);
        
        console.log('\n✅ 密码哈希生成成功!');
        console.log('================');
        console.log('新密码哈希:', hash);
        console.log('\n📝 请将以下内容更新到你的配置中:');
        console.log('================');
        console.log('1. 更新 .env 文件:');
        console.log(`ADMIN_PASSWORD_HASH=${hash}`);
        console.log('\n2. 更新 ecosystem.config.js 文件中的所有环境配置');
        console.log('\n3. 重启 PM2 应用:');
        console.log('pm2 restart docs-platform');
        
        // 验证生成的哈希
        console.log('\n🔍 验证新哈希:');
        const isValid = await bcrypt.compare(password, hash);
        console.log('验证结果:', isValid ? '✅ 正确' : '❌ 错误');
        
      } catch (error) {
        console.error('❌ 生成哈希失败:', error.message);
      }
      
      rl.close();
      resolve();
    });
  });
}

// 如果直接运行此脚本
if (require.main === module) {
  generatePasswordHash().catch(console.error);
}

module.exports = { generatePasswordHash };
