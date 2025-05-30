/**
 * 数据库管理模块
 * 使用 SQLite 作为轻量级数据库解决方案
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { log } from './logger';

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'data', 'misonote.db');

// 确保数据目录存在
function ensureDataDirectory(): void {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    log.info('创建数据库目录: ' + dataDir);
  }
}

// 数据库实例
let db: Database.Database | null = null;

/**
 * 获取数据库连接
 */
export function getDatabase(): Database.Database {
  if (!db) {
    ensureDataDirectory();
    log.info('数据库路径: ' + DB_PATH);
    const isNewDatabase = !fs.existsSync(DB_PATH);
    
    db = new Database(DB_PATH);
    
    // 启用 WAL 模式以提高并发性能
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 1000');
    db.pragma('temp_store = memory');
    
    if (isNewDatabase) {
      log.info('创建新数据库: ' + DB_PATH);
      initializeDatabase(db);
    } else {
      log.info('连接到现有数据库: ' + DB_PATH);
      // 检查并更新数据库结构
      updateDatabaseSchema(db);
    }
  }
  
  return db;
}

/**
 * 初始化数据库表结构
 */
function initializeDatabase(database: Database.Database): void {
  log.info('初始化数据库表结构');
  
  // 创建 API 密钥表
  database.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      key_prefix TEXT NOT NULL,
      permissions TEXT NOT NULL DEFAULT '[]',
      is_active BOOLEAN NOT NULL DEFAULT 1,
      expires_at DATETIME,
      last_used_at DATETIME,
      usage_count INTEGER NOT NULL DEFAULT 0,
      rate_limit INTEGER DEFAULT 1000,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      description TEXT
    )
  `);

  // 创建 MCP 服务器配置表
  database.exec(`
    CREATE TABLE IF NOT EXISTS mcp_servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      api_key_id TEXT,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      connection_status TEXT NOT NULL DEFAULT 'disconnected',
      error_message TEXT,
      last_connected_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL
    )
  `);

  // 创建 MCP 推送历史表
  database.exec(`
    CREATE TABLE IF NOT EXISTS mcp_push_history (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL,
      server_name TEXT NOT NULL,
      operation TEXT NOT NULL CHECK (operation IN ('single', 'batch')),
      document_count INTEGER NOT NULL DEFAULT 0,
      success_count INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
      details TEXT, -- JSON string
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES mcp_servers(id) ON DELETE CASCADE
    )
  `);

  // 创建用户会话表
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_accessed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建系统设置表
  database.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'string',
      description TEXT,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT
    )
  `);

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
    CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
    CREATE INDEX IF NOT EXISTS idx_mcp_servers_active ON mcp_servers(is_active);
    CREATE INDEX IF NOT EXISTS idx_mcp_push_history_server ON mcp_push_history(server_id);
    CREATE INDEX IF NOT EXISTS idx_mcp_push_history_created ON mcp_push_history(created_at);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
  `);

  // 插入默认系统设置
  const insertSetting = database.prepare(`
    INSERT OR IGNORE INTO system_settings (key, value, type, description)
    VALUES (?, ?, ?, ?)
  `);

  insertSetting.run('mcp_webhook_enabled', 'false', 'boolean', '是否启用 MCP Webhook 功能');
  insertSetting.run('mcp_webhook_secret', '', 'string', 'MCP Webhook 签名密钥');
  insertSetting.run('mcp_max_retries', '3', 'number', 'MCP 推送最大重试次数');
  insertSetting.run('mcp_retry_delay', '1000', 'number', 'MCP 推送重试延迟（毫秒）');
  insertSetting.run('mcp_connection_timeout', '10000', 'number', 'MCP 连接超时时间（毫秒）');
  insertSetting.run('api_rate_limit_default', '1000', 'number', '默认 API 速率限制（每小时）');

  log.info('数据库初始化完成');
}

/**
 * 更新数据库结构（用于版本升级）
 */
function updateDatabaseSchema(database: Database.Database): void {
  try {
    // 检查数据库版本并进行必要的升级
    const tables = database.prepare(`
      SELECT name FROM sqlite_master WHERE type='table'
    `).all();

    const tableNames = tables.map((t: any) => t.name);

    // 如果缺少某些表，则创建它们
    if (!tableNames.includes('api_keys')) {
      log.info('添加 api_keys 表');
      initializeDatabase(database);
    }

    log.debug('数据库结构检查完成');
  } catch (error) {
    log.error('数据库结构更新失败', error);
  }
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    log.info('数据库连接已关闭');
  }
}

/**
 * 执行数据库备份
 */
export function backupDatabase(backupPath?: string): string {
  const database = getDatabase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultBackupPath = path.join(process.cwd(), 'data', `backup-${timestamp}.db`);
  const finalBackupPath = backupPath || defaultBackupPath;

  database.backup(finalBackupPath);
  log.info('数据库备份完成: ' + finalBackupPath);
  
  return finalBackupPath;
}

/**
 * 获取数据库统计信息
 */
export function getDatabaseStats(): {
  size: number;
  tables: Array<{ name: string; count: number }>;
  lastBackup?: Date;
} {
  const database = getDatabase();
  
  // 获取数据库文件大小
  const stats = fs.statSync(DB_PATH);
  const size = stats.size;

  // 获取各表的记录数
  const tables = database.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all() as Array<{ name: string }>;

  const tableCounts = tables.map(table => {
    try {
      const result = database.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
      return { name: table.name, count: result.count };
    } catch (error) {
      return { name: table.name, count: 0 };
    }
  });

  return {
    size,
    tables: tableCounts,
  };
}

// 进程退出时关闭数据库连接
process.on('exit', closeDatabase);
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);
