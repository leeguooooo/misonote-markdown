/**
 * API 密钥管理模块 - PostgreSQL 版本
 * 简化版本，专注于核心功能
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import { log } from '../logger';

// 类型定义
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
  createdBy?: string;
  description?: string;
}

export interface ApiKeyWithSecret {
  apiKey: ApiKey;
  secretKey: string;
}

/**
 * 生成 API 密钥
 */
function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `mcp_${uuidv4().replace(/-/g, '')}`;
  const prefix = key.substring(0, 12);
  const hash = bcrypt.hashSync(key, 12);
  return { key, prefix, hash };
}

/**
 * 创建新的 API 密钥
 */
export async function createApiKey(request: CreateApiKeyRequest): Promise<ApiKeyWithSecret> {
  const db = getDatabase();
  const { key, prefix, hash } = generateApiKey();

  const id = uuidv4();
  const now = new Date();

  const apiKeyData = {
    id,
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
    createdAt: now,
    updatedAt: now,
  };

  const stmt = db.prepare(`
    INSERT INTO api_keys (
      id, name, key_hash, key_prefix, permissions, is_active,
      expires_at, usage_count, rate_limit, created_at, updated_at,
      created_by, description
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  `);

  await stmt.run([
    id,
    apiKeyData.name,
    apiKeyData.keyHash,
    apiKeyData.keyPrefix,
    JSON.stringify(apiKeyData.permissions),
    apiKeyData.isActive,
    apiKeyData.expiresAt?.toISOString(),
    apiKeyData.usageCount,
    apiKeyData.rateLimit,
    now.toISOString(),
    now.toISOString(),
    apiKeyData.createdBy,
    apiKeyData.description
  ]);

  log.info('创建 API 密钥', { id, name: request.name, prefix });

  return {
    apiKey: apiKeyData,
    secretKey: key,
  };
}

/**
 * 验证 API 密钥
 */
export async function validateApiKey(key: string): Promise<ApiKey | null> {
  if (!key || !key.startsWith('mcp_')) {
    return null;
  }

  const db = getDatabase();
  const prefix = key.substring(0, 12);

  const stmt = db.prepare(`
    SELECT * FROM api_keys
    WHERE key_prefix = $1 AND is_active = true
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  `);

  const rows = await stmt.all([prefix]);

  for (const row of rows) {
    try {
      if (bcrypt.compareSync(key, row.key_hash)) {
        // 检查是否过期
        if (row.expires_at) {
          const expiresAt = new Date(row.expires_at);
          if (new Date() > expiresAt) {
            log.warn('API 密钥已过期', { prefix, expiresAt });
            return null;
          }
        }

        // 更新使用统计
        await updateApiKeyUsage(row.id);

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
 * 获取所有 API 密钥
 */
export async function getAllApiKeys(): Promise<ApiKey[]> {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM api_keys
    ORDER BY created_at DESC
  `);

  const rows = await stmt.all();

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
export async function getApiKeyById(id: string): Promise<ApiKey | null> {
  const db = getDatabase();
  const stmt = db.prepare(`SELECT * FROM api_keys WHERE id = $1`);
  const row = await stmt.get([id]);

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
 * 删除 API 密钥
 */
export async function deleteApiKey(id: string): Promise<boolean> {
  const db = getDatabase();
  const stmt = db.prepare(`DELETE FROM api_keys WHERE id = $1`);
  const result = await stmt.run([id]);

  if (result.changes > 0) {
    log.info('删除 API 密钥', { id });
    return true;
  }

  return false;
}

/**
 * 撤销 API 密钥（禁用）
 */
export async function revokeApiKey(id: string): Promise<boolean> {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE api_keys
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `);
  const result = await stmt.run([id]);

  if (result.changes > 0) {
    log.info('撤销 API 密钥', { id });
    return true;
  }
  return false;
}

/**
 * 更新 API 密钥使用统计
 */
export async function updateApiKeyUsage(id: string): Promise<boolean> {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE api_keys
    SET usage_count = usage_count + 1,
        last_used_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `);
  const result = await stmt.run([id]);

  return result.changes > 0;
}

/**
 * 检查 API 密钥是否有指定权限
 */
export function hasPermission(apiKey: ApiKey, permission: string): boolean {
  return apiKey.permissions.includes(permission) || apiKey.permissions.includes('*');
}

/**
 * 更新 API 密钥
 */
export async function updateApiKey(id: string, updates: Partial<Pick<ApiKey, 'name' | 'permissions' | 'isActive' | 'expiresAt' | 'rateLimit' | 'description'>>): Promise<boolean> {
  const db = getDatabase();

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }

  if (updates.permissions !== undefined) {
    fields.push(`permissions = $${paramIndex++}`);
    values.push(JSON.stringify(updates.permissions));
  }

  if (updates.isActive !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(updates.isActive);
  }

  if (updates.expiresAt !== undefined) {
    fields.push(`expires_at = $${paramIndex++}`);
    values.push(updates.expiresAt?.toISOString());
  }

  if (updates.rateLimit !== undefined) {
    fields.push(`rate_limit = $${paramIndex++}`);
    values.push(updates.rateLimit);
  }

  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }

  if (fields.length === 0) return false;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const stmt = db.prepare(`
    UPDATE api_keys SET ${fields.join(', ')} WHERE id = $${paramIndex}
  `);

  const result = await stmt.run(values);

  if (result.changes > 0) {
    log.info('更新 API 密钥', { id, updates });
    return true;
  }

  return false;
}

/**
 * 清理过期的 API 密钥
 */
export async function cleanupExpiredApiKeys(): Promise<number> {
  const db = getDatabase();
  const stmt = db.prepare(`
    DELETE FROM api_keys
    WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP
  `);

  const result = await stmt.run();

  if (result.changes > 0) {
    log.info('清理过期 API 密钥', { count: result.changes });
  }

  return result.changes;
}

/**
 * 检查 API 密钥是否过期
 */
export function isApiKeyExpired(apiKey: ApiKey): boolean {
  if (!apiKey.expiresAt) return false;
  return new Date() > apiKey.expiresAt;
}
