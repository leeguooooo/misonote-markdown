/**
 * 测试数据库工具
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let testDb: Database.Database | null = null

/**
 * 获取测试数据库实例
 */
export function getTestDatabase(): Database.Database {
  if (!testDb) {
    const testDbDir = path.join(process.cwd(), 'tests', 'data')
    const testDbPath = path.join(testDbDir, 'test.db')
    
    // 确保测试数据目录存在
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true })
    }

    testDb = new Database(testDbPath)
    
    // 设置数据库选项
    testDb.pragma('journal_mode = WAL')
    testDb.pragma('synchronous = NORMAL')
    testDb.pragma('foreign_keys = ON')
    
    // 初始化测试表
    initializeTestTables()
  }
  
  return testDb
}

/**
 * 初始化测试数据库表
 */
function initializeTestTables(): void {
  if (!testDb) return

  // API 密钥表
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      permissions TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      expires_at DATETIME,
      last_used_at DATETIME,
      usage_count INTEGER NOT NULL DEFAULT 0,
      rate_limit INTEGER NOT NULL DEFAULT 1000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      description TEXT
    )
  `)

  // 系统设置表
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'string',
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 评论表
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      document_path TEXT NOT NULL,
      content TEXT NOT NULL,
      author_name TEXT,
      author_email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_approved INTEGER NOT NULL DEFAULT 0,
      parent_id TEXT,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    )
  `)

  // 创建索引
  testDb.exec(`
    CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
    CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
  `)
}

/**
 * 清理测试数据库
 */
export function cleanTestDatabase(): void {
  if (testDb) {
    // 清空所有表
    const tables = ['api_keys', 'system_settings', 'comments']
    for (const table of tables) {
      try {
        testDb.exec(`DELETE FROM ${table}`)
      } catch (error) {
        // 忽略表不存在的错误
      }
    }
  }
}

/**
 * 关闭测试数据库
 */
export function closeTestDatabase(): void {
  if (testDb) {
    testDb.close()
    testDb = null
  }
}

/**
 * 重置测试数据库
 */
export function resetTestDatabase(): void {
  closeTestDatabase()
  
  // 删除测试数据库文件
  const testDbPath = path.join(process.cwd(), 'tests', 'data', 'test.db')
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath)
  }
}

/**
 * 插入测试数据
 */
export function insertTestData(table: string, data: Record<string, any>[]): void {
  const db = getTestDatabase()
  
  if (data.length === 0) return
  
  const columns = Object.keys(data[0])
  const placeholders = columns.map(() => '?').join(', ')
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
  
  const stmt = db.prepare(sql)
  
  for (const row of data) {
    const values = columns.map(col => row[col])
    stmt.run(...values)
  }
}

/**
 * 获取表中的所有数据
 */
export function getTableData(table: string): any[] {
  const db = getTestDatabase()
  return db.prepare(`SELECT * FROM ${table}`).all()
}

/**
 * 获取表中的记录数
 */
export function getTableCount(table: string): number {
  const db = getTestDatabase()
  const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number }
  return result.count
}
