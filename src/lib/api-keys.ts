/**
 * API 密钥管理模块
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDatabase } from './database';
import { log } from './logger';

export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions: string[];
  isActive: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;
  rateLimit: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  description?: string;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  expiresAt?: Date;
  rateLimit?: number;
  description?: string;
  createdBy?: string;
}

export interface ApiKeyWithSecret {
  apiKey: ApiKey;
  secretKey: string;
}

/**
 * 生成 API 密钥
 */
function generateApiKey(): { key: string; prefix: string; hash: string } {
  // 生成 32 字节的随机密钥
  const randomBytes = crypto.randomBytes(32);
  const key = `mcp_${randomBytes.toString('hex')}`;
  
  // 提取前缀用于快速查找
  const prefix = key.substring(0, 12);
  
  // 生成哈希用于存储
  const hash = bcrypt.hashSync(key, 12);
  
  return { key, prefix, hash };
}

/**
 * 创建新的 API 密钥
 */
export function createApiKey(request: CreateApiKeyRequest): ApiKeyWithSecret {
  const db = getDatabase();
  const { key, prefix, hash } = generateApiKey();
  
  const apiKeyData: Omit<ApiKey, 'id' | 'createdAt' | 'updatedAt'> = {
    name: request.name,
    keyHash: hash,
    keyPrefix: prefix,
    permissions: request.permissions || ['read', 'write'],
    isActive: true,
    expiresAt: request.expiresAt,
    usageCount: 0,
    rateLimit: request.rateLimit || 1000,
    createdBy: request.createdBy,
    description: request.description,
    lastUsedAt: undefined,
  };

  const id = uuidv4();
  const now = new Date();

  const stmt = db.prepare(`
    INSERT INTO api_keys (
      id, name, key_hash, key_prefix, permissions, is_active,
      expires_at, usage_count, rate_limit, created_at, updated_at,
      created_by, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    apiKeyData.name,
    apiKeyData.keyHash,
    apiKeyData.keyPrefix,
    JSON.stringify(apiKeyData.permissions),
    apiKeyData.isActive ? 1 : 0,
    apiKeyData.expiresAt?.toISOString(),
    apiKeyData.usageCount,
    apiKeyData.rateLimit,
    now.toISOString(),
    now.toISOString(),
    apiKeyData.createdBy,
    apiKeyData.description
  );

  const createdApiKey: ApiKey = {
    ...apiKeyData,
    id,
    createdAt: now,
    updatedAt: now,
  };

  log.info('创建 API 密钥', { id, name: request.name, prefix });

  return {
    apiKey: createdApiKey,
    secretKey: key,
  };
}

/**
 * 验证 API 密钥
 */
export function validateApiKey(key: string): ApiKey | null {
  if (!key || !key.startsWith('mcp_')) {
    return null;
  }

  const db = getDatabase();
  const prefix = key.substring(0, 12);

  const stmt = db.prepare(`
    SELECT * FROM api_keys 
    WHERE key_prefix = ? AND is_active = 1
  `);

  const rows = stmt.all(prefix) as any[];

  for (const row of rows) {
    try {
      if (bcrypt.compareSync(key, row.key_hash)) {
        // 更新使用统计
        updateApiKeyUsage(row.id);
        
        return {
          id: row.id,
          name: row.name,
          keyHash: row.key_hash,
          keyPrefix: row.key_prefix,
          permissions: JSON.parse(row.permissions || '[]'),
          isActive: Boolean(row.is_active),
          expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
          lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : undefined,
          usageCount: row.usage_count,
          rateLimit: row.rate_limit,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          createdBy: row.created_by,
          description: row.description,
        };
      }
    } catch (error) {
      log.warn('API 密钥验证失败', { prefix, error: error instanceof Error ? error.message : error });
    }
  }

  return null;
}

/**
 * 更新 API 密钥使用统计
 */
function updateApiKeyUsage(id: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE api_keys 
    SET usage_count = usage_count + 1, 
        last_used_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(id);
}

/**
 * 获取所有 API 密钥（不包含密钥哈希）
 */
export function getAllApiKeys(): ApiKey[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM api_keys 
    ORDER BY created_at DESC
  `);

  const rows = stmt.all() as any[];
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    keyHash: row.key_hash,
    keyPrefix: row.key_prefix,
    permissions: JSON.parse(row.permissions || '[]'),
    isActive: Boolean(row.is_active),
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : undefined,
    usageCount: row.usage_count,
    rateLimit: row.rate_limit,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
    description: row.description,
  }));
}

/**
 * 根据 ID 获取 API 密钥
 */
export function getApiKeyById(id: string): ApiKey | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM api_keys WHERE id = ?
  `);

  const row = stmt.get(id) as any;
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    keyHash: row.key_hash,
    keyPrefix: row.key_prefix,
    permissions: JSON.parse(row.permissions || '[]'),
    isActive: Boolean(row.is_active),
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : undefined,
    usageCount: row.usage_count,
    rateLimit: row.rate_limit,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
    description: row.description,
  };
}

/**
 * 更新 API 密钥
 */
export function updateApiKey(id: string, updates: Partial<Pick<ApiKey, 'name' | 'permissions' | 'isActive' | 'expiresAt' | 'rateLimit' | 'description'>>): boolean {
  const db = getDatabase();
  
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  
  if (updates.permissions !== undefined) {
    fields.push('permissions = ?');
    values.push(JSON.stringify(updates.permissions));
  }
  
  if (updates.isActive !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.isActive ? 1 : 0);
  }
  
  if (updates.expiresAt !== undefined) {
    fields.push('expires_at = ?');
    values.push(updates.expiresAt?.toISOString());
  }
  
  if (updates.rateLimit !== undefined) {
    fields.push('rate_limit = ?');
    values.push(updates.rateLimit);
  }
  
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }

  if (fields.length === 0) return false;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const stmt = db.prepare(`
    UPDATE api_keys SET ${fields.join(', ')} WHERE id = ?
  `);

  const result = stmt.run(...values);
  
  if (result.changes > 0) {
    log.info('更新 API 密钥', { id, updates });
    return true;
  }
  
  return false;
}

/**
 * 删除 API 密钥
 */
export function deleteApiKey(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`DELETE FROM api_keys WHERE id = ?`);
  const result = stmt.run(id);
  
  if (result.changes > 0) {
    log.info('删除 API 密钥', { id });
    return true;
  }
  
  return false;
}

/**
 * 检查 API 密钥是否有指定权限
 */
export function hasPermission(apiKey: ApiKey, permission: string): boolean {
  return apiKey.permissions.includes(permission) || apiKey.permissions.includes('*');
}

/**
 * 检查 API 密钥是否过期
 */
export function isApiKeyExpired(apiKey: ApiKey): boolean {
  if (!apiKey.expiresAt) return false;
  return new Date() > apiKey.expiresAt;
}

/**
 * 清理过期的 API 密钥
 */
export function cleanupExpiredApiKeys(): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    DELETE FROM api_keys 
    WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP
  `);
  
  const result = stmt.run();
  
  if (result.changes > 0) {
    log.info('清理过期 API 密钥', { count: result.changes });
  }
  
  return result.changes;
}
