/**
 * 标注服务 - PostgreSQL 简化版本
 * 专注于解决构建问题
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/postgres-adapter';
import { log } from '../logger';

// 标注类型
export type AnnotationType = 'highlight' | 'note' | 'bookmark';

// 标注接口
export interface Annotation {
  id: string;
  documentPath: string;
  annotationType: AnnotationType;
  selectedText: string;
  commentText?: string;
  positionData: any;
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
  color?: string;
}

// 创建标注请求
export interface CreateAnnotationRequest {
  documentPath: string;
  annotationType: AnnotationType;
  selectedText: string;
  commentText?: string;
  positionData: any;
  authorName: string;
  authorEmail?: string;
  authorRole?: string;
  metadata?: any;
  tags?: string[];
  color?: string;
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
export async function createAnnotation(request: CreateAnnotationRequest): Promise<Annotation> {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date();

  // 根据类型设置默认颜色
  const defaultColor = request.annotationType === 'highlight' ? '#ffeb3b' :
                      request.annotationType === 'note' ? '#4caf50' : '#f44336';

  const stmt = db.prepare(`
    INSERT INTO annotations (
      id, document_path, annotation_type, selected_text, comment_text,
      position_data, author_name, author_email, author_role, likes,
      is_approved, is_deleted, is_resolved, created_at, updated_at,
      metadata, tags, color
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
  `);

  await stmt.run([
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
    true, // 所有标注默认自动审核通过
    false, // 未删除
    false, // 未解决
    now.toISOString(),
    now.toISOString(),
    request.metadata ? JSON.stringify(request.metadata) : null,
    request.tags ? JSON.stringify(request.tags) : null,
    request.color || defaultColor
  ]);

  log.info('创建标注', {
    id,
    type: request.annotationType,
    documentPath: request.documentPath,
    author: request.authorName
  });

  return (await getAnnotationById(id))!;
}

/**
 * 根据ID获取标注
 */
export async function getAnnotationById(id: string): Promise<Annotation | null> {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT * FROM annotations
    WHERE id = $1 AND is_deleted = false
  `);

  const row = await stmt.get([id]) as any;

  if (!row) return null;

  return mapRowToAnnotation(row);
}

/**
 * 获取文档的所有标注
 */
export async function getAnnotationsByDocument(
  documentPath: string,
  type?: AnnotationType,
  includeUnapproved: boolean = false
): Promise<Annotation[]> {
  const db = getDatabase();

  let sql = `
    SELECT * FROM annotations
    WHERE document_path = $1 AND is_deleted = false
  `;

  const params: any[] = [documentPath];
  let paramIndex = 2;

  if (type) {
    sql += ` AND annotation_type = $${paramIndex++}`;
    params.push(type);
  }

  if (!includeUnapproved) {
    sql += ' AND is_approved = true';
  }

  sql += ' ORDER BY created_at ASC';

  const stmt = db.prepare(sql);
  const rows = await stmt.all(params) as any[];

  return rows.map(mapRowToAnnotation);
}

/**
 * 获取用户的标注
 */
export async function getAnnotationsByUser(
  authorName: string,
  type?: AnnotationType
): Promise<Annotation[]> {
  const db = getDatabase();

  let sql = `
    SELECT * FROM annotations
    WHERE author_name = $1 AND is_deleted = false
  `;

  const params: any[] = [authorName];
  let paramIndex = 2;

  if (type) {
    sql += ` AND annotation_type = $${paramIndex++}`;
    params.push(type);
  }

  sql += ' ORDER BY created_at DESC';

  const stmt = db.prepare(sql);
  const rows = await stmt.all(params) as any[];

  return rows.map(mapRowToAnnotation);
}

/**
 * 更新标注
 */
export async function updateAnnotation(id: string, request: UpdateAnnotationRequest): Promise<boolean> {
  const db = getDatabase();

  const updates: string[] = ['updated_at = $1'];
  const values: any[] = [new Date().toISOString()];
  let paramIndex = 2;

  if (request.commentText !== undefined) {
    updates.push(`comment_text = $${paramIndex++}`);
    values.push(request.commentText);
  }

  if (request.isApproved !== undefined) {
    updates.push(`is_approved = $${paramIndex++}`);
    values.push(request.isApproved);
  }

  if (request.isResolved !== undefined) {
    updates.push(`is_resolved = $${paramIndex++}`);
    values.push(request.isResolved);
  }

  if (request.tags !== undefined) {
    updates.push(`tags = $${paramIndex++}`);
    values.push(request.tags ? JSON.stringify(request.tags) : null);
  }

  if (request.color !== undefined) {
    updates.push(`color = $${paramIndex++}`);
    values.push(request.color);
  }

  if (request.metadata !== undefined) {
    updates.push(`metadata = $${paramIndex++}`);
    values.push(request.metadata ? JSON.stringify(request.metadata) : null);
  }

  values.push(id);

  const sql = `UPDATE annotations SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
  const result = await db.prepare(sql).run(values);

  if (result.changes > 0) {
    log.info('更新标注', { id });
    return true;
  }

  return false;
}

/**
 * 删除标注（软删除）
 */
export async function deleteAnnotation(id: string): Promise<boolean> {
  const db = getDatabase();

  const stmt = db.prepare(`
    UPDATE annotations
    SET is_deleted = true, updated_at = $1
    WHERE id = $2
  `);

  const result = await stmt.run([new Date().toISOString(), id]);

  if (result.changes > 0) {
    log.info('删除标注', { id });
    return true;
  }

  return false;
}

/**
 * 点赞标注
 */
export async function likeAnnotation(id: string): Promise<boolean> {
  const db = getDatabase();

  const stmt = db.prepare(`
    UPDATE annotations
    SET likes = likes + 1, updated_at = $1
    WHERE id = $2 AND is_deleted = false
  `);

  const result = await stmt.run([new Date().toISOString(), id]);

  if (result.changes > 0) {
    log.info('点赞标注', { id });
    return true;
  }

  return false;
}

/**
 * 搜索标注
 */
export async function searchAnnotations(
  query: string,
  type?: AnnotationType,
  documentPath?: string
): Promise<Annotation[]> {
  const db = getDatabase();

  let sql = `
    SELECT * FROM annotations
    WHERE is_deleted = false AND is_approved = true
    AND (selected_text ILIKE $1 OR comment_text ILIKE $2)
  `;

  const params: any[] = [`%${query}%`, `%${query}%`];
  let paramIndex = 3;

  if (type) {
    sql += ` AND annotation_type = $${paramIndex++}`;
    params.push(type);
  }

  if (documentPath) {
    sql += ` AND document_path = $${paramIndex++}`;
    params.push(documentPath);
  }

  sql += ' ORDER BY created_at DESC';

  const stmt = db.prepare(sql);
  const rows = await stmt.all(params) as any[];

  return rows.map(mapRowToAnnotation);
}

/**
 * 获取标注统计信息
 */
export async function getAnnotationStats(): Promise<{
  total: number;
  byType: { type: AnnotationType; count: number }[];
  byDocument: { documentPath: string; count: number }[];
  pending: number;
}> {
  const db = getDatabase();

  // 总数统计
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM annotations WHERE is_deleted = false');
  const total = (await totalStmt.get() as any).count;

  // 按类型统计
  const byTypeStmt = db.prepare(`
    SELECT annotation_type, COUNT(*) as count
    FROM annotations
    WHERE is_deleted = false
    GROUP BY annotation_type
  `);
  const byType = await byTypeStmt.all() as any[];

  // 按文档统计
  const byDocumentStmt = db.prepare(`
    SELECT document_path, COUNT(*) as count
    FROM annotations
    WHERE is_deleted = false
    GROUP BY document_path
    ORDER BY count DESC
    LIMIT 10
  `);
  const byDocument = await byDocumentStmt.all() as any[];

  // 待审核统计
  const pendingStmt = db.prepare('SELECT COUNT(*) as count FROM annotations WHERE is_approved = false AND is_deleted = false');
  const pending = (await pendingStmt.get() as any).count;

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
    positionData: typeof row.position_data === 'string' ? JSON.parse(row.position_data) : row.position_data,
    authorName: row.author_name,
    authorEmail: row.author_email,
    authorRole: row.author_role,
    likes: row.likes,
    isApproved: Boolean(row.is_approved),
    isDeleted: Boolean(row.is_deleted),
    isResolved: Boolean(row.is_resolved),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
    tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : undefined,
    color: row.color
  };
}
