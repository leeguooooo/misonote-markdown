/**
 * 评论服务 - 数据库版本
 * 替代原有的文件存储方式
 */

import { getDatabase } from '../database/database';
import { log } from '../logger';
import { v4 as uuidv4 } from 'uuid';

// 评论接口
export interface Comment {
  id: string;
  documentPath: string;
  content: string;
  authorName: string;
  authorEmail?: string;
  authorRole: string;
  authorAvatar?: string;
  likes: number;
  isApproved: boolean;
  isDeleted: boolean;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  // 关联数据
  replies?: Comment[];
}

// 创建评论请求
export interface CreateCommentRequest {
  documentPath: string;
  content: string;
  authorName: string;
  authorEmail?: string;
  authorRole?: string;
  authorAvatar?: string;
  parentId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

// 更新评论请求
export interface UpdateCommentRequest {
  content?: string;
  isApproved?: boolean;
  metadata?: any;
}

/**
 * 创建评论
 */
export function createComment(request: CreateCommentRequest): Comment {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date();

  const stmt = db.prepare(`
    INSERT INTO comments (
      id, document_path, content, author_name, author_email, author_role,
      author_avatar, likes, is_approved, is_deleted, parent_id,
      created_at, updated_at, metadata, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    request.documentPath,
    request.content,
    request.authorName,
    request.authorEmail,
    request.authorRole || 'guest',
    request.authorAvatar,
    0, // 初始点赞数
    request.authorRole === 'admin' ? 1 : 0, // 管理员评论自动审核
    0, // 未删除
    request.parentId,
    now.toISOString(),
    now.toISOString(),
    request.metadata ? JSON.stringify(request.metadata) : null,
    request.ipAddress,
    request.userAgent
  );

  log.info('创建评论', { id, documentPath: request.documentPath, author: request.authorName });

  return getCommentById(id)!;
}

/**
 * 根据ID获取评论
 */
export function getCommentById(id: string): Comment | null {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT * FROM comments 
    WHERE id = ? AND is_deleted = 0
  `);

  const row = stmt.get(id) as any;
  
  if (!row) return null;

  return mapRowToComment(row);
}

/**
 * 获取文档的所有评论（包括回复）
 */
export function getCommentsByDocument(documentPath: string, includeUnapproved: boolean = false): Comment[] {
  const db = getDatabase();
  
  let sql = `
    SELECT * FROM comments 
    WHERE document_path = ? AND is_deleted = 0
  `;
  
  if (!includeUnapproved) {
    sql += ' AND is_approved = 1';
  }
  
  sql += ' ORDER BY created_at ASC';

  const stmt = db.prepare(sql);
  const rows = stmt.all(documentPath) as any[];

  // 构建评论树结构
  const comments = rows.map(mapRowToComment);
  const commentMap = new Map<string, Comment>();
  const rootComments: Comment[] = [];

  // 第一遍：创建所有评论对象
  for (const comment of comments) {
    comment.replies = [];
    commentMap.set(comment.id, comment);
  }

  // 第二遍：构建树结构
  for (const comment of comments) {
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies!.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  }

  return rootComments;
}

/**
 * 更新评论
 */
export function updateComment(id: string, request: UpdateCommentRequest): boolean {
  const db = getDatabase();
  
  const updates: string[] = ['updated_at = ?'];
  const values: any[] = [new Date().toISOString()];

  if (request.content !== undefined) {
    updates.push('content = ?');
    values.push(request.content);
  }

  if (request.isApproved !== undefined) {
    updates.push('is_approved = ?');
    values.push(request.isApproved ? 1 : 0);
  }

  if (request.metadata !== undefined) {
    updates.push('metadata = ?');
    values.push(request.metadata ? JSON.stringify(request.metadata) : null);
  }

  values.push(id);

  const sql = `UPDATE comments SET ${updates.join(', ')} WHERE id = ?`;
  const result = db.prepare(sql).run(...values);

  if (result.changes > 0) {
    log.info('更新评论', { id });
    return true;
  }

  return false;
}

/**
 * 删除评论（软删除）
 */
export function deleteComment(id: string): boolean {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    UPDATE comments 
    SET is_deleted = 1, updated_at = ? 
    WHERE id = ?
  `);

  const result = stmt.run(new Date().toISOString(), id);

  if (result.changes > 0) {
    log.info('删除评论', { id });
    return true;
  }

  return false;
}

/**
 * 点赞评论
 */
export function likeComment(id: string): boolean {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    UPDATE comments 
    SET likes = likes + 1, updated_at = ? 
    WHERE id = ? AND is_deleted = 0
  `);

  const result = stmt.run(new Date().toISOString(), id);

  if (result.changes > 0) {
    log.info('点赞评论', { id });
    return true;
  }

  return false;
}

/**
 * 取消点赞评论
 */
export function unlikeComment(id: string): boolean {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    UPDATE comments 
    SET likes = MAX(0, likes - 1), updated_at = ? 
    WHERE id = ? AND is_deleted = 0
  `);

  const result = stmt.run(new Date().toISOString(), id);

  if (result.changes > 0) {
    log.info('取消点赞评论', { id });
    return true;
  }

  return false;
}

/**
 * 获取待审核的评论
 */
export function getPendingComments(): Comment[] {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT * FROM comments 
    WHERE is_approved = 0 AND is_deleted = 0
    ORDER BY created_at DESC
  `);

  const rows = stmt.all() as any[];
  return rows.map(mapRowToComment);
}

/**
 * 批量审核评论
 */
export function approveComments(ids: string[]): number {
  if (ids.length === 0) return 0;

  const db = getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  
  const stmt = db.prepare(`
    UPDATE comments 
    SET is_approved = 1, updated_at = ? 
    WHERE id IN (${placeholders}) AND is_deleted = 0
  `);

  const result = stmt.run(new Date().toISOString(), ...ids);

  log.info('批量审核评论', { count: result.changes, ids });
  return result.changes;
}

/**
 * 获取评论统计信息
 */
export function getCommentStats(): {
  total: number;
  approved: number;
  pending: number;
  byDocument: { documentPath: string; count: number }[];
} {
  const db = getDatabase();

  // 总数统计
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM comments WHERE is_deleted = 0');
  const total = (totalStmt.get() as any).count;

  // 已审核统计
  const approvedStmt = db.prepare('SELECT COUNT(*) as count FROM comments WHERE is_approved = 1 AND is_deleted = 0');
  const approved = (approvedStmt.get() as any).count;

  // 待审核统计
  const pendingStmt = db.prepare('SELECT COUNT(*) as count FROM comments WHERE is_approved = 0 AND is_deleted = 0');
  const pending = (pendingStmt.get() as any).count;

  // 按文档统计
  const byDocumentStmt = db.prepare(`
    SELECT document_path, COUNT(*) as count 
    FROM comments 
    WHERE is_deleted = 0 
    GROUP BY document_path 
    ORDER BY count DESC
  `);
  const byDocument = byDocumentStmt.all() as any[];

  return {
    total,
    approved,
    pending,
    byDocument: byDocument.map(row => ({
      documentPath: row.document_path,
      count: row.count
    }))
  };
}

/**
 * 将数据库行映射为评论对象
 */
function mapRowToComment(row: any): Comment {
  return {
    id: row.id,
    documentPath: row.document_path,
    content: row.content,
    authorName: row.author_name,
    authorEmail: row.author_email,
    authorRole: row.author_role,
    authorAvatar: row.author_avatar,
    likes: row.likes,
    isApproved: Boolean(row.is_approved),
    isDeleted: Boolean(row.is_deleted),
    parentId: row.parent_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    ipAddress: row.ip_address,
    userAgent: row.user_agent
  };
}
