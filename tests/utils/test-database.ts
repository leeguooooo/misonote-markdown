/**
 * 测试数据库工具 - PostgreSQL 版本
 */

import { getDatabase, cleanTestDatabase } from '../../src/core/database'

/**
 * 获取测试数据库实例
 */
export function getTestDatabase() {
  return getDatabase()
}

/**
 * 清理测试数据库
 */
export async function cleanupTestDatabase() {
  await cleanTestDatabase()
}

/**
 * 插入测试数据
 */
export async function insertTestData(table: string, data: Record<string, any>[]): Promise<void> {
  const db = getTestDatabase()

  if (data.length === 0) return

  const columns = Object.keys(data[0])
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`

  for (const row of data) {
    const values = columns.map(col => row[col])
    await db.prepare(sql).run(values)
  }
}

/**
 * 获取表中的所有数据
 */
export async function getTableData(table: string): Promise<any[]> {
  const db = getTestDatabase()
  return await db.prepare(`SELECT * FROM ${table}`).all()
}

/**
 * 获取表中的记录数
 */
export async function getTableCount(table: string): Promise<number> {
  const db = getTestDatabase()
  const result = await db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get()
  return result?.count || 0
}
