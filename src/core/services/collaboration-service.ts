/**
 * 协作服务 - 会话管理和 Yjs 持久化
 * 跟踪活动会话，管理用户状态，持久化 Yjs 更新
 */

import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../database/postgres-adapter';
import { log } from '../logger';
import * as Y from 'yjs';

// 协作会话接口
export interface CollaborationSession {
  id: string;
  documentId: string;
  userId: number;
  cursorPosition?: number;
  selection?: {
    start: number;
    end: number;
  };
  connectedAt: Date;
  lastHeartbeat: Date;
  isActive: boolean;
  metadata?: any;
}

// 创建会话请求
export interface CreateSessionRequest {
  documentId: string;
  userId: number;
  metadata?: any;
}

// 更新会话请求
export interface UpdateSessionRequest {
  cursorPosition?: number;
  selection?: {
    start: number;
    end: number;
  };
  metadata?: any;
}

// Yjs 更新数据
export interface YjsUpdate {
  id: number;
  documentId: string;
  updateData: Buffer;
  clientId?: string;
  createdAt: Date;
}

/**
 * 创建协作会话
 */
export async function createCollaborationSession(
  request: CreateSessionRequest
): Promise<CollaborationSession> {
  const pool = getPool();
  const id = uuidv4();
  
  try {
    // 先将该用户在此文档的其他会话设为非活动
    await pool.query(
      `UPDATE collaboration_sessions 
       SET is_active = false 
       WHERE user_id = $1 AND document_id = $2 AND is_active = true`,
      [request.userId, request.documentId]
    );
    
    // 创建新会话
    const result = await pool.query(
      `INSERT INTO collaboration_sessions 
       (id, document_id, user_id, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, request.documentId, request.userId, request.metadata || {}]
    );
    
    log.info('创建协作会话', {
      sessionId: id,
      documentId: request.documentId,
      userId: request.userId
    });
    
    return mapRowToSession(result.rows[0]);
  } catch (error) {
    log.error('创建协作会话失败:', error);
    throw error;
  }
}

/**
 * 更新会话信息
 */
export async function updateCollaborationSession(
  sessionId: string,
  request: UpdateSessionRequest
): Promise<boolean> {
  const pool = getPool();
  
  const updates: string[] = ['last_heartbeat = CURRENT_TIMESTAMP'];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (request.cursorPosition !== undefined) {
    updates.push(`cursor_position = $${paramIndex++}`);
    values.push(request.cursorPosition);
  }
  
  if (request.selection) {
    updates.push(`selection_start = $${paramIndex++}`);
    values.push(request.selection.start);
    updates.push(`selection_end = $${paramIndex++}`);
    values.push(request.selection.end);
  }
  
  if (request.metadata !== undefined) {
    updates.push(`metadata = $${paramIndex++}`);
    values.push(request.metadata);
  }
  
  values.push(sessionId);
  
  try {
    const result = await pool.query(
      `UPDATE collaboration_sessions 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} AND is_active = true`,
      values
    );
    
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    log.error('更新协作会话失败:', error);
    throw error;
  }
}

/**
 * 更新会话心跳
 */
export async function updateSessionHeartbeat(sessionId: string): Promise<boolean> {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `UPDATE collaboration_sessions 
       SET last_heartbeat = CURRENT_TIMESTAMP 
       WHERE id = $1 AND is_active = true`,
      [sessionId]
    );
    
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    log.error('更新会话心跳失败:', error);
    throw error;
  }
}

/**
 * 结束协作会话
 */
export async function endCollaborationSession(sessionId: string): Promise<boolean> {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `UPDATE collaboration_sessions 
       SET is_active = false 
       WHERE id = $1`,
      [sessionId]
    );
    
    if ((result.rowCount ?? 0) > 0) {
      log.info('结束协作会话', { sessionId });
    }
    
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    log.error('结束协作会话失败:', error);
    throw error;
  }
}

/**
 * 获取文档的活动会话
 */
export async function getActiveSessionsByDocument(
  documentId: string
): Promise<CollaborationSession[]> {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `SELECT * FROM collaboration_sessions 
       WHERE document_id = $1 AND is_active = true 
       ORDER BY connected_at DESC`,
      [documentId]
    );
    
    return result.rows.map(mapRowToSession);
  } catch (error) {
    log.error('获取文档活动会话失败:', error);
    throw error;
  }
}

/**
 * 获取用户的活动会话
 */
export async function getActiveSessionsByUser(
  userId: number
): Promise<CollaborationSession[]> {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `SELECT * FROM collaboration_sessions 
       WHERE user_id = $1 AND is_active = true 
       ORDER BY connected_at DESC`,
      [userId]
    );
    
    return result.rows.map(mapRowToSession);
  } catch (error) {
    log.error('获取用户活动会话失败:', error);
    throw error;
  }
}

/**
 * 清理非活动会话
 */
export async function cleanupInactiveSessions(): Promise<number> {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `UPDATE collaboration_sessions 
       SET is_active = false 
       WHERE last_heartbeat < NOW() - INTERVAL '5 minutes' 
       AND is_active = true`
    );
    
    if ((result.rowCount ?? 0) > 0) {
      log.info('清理非活动会话', { count: result.rowCount ?? 0 });
    }
    
    return result.rowCount ?? 0;
  } catch (error) {
    log.error('清理非活动会话失败:', error);
    throw error;
  }
}

/**
 * 保存 Yjs 更新
 */
export async function saveYjsUpdate(
  documentId: string,
  updateData: Uint8Array,
  clientId?: string
): Promise<void> {
  const pool = getPool();
  
  try {
    await pool.query(
      `INSERT INTO yjs_updates (document_id, update_data, client_id)
       VALUES ($1, $2, $3)`,
      [documentId, Buffer.from(updateData), clientId]
    );
    
    log.debug('保存 Yjs 更新', {
      documentId,
      updateSize: updateData.length,
      clientId
    });
  } catch (error) {
    log.error('保存 Yjs 更新失败:', error);
    throw error;
  }
}

/**
 * 获取文档的 Yjs 更新历史
 */
export async function getYjsUpdates(
  documentId: string,
  since?: Date
): Promise<YjsUpdate[]> {
  const pool = getPool();
  
  try {
    let query = `SELECT * FROM yjs_updates WHERE document_id = $1`;
    const params: any[] = [documentId];
    
    if (since) {
      query += ` AND created_at > $2`;
      params.push(since);
    }
    
    query += ` ORDER BY created_at ASC`;
    
    const result = await pool.query(query, params);
    
    return result.rows.map(row => ({
      id: row.id,
      documentId: row.document_id,
      updateData: row.update_data,
      clientId: row.client_id,
      createdAt: new Date(row.created_at)
    }));
  } catch (error) {
    log.error('获取 Yjs 更新历史失败:', error);
    throw error;
  }
}

/**
 * 合并并保存 Yjs 文档状态
 */
export async function mergeAndSaveYjsDocument(
  documentId: string,
  newUpdate: Uint8Array
): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 获取所有历史更新
    const updates = await getYjsUpdates(documentId);
    
    // 创建新的 Yjs 文档并应用所有更新
    const ydoc = new Y.Doc();
    
    // 应用历史更新
    updates.forEach(update => {
      Y.applyUpdate(ydoc, update.updateData);
    });
    
    // 应用新更新
    Y.applyUpdate(ydoc, newUpdate);
    
    // 获取完整的文档状态
    const fullState = Y.encodeStateAsUpdate(ydoc);
    
    // 清除旧更新
    await client.query(
      `DELETE FROM yjs_updates WHERE document_id = $1`,
      [documentId]
    );
    
    // 保存合并后的状态
    await client.query(
      `INSERT INTO yjs_updates (document_id, update_data, client_id)
       VALUES ($1, $2, 'merged')`,
      [documentId, Buffer.from(fullState)]
    );
    
    await client.query('COMMIT');
    
    log.info('合并并保存 Yjs 文档', {
      documentId,
      oldUpdatesCount: updates.length,
      mergedSize: fullState.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    log.error('合并 Yjs 文档失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 清理旧的 Yjs 更新
 */
export async function cleanupOldYjsUpdates(days: number = 7): Promise<number> {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `DELETE FROM yjs_updates 
       WHERE created_at < NOW() - INTERVAL '${days} days'`
    );
    
    if ((result.rowCount ?? 0) > 0) {
      log.info('清理旧 Yjs 更新', {
        count: result.rowCount ?? 0,
        days
      });
    }
    
    return result.rowCount ?? 0;
  } catch (error) {
    log.error('清理旧 Yjs 更新失败:', error);
    throw error;
  }
}

/**
 * 获取协作统计信息
 */
export async function getCollaborationStats(): Promise<{
  activeSessions: number;
  uniqueUsers: number;
  activeDocuments: number;
}> {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as active_sessions,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT document_id) as active_documents
      FROM collaboration_sessions
      WHERE is_active = true
    `);
    
    const row = result.rows[0];
    
    return {
      activeSessions: parseInt(row.active_sessions),
      uniqueUsers: parseInt(row.unique_users),
      activeDocuments: parseInt(row.active_documents)
    };
  } catch (error) {
    log.error('获取协作统计信息失败:', error);
    throw error;
  }
}

/**
 * 将数据库行映射为会话对象
 */
function mapRowToSession(row: any): CollaborationSession {
  return {
    id: row.id,
    documentId: row.document_id,
    userId: row.user_id,
    cursorPosition: row.cursor_position,
    selection: row.selection_start && row.selection_end ? {
      start: row.selection_start,
      end: row.selection_end
    } : undefined,
    connectedAt: new Date(row.connected_at),
    lastHeartbeat: new Date(row.last_heartbeat),
    isActive: row.is_active,
    metadata: row.metadata
  };
}

// 定期清理任务
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * 启动定期清理任务
 */
export function startCleanupTasks(): void {
  // 每5分钟清理一次非活动会话
  cleanupInterval = setInterval(async () => {
    try {
      await cleanupInactiveSessions();
      // 每天清理一次旧的 Yjs 更新
      const now = new Date();
      if (now.getHours() === 2 && now.getMinutes() < 5) {
        await cleanupOldYjsUpdates();
      }
    } catch (error) {
      log.error('定期清理任务失败:', error);
    }
  }, 5 * 60 * 1000); // 5分钟
}

/**
 * 停止定期清理任务
 */
export function stopCleanupTasks(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// 进程退出时停止清理任务
process.on('exit', stopCleanupTasks);
process.on('SIGINT', stopCleanupTasks);
process.on('SIGTERM', stopCleanupTasks);
