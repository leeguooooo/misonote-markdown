/**
 * PostgreSQL 数据库适配器
 * 提供与 better-sqlite3 兼容的接口，使用 PostgreSQL
 */

import { pool } from '../../../lib/db/config';
import { PoolClient } from 'pg';
import { log } from '../logger';

/**
 * 模拟 better-sqlite3 的 prepare 语句接口
 */
class PreparedStatement {
  private sql: string;
  private client?: PoolClient;

  constructor(sql: string) {
    // 转换 SQLite 的 ? 占位符为 PostgreSQL 的 $1, $2 等
    let paramIndex = 1;
    this.sql = sql.replace(/\?/g, () => `$${paramIndex++}`);
  }

  /**
   * 设置数据库客户端（用于事务）
   */
  setClient(client: PoolClient) {
    this.client = client;
  }

  /**
   * 执行查询并返回第一行
   */
  async get(params: any[] = []): Promise<any> {
    try {
      const result = this.client 
        ? await this.client.query(this.sql, params)
        : await pool.query(this.sql, params);
      
      return result.rows[0] || null;
    } catch (error) {
      log.error('数据库查询失败:', { sql: this.sql, params, error });
      throw error;
    }
  }

  /**
   * 执行查询并返回所有行
   */
  async all(params: any[] = []): Promise<any[]> {
    try {
      const result = this.client
        ? await this.client.query(this.sql, params)
        : await pool.query(this.sql, params);
      
      return result.rows;
    } catch (error) {
      log.error('数据库查询失败:', { sql: this.sql, params, error });
      throw error;
    }
  }

  /**
   * 执行 INSERT/UPDATE/DELETE 操作
   */
  async run(params: any[] = []): Promise<{ changes: number; lastInsertRowid?: string }> {
    try {
      const result = this.client
        ? await this.client.query(this.sql, params)
        : await pool.query(this.sql, params);
      
      // 对于 INSERT 语句，尝试获取插入的 ID
      let lastInsertRowid: string | undefined;
      if (this.sql.toUpperCase().includes('INSERT') && this.sql.toUpperCase().includes('RETURNING')) {
        lastInsertRowid = result.rows[0]?.id;
      }
      
      return {
        changes: result.rowCount || 0,
        lastInsertRowid
      };
    } catch (error) {
      log.error('数据库执行失败:', { sql: this.sql, params, error });
      throw error;
    }
  }
}

/**
 * PostgreSQL 数据库接口
 * 模拟 better-sqlite3 的接口
 */
class PostgreSQLDatabase {
  private transactionClient?: PoolClient;

  /**
   * 准备 SQL 语句
   */
  prepare(sql: string): PreparedStatement {
    const stmt = new PreparedStatement(sql);
    if (this.transactionClient) {
      stmt.setClient(this.transactionClient);
    }
    return stmt;
  }

  /**
   * 执行 SQL 语句（不返回结果）
   */
  async exec(sql: string): Promise<void> {
    try {
      if (this.transactionClient) {
        await this.transactionClient.query(sql);
      } else {
        await pool.query(sql);
      }
    } catch (error) {
      log.error('数据库执行失败:', { sql, error });
      throw error;
    }
  }

  /**
   * 开始事务
   */
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      this.transactionClient = client;
      
      const result = await fn();
      
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      this.transactionClient = undefined;
      client.release();
    }
  }

  /**
   * pragma 操作（PostgreSQL 中大多数不适用）
   */
  pragma(command: string): void {
    // PostgreSQL 不使用 pragma
    // 这里只是为了兼容性
    log.debug(`Pragma 命令被忽略（PostgreSQL）: ${command}`);
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    // PostgreSQL 使用连接池，不需要关闭单个连接
    log.debug('PostgreSQL 使用连接池，无需关闭');
  }

  /**
   * 备份数据库（PostgreSQL 使用 pg_dump）
   */
  backup(_path: string): void {
    // PostgreSQL 备份需要使用 pg_dump 工具
    throw new Error('PostgreSQL 备份请使用 pg_dump 工具');
  }
}

// 单例数据库实例
let db: PostgreSQLDatabase | null = null;

/**
 * 获取数据库实例
 */
export function getDatabase(): PostgreSQLDatabase {
  if (!db) {
    db = new PostgreSQLDatabase();
    log.info('PostgreSQL 数据库适配器已初始化');
  }
  return db;
}

/**
 * 获取 PostgreSQL 连接池（用于需要原生 PostgreSQL 功能的场景）
 */
export function getPool() {
  return pool;
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    log.info('PostgreSQL 数据库适配器已关闭');
  }
}

/**
 * 清理测试数据库
 */
export async function cleanTestDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    const database = getDatabase();
    
    try {
      // 清空所有表
      const tables = [
        'api_keys', 'system_settings', 'users', 'documents', 
        'comments', 'annotations', 'bookmarks', 'migration_history', 
        'user_sessions', 'organizations', 'workspaces', 'user_organization_roles'
      ];
      
      for (const table of tables) {
        try {
          await database.exec(`TRUNCATE TABLE ${table} CASCADE`);
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
 * 获取数据库统计信息
 */
export async function getDatabaseStats(): Promise<any> {
  const database = getDatabase();
  
  try {
    const stats = {
      tables: {} as Record<string, number>,
      size: 0,
      connections: {
        total: 0,
        idle: 0,
        waiting: 0
      }
    };

    // 获取表统计信息
    const tables = [
      'system_settings', 'api_keys', 'users', 'documents', 
      'comments', 'annotations', 'bookmarks', 'migration_history', 
      'user_sessions', 'organizations', 'workspaces', 'user_organization_roles'
    ];

    for (const table of tables) {
      try {
        const result = await database.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        stats.tables[table] = result?.count || 0;
      } catch (error) {
        stats.tables[table] = 0;
      }
    }

    // 获取连接池状态
    const poolStats = pool as any;
    if (poolStats) {
      stats.connections.total = poolStats.totalCount || 0;
      stats.connections.idle = poolStats.idleCount || 0;
      stats.connections.waiting = poolStats.waitingCount || 0;
    }

    // 获取数据库大小（需要适当权限）
    try {
      const sizeResult = await database.prepare(`
        SELECT pg_database_size(current_database()) as size
      `).get();
      stats.size = sizeResult?.size || 0;
    } catch (error) {
      log.debug('无法获取数据库大小信息');
    }

    return stats;
  } catch (error) {
    log.error('获取数据库统计信息失败:', error);
    throw error;
  }
}

// 进程退出时的清理
process.on('exit', () => closeDatabase());
process.on('SIGINT', () => closeDatabase());
process.on('SIGTERM', () => closeDatabase());