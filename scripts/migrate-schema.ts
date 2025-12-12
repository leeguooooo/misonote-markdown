#!/usr/bin/env tsx

/**
 * 数据库架构迁移脚本：应用新的数据库迁移
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../lib/db/config';

async function applyMigrations() {
  console.log('🔄 开始应用数据库迁移...');
  
  const client = await pool.connect();
  
  try {
    // 应用组织相关表迁移
    console.log('📊 应用组织表迁移...');
    const orgMigration = readFileSync(
      join(__dirname, 'migrations', '0001_add_organizations.sql'),
      'utf-8'
    );
    await client.query(orgMigration);
    console.log('✅ 组织表迁移完成');
    
    // 应用协作会话表迁移
    console.log('📊 应用协作会话表迁移...');
    const collabMigration = readFileSync(
      join(__dirname, 'migrations', '0002_add_collaboration_sessions.sql'),
      'utf-8'
    );
    await client.query(collabMigration);
    console.log('✅ 协作会话表迁移完成');

    // 应用全文检索索引迁移
    console.log('📊 应用全文检索索引迁移...');
    const searchMigration = readFileSync(
      join(__dirname, 'migrations', '0003_add_search_index.sql'),
      'utf-8'
    );
    await client.query(searchMigration);
    console.log('✅ 全文检索索引迁移完成');

    // 应用完整 PostgreSQL 架构对齐迁移
    console.log('📊 应用完整架构对齐迁移...');
    const fullSchemaMigration = readFileSync(
      join(__dirname, 'migrations', '0004_full_pg_schema.sql'),
      'utf-8'
    );
    await client.query(fullSchemaMigration);
    console.log('✅ 完整架构对齐迁移完成');
    
    console.log('🎉 所有迁移应用成功！');
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  applyMigrations()
    .then(() => {
      console.log('✅ 迁移完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 迁移失败:', error);
      process.exit(1);
    });
}

export { applyMigrations };
