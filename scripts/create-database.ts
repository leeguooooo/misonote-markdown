#!/usr/bin/env tsx

/**
 * 创建 PostgreSQL 数据库脚本
 */

import { Pool } from 'pg';

async function createDatabase() {
  console.log('🚀 创建 PostgreSQL 数据库...');
  
  // 连接到 postgres 系统数据库来创建新数据库
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres', // 连接到默认的 postgres 数据库
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  });

  try {
    const client = await adminPool.connect();
    
    try {
      // 检查数据库是否已存在
      const dbName = process.env.DB_NAME || 'misonote';
      const checkResult = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [dbName]
      );
      
      if (checkResult.rows.length > 0) {
        console.log(`✅ 数据库 "${dbName}" 已存在`);
        return;
      }
      
      // 创建数据库
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ 数据库 "${dbName}" 创建成功`);
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ 创建数据库失败:', error);
    throw error;
  } finally {
    await adminPool.end();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  createDatabase()
    .then(() => {
      console.log('🎉 数据库创建完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 创建数据库失败:', error);
      process.exit(1);
    });
}

export { createDatabase };