/**
 * 数据库功能单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getDatabase, getDatabaseStats, cleanupExpiredData } from '@/core/database'
import { cleanTestDatabase, getTableCount, insertTestData, resetTestDatabase } from '../../utils/test-database'
import fs from 'fs'
import path from 'path'

describe('数据库功能测试', () => {
  beforeEach(() => {
    cleanTestDatabase()
  })

  afterEach(() => {
    cleanTestDatabase()
  })

  describe('getDatabase', () => {
    it('应该返回数据库实例', () => {
      const db = getDatabase()

      expect(db).toBeDefined()
      expect(typeof db.prepare).toBe('function')
      expect(typeof db.exec).toBe('function')
    })

    it('应该在测试环境中使用测试数据库', () => {
      expect(process.env.NODE_ENV).toBe('test')

      const db = getDatabase()

      // 验证是否是测试数据库（通过检查表是否存在）
      const tables = db.prepare(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' 
        AND table_name IN ('api_keys', 'system_settings')
      `).all()

      expect(tables.length).toBeGreaterThan(0)
    })
  })

  describe('getDatabaseStats', () => {
    it('应该返回数据库统计信息', () => {
      // 插入一些测试数据
      insertTestData('api_keys', [
        {
          id: 'test-1',
          name: 'Test Key 1',
          key_hash: 'hash1',
          key_prefix: 'mcp_test1',
          permissions: '["read"]',
          is_active: 1,
          usage_count: 0,
          rate_limit: 1000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'test-2',
          name: 'Test Key 2',
          key_hash: 'hash2',
          key_prefix: 'mcp_test2',
          permissions: '["write"]',
          is_active: 1,
          usage_count: 5,
          rate_limit: 500,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])

      insertTestData('system_settings', [
        {
          key: 'test_setting',
          value: 'test_value',
          type: 'string',
          description: 'Test setting',
          updated_at: new Date().toISOString(),
        }
      ])

      const stats = getDatabaseStats()

      expect(stats).toBeDefined()
      expect(stats.tables).toBeDefined()
      expect(stats.tables.api_keys).toBe(2)
      expect(stats.tables.system_settings).toBe(1)
      expect(stats.tables.comments).toBe(0)
      expect(stats.size).toBeGreaterThan(0)
      expect(stats.pageCount).toBeGreaterThan(0)
      expect(stats.pageSize).toBeGreaterThan(0)
    })

    it('应该处理空数据库', () => {
      const stats = getDatabaseStats()

      expect(stats.tables.api_keys).toBe(0)
      expect(stats.tables.system_settings).toBe(0)
      expect(stats.tables.comments).toBe(0)
      expect(stats.tables.annotations).toBe(0)
      expect(stats.tables.user_sessions).toBe(0)
    })
  })

  describe('backupDatabase', () => {
    it('应该创建数据库备份', () => {
      // 插入一些测试数据
      insertTestData('system_settings', [
        {
          key: 'backup_test',
          value: 'backup_value',
          type: 'string',
          description: 'Backup test setting',
          updated_at: new Date().toISOString(),
        }
      ])

      const backupDir = path.join(process.cwd(), 'tests', 'backups')
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }

      const backupPath = path.join(backupDir, 'test-backup.db')

      const resultPath = backupDatabase(backupPath)

      expect(resultPath).toBe(backupPath)
      expect(fs.existsSync(backupPath)).toBe(true)

      // 验证备份文件包含数据
      const backupStats = fs.statSync(backupPath)
      expect(backupStats.size).toBeGreaterThan(0)

      // 清理备份文件
      fs.unlinkSync(backupPath)
      fs.rmSync(backupDir, { recursive: true, force: true })
    })

    it('应该使用默认备份路径', () => {
      const resultPath = backupDatabase()

      expect(resultPath).toMatch(/backup-.*\.db$/)
      expect(fs.existsSync(resultPath)).toBe(true)

      // 清理备份文件
      fs.unlinkSync(resultPath)
    })
  })

  describe('cleanupExpiredData', () => {
    it('应该清理过期的用户会话', () => {
      const db = getDatabase()

      // 创建用户会话表（如果不存在）
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token_hash TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_agent TEXT,
          ip_address TEXT
        )
      `)

      // 插入过期和未过期的会话
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24小时前
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时后

      insertTestData('user_sessions', [
        {
          id: 'expired-1',
          user_id: 'user1',
          token_hash: 'hash1',
          expires_at: pastDate,
        },
        {
          id: 'expired-2',
          user_id: 'user2',
          token_hash: 'hash2',
          expires_at: pastDate,
        },
        {
          id: 'valid-1',
          user_id: 'user3',
          token_hash: 'hash3',
          expires_at: futureDate,
        }
      ])

      expect(getTableCount('user_sessions')).toBe(3)

      cleanupExpiredData()

      expect(getTableCount('user_sessions')).toBe(1)

      // 验证剩余的是未过期的会话
      const remainingSessions = db.prepare('SELECT id FROM user_sessions').all()
      expect(remainingSessions[0].id).toBe('valid-1')
    })

    it('应该禁用过期的API密钥', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24小时前
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时后

      insertTestData('api_keys', [
        {
          id: 'expired-key',
          name: 'Expired Key',
          key_hash: 'hash1',
          key_prefix: 'mcp_exp',
          permissions: '["read"]',
          is_active: 1,
          expires_at: pastDate,
          usage_count: 0,
          rate_limit: 1000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'valid-key',
          name: 'Valid Key',
          key_hash: 'hash2',
          key_prefix: 'mcp_val',
          permissions: '["read"]',
          is_active: 1,
          expires_at: futureDate,
          usage_count: 0,
          rate_limit: 1000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'no-expiry-key',
          name: 'No Expiry Key',
          key_hash: 'hash3',
          key_prefix: 'mcp_noe',
          permissions: '["read"]',
          is_active: 1,
          expires_at: null,
          usage_count: 0,
          rate_limit: 1000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])

      cleanupExpiredData()

      const db = getDatabase()
      const keys = db.prepare('SELECT id, is_active FROM api_keys ORDER BY id').all()

      expect(keys).toHaveLength(3)
      expect(keys[0].id).toBe('expired-key')
      expect(keys[0].is_active).toBe(0) // 应该被禁用
      expect(keys[1].id).toBe('no-expiry-key')
      expect(keys[1].is_active).toBe(1) // 应该保持活跃
      expect(keys[2].id).toBe('valid-key')
      expect(keys[2].is_active).toBe(1) // 应该保持活跃
    })
  })

  describe('数据库连接和事务', () => {
    it('应该支持事务操作', () => {
      const db = getDatabase()

      const insertSetting = db.prepare(`
        INSERT INTO system_settings (key, value, type, description)
        VALUES (?, ?, ?, ?)
      `)

      const transaction = db.transaction((settings: Array<{key: string, value: string, type: string, description: string}>) => {
        for (const setting of settings) {
          insertSetting.run(setting.key, setting.value, setting.type, setting.description)
        }
      })

      const testSettings = [
        { key: 'setting1', value: 'value1', type: 'string', description: 'Test 1' },
        { key: 'setting2', value: 'value2', type: 'string', description: 'Test 2' },
        { key: 'setting3', value: 'value3', type: 'string', description: 'Test 3' },
      ]

      transaction(testSettings)

      expect(getTableCount('system_settings')).toBe(3)
    })

    it('应该正确处理外键约束', () => {
      const db = getDatabase()

      // 创建评论表的测试数据
      db.exec(`
        INSERT INTO comments (id, document_path, content, author_name)
        VALUES ('parent-1', '/test/doc', 'Parent comment', 'Test User')
      `)

      db.exec(`
        INSERT INTO comments (id, document_path, content, author_name, parent_id)
        VALUES ('child-1', '/test/doc', 'Child comment', 'Test User', 'parent-1')
      `)

      expect(getTableCount('comments')).toBe(2)

      // 删除父评论应该级联删除子评论
      db.exec(`DELETE FROM comments WHERE id = 'parent-1'`)

      expect(getTableCount('comments')).toBe(0)
    })
  })
})
