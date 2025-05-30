import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { log } from './logger';

// 从环境变量获取配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// 支持 Base64 编码的密码哈希，避免特殊字符问题
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH_BASE64
  ? Buffer.from(process.env.ADMIN_PASSWORD_HASH_BASE64, 'base64').toString('utf8')
  : process.env.ADMIN_PASSWORD_HASH; // 向后兼容

const DEFAULT_ADMIN_PASSWORD = 'admin123'; // 仅用于开发环境

// 启动时的环境变量调试信息
log.startup('认证模块初始化');
log.env('NODE_ENV: ' + process.env.NODE_ENV);
log.env('JWT_SECRET: ' + (JWT_SECRET ? '已设置' : '未设置'));
log.env('ADMIN_PASSWORD_HASH_BASE64: ' + (process.env.ADMIN_PASSWORD_HASH_BASE64 ? '已设置' : '未设置'));
log.env('ADMIN_PASSWORD_HASH (解码后): ' + (ADMIN_PASSWORD_HASH ? '已设置' : '未设置'));

if (ADMIN_PASSWORD_HASH) {
  log.env('ADMIN_PASSWORD_HASH 长度: ' + ADMIN_PASSWORD_HASH.length);
  log.env('ADMIN_PASSWORD_HASH 前缀: ' + ADMIN_PASSWORD_HASH.substring(0, 10));
  log.env('使用 Base64 编码: ' + (process.env.ADMIN_PASSWORD_HASH_BASE64 ? '是' : '否'));
} else {
  log.warn('ADMIN_PASSWORD_HASH 未设置，将使用默认密码');
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
  log.auth('开始验证管理员密码');
  log.debug('密码长度: ' + (password?.length || 0));
  log.debug('ADMIN_PASSWORD_HASH 存在: ' + !!ADMIN_PASSWORD_HASH);

  try {
    if (ADMIN_PASSWORD_HASH) {
      // 生产环境：使用哈希密码验证
      log.auth('使用哈希密码验证模式');
      log.debug('哈希值长度: ' + ADMIN_PASSWORD_HASH.length);
      log.debug('哈希值前缀: ' + ADMIN_PASSWORD_HASH.substring(0, 10));

      const result = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
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
  log.auth('生成 JWT Token');
  log.debug('用户信息', { id: user.id, username: user.username, role: user.role });
  log.debug('JWT_SECRET 长度: ' + JWT_SECRET.length);

  try {
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
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
  log.auth('验证 JWT Token');
  log.debug('Token 长度: ' + (token?.length || 0));
  log.debug('Token 前缀: ' + (token?.substring(0, 20) || 'undefined'));

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
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

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
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
  return {
    isProduction: isProduction(),
    hasCustomPassword: !!ADMIN_PASSWORD_HASH,
    hasCustomJwtSecret: JWT_SECRET !== 'your-super-secret-jwt-key-change-in-production',
    recommendations: getSecurityRecommendations(),
  };
}

/**
 * 获取安全建议
 */
function getSecurityRecommendations(): string[] {
  const recommendations: string[] = [];

  if (!ADMIN_PASSWORD_HASH) {
    recommendations.push('设置 ADMIN_PASSWORD_HASH 环境变量');
  }

  if (JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
    recommendations.push('设置 JWT_SECRET 环境变量');
  }

  if (isProduction() && recommendations.length > 0) {
    recommendations.unshift('⚠️ 生产环境安全警告');
  }

  return recommendations;
}
