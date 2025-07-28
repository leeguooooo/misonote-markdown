/**
 * 评论服务 - PostgreSQL 简化版本
 * 专注于解决构建问题
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/postgres-adapter';
import { log } from '../logger';

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
export async function createComment(request: CreateCommentRequest): Promise<Comment> {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date();

  const stmt = db.prepare(`
    INSERT INTO comments (
      id, document_path, content, author_name, author_email, author_role,
      author_avatar, likes, is_approved, is_deleted, parent_id,
      created_at, updated_at, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  `);

  await stmt.run([
    id,
    request.documentPath,
    request.content,
    request.authorName,
    request.authorEmail,
    request.authorRole || 'guest',
    request.authorAvatar,
    0, // 初始点赞数
    true, // 所有评论默认自动审核通过
    false, // 未删除
    request.parentId,
    now.toISOString(),
    now.toISOString(),
    request.metadata ? JSON.stringify(request.metadata) : null
  ]);

  log.info('创建评论', {
    id,
    documentPath: request.documentPath,
    author: request.authorName,
    parentId: request.parentId
  });

  return (await getCommentById(id))!;
}

/**
 * 根据ID获取评论
 */
export async function getCommentById(id: string): Promise<Comment | null> {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM comments
    WHERE id = $1 AND is_deleted = false
  `);

  const row = await stmt.get([id]) as any;

  if (!row) return null;

  return mapRowToComment(row);
}

/**
 * 获取文档的所有评论
 */
export async function getCommentsByDocument(
  documentPath: string,
  includeUnapproved: boolean = false
): Promise<Comment[]> {
  const db = getDatabase();

  let sql = `
    SELECT * FROM comments
    WHERE document_path = $1 AND is_deleted = false
  `;

  if (!includeUnapproved) {
    sql += ' AND is_approved = true';
  }

  sql += ' ORDER BY created_at ASC';

  const stmt = db.prepare(sql);
  const rows = await stmt.all([documentPath]) as any[];

  const comments = rows.map(mapRowToComment);

  // 构建评论树结构
  return buildCommentTree(comments);
}

/**
 * 获取用户的评论
 */
export async function getCommentsByUser(authorName: string): Promise<Comment[]> {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM comments
    WHERE author_name = $1 AND is_deleted = false
    ORDER BY created_at DESC
  `);

  const rows = await stmt.all([authorName]) as any[];

  return rows.map(mapRowToComment);
}

/**
 * 更新评论
 */
export async function updateComment(id: string, request: UpdateCommentRequest): Promise<boolean> {
  const db = getDatabase();

  const updates: string[] = ['updated_at = $1'];
  const values: any[] = [new Date().toISOString()];
  let paramIndex = 2;

  if (request.content !== undefined) {
    updates.push(`content = $${paramIndex++}`);
    values.push(request.content);
  }

  if (request.isApproved !== undefined) {
    updates.push(`is_approved = $${paramIndex++}`);
    values.push(request.isApproved);
  }

  if (request.metadata !== undefined) {
    updates.push(`metadata = $${paramIndex++}`);
    values.push(request.metadata ? JSON.stringify(request.metadata) : null);
  }

  values.push(id);

  const sql = `UPDATE comments SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
  const result = await db.prepare(sql).run(values);

  if (result.changes > 0) {
    log.info('更新评论', { id });
    return true;
  }

  return false;
}

/**
 * 删除评论（软删除）
 */
export async function deleteComment(id: string): Promise<boolean> {
  const db = getDatabase();

  const stmt = db.prepare(`
    UPDATE comments
    SET is_deleted = true, updated_at = $1
    WHERE id = $2
  `);

  const result = await stmt.run([new Date().toISOString(), id]);

  if (result.changes > 0) {
    log.info('删除评论', { id });
    return true;
  }

  return false;
}

/**
 * 点赞评论
 */
export async function likeComment(id: string): Promise<boolean> {
  const db = getDatabase();

  const stmt = db.prepare(`
    UPDATE comments
    SET likes = likes + 1, updated_at = $1
    WHERE id = $2 AND is_deleted = false
  `);

  const result = await stmt.run([new Date().toISOString(), id]);

  if (result.changes > 0) {
    log.info('点赞评论', { id });
    return true;
  }

  return false;
}

/**
 * 搜索评论
 */
export async function searchComments(
  query: string,
  documentPath?: string
): Promise<Comment[]> {
  const db = getDatabase();

  let sql = `
    SELECT * FROM comments
    WHERE is_deleted = false AND is_approved = true
    AND content ILIKE $1
  `;

  const params: any[] = [`%${query}%`];

  if (documentPath) {
    sql += ' AND document_path = $2';
    params.push(documentPath);
  }

  sql += ' ORDER BY created_at DESC';

  const stmt = db.prepare(sql);
  const rows = await stmt.all(params) as any[];

  return rows.map(mapRowToComment);
}

/**
 * 获取评论统计信息
 */
export async function getCommentStats(): Promise<{
  total: number;
  byDocument: { documentPath: string; count: number }[];
  pending: number;
  recent: Comment[];
}> {
  const db = getDatabase();

  // 总数统计
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM comments WHERE is_deleted = false');
  const total = (await totalStmt.get() as any).count;

  // 按文档统计
  const byDocumentStmt = db.prepare(`
    SELECT document_path, COUNT(*) as count
    FROM comments
    WHERE is_deleted = false
    GROUP BY document_path
    ORDER BY count DESC
    LIMIT 10
  `);
  const byDocument = await byDocumentStmt.all() as any[];

  // 待审核统计
  const pendingStmt = db.prepare('SELECT COUNT(*) as count FROM comments WHERE is_approved = false AND is_deleted = false');
  const pending = (await pendingStmt.get() as any).count;

  // 最近评论
  const recentStmt = db.prepare(`
    SELECT * FROM comments
    WHERE is_deleted = false AND is_approved = true
    ORDER BY created_at DESC
    LIMIT 5
  `);
  const recentRows = await recentStmt.all() as any[];
  const recent = recentRows.map(mapRowToComment);

  return {
    total,
    byDocument: byDocument.map(row => ({
      documentPath: row.document_path,
      count: row.count
    })),
    pending,
    recent
  };
}

/**
 * 构建评论树结构
 */
function buildCommentTree(comments: Comment[]): Comment[] {
  const commentMap = new Map<string, Comment>();
  const rootComments: Comment[] = [];

  // 创建评论映射
  comments.forEach(comment => {
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });

  // 构建树结构
  comments.forEach(comment => {
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies!.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  });

  return rootComments;
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
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined
  };
}
