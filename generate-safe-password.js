#!/usr/bin/env node

// 生成不含特殊字符的安全密码和哈希

const bcrypt = require('bcryptjs');

// 生成不含特殊字符的随机密码
function generateSafePassword(length = 16) {
  // 只使用字母和数字，避免 $、/、= 等特殊字符
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

async function main() {
  console.log('🔐 生成安全密码（不含特殊字符）');
  console.log('================================');
  
  // 生成密码
  const password = generateSafePassword(16);
  console.log('生成的密码:', password);
  
  // 生成哈希
  console.log('\n⏳ 正在生成密码哈希...');
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);
  
  console.log('\n✅ 生成完成！');
  console.log('================');
  console.log('密码:', password);
  console.log('哈希:', hash);
  
  console.log('\n📝 .env 文件配置:');
  console.log('================');
  console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
  
  // 验证
  console.log('\n🔍 验证哈希:');
  const isValid = await bcrypt.compare(password, hash);
  console.log('验证结果:', isValid ? '✅ 正确' : '❌ 错误');
  
  console.log('\n🎯 使用说明:');
  console.log('1. 复制上面的 ADMIN_PASSWORD_HASH 到 .env 文件');
  console.log('2. 使用密码:', password, '登录');
  console.log('3. 重新构建应用: pnpm build');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateSafePassword };
