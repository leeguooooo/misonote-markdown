#!/usr/bin/env node

// 生成 Base64 编码的安全密码

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 生成不含特殊字符的随机密码
function generateSafePassword(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// 生成随机 JWT 密钥
function generateJWTSecret() {
  return require('crypto').randomBytes(32).toString('base64');
}

// 更新 .env 文件
function updateEnvFile(adminHashBase64, jwtSecret) {
  const envPath = path.join(process.cwd(), '.env');
  
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // 移除旧的配置
  const lines = envContent.split('\n').filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('ADMIN_PASSWORD_HASH') && 
           !trimmed.startsWith('JWT_SECRET');
  });
  
  // 添加新的配置
  lines.push('# 管理员密码哈希 (Base64 编码，避免特殊字符问题)');
  lines.push(`ADMIN_PASSWORD_HASH_BASE64="${adminHashBase64}"`);
  lines.push('');
  lines.push('# JWT 密钥 (自动生成的安全密钥)');
  lines.push(`JWT_SECRET="${jwtSecret}"`);
  lines.push('');
  lines.push('# 环境设置');
  lines.push('NODE_ENV=production');
  lines.push('');
  lines.push('# 服务端口');
  lines.push('PORT=3001');
  lines.push('');
  
  fs.writeFileSync(envPath, lines.join('\n'));
}

// 交互式密码输入
function askPassword() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('请输入管理员密码 (留空自动生成): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('🔐 密码配置工具');
  console.log('================');
  
  try {
    // 询问密码
    const inputPassword = await askPassword();
    
    let password;
    if (inputPassword) {
      if (inputPassword.length < 6) {
        console.log('❌ 密码长度至少需要6位字符');
        process.exit(1);
      }
      password = inputPassword;
      console.log('✅ 使用用户输入的密码');
    } else {
      password = generateSafePassword(16);
      console.log('✅ 自动生成安全密码');
    }
    
    console.log('\n⏳ 正在生成密码哈希...');
    
    // 生成哈希
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    
    // Base64 编码
    const base64Hash = Buffer.from(hash).toString('base64');
    
    // 生成 JWT 密钥
    const jwtSecret = generateJWTSecret();
    
    // 更新 .env 文件
    updateEnvFile(base64Hash, jwtSecret);
    
    console.log('\n✅ 配置完成！');
    console.log('================');
    console.log('管理员密码:', password);
    console.log('密码哈希已保存到 .env 文件');
    
    // 验证
    console.log('\n🔍 验证配置...');
    const decodedHash = Buffer.from(base64Hash, 'base64').toString('utf8');
    const isValid = await bcrypt.compare(password, decodedHash);
    
    if (isValid) {
      console.log('✅ 密码验证成功');
    } else {
      console.log('❌ 密码验证失败');
      process.exit(1);
    }
    
    console.log('\n🎯 下一步:');
    console.log('1. 使用密码登录:', password);
    console.log('2. 构建应用: pnpm build');
    console.log('3. 启动应用: pnpm pm2:start');
    
  } catch (error) {
    console.error('❌ 配置失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateSafePassword, generateJWTSecret, updateEnvFile };
