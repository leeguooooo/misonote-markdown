import pool from './config';
import { PoolClient } from 'pg';

// 数据库操作工具类
export class DatabaseOperations {
  private static instance: DatabaseOperations;
  
  private constructor() {}
  
  static getInstance(): DatabaseOperations {
    if (!DatabaseOperations.instance) {
      DatabaseOperations.instance = new DatabaseOperations();
    }
    return DatabaseOperations.instance;
  }

  // 执行查询
  async query(text: string, params?: any[]): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // 执行单条查询，返回第一行
  async queryOne(text: string, params?: any[]): Promise<any> {
    const rows = await this.query(text, params);
    return rows[0] || null;
  }

  // 执行插入并返回插入的ID
  async insert(text: string, params?: any[]): Promise<number> {
    const client = await pool.connect();
    try {
      const result = await client.query(text + ' RETURNING id', params);
      return result.rows[0]?.id;
    } finally {
      client.release();
    }
  }

  // 执行更新
  async update(text: string, params?: any[]): Promise<number> {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  // 执行删除
  async delete(text: string, params?: any[]): Promise<number> {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  // 事务操作
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 准备语句（模拟旧 SQLite 风格的 prepare 方法）
  prepare(sql: string) {
    return {
      get: async (params?: any[]) => {
        return await this.queryOne(sql, params);
      },
      all: async (params?: any[]) => {
        return await this.query(sql, params);
      },
      run: async (params?: any[]) => {
        const client = await pool.connect();
        try {
          const result = await client.query(sql, params);
          return {
            changes: result.rowCount || 0,
            lastInsertRowid: result.rows[0]?.id || null
          };
        } finally {
          client.release();
        }
      }
    };
  }

  // 获取数据库统计信息
  async getStats() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes
        FROM pg_stat_user_tables
      `);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

// 导出单例实例
export const db = DatabaseOperations.getInstance();
export default db;
