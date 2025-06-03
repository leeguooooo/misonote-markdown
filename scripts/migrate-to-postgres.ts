#!/usr/bin/env tsx

/**
 * 数据库迁移脚本：从 SQLite 迁移到 PostgreSQL
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import { db } from '../lib/db/operations';
import { initDatabase } from '../lib/db/init';

interface MigrationData {
  users: any[];
  api_keys: any[];
  documents: any[];
  comments: any[];
  highlights: any[];
  bookmarks: any[];
  workspaces: any[];
  workspace_members: any[];
}

async function migrateSQLiteToPostgreSQL() {
  console.log('🔄 开始从 SQLite 迁移到 PostgreSQL...');

  // 1. 初始化 PostgreSQL 数据库
  console.log('📊 初始化 PostgreSQL 数据库...');
  await initDatabase();

  // 2. 检查 SQLite 数据库是否存在
  const sqliteDbPath = join(process.cwd(), 'data', 'misonote.db');
  if (!existsSync(sqliteDbPath)) {
    console.log('⚠️  SQLite 数据库不存在，跳过数据迁移');
    console.log('✅ PostgreSQL 数据库初始化完成');
    return;
  }

  // 3. 读取 SQLite 数据
  console.log('📖 读取 SQLite 数据...');
  const sqliteDb = new Database(sqliteDbPath, { readonly: true });
  
  const migrationData: MigrationData = {
    users: [],
    api_keys: [],
    documents: [],
    comments: [],
    highlights: [],
    bookmarks: [],
    workspaces: [],
    workspace_members: []
  };

  try {
    // 读取各表数据
    const tables = ['users', 'api_keys', 'documents', 'comments', 'highlights', 'bookmarks', 'workspaces', 'workspace_members'];
    
    for (const table of tables) {
      try {
        const rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
        migrationData[table as keyof MigrationData] = rows;
        console.log(`  📋 ${table}: ${rows.length} 条记录`);
      } catch (error) {
        console.log(`  ⚠️  表 ${table} 不存在或读取失败，跳过`);
      }
    }
  } finally {
    sqliteDb.close();
  }

  // 4. 迁移数据到 PostgreSQL
  console.log('📝 迁移数据到 PostgreSQL...');

  await db.transaction(async (client) => {
    // 迁移用户
    if (migrationData.users.length > 0) {
      console.log('  👥 迁移用户数据...');
      for (const user of migrationData.users) {
        await client.query(`
          INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [user.id, user.username, user.email, user.password_hash, user.role, user.created_at, user.updated_at]);
      }
    }

    // 迁移 API 密钥
    if (migrationData.api_keys.length > 0) {
      console.log('  🔑 迁移 API 密钥...');
      for (const apiKey of migrationData.api_keys) {
        const permissions = typeof apiKey.permissions === 'string' 
          ? JSON.parse(apiKey.permissions || '[]')
          : apiKey.permissions || [];
        
        await client.query(`
          INSERT INTO api_keys (id, user_id, key_hash, name, permissions, last_used_at, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `, [apiKey.id, apiKey.user_id, apiKey.key_hash, apiKey.name, permissions, apiKey.last_used_at, apiKey.created_at, apiKey.updated_at]);
      }
    }

    // 迁移文档
    if (migrationData.documents.length > 0) {
      console.log('  📄 迁移文档数据...');
      for (const doc of migrationData.documents) {
        await client.query(`
          INSERT INTO documents (id, title, content, file_path, user_id, workspace_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `, [doc.id, doc.title, doc.content, doc.file_path, doc.user_id, doc.workspace_id, doc.created_at, doc.updated_at]);
      }
    }

    // 迁移评论
    if (migrationData.comments.length > 0) {
      console.log('  💬 迁移评论数据...');
      for (const comment of migrationData.comments) {
        await client.query(`
          INSERT INTO comments (id, document_id, user_id, content, position_start, position_end, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `, [comment.id, comment.document_id, comment.user_id, comment.content, comment.position_start, comment.position_end, comment.created_at, comment.updated_at]);
      }
    }

    // 迁移高亮
    if (migrationData.highlights.length > 0) {
      console.log('  🎨 迁移高亮数据...');
      for (const highlight of migrationData.highlights) {
        await client.query(`
          INSERT INTO highlights (id, document_id, user_id, text, color, position_start, position_end, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING
        `, [highlight.id, highlight.document_id, highlight.user_id, highlight.text, highlight.color, highlight.position_start, highlight.position_end, highlight.created_at, highlight.updated_at]);
      }
    }

    // 迁移书签
    if (migrationData.bookmarks.length > 0) {
      console.log('  🔖 迁移书签数据...');
      for (const bookmark of migrationData.bookmarks) {
        await client.query(`
          INSERT INTO bookmarks (id, document_id, user_id, title, position, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [bookmark.id, bookmark.document_id, bookmark.user_id, bookmark.title, bookmark.position, bookmark.created_at, bookmark.updated_at]);
      }
    }

    // 迁移工作空间
    if (migrationData.workspaces.length > 0) {
      console.log('  🏢 迁移工作空间数据...');
      for (const workspace of migrationData.workspaces) {
        await client.query(`
          INSERT INTO workspaces (id, name, description, owner_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING
        `, [workspace.id, workspace.name, workspace.description, workspace.owner_id, workspace.created_at, workspace.updated_at]);
      }
    }

    // 迁移工作空间成员
    if (migrationData.workspace_members.length > 0) {
      console.log('  👥 迁移工作空间成员数据...');
      for (const member of migrationData.workspace_members) {
        await client.query(`
          INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO NOTHING
        `, [member.id, member.workspace_id, member.user_id, member.role, member.created_at]);
      }
    }
  });

  console.log('✅ 数据迁移完成！');
  console.log('📊 迁移统计：');
  console.log(`  👥 用户: ${migrationData.users.length}`);
  console.log(`  🔑 API密钥: ${migrationData.api_keys.length}`);
  console.log(`  📄 文档: ${migrationData.documents.length}`);
  console.log(`  💬 评论: ${migrationData.comments.length}`);
  console.log(`  🎨 高亮: ${migrationData.highlights.length}`);
  console.log(`  🔖 书签: ${migrationData.bookmarks.length}`);
  console.log(`  🏢 工作空间: ${migrationData.workspaces.length}`);
  console.log(`  👥 工作空间成员: ${migrationData.workspace_members.length}`);
}

// 如果直接运行此文件
if (require.main === module) {
  migrateSQLiteToPostgreSQL()
    .then(() => {
      console.log('🎉 迁移完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 迁移失败:', error);
      process.exit(1);
    });
}

export { migrateSQLiteToPostgreSQL };
