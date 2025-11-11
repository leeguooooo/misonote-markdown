#!/usr/bin/env node

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const REQUIRED_VARS = ['JWT_SECRET', 'ADMIN_PASSWORD_HASH_BASE64'];
const ENV_PATH = path.join(process.cwd(), '.env');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const content = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue;
    }
    const [key, ...rest] = line.split('=');
    if (!key) {
      continue;
    }
    let value = rest.join('=').trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key.trim()] = value;
  }
  return env;
}

function hydrateProcessEnv(source) {
  for (const key of REQUIRED_VARS) {
    if (!process.env[key] && source[key]) {
      process.env[key] = source[key];
    }
  }
}

function resolveMissing() {
  return REQUIRED_VARS.filter((key) => !process.env[key]);
}

function runSecuritySetup() {
  const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const result = spawnSync(pnpmCmd, ['security:setup'], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    console.error('❌ 自动运行 pnpm security:setup 失败');
    process.exit(result.status || 1);
  }
}

function ensureSecrets() {
  hydrateProcessEnv(parseEnvFile(ENV_PATH));
  let missing = resolveMissing();

  if (!missing.length) {
    return;
  }

  if (process.env.SKIP_AUTO_SECURITY_SETUP === 'true') {
    console.warn(
      `⚠️  缺少必要环境变量: ${missing.join(', ')}。已跳过自动配置，请手动运行 pnpm security:setup`
    );
    return;
  }

  console.log(
    `🔐 检测到缺少 ${missing.join(', ')}，正在自动执行 pnpm security:setup...`
  );
  runSecuritySetup();

  hydrateProcessEnv(parseEnvFile(ENV_PATH));
  missing = resolveMissing();

  if (missing.length) {
    console.error(
      `❌ 自动配置后仍缺少变量: ${missing.join(', ')}。请检查 .env 文件`
    );
    process.exit(1);
  }
  console.log('✅ 安全配置已完成，继续启动开发服务器');
}

async function checkPort(port) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          reject(err);
        }
      })
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port, '0.0.0.0');
  });
}

async function findAvailablePort(startPort, maxAttempts = 20) {
  let port = Number(startPort) || 3001;
  for (let i = 0; i < maxAttempts; i++) {
    const free = await checkPort(port);
    if (free) {
      return port;
    }
    port++;
  }
  throw new Error(`无法找到可用端口 (尝试范围: ${startPort}-${startPort + maxAttempts - 1})`);
}

function startNextDev(port) {
  process.env.PORT = String(port);
  const args = ['dev', '--turbopack', '--port', String(port), ...process.argv.slice(2)];
  const nextProcess = spawn('next', args, {
    stdio: 'inherit',
    env: process.env,
  });

  nextProcess.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

async function main() {
  ensureSecrets();
  const preferredPort = Number(process.env.PORT) || 3001;
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.warn(`⚠️  端口 ${preferredPort} 已被占用，自动切换到 ${port}`);
  } else {
    console.log(`🚪 使用端口 ${port}`);
  }
  startNextDev(port);
}

main().catch((err) => {
  console.error('❌ 启动开发服务器失败:', err.message);
  process.exit(1);
});
