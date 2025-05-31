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

      // 初始化测试表（同步版本，用于测试）
      initializeTablesSync();

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
async function initializeDatabase(): Promise<void> {
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
    await initializeTables();

  } catch (error) {
    log.error('数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 初始化数据库表（同步版本，用于测试）
 */
function initializeTablesSync(): void {
  if (!db) return;

  try {
    // 直接执行表创建，不调用企业版功能
    createBaseTables();
    createIndexes();
    log.info('数据库表初始化完成（同步）');
  } catch (error) {
    log.error('数据库表初始化失败:', error);
    throw error;
  }
}

/**
 * 创建基础表（同步版本）
 */
function createBaseTables(): void {
  if (!db) return;

  // 系统设置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'string',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      display_name TEXT,
      avatar_url TEXT,
      user_type TEXT NOT NULL DEFAULT 'admin' CHECK (user_type IN ('admin', 'guest', 'reader')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME,
      metadata TEXT
    )
  `);

  // 文档表
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      current_path TEXT NOT NULL UNIQUE,
      original_path TEXT NOT NULL,
      title TEXT,
      content_hash TEXT,
      author_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      path_history TEXT,
      metadata TEXT,
      FOREIGN KEY (author_id) REFERENCES users(id)
    )
  `);

  // 评论表
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      document_path TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id TEXT,
      author_name TEXT,
      author_email TEXT,
      author_role TEXT DEFAULT 'guest',
      author_avatar TEXT,
      likes INTEGER NOT NULL DEFAULT 0,
      is_approved INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      parent_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT,
      ip_address TEXT,
      user_agent TEXT,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // 标注表
  db.exec(`
    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      document_path TEXT NOT NULL,
      annotation_type TEXT NOT NULL CHECK (annotation_type IN ('highlight', 'note', 'bookmark')),
      selected_text TEXT NOT NULL,
      comment_text TEXT,
      position_data TEXT NOT NULL,
      author_id TEXT,
      author_name TEXT,
      author_email TEXT,
      author_role TEXT DEFAULT 'guest',
      likes INTEGER NOT NULL DEFAULT 0,
      is_approved INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      is_resolved INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      content_hash TEXT,
      context_before TEXT,
      context_after TEXT,
      anchor_confidence REAL DEFAULT 1.0,
      metadata TEXT,
      tags TEXT,
      color TEXT DEFAULT '#ffeb3b',
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // 收藏表
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      bookmark_type TEXT NOT NULL CHECK (bookmark_type IN ('document', 'annotation')),
      target_id TEXT NOT NULL,
      title TEXT,
      description TEXT,
      tags TEXT,
      is_private INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT,
      sort_order INTEGER DEFAULT 0,
      UNIQUE(user_id, bookmark_type, target_id)
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

  // 迁移历史表
  db.exec(`
    CREATE TABLE IF NOT EXISTS migration_history (
      id TEXT PRIMARY KEY,
      migration_name TEXT NOT NULL,
      migration_version TEXT NOT NULL,
      source_type TEXT NOT NULL,
      target_type TEXT NOT NULL,
      records_migrated INTEGER NOT NULL DEFAULT 0,
      migration_status TEXT NOT NULL CHECK (migration_status IN ('pending', 'running', 'completed', 'failed')),
      error_message TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      source_info TEXT,
      migration_log TEXT
    )
  `);
}

/**
 * 创建索引（同步版本）
 */
function createIndexes(): void {
  if (!db) return;

  db.exec(`
    -- 用户表索引
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
    CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

    -- 文档表索引
    CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(current_path);
    CREATE INDEX IF NOT EXISTS idx_documents_author ON documents(author_id);
    CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

    -- 评论表索引
    CREATE INDEX IF NOT EXISTS idx_comments_document_path ON comments(document_path);
    CREATE INDEX IF NOT EXISTS idx_comments_document_id ON comments(document_id);
    CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
    CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
    CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_name);
    CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
    CREATE INDEX IF NOT EXISTS idx_comments_approved ON comments(is_approved);

    -- 标注表索引
    CREATE INDEX IF NOT EXISTS idx_annotations_document_path ON annotations(document_path);
    CREATE INDEX IF NOT EXISTS idx_annotations_document_id ON annotations(document_id);
    CREATE INDEX IF NOT EXISTS idx_annotations_type ON annotations(annotation_type);
    CREATE INDEX IF NOT EXISTS idx_annotations_author_id ON annotations(author_id);
    CREATE INDEX IF NOT EXISTS idx_annotations_author ON annotations(author_name);
    CREATE INDEX IF NOT EXISTS idx_annotations_created_at ON annotations(created_at);

    -- 收藏表索引
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_type ON bookmarks(bookmark_type);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_target ON bookmarks(target_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at);

    -- 系统设置表索引
    CREATE INDEX IF NOT EXISTS idx_system_settings_type ON system_settings(type);
    CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON system_settings(updated_at);

    -- API密钥表索引
    CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
    CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

    -- 会话表索引
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

    -- 迁移历史表索引
    CREATE INDEX IF NOT EXISTS idx_migration_status ON migration_history(migration_status);
    CREATE INDEX IF NOT EXISTS idx_migration_name ON migration_history(migration_name);
  `);
}

/**
 * 初始化数据库表（异步版本，支持企业版）
 */
async function initializeTables(): Promise<void> {
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

    // 系统设置表
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'string',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

    // 用户表 - 社区版基础功能（单用户模式）
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT UNIQUE,
        display_name TEXT,
        avatar_url TEXT,
        user_type TEXT NOT NULL DEFAULT 'admin' CHECK (user_type IN ('admin', 'guest', 'reader')),
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        -- 社区版限制：只能有一个admin用户
        last_login_at DATETIME,
        metadata TEXT -- JSON格式存储用户偏好设置
      )
    `);

    // 文档表 - 社区版基础功能
    db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        current_path TEXT NOT NULL UNIQUE,
        original_path TEXT NOT NULL,
        title TEXT,
        content_hash TEXT,
        author_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        -- 路径历史和元数据
        path_history TEXT, -- JSON数组存储路径变更历史
        metadata TEXT,     -- JSON格式存储文档元数据
        FOREIGN KEY (author_id) REFERENCES users(id)
      )
    `);

    // 评论表 - 社区版功能
    db.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        document_path TEXT NOT NULL, -- 冗余字段，便于查询
        content TEXT NOT NULL,
        author_id TEXT, -- 关联用户表，可为空（匿名评论）
        author_name TEXT, -- 冗余字段，便于查询
        author_email TEXT,
        author_role TEXT DEFAULT 'guest',
        author_avatar TEXT,
        likes INTEGER NOT NULL DEFAULT 0,
        is_approved INTEGER NOT NULL DEFAULT 0,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        parent_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        -- 扩展字段
        metadata TEXT,     -- JSON格式存储额外信息
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 文档标注表 - 社区版功能，支持高亮、笔记、书签和智能重定位
    db.exec(`
      CREATE TABLE IF NOT EXISTS annotations (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        document_path TEXT NOT NULL, -- 冗余字段，便于查询
        annotation_type TEXT NOT NULL CHECK (annotation_type IN ('highlight', 'note', 'bookmark')),
        selected_text TEXT NOT NULL,
        comment_text TEXT, -- 笔记内容，高亮可为空
        position_data TEXT NOT NULL, -- JSON格式存储位置信息
        author_id TEXT, -- 关联用户表，可为空（匿名标注）
        author_name TEXT, -- 冗余字段，便于查询
        author_email TEXT,
        author_role TEXT DEFAULT 'guest',
        likes INTEGER NOT NULL DEFAULT 0,
        is_approved INTEGER NOT NULL DEFAULT 0,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        is_resolved INTEGER NOT NULL DEFAULT 0, -- 用于问题类型的标注
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        -- 智能重定位相关字段
        content_hash TEXT,     -- 选中内容的哈希
        context_before TEXT,   -- 前文上下文
        context_after TEXT,    -- 后文上下文
        anchor_confidence REAL DEFAULT 1.0, -- 锚点置信度
        -- 扩展字段
        metadata TEXT,         -- JSON格式存储额外信息
        tags TEXT,            -- JSON数组格式存储标签
        color TEXT DEFAULT '#ffeb3b', -- 高亮颜色
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 收藏表 - 用户收藏的文档和标注
    db.exec(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL, -- 用户标识（邮箱或ID）
        bookmark_type TEXT NOT NULL CHECK (bookmark_type IN ('document', 'annotation')),
        target_id TEXT NOT NULL, -- 文档路径或标注ID
        title TEXT, -- 收藏标题
        description TEXT, -- 收藏描述
        tags TEXT, -- JSON数组格式存储标签
        is_private INTEGER NOT NULL DEFAULT 0, -- 是否私有收藏
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        -- 扩展字段
        metadata TEXT, -- JSON格式存储额外信息
        sort_order INTEGER DEFAULT 0, -- 排序顺序
        UNIQUE(user_id, bookmark_type, target_id) -- 防止重复收藏
      )
    `);

    // 数据迁移历史表 - 记录迁移过程和版本
    db.exec(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id TEXT PRIMARY KEY,
        migration_name TEXT NOT NULL,
        migration_version TEXT NOT NULL,
        source_type TEXT NOT NULL, -- 'file' 或 'database'
        target_type TEXT NOT NULL, -- 'database'
        records_migrated INTEGER NOT NULL DEFAULT 0,
        migration_status TEXT NOT NULL CHECK (migration_status IN ('pending', 'running', 'completed', 'failed')),
        error_message TEXT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        -- 迁移详情
        source_info TEXT, -- JSON格式存储源信息
        migration_log TEXT -- 迁移日志
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

    // 创建索引 - 优化查询性能
    db.exec(`
      -- 用户表索引
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

      -- 文档表索引
      CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(current_path);
      CREATE INDEX IF NOT EXISTS idx_documents_author ON documents(author_id);
      CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

      -- 评论表索引
      CREATE INDEX IF NOT EXISTS idx_comments_document_path ON comments(document_path);
      CREATE INDEX IF NOT EXISTS idx_comments_document_id ON comments(document_id);
      CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
      CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
      CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_name);
      CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
      CREATE INDEX IF NOT EXISTS idx_comments_approved ON comments(is_approved);

      -- 标注表索引
      CREATE INDEX IF NOT EXISTS idx_annotations_document_path ON annotations(document_path);
      CREATE INDEX IF NOT EXISTS idx_annotations_document_id ON annotations(document_id);
      CREATE INDEX IF NOT EXISTS idx_annotations_type ON annotations(annotation_type);
      CREATE INDEX IF NOT EXISTS idx_annotations_author_id ON annotations(author_id);
      CREATE INDEX IF NOT EXISTS idx_annotations_author ON annotations(author_name);
      CREATE INDEX IF NOT EXISTS idx_annotations_created_at ON annotations(created_at);

      -- 收藏表索引
      CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_type ON bookmarks(bookmark_type);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_target ON bookmarks(target_id);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at);

      -- 系统设置表索引
      CREATE INDEX IF NOT EXISTS idx_system_settings_type ON system_settings(type);
      CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON system_settings(updated_at);

      -- API密钥表索引
      CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
      CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

      -- 会话表索引
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

      -- 迁移历史表索引
      CREATE INDEX IF NOT EXISTS idx_migration_status ON migration_history(migration_status);
      CREATE INDEX IF NOT EXISTS idx_migration_name ON migration_history(migration_name);
    `);

    // 调用商业版本的数据库初始化（如果存在）
    await initializeEnterpriseDatabase(db);

    log.info('数据库表初始化完成');

  } catch (error) {
    log.error('数据库表初始化失败:', error);
    throw error;
  }
}

/**
 * 商业版本数据库初始化钩子
 * 在企业版中会被重写，社区版中为空实现
 */
async function initializeEnterpriseDatabase(db: Database.Database): Promise<void> {
  // 尝试加载企业版数据库初始化模块
  try {
    // 使用 eval 来避免 TypeScript 编译时检查
    const modulePath = '../../enterprise/database/enterprise-init';
    const enterpriseModule = await eval('import')(modulePath).catch(() => null);

    if (enterpriseModule && typeof enterpriseModule.initializeEnterpriseTables === 'function') {
      await enterpriseModule.initializeEnterpriseTables(db);
      log.info('企业版数据库表初始化完成');
    } else {
      log.debug('企业版数据库模块未找到（社区版）');
    }
  } catch (error) {
    // 企业版模块加载失败或未授权，忽略错误
    log.debug('企业版数据库模块加载失败');
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
    const tables = ['system_settings', 'api_keys', 'users', 'documents', 'comments', 'annotations', 'bookmarks', 'migration_history', 'user_sessions'];

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
      const tables = ['api_keys', 'system_settings', 'users', 'documents', 'comments', 'annotations', 'bookmarks', 'migration_history', 'user_sessions'];
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
