#!/usr/bin/env node

// 生成 Base64 编码的密码哈希，完全避免特殊字符问题

const bcrypt = require('bcryptjs');

// 生成不含特殊字符的随机密码
function generateSafePassword(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

async function main() {
  console.log('🔐 生成 Base64 编码的安全密码');
  console.log('==============================');
  
  // 生成密码
  const password = generateSafePassword(16);
  console.log('生成的密码:', password);
  
  // 生成哈希
  console.log('\n⏳ 正在生成密码哈希...');
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);
  
  // 将哈希进行 Base64 编码
  const base64Hash = Buffer.from(hash).toString('base64');
  
  console.log('\n✅ 生成完成！');
  console.log('================');
  console.log('密码:', password);
  console.log('原始哈希:', hash);
  console.log('Base64 哈希:', base64Hash);
  
  console.log('\n📝 .env 文件配置:');
  console.log('================');
  console.log(`ADMIN_PASSWORD_HASH_BASE64="${base64Hash}"`);
  
  // 验证解码和验证
  console.log('\n🔍 验证 Base64 解码和哈希:');
  const decodedHash = Buffer.from(base64Hash, 'base64').toString('utf8');
  console.log('解码后的哈希:', decodedHash);
  console.log('解码是否正确:', decodedHash === hash ? '✅ 正确' : '❌ 错误');
  
  const isValid = await bcrypt.compare(password, decodedHash);
  console.log('密码验证结果:', isValid ? '✅ 正确' : '❌ 错误');
  
  console.log('\n🎯 使用说明:');
  console.log('1. 复制上面的 ADMIN_PASSWORD_HASH_BASE64 到 .env 文件');
  console.log('2. 修改代码使用 Base64 解码');
  console.log('3. 使用密码:', password, '登录');
  console.log('4. 重新构建应用: pnpm build');
  
  console.log('\n💡 代码修改示例:');
  console.log('在 auth.ts 中添加:');
  console.log('const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH_BASE64 ? ');
  console.log('  Buffer.from(process.env.ADMIN_PASSWORD_HASH_BASE64, "base64").toString("utf8") : null;');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateSafePassword };
