#!/usr/bin/env tsx

/**
 * PostgreSQL 数据库初始化脚本
 * 只初始化数据库表结构，不进行数据迁移
 */

import { initDatabase } from '../lib/db/init';

async function initPostgreSQL() {
  console.log('🔄 开始初始化 PostgreSQL 数据库...');

  try {
    // 初始化数据库表结构
    console.log('📊 创建数据库表结构...');
    await initDatabase();
    
    console.log('✅ PostgreSQL 数据库初始化完成！');
    console.log('');
    console.log('🎯 下一步操作：');
    console.log('   1. 启动开发服务器: pnpm dev');
    console.log('   2. 访问管理后台: http://localhost:3001/admin');
    console.log('   3. 使用默认管理员账号登录');
    console.log('');
    console.log('📝 注意事项：');
    console.log('   - 确保 PostgreSQL 服务正在运行');
    console.log('   - 检查 .env 文件中的数据库配置');
    console.log('   - 当前版本仅支持 PostgreSQL；如需从旧 SQLite 版本迁移，请使用旧版迁移脚本');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    console.log('');
    console.log('🔧 可能的解决方案：');
    console.log('   1. 检查 PostgreSQL 是否正在运行');
    console.log('   2. 验证 .env 文件中的数据库配置');
    console.log('   3. 确保数据库用户有创建表的权限');
    console.log('   4. 检查网络连接和防火墙设置');
    throw error;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  initPostgreSQL()
    .then(() => {
      console.log('🎉 初始化完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 初始化失败:', error);
      process.exit(1);
    });
}

export { initPostgreSQL };
