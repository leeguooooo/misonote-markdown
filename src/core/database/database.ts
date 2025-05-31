/**
 * 数据库连接和管理模块
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { log } from '../logger';

let db: Database.Database | null = null;

/**
 * 获取数据库实例
 */
export function getDatabase(): Database.Database {
  // 在测试环境中使用内存数据库
  if (process.env.NODE_ENV === 'test') {
    if (!db) {
      // 创建内存数据库用于测试
      db = new Database(':memory:');

      // 设置数据库选项
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      db.pragma('foreign_keys = ON');

      // 初始化测试表
      initializeTables();

      log.info('测试数据库已初始化（内存模式）');
    }
    return db;
  }

  if (!db) {
    initializeDatabase();
  }
  return db!;
}

/**
 * 初始化数据库
 */
function initializeDatabase(): void {
  try {
    // 确保数据目录存在
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      log.info('创建数据目录: ' + dataDir);
    }

    // 数据库文件路径
    const dbPath = path.join(dataDir, 'misonote.db');

    // 创建数据库连接
    db = new Database(dbPath);

    // 设置数据库选项
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 1000');
    db.pragma('foreign_keys = ON');

    log.info('数据库连接已建立: ' + dbPath);

    // 初始化数据库表
    initializeTables();

  } catch (error) {
    log.error('数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 初始化数据库表
 */
function initializeTables(): void {
  if (!db) return;

  try {
    // 系统设置表
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'string',
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // API 密钥表
    db.exec(`
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
    `);

    // 评论表
    db.exec(`
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
    `);

    // 文档标注表
    db.exec(`
      CREATE TABLE IF NOT EXISTS annotations (
        id TEXT PRIMARY KEY,
        document_path TEXT NOT NULL,
        content TEXT NOT NULL,
        position_start INTEGER NOT NULL,
        position_end INTEGER NOT NULL,
        author_name TEXT,
        author_email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_approved INTEGER NOT NULL DEFAULT 0
      )
    `);

    // 用户会话表
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
    `);

    // 创建索引
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_comments_document_path ON comments(document_path);
      CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
      CREATE INDEX IF NOT EXISTS idx_annotations_document_path ON annotations(document_path);
      CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
      CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
    `);

    log.info('数据库表初始化完成');

  } catch (error) {
    log.error('数据库表初始化失败:', error);
    throw error;
  }
}

/**
 * 获取数据库统计信息
 */
export function getDatabaseStats(): any {
  if (!db) {
    throw new Error('数据库未初始化');
  }

  try {
    const stats = {
      tables: {} as Record<string, number>,
      size: 0,
      pageCount: 0,
      pageSize: 0,
    };

    // 获取表统计信息
    const tables = ['system_settings', 'api_keys', 'comments', 'annotations', 'user_sessions'];

    for (const table of tables) {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
        stats.tables[table] = count.count;
      } catch (error) {
        stats.tables[table] = 0;
      }
    }

    // 获取数据库大小信息
    try {
      const sizeInfo = db.prepare('PRAGMA page_count').get() as { page_count: number };
      const pageSizeInfo = db.prepare('PRAGMA page_size').get() as { page_size: number };

      stats.pageCount = sizeInfo.page_count || 0;
      stats.pageSize = pageSizeInfo.page_size || 0;
      stats.size = stats.pageCount * stats.pageSize;
    } catch (error) {
      log.error('获取数据库大小信息失败:', error);
    }

    return stats;
  } catch (error) {
    log.error('获取数据库统计信息失败:', error);
    throw error;
  }
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    try {
      db.close();
      db = null;
      log.info('数据库连接已关闭');
    } catch (error) {
      log.error('关闭数据库连接失败:', error);
    }
  }
}

/**
 * 清理测试数据库
 */
export function cleanTestDatabase(): void {
  if (process.env.NODE_ENV === 'test' && db) {
    try {
      // 清空所有表
      const tables = ['api_keys', 'system_settings', 'comments', 'annotations', 'user_sessions'];
      for (const table of tables) {
        try {
          db.exec(`DELETE FROM ${table}`);
        } catch (error) {
          // 忽略表不存在的错误
        }
      }
      log.debug('测试数据库已清理');
    } catch (error) {
      log.error('清理测试数据库失败:', error);
    }
  }
}

/**
 * 执行数据库备份
 */
export function backupDatabase(backupPath?: string): string {
  if (!db) {
    throw new Error('数据库未初始化');
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultBackupPath = path.join(process.cwd(), 'data', `backup-${timestamp}.db`);
    const finalBackupPath = backupPath || defaultBackupPath;

    // 确保备份目录存在
    const backupDir = path.dirname(finalBackupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 执行备份
    db.backup(finalBackupPath);

    log.info('数据库备份完成: ' + finalBackupPath);
    return finalBackupPath;
  } catch (error) {
    log.error('数据库备份失败:', error);
    throw error;
  }
}

/**
 * 清理过期数据
 */
export function cleanupExpiredData(): void {
  if (!db) return;

  try {
    const now = new Date().toISOString();

    // 清理过期的用户会话
    const expiredSessions = db.prepare(`
      DELETE FROM user_sessions WHERE expires_at < ?
    `);
    const sessionResult = expiredSessions.run(now);

    if (sessionResult.changes > 0) {
      log.info(`清理了 ${sessionResult.changes} 个过期会话`);
    }

    // 清理过期的 API 密钥
    const expiredApiKeys = db.prepare(`
      UPDATE api_keys SET is_active = 0 WHERE expires_at < ? AND expires_at IS NOT NULL
    `);
    const apiKeyResult = expiredApiKeys.run(now);

    if (apiKeyResult.changes > 0) {
      log.info(`禁用了 ${apiKeyResult.changes} 个过期 API 密钥`);
    }

  } catch (error) {
    log.error('清理过期数据失败:', error);
  }
}

// 进程退出时关闭数据库连接
process.on('exit', closeDatabase);
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);
