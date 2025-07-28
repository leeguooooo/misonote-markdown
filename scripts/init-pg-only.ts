#!/usr/bin/env tsx

/**
 * PostgreSQL 初始化脚本
 * 初始化数据库并应用所有迁移
 */

import { initDatabase } from '../lib/db/init';
import { applyMigrations } from './migrate-schema';
import { createDatabase } from './create-database';

async function initPostgreSQL() {
  try {
    console.log('🚀 初始化 PostgreSQL 数据库...');
    
    // 首先创建数据库（如果不存在）
    await createDatabase();
    
    // 初始化基础数据库结构
    await initDatabase();
    
    // 应用新的迁移
    await applyMigrations();
    
    console.log('✅ PostgreSQL 数据库初始化完成！');
    console.log('');
    console.log('📝 下一步：');
    console.log('1. 安装依赖: pnpm install');
    console.log('2. 启动开发服务器: pnpm dev:all');
    console.log('   - Next.js 服务器运行在: http://localhost:3001');
    console.log('   - WebSocket 服务器运行在: ws://localhost:3002');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    throw error;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  initPostgreSQL()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 初始化失败:', error);
      process.exit(1);
    });
}

export { initPostgreSQL };