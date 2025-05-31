/**
 * 标注服务 - 数据库版本
 * 支持高亮、笔记、书签功能
 */

import { getDatabase } from '../database/database';
import { log } from '../logger';
import { v4 as uuidv4 } from 'uuid';

// 标注类型
export type AnnotationType = 'highlight' | 'note' | 'bookmark';

// 位置数据接口
export interface PositionData {
  start: number;
  end: number;
  startContainer: string;
  endContainer: string;
  xpath?: string;
  textOffset?: number;
  contextBefore?: string;
  contextAfter?: string;
}

// 标注接口
export interface Annotation {
  id: string;
  documentPath: string;
  annotationType: AnnotationType;
  selectedText: string;
  commentText?: string;
  positionData: PositionData;
  authorName: string;
  authorEmail?: string;
  authorRole: string;
  likes: number;
  isApproved: boolean;
  isDeleted: boolean;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
  tags?: string[];
  color: string;
}

// 创建标注请求
export interface CreateAnnotationRequest {
  documentPath: string;
  annotationType: AnnotationType;
  selectedText: string;
  commentText?: string;
  positionData: PositionData;
  authorName: string;
  authorEmail?: string;
  authorRole?: string;
  tags?: string[];
  color?: string;
  metadata?: any;
}

// 更新标注请求
export interface UpdateAnnotationRequest {
  commentText?: string;
  isApproved?: boolean;
  isResolved?: boolean;
  tags?: string[];
  color?: string;
  metadata?: any;
}

/**
 * 创建标注
 */
export function createAnnotation(request: CreateAnnotationRequest): Annotation {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date();

  // 根据类型设置默认颜色
  let defaultColor = '#ffeb3b'; // 黄色 - 高亮
  if (request.annotationType === 'note') defaultColor = '#4caf50'; // 绿色 - 笔记
  if (request.annotationType === 'bookmark') defaultColor = '#f44336'; // 红色 - 书签

  const stmt = db.prepare(`
    INSERT INTO annotations (
      id, document_path, annotation_type, selected_text, comment_text,
      position_data, author_name, author_email, author_role, likes,
      is_approved, is_deleted, is_resolved, created_at, updated_at,
      metadata, tags, color
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    request.documentPath,
    request.annotationType,
    request.selectedText,
    request.commentText,
    JSON.stringify(request.positionData),
    request.authorName,
    request.authorEmail,
    request.authorRole || 'guest',
    0, // 初始点赞数
    request.authorRole === 'admin' ? 1 : 0, // 管理员标注自动审核
    0, // 未删除
    0, // 未解决
    now.toISOString(),
    now.toISOString(),
    request.metadata ? JSON.stringify(request.metadata) : null,
    request.tags ? JSON.stringify(request.tags) : null,
    request.color || defaultColor
  );

  log.info('创建标注', { 
    id, 
    type: request.annotationType, 
    documentPath: request.documentPath, 
    author: request.authorName 
  });

  return getAnnotationById(id)!;
}

/**
 * 根据ID获取标注
 */
export function getAnnotationById(id: string): Annotation | null {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT * FROM annotations 
    WHERE id = ? AND is_deleted = 0
  `);

  const row = stmt.get(id) as any;
  
  if (!row) return null;

  return mapRowToAnnotation(row);
}

/**
 * 获取文档的所有标注
 */
export function getAnnotationsByDocument(
  documentPath: string, 
  type?: AnnotationType,
  includeUnapproved: boolean = false
): Annotation[] {
  const db = getDatabase();
  
  let sql = `
    SELECT * FROM annotations 
    WHERE document_path = ? AND is_deleted = 0
  `;
  
  const params: any[] = [documentPath];

  if (type) {
    sql += ' AND annotation_type = ?';
    params.push(type);
  }
  
  if (!includeUnapproved) {
    sql += ' AND is_approved = 1';
  }
  
  sql += ' ORDER BY created_at ASC';

  const stmt = db.prepare(sql);
  const rows = stmt.all(...params) as any[];

  return rows.map(mapRowToAnnotation);
}

/**
 * 获取用户的标注
 */
export function getAnnotationsByUser(
  authorName: string,
  type?: AnnotationType
): Annotation[] {
  const db = getDatabase();
  
  let sql = `
    SELECT * FROM annotations 
    WHERE author_name = ? AND is_deleted = 0
  `;
  
  const params: any[] = [authorName];

  if (type) {
    sql += ' AND annotation_type = ?';
    params.push(type);
  }
  
  sql += ' ORDER BY created_at DESC';

  const stmt = db.prepare(sql);
  const rows = stmt.all(...params) as any[];

  return rows.map(mapRowToAnnotation);
}

/**
 * 更新标注
 */
export function updateAnnotation(id: string, request: UpdateAnnotationRequest): boolean {
  const db = getDatabase();
  
  const updates: string[] = ['updated_at = ?'];
  const values: any[] = [new Date().toISOString()];

  if (request.commentText !== undefined) {
    updates.push('comment_text = ?');
    values.push(request.commentText);
  }

  if (request.isApproved !== undefined) {
    updates.push('is_approved = ?');
    values.push(request.isApproved ? 1 : 0);
  }

  if (request.isResolved !== undefined) {
    updates.push('is_resolved = ?');
    values.push(request.isResolved ? 1 : 0);
  }

  if (request.tags !== undefined) {
    updates.push('tags = ?');
    values.push(request.tags ? JSON.stringify(request.tags) : null);
  }

  if (request.color !== undefined) {
    updates.push('color = ?');
    values.push(request.color);
  }

  if (request.metadata !== undefined) {
    updates.push('metadata = ?');
    values.push(request.metadata ? JSON.stringify(request.metadata) : null);
  }

  values.push(id);

  const sql = `UPDATE annotations SET ${updates.join(', ')} WHERE id = ?`;
  const result = db.prepare(sql).run(...values);

  if (result.changes > 0) {
    log.info('更新标注', { id });
    return true;
  }

  return false;
}

/**
 * 删除标注（软删除）
 */
export function deleteAnnotation(id: string): boolean {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    UPDATE annotations 
    SET is_deleted = 1, updated_at = ? 
    WHERE id = ?
  `);

  const result = stmt.run(new Date().toISOString(), id);

  if (result.changes > 0) {
    log.info('删除标注', { id });
    return true;
  }

  return false;
}

/**
 * 点赞标注
 */
export function likeAnnotation(id: string): boolean {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    UPDATE annotations 
    SET likes = likes + 1, updated_at = ? 
    WHERE id = ? AND is_deleted = 0
  `);

  const result = stmt.run(new Date().toISOString(), id);

  if (result.changes > 0) {
    log.info('点赞标注', { id });
    return true;
  }

  return false;
}

/**
 * 搜索标注
 */
export function searchAnnotations(
  query: string,
  type?: AnnotationType,
  documentPath?: string
): Annotation[] {
  const db = getDatabase();
  
  let sql = `
    SELECT * FROM annotations 
    WHERE is_deleted = 0 AND is_approved = 1
    AND (selected_text LIKE ? OR comment_text LIKE ?)
  `;
  
  const params: any[] = [`%${query}%`, `%${query}%`];

  if (type) {
    sql += ' AND annotation_type = ?';
    params.push(type);
  }

  if (documentPath) {
    sql += ' AND document_path = ?';
    params.push(documentPath);
  }
  
  sql += ' ORDER BY created_at DESC';

  const stmt = db.prepare(sql);
  const rows = stmt.all(...params) as any[];

  return rows.map(mapRowToAnnotation);
}

/**
 * 获取标注统计信息
 */
export function getAnnotationStats(): {
  total: number;
  byType: { type: AnnotationType; count: number }[];
  byDocument: { documentPath: string; count: number }[];
  pending: number;
} {
  const db = getDatabase();

  // 总数统计
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM annotations WHERE is_deleted = 0');
  const total = (totalStmt.get() as any).count;

  // 按类型统计
  const byTypeStmt = db.prepare(`
    SELECT annotation_type, COUNT(*) as count 
    FROM annotations 
    WHERE is_deleted = 0 
    GROUP BY annotation_type
  `);
  const byType = byTypeStmt.all() as any[];

  // 按文档统计
  const byDocumentStmt = db.prepare(`
    SELECT document_path, COUNT(*) as count 
    FROM annotations 
    WHERE is_deleted = 0 
    GROUP BY document_path 
    ORDER BY count DESC
    LIMIT 10
  `);
  const byDocument = byDocumentStmt.all() as any[];

  // 待审核统计
  const pendingStmt = db.prepare('SELECT COUNT(*) as count FROM annotations WHERE is_approved = 0 AND is_deleted = 0');
  const pending = (pendingStmt.get() as any).count;

  return {
    total,
    byType: byType.map(row => ({
      type: row.annotation_type as AnnotationType,
      count: row.count
    })),
    byDocument: byDocument.map(row => ({
      documentPath: row.document_path,
      count: row.count
    })),
    pending
  };
}

/**
 * 将数据库行映射为标注对象
 */
function mapRowToAnnotation(row: any): Annotation {
  return {
    id: row.id,
    documentPath: row.document_path,
    annotationType: row.annotation_type as AnnotationType,
    selectedText: row.selected_text,
    commentText: row.comment_text,
    positionData: JSON.parse(row.position_data),
    authorName: row.author_name,
    authorEmail: row.author_email,
    authorRole: row.author_role,
    likes: row.likes,
    isApproved: Boolean(row.is_approved),
    isDeleted: Boolean(row.is_deleted),
    isResolved: Boolean(row.is_resolved),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    color: row.color
  };
}
