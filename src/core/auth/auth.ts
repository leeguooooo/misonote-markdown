import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { log } from '../logger';
import { ADMIN_TOKEN_COOKIE } from '@/lib/server/auth-cookies';

const DEFAULT_ADMIN_PASSWORD = 'admin123'; // 仅用于开发环境

// 延迟初始化标志
let authInitialized = false;

/**
 * 获取 JWT 密钥（运行时读取）
 */
function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
}

/**
 * 获取管理员密码哈希（运行时读取）
 */
function getAdminPasswordHash(): string | undefined {
  // 支持 Base64 编码的密码哈希，避免特殊字符问题
  if (process.env.ADMIN_PASSWORD_HASH_BASE64) {
    try {
      return Buffer.from(process.env.ADMIN_PASSWORD_HASH_BASE64, 'base64').toString('utf8');
    } catch (error) {
      log.error('Base64 解码失败:', error);
      return undefined;
    }
  }

  // 向后兼容
  return process.env.ADMIN_PASSWORD_HASH;
}

/**
 * 初始化认证模块（仅在首次使用时调用）
 */
function initializeAuth(): void {
  if (authInitialized) return;

  authInitialized = true;

  const jwtSecret = getJwtSecret();
  const adminPasswordHash = getAdminPasswordHash();

  // 启动时的环境变量调试信息
  log.startup('认证模块初始化');
  log.env('NODE_ENV: ' + process.env.NODE_ENV);
  log.env('JWT_SECRET: ' + (jwtSecret ? '已设置' : '未设置'));
  log.env('ADMIN_PASSWORD_HASH_BASE64: ' + (process.env.ADMIN_PASSWORD_HASH_BASE64 ? '已设置' : '未设置'));
  log.env('ADMIN_PASSWORD_HASH (解码后): ' + (adminPasswordHash ? '已设置' : '未设置'));

  if (adminPasswordHash) {
    log.env('ADMIN_PASSWORD_HASH 长度: ' + adminPasswordHash.length);
    log.env('ADMIN_PASSWORD_HASH 前缀: ' + adminPasswordHash.substring(0, 10));
    log.env('使用 Base64 编码: ' + (process.env.ADMIN_PASSWORD_HASH_BASE64 ? '是' : '否'));
  } else {
    log.warn('ADMIN_PASSWORD_HASH 未设置，将使用默认密码');
  }
}

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin';
}

/**
 * 验证管理员密码
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  initializeAuth(); // 确保认证模块已初始化

  const adminPasswordHash = getAdminPasswordHash();

  log.auth('开始验证管理员密码');
  log.debug('密码长度: ' + (password?.length || 0));
  log.debug('ADMIN_PASSWORD_HASH 存在: ' + !!adminPasswordHash);

  try {
    if (adminPasswordHash) {
      // 生产环境：使用哈希密码验证
      log.auth('使用哈希密码验证模式');
      log.debug('哈希值长度: ' + adminPasswordHash.length);
      log.debug('哈希值前缀: ' + adminPasswordHash.substring(0, 10));

      const result = await bcrypt.compare(password, adminPasswordHash);
      log.auth('密码验证结果: ' + (result ? '✅ 成功' : '❌ 失败'));

      if (!result) {
        log.warn('密码验证失败，可能的原因：密码错误或哈希值问题');
      }

      return result;
    } else {
      // 开发环境：使用默认密码
      log.warn('使用默认密码，请在生产环境中设置 ADMIN_PASSWORD_HASH 环境变量');
      const result = password === DEFAULT_ADMIN_PASSWORD;
      log.auth('默认密码验证结果: ' + (result ? '✅ 成功' : '❌ 失败'));
      return result;
    }
  } catch (error) {
    log.error('密码验证失败', {
      message: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

/**
 * 生成 JWT Token
 */
export function generateToken(user: AuthUser): string {
  const jwtSecret = getJwtSecret();

  log.auth('生成 JWT Token');
  log.debug('用户信息', { id: user.id, username: user.username, role: user.role });
  log.debug('JWT_SECRET 长度: ' + jwtSecret.length);

  try {
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: '24h', // 24小时过期
      }
    );
    log.auth('JWT Token 生成成功');
    log.debug('Token 长度: ' + token.length);
    return token;
  } catch (error) {
    log.error('JWT Token 生成失败', error);
    throw error;
  }
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): AuthUser | null {
  const jwtSecret = getJwtSecret();

  log.auth('验证 JWT Token');
  log.debug('Token 长度: ' + (token?.length || 0));
  log.debug('Token 前缀: ' + (token?.substring(0, 20) || 'undefined'));

  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    log.auth('JWT Token 验证成功');
    log.debug('解码用户信息', { id: decoded.id, username: decoded.username, role: decoded.role });

    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };
  } catch (error) {
    log.warn('JWT Token 验证失败: ' + (error instanceof Error ? error.message : '未知错误'));
    return null;
  }
}

/**
 * 从请求中提取并验证 Token
 */
export function authenticateRequest(request: NextRequest): AuthUser | null {
  const authHeader = request.headers.get('authorization');

  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value || null;
  }

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * 生成密码哈希（用于设置管理员密码）
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * 获取安全配置状态
 */
export function getSecurityStatus() {
  const adminPasswordHash = getAdminPasswordHash();
  const jwtSecret = getJwtSecret();

  return {
    isProduction: isProduction(),
    hasCustomPassword: !!adminPasswordHash,
    hasCustomJwtSecret: jwtSecret !== 'your-super-secret-jwt-key-change-in-production',
    recommendations: getSecurityRecommendations(),
  };
}

/**
 * 获取安全建议
 */
function getSecurityRecommendations(): string[] {
  const adminPasswordHash = getAdminPasswordHash();
  const jwtSecret = getJwtSecret();
  const recommendations: string[] = [];

  if (!adminPasswordHash) {
    recommendations.push('设置 ADMIN_PASSWORD_HASH 环境变量');
  }

  if (jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
    recommendations.push('设置 JWT_SECRET 环境变量');
  }

  if (isProduction() && recommendations.length > 0) {
    recommendations.unshift('⚠️ 生产环境安全警告');
  }

  return recommendations;
}
