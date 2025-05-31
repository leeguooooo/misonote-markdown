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
  console.log('此工具用于为管理员账户生成安全的密码哈希');

  return new Promise((resolve) => {
    rl.question('\n请输入新的管理员密码 (至少6位字符): ', async (password) => {
      if (!password || password.length < 6) {
        console.log('❌ 密码长度至少需要6位字符');
        rl.close();
        return;
      }

      // 确认密码
      rl.question('请再次确认密码: ', async (confirmPassword) => {
        if (password !== confirmPassword) {
          console.log('❌ 两次输入的密码不一致');
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
          console.log('\n📝 请将以下内容更新到你的 .env 文件:');
          console.log('================');
          console.log(`ADMIN_PASSWORD_HASH=${hash}`);
          console.log('\n🔄 更新步骤:');
          console.log('1. 更新 .env 文件中的 ADMIN_PASSWORD_HASH');
          console.log('2. 重启 PM2 应用: pm2 restart docs-platform');
          console.log('3. 使用新密码登录验证');

          // 验证生成的哈希
          console.log('\n🔍 验证新哈希:');
          const isValid = await bcrypt.compare(password, hash);
          console.log('验证结果:', isValid ? '✅ 正确' : '❌ 错误');

          console.log('\n🎉 密码设置完成！请妥善保管你的密码。');

        } catch (error) {
          console.error('❌ 生成哈希失败:', error.message);
        }

        rl.close();
        resolve();
      });
    });
  });
}

// 如果直接运行此脚本
if (require.main === module) {
  generatePasswordHash().catch(console.error);
}

module.exports = { generatePasswordHash };
