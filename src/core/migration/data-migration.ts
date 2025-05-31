/**
 * 数据迁移模块
 * 负责将文件存储的数据迁移到数据库
 */

import { getDatabase } from '../database/database';
import { log } from '../logger';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// 迁移状态枚举
export enum MigrationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// 迁移记录接口
export interface MigrationRecord {
  id: string;
  migrationName: string;
  migrationVersion: string;
  sourceType: 'file' | 'database';
  targetType: 'database';
  recordsMigrated: number;
  migrationStatus: MigrationStatus;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  sourceInfo: any;
  migrationLog: string[];
}

// 文件数据接口
interface FileComment {
  id: string;
  content: string;
  author: string;
  authorRole?: string;
  avatar?: string;
  timestamp: string | Date;
  likes: number;
  replies: FileComment[];
  docPath: string;
}

interface FileAnnotation {
  id: string;
  text: string;
  comment: string;
  type: 'highlight' | 'note' | 'bookmark';
  position: {
    start: number;
    end: number;
    startContainer: string;
    endContainer: string;
    xpath?: string;
    textOffset?: number;
    contextBefore?: string;
    contextAfter?: string;
  };
  timestamp: string | Date;
  author: string;
  docPath: string;
}

/**
 * 记录迁移历史
 */
function recordMigration(migration: Omit<MigrationRecord, 'id' | 'startedAt'>): string {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date();

  const stmt = db.prepare(`
    INSERT INTO migration_history (
      id, migration_name, migration_version, source_type, target_type,
      records_migrated, migration_status, error_message, started_at,
      completed_at, source_info, migration_log
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    migration.migrationName,
    migration.migrationVersion,
    migration.sourceType,
    migration.targetType,
    migration.recordsMigrated,
    migration.migrationStatus,
    migration.errorMessage,
    now.toISOString(),
    migration.completedAt?.toISOString(),
    JSON.stringify(migration.sourceInfo),
    JSON.stringify(migration.migrationLog)
  );

  return id;
}

/**
 * 更新迁移状态
 */
function updateMigrationStatus(
  id: string,
  status: MigrationStatus,
  recordsMigrated?: number,
  errorMessage?: string,
  additionalLogs?: string[]
): void {
  const db = getDatabase();

  const updates: string[] = ['migration_status = ?'];
  const values: any[] = [status];

  if (recordsMigrated !== undefined) {
    updates.push('records_migrated = ?');
    values.push(recordsMigrated);
  }

  if (errorMessage) {
    updates.push('error_message = ?');
    values.push(errorMessage);
  }

  if (status === MigrationStatus.COMPLETED || status === MigrationStatus.FAILED) {
    updates.push('completed_at = ?');
    values.push(new Date().toISOString());
  }

  if (additionalLogs && additionalLogs.length > 0) {
    // 获取现有日志并追加
    const existing = db.prepare('SELECT migration_log FROM migration_history WHERE id = ?').get(id) as any;
    const existingLogs = existing ? JSON.parse(existing.migration_log || '[]') : [];
    const newLogs = [...existingLogs, ...additionalLogs];

    updates.push('migration_log = ?');
    values.push(JSON.stringify(newLogs));
  }

  values.push(id);

  const sql = `UPDATE migration_history SET ${updates.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...values);
}

/**
 * 检查是否已经迁移过
 */
export function checkMigrationStatus(migrationName: string, version: string): MigrationRecord | null {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM migration_history
    WHERE migration_name = ? AND migration_version = ?
    ORDER BY started_at DESC
    LIMIT 1
  `);

  const row = stmt.get(migrationName, version) as any;

  if (!row) return null;

  return {
    id: row.id,
    migrationName: row.migration_name,
    migrationVersion: row.migration_version,
    sourceType: row.source_type,
    targetType: row.target_type,
    recordsMigrated: row.records_migrated,
    migrationStatus: row.migration_status as MigrationStatus,
    errorMessage: row.error_message,
    startedAt: new Date(row.started_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    sourceInfo: JSON.parse(row.source_info || '{}'),
    migrationLog: JSON.parse(row.migration_log || '[]')
  };
}

/**
 * 迁移评论数据
 */
export async function migrateComments(): Promise<MigrationRecord> {
  const migrationName = 'comments-file-to-database';
  const version = '1.0.0';

  // 检查是否已经迁移过
  const existingMigration = checkMigrationStatus(migrationName, version);
  if (existingMigration && existingMigration.migrationStatus === MigrationStatus.COMPLETED) {
    log.info('评论数据已经迁移过，跳过迁移');
    return existingMigration;
  }

  const commentsFile = path.join(process.cwd(), 'data', 'comments.json');
  const sourceInfo = {
    filePath: commentsFile,
    fileExists: fs.existsSync(commentsFile),
    fileSize: fs.existsSync(commentsFile) ? fs.statSync(commentsFile).size : 0
  };

  // 记录迁移开始
  const migrationId = recordMigration({
    migrationName,
    migrationVersion: version,
    sourceType: 'file',
    targetType: 'database',
    recordsMigrated: 0,
    migrationStatus: MigrationStatus.RUNNING,
    sourceInfo,
    migrationLog: ['开始迁移评论数据']
  });

  try {
    if (!fs.existsSync(commentsFile)) {
      updateMigrationStatus(migrationId, MigrationStatus.COMPLETED, 0, undefined, ['评论文件不存在，迁移完成']);
      return checkMigrationStatus(migrationName, version)!;
    }

    // 读取文件数据
    const fileData = fs.readFileSync(commentsFile, 'utf-8');
    const comments: FileComment[] = JSON.parse(fileData);

    updateMigrationStatus(migrationId, MigrationStatus.RUNNING, 0, undefined, [`读取到 ${comments.length} 条评论记录`]);

    const db = getDatabase();
    let migratedCount = 0;

    // 准备插入语句
    const insertComment = db.prepare(`
      INSERT OR REPLACE INTO comments (
        id, document_path, content, author_name, author_role, author_avatar,
        likes, is_approved, parent_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 使用事务批量插入
    const transaction = db.transaction((comments: FileComment[]) => {
      for (const comment of comments) {
        // 插入主评论
        const createdAt = new Date(comment.timestamp).toISOString();
        insertComment.run(
          comment.id,
          comment.docPath,
          comment.content,
          comment.author,
          comment.authorRole || 'guest',
          comment.avatar,
          comment.likes || 0,
          1, // 默认已审核
          null, // 主评论没有父级
          createdAt,
          createdAt
        );
        migratedCount++;

        // 插入回复
        if (comment.replies && comment.replies.length > 0) {
          for (const reply of comment.replies) {
            const replyCreatedAt = new Date(reply.timestamp).toISOString();
            insertComment.run(
              reply.id,
              comment.docPath, // 使用主评论的文档路径
              reply.content,
              reply.author,
              reply.authorRole || 'guest',
              reply.avatar,
              reply.likes || 0,
              1, // 默认已审核
              comment.id, // 父评论ID
              replyCreatedAt,
              replyCreatedAt
            );
            migratedCount++;
          }
        }
      }
    });

    transaction(comments);

    updateMigrationStatus(
      migrationId,
      MigrationStatus.COMPLETED,
      migratedCount,
      undefined,
      [`成功迁移 ${migratedCount} 条评论记录`]
    );

    log.info(`评论数据迁移完成，共迁移 ${migratedCount} 条记录`);

    return checkMigrationStatus(migrationName, version)!;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    updateMigrationStatus(
      migrationId,
      MigrationStatus.FAILED,
      undefined,
      errorMessage,
      [`迁移失败: ${errorMessage}`]
    );

    log.error('评论数据迁移失败', error);
    throw error;
  }
}

/**
 * 迁移标注数据（高亮、笔记、书签）
 */
export async function migrateAnnotations(): Promise<MigrationRecord> {
  const migrationName = 'annotations-file-to-database';
  const version = '1.0.0';

  // 检查是否已经迁移过
  const existingMigration = checkMigrationStatus(migrationName, version);
  if (existingMigration && existingMigration.migrationStatus === MigrationStatus.COMPLETED) {
    log.info('标注数据已经迁移过，跳过迁移');
    return existingMigration;
  }

  const annotationsFile = path.join(process.cwd(), 'data', 'annotations.json');
  const sourceInfo = {
    filePath: annotationsFile,
    fileExists: fs.existsSync(annotationsFile),
    fileSize: fs.existsSync(annotationsFile) ? fs.statSync(annotationsFile).size : 0
  };

  // 记录迁移开始
  const migrationId = recordMigration({
    migrationName,
    migrationVersion: version,
    sourceType: 'file',
    targetType: 'database',
    recordsMigrated: 0,
    migrationStatus: MigrationStatus.RUNNING,
    sourceInfo,
    migrationLog: ['开始迁移标注数据']
  });

  try {
    if (!fs.existsSync(annotationsFile)) {
      updateMigrationStatus(migrationId, MigrationStatus.COMPLETED, 0, undefined, ['标注文件不存在，迁移完成']);
      return checkMigrationStatus(migrationName, version)!;
    }

    // 读取文件数据
    const fileData = fs.readFileSync(annotationsFile, 'utf-8');
    const annotations: FileAnnotation[] = JSON.parse(fileData);

    updateMigrationStatus(migrationId, MigrationStatus.RUNNING, 0, undefined, [`读取到 ${annotations.length} 条标注记录`]);

    const db = getDatabase();
    let migratedCount = 0;

    // 准备插入语句
    const insertAnnotation = db.prepare(`
      INSERT OR REPLACE INTO annotations (
        id, document_path, annotation_type, selected_text, comment_text,
        position_data, author_name, author_role, likes, is_approved,
        created_at, updated_at, color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 使用事务批量插入
    const transaction = db.transaction((annotations: FileAnnotation[]) => {
      for (const annotation of annotations) {
        const createdAt = new Date(annotation.timestamp).toISOString();

        // 确定颜色
        let color = '#ffeb3b'; // 默认黄色
        if (annotation.type === 'note') color = '#4caf50'; // 绿色
        if (annotation.type === 'bookmark') color = '#f44336'; // 红色

        insertAnnotation.run(
          annotation.id,
          annotation.docPath,
          annotation.type,
          annotation.text,
          annotation.comment || null,
          JSON.stringify(annotation.position),
          annotation.author,
          'guest', // 默认角色
          0, // 默认点赞数
          1, // 默认已审核
          createdAt,
          createdAt,
          color
        );
        migratedCount++;
      }
    });

    transaction(annotations);

    updateMigrationStatus(
      migrationId,
      MigrationStatus.COMPLETED,
      migratedCount,
      undefined,
      [`成功迁移 ${migratedCount} 条标注记录`]
    );

    log.info(`标注数据迁移完成，共迁移 ${migratedCount} 条记录`);

    return checkMigrationStatus(migrationName, version)!;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    updateMigrationStatus(
      migrationId,
      MigrationStatus.FAILED,
      undefined,
      errorMessage,
      [`迁移失败: ${errorMessage}`]
    );

    log.error('标注数据迁移失败', error);
    throw error;
  }
}

/**
 * 执行完整的数据迁移
 */
export async function runFullMigration(): Promise<{
  comments: MigrationRecord;
  annotations: MigrationRecord;
}> {
  log.info('开始执行完整数据迁移');

  try {
    // 迁移评论数据
    const commentsResult = await migrateComments();

    // 迁移标注数据
    const annotationsResult = await migrateAnnotations();

    log.info('完整数据迁移完成');

    return {
      comments: commentsResult,
      annotations: annotationsResult
    };

  } catch (error) {
    log.error('数据迁移过程中发生错误', error);
    throw error;
  }
}

/**
 * 获取迁移历史
 */
export function getMigrationHistory(): MigrationRecord[] {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM migration_history
    ORDER BY started_at DESC
  `);

  const rows = stmt.all() as any[];

  return rows.map(row => ({
    id: row.id,
    migrationName: row.migration_name,
    migrationVersion: row.migration_version,
    sourceType: row.source_type,
    targetType: row.target_type,
    recordsMigrated: row.records_migrated,
    migrationStatus: row.migration_status as MigrationStatus,
    errorMessage: row.error_message,
    startedAt: new Date(row.started_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    sourceInfo: JSON.parse(row.source_info || '{}'),
    migrationLog: JSON.parse(row.migration_log || '[]')
  }));
}
