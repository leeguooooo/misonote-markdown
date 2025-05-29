import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// 从环境变量获取配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const DEFAULT_ADMIN_PASSWORD = 'admin123'; // 仅用于开发环境

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin';
}

/**
 * 验证管理员密码
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    if (ADMIN_PASSWORD_HASH) {
      // 生产环境：使用哈希密码验证
      return await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    } else {
      // 开发环境：使用默认密码
      console.warn('⚠️  使用默认密码，请在生产环境中设置 ADMIN_PASSWORD_HASH 环境变量');
      return password === DEFAULT_ADMIN_PASSWORD;
    }
  } catch (error) {
    console.error('密码验证失败:', error);
    return false;
  }
}

/**
 * 生成 JWT Token
 */
export function generateToken(user: AuthUser): string {
  return jwt.sign(
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
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };
  } catch (error) {
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
