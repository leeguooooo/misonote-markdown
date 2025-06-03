import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './config';

export async function initDatabase() {
  try {
    console.log('🔄 正在初始化数据库...');
    
    // 读取 SQL 文件
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // 执行 SQL
    await pool.query(schema);
    
    console.log('✅ 数据库初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，则初始化数据库
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('数据库初始化成功');
      process.exit(0);
    })
    .catch((error) => {
      console.error('数据库初始化失败:', error);
      process.exit(1);
    });
}
