/**
 * API Keys 功能单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createApiKey,
  validateApiKey,
  getApiKeyById,
  getAllApiKeys,
  updateApiKey,
  deleteApiKey,
  revokeApiKey,
  updateApiKeyUsage,
} from '@/core/api/api-keys'
import { cleanTestDatabase, getTableCount, getTableData } from '../../utils/test-database'

describe('API Keys 功能测试', () => {
  beforeEach(() => {
    cleanTestDatabase()
  })

  afterEach(() => {
    cleanTestDatabase()
  })

  describe('createApiKey', () => {
    it('应该成功创建API密钥', () => {
      const request = {
        name: 'Test API Key',
        permissions: ['read', 'write'],
        description: 'Test description',
        createdBy: 'test-user',
      }

      const result = createApiKey(request)

      expect(result).toBeDefined()
      expect(result.apiKey).toBeDefined()
      expect(result.secretKey).toBeDefined()
      expect(result.apiKey.name).toBe(request.name)
      expect(result.apiKey.permissions).toEqual(request.permissions)
      expect(result.apiKey.description).toBe(request.description)
      expect(result.apiKey.createdBy).toBe(request.createdBy)
      expect(result.apiKey.isActive).toBe(true)
      expect(result.apiKey.usageCount).toBe(0)
      expect(result.secretKey).toMatch(/^mcp_[a-zA-Z0-9]{32}$/)

      // 验证数据库中的记录
      expect(getTableCount('api_keys')).toBe(1)
    })

    it('应该使用默认值创建API密钥', () => {
      const request = {
        name: 'Minimal API Key',
      }

      const result = createApiKey(request)

      expect(result.apiKey.permissions).toEqual(['read', 'write'])
      expect(result.apiKey.rateLimit).toBe(1000)
      expect(result.apiKey.isActive).toBe(true)
    })

    it('应该设置过期时间', () => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后
      const request = {
        name: 'Expiring API Key',
        expiresAt,
      }

      const result = createApiKey(request)

      expect(result.apiKey.expiresAt).toEqual(expiresAt)
    })
  })

  describe('validateApiKey', () => {
    it('应该验证有效的API密钥', () => {
      // 创建API密钥
      const { secretKey } = createApiKey({
        name: 'Valid Key',
        permissions: ['read'],
      })

      // 验证密钥
      const apiKey = validateApiKey(secretKey)

      expect(apiKey).toBeDefined()
      expect(apiKey!.name).toBe('Valid Key')
      expect(apiKey!.permissions).toEqual(['read'])
      expect(apiKey!.isActive).toBe(true)
    })

    it('应该拒绝无效的API密钥', () => {
      const invalidKey = 'invalid_key'
      const apiKey = validateApiKey(invalidKey)

      expect(apiKey).toBeNull()
    })

    it('应该拒绝格式错误的API密钥', () => {
      const invalidKey = 'wrong_prefix_12345678901234567890123456789012'
      const apiKey = validateApiKey(invalidKey)

      expect(apiKey).toBeNull()
    })

    it('应该拒绝已禁用的API密钥', () => {
      // 创建并禁用API密钥
      const { apiKey, secretKey } = createApiKey({
        name: 'Disabled Key',
      })
      
      revokeApiKey(apiKey.id)

      // 尝试验证已禁用的密钥
      const result = validateApiKey(secretKey)

      expect(result).toBeNull()
    })

    it('应该拒绝已过期的API密钥', () => {
      // 创建已过期的API密钥
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时前
      const { secretKey } = createApiKey({
        name: 'Expired Key',
        expiresAt: pastDate,
      })

      // 尝试验证已过期的密钥
      const result = validateApiKey(secretKey)

      expect(result).toBeNull()
    })
  })

  describe('getApiKeyById', () => {
    it('应该根据ID获取API密钥', () => {
      const { apiKey } = createApiKey({
        name: 'Test Key',
        permissions: ['admin'],
      })

      const retrieved = getApiKeyById(apiKey.id)

      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(apiKey.id)
      expect(retrieved!.name).toBe('Test Key')
      expect(retrieved!.permissions).toEqual(['admin'])
    })

    it('应该在ID不存在时返回null', () => {
      const result = getApiKeyById('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('getAllApiKeys', () => {
    it('应该获取所有API密钥', () => {
      // 创建多个API密钥
      createApiKey({ name: 'Key 1' })
      createApiKey({ name: 'Key 2' })
      createApiKey({ name: 'Key 3' })

      const allKeys = getAllApiKeys()

      expect(allKeys).toHaveLength(3)
      expect(allKeys.map(k => k.name)).toEqual(['Key 1', 'Key 2', 'Key 3'])
    })

    it('应该在没有API密钥时返回空数组', () => {
      const allKeys = getAllApiKeys()

      expect(allKeys).toEqual([])
    })

    it('应该按创建时间排序', () => {
      // 创建API密钥（有时间间隔）
      const key1 = createApiKey({ name: 'First Key' })
      
      // 模拟时间间隔
      setTimeout(() => {
        const key2 = createApiKey({ name: 'Second Key' })
        
        const allKeys = getAllApiKeys()
        
        expect(allKeys[0].name).toBe('First Key')
        expect(allKeys[1].name).toBe('Second Key')
      }, 10)
    })
  })

  describe('updateApiKey', () => {
    it('应该更新API密钥信息', () => {
      const { apiKey } = createApiKey({
        name: 'Original Name',
        permissions: ['read'],
      })

      const updated = updateApiKey(apiKey.id, {
        name: 'Updated Name',
        permissions: ['read', 'write', 'admin'],
        description: 'Updated description',
      })

      expect(updated).toBe(true)

      const retrieved = getApiKeyById(apiKey.id)
      expect(retrieved!.name).toBe('Updated Name')
      expect(retrieved!.permissions).toEqual(['read', 'write', 'admin'])
      expect(retrieved!.description).toBe('Updated description')
    })

    it('应该在ID不存在时返回false', () => {
      const result = updateApiKey('non-existent-id', {
        name: 'New Name',
      })

      expect(result).toBe(false)
    })
  })

  describe('deleteApiKey', () => {
    it('应该删除API密钥', () => {
      const { apiKey } = createApiKey({
        name: 'To Delete',
      })

      const deleted = deleteApiKey(apiKey.id)

      expect(deleted).toBe(true)
      expect(getApiKeyById(apiKey.id)).toBeNull()
      expect(getTableCount('api_keys')).toBe(0)
    })

    it('应该在ID不存在时返回false', () => {
      const result = deleteApiKey('non-existent-id')

      expect(result).toBe(false)
    })
  })

  describe('revokeApiKey', () => {
    it('应该撤销API密钥', () => {
      const { apiKey } = createApiKey({
        name: 'To Revoke',
      })

      const revoked = revokeApiKey(apiKey.id)

      expect(revoked).toBe(true)

      const retrieved = getApiKeyById(apiKey.id)
      expect(retrieved!.isActive).toBe(false)
    })

    it('应该在ID不存在时返回false', () => {
      const result = revokeApiKey('non-existent-id')

      expect(result).toBe(false)
    })
  })

  describe('updateApiKeyUsage', () => {
    it('应该更新API密钥使用统计', () => {
      const { apiKey } = createApiKey({
        name: 'Usage Test',
      })

      const updated = updateApiKeyUsage(apiKey.id)

      expect(updated).toBe(true)

      const retrieved = getApiKeyById(apiKey.id)
      expect(retrieved!.usageCount).toBe(1)
      expect(retrieved!.lastUsedAt).toBeDefined()
    })

    it('应该累计使用次数', () => {
      const { apiKey } = createApiKey({
        name: 'Multiple Usage',
      })

      updateApiKeyUsage(apiKey.id)
      updateApiKeyUsage(apiKey.id)
      updateApiKeyUsage(apiKey.id)

      const retrieved = getApiKeyById(apiKey.id)
      expect(retrieved!.usageCount).toBe(3)
    })

    it('应该在ID不存在时返回false', () => {
      const result = updateApiKeyUsage('non-existent-id')

      expect(result).toBe(false)
    })
  })

  describe('数据完整性测试', () => {
    it('应该生成唯一的API密钥', () => {
      const key1 = createApiKey({ name: 'Key 1' })
      const key2 = createApiKey({ name: 'Key 2' })

      expect(key1.secretKey).not.toBe(key2.secretKey)
      expect(key1.apiKey.id).not.toBe(key2.apiKey.id)
      expect(key1.apiKey.keyPrefix).not.toBe(key2.apiKey.keyPrefix)
    })

    it('应该正确处理权限数组', () => {
      const { apiKey } = createApiKey({
        name: 'Permission Test',
        permissions: ['read', 'write', 'admin', 'delete'],
      })

      const retrieved = getApiKeyById(apiKey.id)
      expect(retrieved!.permissions).toEqual(['read', 'write', 'admin', 'delete'])
    })

    it('应该正确处理时间戳', () => {
      const beforeCreate = new Date()
      const { apiKey } = createApiKey({
        name: 'Timestamp Test',
      })
      const afterCreate = new Date()

      expect(apiKey.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(apiKey.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime())
      expect(apiKey.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(apiKey.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime())
    })
  })
})
