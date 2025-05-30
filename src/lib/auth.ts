import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// 从环境变量获取配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const DEFAULT_ADMIN_PASSWORD = 'admin123'; // 仅用于开发环境

// 调试信息
console.log('🔍 环境变量调试信息:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET:', JWT_SECRET ? '已设置' : '未设置');
console.log('ADMIN_PASSWORD_HASH:', ADMIN_PASSWORD_HASH ? '已设置' : '未设置');
if (ADMIN_PASSWORD_HASH) {
  console.log('ADMIN_PASSWORD_HASH 长度:', ADMIN_PASSWORD_HASH.length);
  console.log('ADMIN_PASSWORD_HASH 前缀:', ADMIN_PASSWORD_HASH.substring(0, 10));
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
  console.log('🔐 开始验证管理员密码...');
  console.log('密码长度:', password?.length || 0);
  console.log('ADMIN_PASSWORD_HASH 存在:', !!ADMIN_PASSWORD_HASH);

  try {
    if (ADMIN_PASSWORD_HASH) {
      // 生产环境：使用哈希密码验证
      console.log('使用哈希密码验证模式');
      console.log('哈希值长度:', ADMIN_PASSWORD_HASH.length);
      console.log('哈希值前缀:', ADMIN_PASSWORD_HASH.substring(0, 10));

      const result = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      console.log('密码验证结果:', result ? '✅ 成功' : '❌ 失败');
      return result;
    } else {
      // 开发环境：使用默认密码
      console.warn('⚠️  使用默认密码，请在生产环境中设置 ADMIN_PASSWORD_HASH 环境变量');
      const result = password === DEFAULT_ADMIN_PASSWORD;
      console.log('默认密码验证结果:', result ? '✅ 成功' : '❌ 失败');
      return result;
    }
  } catch (error) {
    console.error('❌ 密码验证失败:', error);
    console.error('错误详情:', {
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
  console.log('🎫 生成 JWT Token...');
  console.log('用户信息:', { id: user.id, username: user.username, role: user.role });
  console.log('JWT_SECRET 长度:', JWT_SECRET.length);

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
    console.log('✅ JWT Token 生成成功');
    console.log('Token 长度:', token.length);
    return token;
  } catch (error) {
    console.error('❌ JWT Token 生成失败:', error);
    throw error;
  }
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): AuthUser | null {
  console.log('🔍 验证 JWT Token...');
  console.log('Token 长度:', token?.length || 0);
  console.log('Token 前缀:', token?.substring(0, 20) || 'undefined');

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('✅ JWT Token 验证成功');
    console.log('解码用户信息:', { id: decoded.id, username: decoded.username, role: decoded.role });

    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };
  } catch (error) {
    console.error('❌ JWT Token 验证失败:', error instanceof Error ? error.message : '未知错误');
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
