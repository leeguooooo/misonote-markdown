#!/usr/bin/env tsx

/**
 * 数据库初始化脚本
 * 根据许可证类型初始化社区版或企业版数据库
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './config';

interface InitOptions {
  force?: boolean; // 是否强制重新初始化
  enterpriseEnabled?: boolean; // 是否启用企业版功能
}

/**
 * 检查企业版许可证
 */
async function checkEnterpriseLicense(): Promise<boolean> {
  try {
    // 检查环境变量
    if (process.env.ENTERPRISE_LICENSE === 'true' || process.env.NODE_ENV === 'development') {
      return true;
    }

    // 检查数据库中的许可证设置
    const result = await pool.query(
      "SELECT value FROM system_settings WHERE key = 'enterprise_enabled'"
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].value === 'true';
    }

    return false;
  } catch (error) {
    console.warn('检查企业版许可证时出错:', error);
    return false;
  }
}

/**
 * 检查数据库是否已初始化
 */
async function isDatabaseInitialized(): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    return result.rows[0].exists;
  } catch (error) {
    return false;
  }
}

/**
 * 初始化社区版数据库
 */
async function initCommunityDatabase(): Promise<void> {
  console.log('🏠 初始化社区版数据库...');
  
  try {
    // 读取社区版SQL文件
    const schemaPath = join(__dirname, 'community-schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // 执行SQL
    await pool.query(schema);
    
    console.log('✅ 社区版数据库初始化完成');
  } catch (error) {
    console.error('❌ 社区版数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 初始化企业版数据库扩展
 */
async function initEnterpriseDatabase(): Promise<void> {
  console.log('🏢 初始化企业版数据库扩展...');
  
  try {
    // 读取企业版SQL文件
    const schemaPath = join(__dirname, '../../enterprise/database/enterprise-schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // 执行SQL
    await pool.query(schema);
    
    // 更新企业版启用状态
    await pool.query(`
      UPDATE system_settings 
      SET value = 'true' 
      WHERE key = 'enterprise_enabled'
    `);
    
    console.log('✅ 企业版数据库扩展初始化完成');
  } catch (error) {
    console.error('❌ 企业版数据库扩展初始化失败:', error);
    throw error;
  }
}

/**
 * 创建默认管理员用户
 */
async function createDefaultAdmin(): Promise<void> {
  console.log('👤 创建默认管理员用户...');
  
  try {
    // 检查是否已存在管理员
    const existingAdmin = await pool.query(
      "SELECT id FROM users WHERE user_type = 'admin' LIMIT 1"
    );
    
    if (existingAdmin.rows.length > 0) {
      console.log('ℹ️  管理员用户已存在，跳过创建');
      return;
    }
    
    // 创建默认管理员
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    
    await pool.query(`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        display_name, 
        user_type, 
        can_edit_documents,
        account_status
      ) VALUES (
        'admin', 
        'admin@misonote.com', 
        $1, 
        '系统管理员', 
        'admin', 
        true,
        'active'
      )
    `, [passwordHash]);
    
    console.log('✅ 默认管理员用户创建完成');
    console.log('📝 默认登录信息:');
    console.log('   用户名: admin');
    console.log('   密码:', defaultPassword);
    console.log('   邮箱: admin@misonote.com');
  } catch (error) {
    console.error('❌ 创建默认管理员失败:', error);
    throw error;
  }
}

/**
 * 主初始化函数
 */
export async function initDatabase(options: InitOptions = {}): Promise<void> {
  const { force = false, enterpriseEnabled } = options;
  
  try {
    console.log('🔄 开始数据库初始化...');
    
    // 检查是否已初始化
    const isInitialized = await isDatabaseInitialized();
    if (isInitialized && !force) {
      console.log('ℹ️  数据库已初始化，跳过初始化过程');
      console.log('💡 如需强制重新初始化，请使用 --force 参数');
      return;
    }
    
    if (force && isInitialized) {
      console.log('⚠️  强制重新初始化数据库...');
      // 注意：这里不删除数据，只是重新执行SQL（使用IF NOT EXISTS）
    }
    
    // 1. 初始化社区版数据库
    await initCommunityDatabase();
    
    // 2. 检查是否需要初始化企业版
    const shouldInitEnterprise = enterpriseEnabled ?? await checkEnterpriseLicense();
    
    if (shouldInitEnterprise) {
      await initEnterpriseDatabase();
    } else {
      console.log('ℹ️  企业版许可证未激活，跳过企业版功能初始化');
    }
    
    // 3. 创建默认管理员
    await createDefaultAdmin();
    
    console.log('');
    console.log('🎉 数据库初始化完成！');
    console.log('');
    console.log('📊 数据库信息:');
    console.log(`   类型: ${shouldInitEnterprise ? '企业版' : '社区版'}`);
    console.log('   数据库: PostgreSQL');
    console.log('   状态: 已初始化');
    console.log('');
    console.log('🚀 下一步操作:');
    console.log('   1. 启动开发服务器: pnpm dev');
    console.log('   2. 访问管理后台: http://localhost:3001/admin');
    console.log('   3. 使用默认管理员账号登录');
    
  } catch (error) {
    console.error('💥 数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 获取数据库状态信息
 */
export async function getDatabaseStatus(): Promise<{
  initialized: boolean;
  enterpriseEnabled: boolean;
  userCount: number;
  documentCount: number;
  version: string;
}> {
  try {
    const initialized = await isDatabaseInitialized();
    
    if (!initialized) {
      return {
        initialized: false,
        enterpriseEnabled: false,
        userCount: 0,
        documentCount: 0,
        version: 'unknown'
      };
    }
    
    const [enterpriseResult, userResult, documentResult] = await Promise.all([
      pool.query("SELECT value FROM system_settings WHERE key = 'enterprise_enabled'"),
      pool.query("SELECT COUNT(*) as count FROM users"),
      pool.query("SELECT COUNT(*) as count FROM documents")
    ]);
    
    return {
      initialized: true,
      enterpriseEnabled: enterpriseResult.rows[0]?.value === 'true',
      userCount: parseInt(userResult.rows[0].count),
      documentCount: parseInt(documentResult.rows[0].count),
      version: '1.0.0'
    };
  } catch (error) {
    console.error('获取数据库状态失败:', error);
    throw error;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const enterprise = args.includes('--enterprise');
  
  initDatabase({ force, enterpriseEnabled: enterprise })
    .then(() => {
      console.log('🎯 数据库初始化成功！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 数据库初始化失败:', error);
      process.exit(1);
    });
}
