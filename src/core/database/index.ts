/**
 * 数据库模块 - PostgreSQL 版本
 * 提供简洁、专业的数据库操作接口
 */

import { db } from '../../../lib/db/operations';
import { log } from '../logger';

// 类型定义
interface PreparedStatement {
  get: (params?: any[]) => Promise<any>;
  all: (params?: any[]) => Promise<any[]>;
  run: (params?: any[]) => Promise<{ changes: number; lastInsertRowid: any }>;
}

interface DatabaseInterface {
  prepare: (sql: string) => PreparedStatement;
  exec: (sql: string) => Promise<void>;
  close: () => void;
  backup: (path: string) => void;
}

interface DatabaseStats {
  tables: Record<string, number>;
  size: number;
  connections: number;
}

// 单例实例
let dbInstance: DatabaseInterface | null = null;

/**
 * 获取数据库实例
 */
export function getDatabase(): DatabaseInterface {
  if (!dbInstance) {
    dbInstance = createDatabaseInterface();
    log.info('PostgreSQL 数据库连接已建立');
  }
  return dbInstance;
}

/**
 * 创建数据库接口
 */
function createDatabaseInterface(): DatabaseInterface {
  return {
    prepare: (sql: string): PreparedStatement => ({
      get: async (params?: any[]) => await db.queryOne(sql, params),
      all: async (params?: any[]) => await db.query(sql, params),
      run: async (params?: any[]) => {
        const result = await db.update(sql, params);
        return { changes: result, lastInsertRowid: null };
      }
    }),
    exec: async (sql: string) => {
      await db.query(sql);
    },
    close: () => {
      log.info('数据库连接已关闭');
    },
    backup: (_path: string) => {
      log.warn('PostgreSQL 备份需要使用 pg_dump 命令');
    }
  };
}

/**
 * 获取数据库统计信息
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  try {
    const stats: DatabaseStats = {
      tables: {},
      size: 0,
      connections: 0
    };

    // 获取表统计信息
    const tables = [
      'system_settings', 'api_keys', 'users', 'documents', 
      'comments', 'annotations', 'bookmarks', 'migration_history', 'user_sessions'
    ];

    for (const table of tables) {
      try {
        const result = await db.queryOne(`SELECT COUNT(*) as count FROM ${table}`);
        stats.tables[table] = result?.count || 0;
      } catch {
        stats.tables[table] = 0;
      }
    }

    // 获取数据库大小
    try {
      const sizeResult = await db.queryOne(`
        SELECT pg_database_size(current_database()) as size_bytes
      `);
      stats.size = sizeResult?.size_bytes || 0;
    } catch (error) {
      log.error('获取数据库大小失败:', error);
    }

    // 获取连接数
    try {
      const connResult = await db.queryOne(`
        SELECT count(*) as connections 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      stats.connections = connResult?.connections || 0;
    } catch (error) {
      log.error('获取连接数失败:', error);
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
  if (dbInstance) {
    try {
      dbInstance.close();
      dbInstance = null;
      log.info('数据库连接已关闭');
    } catch (error) {
      log.error('关闭数据库连接失败:', error);
    }
  }
}

/**
 * 清理测试数据
 */
export async function cleanTestDatabase(): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('只能在测试环境中清理数据库');
  }

  try {
    const tables = [
      'api_keys', 'system_settings', 'users', 'documents', 
      'comments', 'annotations', 'bookmarks', 'migration_history', 'user_sessions'
    ];
    
    for (const table of tables) {
      try {
        await db.query(`DELETE FROM ${table}`);
      } catch {
        // 忽略表不存在的错误
      }
    }
    
    log.debug('测试数据库已清理');
  } catch (error) {
    log.error('清理测试数据库失败:', error);
    throw error;
  }
}

/**
 * 清理过期数据
 */
export async function cleanupExpiredData(): Promise<void> {
  try {
    const now = new Date().toISOString();

    // 清理过期会话
    const sessionResult = await db.update(
      'DELETE FROM user_sessions WHERE expires_at < $1',
      [now]
    );

    if (sessionResult > 0) {
      log.info(`清理了 ${sessionResult} 个过期会话`);
    }

    // 禁用过期 API 密钥
    const apiKeyResult = await db.update(
      'UPDATE api_keys SET is_active = false WHERE expires_at < $1 AND expires_at IS NOT NULL',
      [now]
    );

    if (apiKeyResult > 0) {
      log.info(`禁用了 ${apiKeyResult} 个过期 API 密钥`);
    }
  } catch (error) {
    log.error('清理过期数据失败:', error);
    throw error;
  }
}

/**
 * 执行数据库健康检查
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await db.queryOne('SELECT 1 as health');
    return true;
  } catch (error) {
    log.error('数据库健康检查失败:', error);
    return false;
  }
}

// 进程退出时清理
process.on('exit', closeDatabase);
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);

// 导出主要接口
export { db as rawDb };
export default getDatabase;
