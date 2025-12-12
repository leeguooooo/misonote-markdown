/**
 * 组织服务 - 多租户组织管理
 * 遵循现有服务模式，使用 PostgreSQL
 */

import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../../lib/db/config';
import { log } from '../logger';

// 组织接口
export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
}

// 工作区接口
export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
}

// 用户角色类型
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

// 用户组织角色接口
export interface UserOrganizationRole {
  userId: number;
  organizationId: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// 创建组织请求
export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  ownerId: number;
  metadata?: any;
}

// 更新组织请求
export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  metadata?: any;
}

// 创建工作区请求
export interface CreateWorkspaceRequest {
  organizationId: string;
  name: string;
  description?: string;
  ownerId: number;
}

/**
 * 创建组织
 */
export async function createOrganization(request: CreateOrganizationRequest): Promise<Organization> {
  // 使用导入的pool
  const id = uuidv4();
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 创建组织
    const orgResult = await client.query(
      `INSERT INTO organizations (id, name, description, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, request.name, request.description || null, request.metadata || {}]
    );
    
    // 分配所有者角色
    const roleId = uuidv4();
    await client.query(
      `INSERT INTO user_organization_roles (id, user_id, organization_id, role)
       VALUES ($1, $2, $3, 'owner')`,
      [roleId, request.ownerId, id]
    );
    
    await client.query('COMMIT');
    
    log.info('创建组织', {
      id,
      name: request.name,
      ownerId: request.ownerId
    });
    
    return mapRowToOrganization(orgResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    log.error('创建组织失败:', error);
    throw new Error('创建组织失败');
  } finally {
    client.release();
  }
}

/**
 * 根据ID获取组织
 */
export async function getOrganizationById(id: string): Promise<Organization | null> {
  // 使用导入的pool
  
  try {
    const result = await pool.query(
      'SELECT * FROM organizations WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return mapRowToOrganization(result.rows[0]);
  } catch (error) {
    log.error('获取组织失败:', error);
    throw error;
  }
}

/**
 * 获取用户的所有组织
 */
export async function getOrganizationsByUser(userId: number): Promise<Organization[]> {
  // 使用导入的pool
  
  try {
    const result = await pool.query(
      `SELECT o.* FROM organizations o
       INNER JOIN user_organization_roles uor ON o.id = uor.organization_id
       WHERE uor.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );
    
    return result.rows.map(mapRowToOrganization);
  } catch (error) {
    log.error('获取用户组织失败:', error);
    throw error;
  }
}

/**
 * 更新组织
 */
export async function updateOrganization(
  id: string, 
  request: UpdateOrganizationRequest
): Promise<boolean> {
  // 使用导入的pool
  
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (request.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(request.name);
  }
  
  if (request.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(request.description);
  }
  
  if (request.metadata !== undefined) {
    updates.push(`metadata = $${paramIndex++}`);
    values.push(request.metadata);
  }
  
  if (updates.length === 0) {
    return false;
  }
  
  values.push(id);
  
  try {
    const result = await pool.query(
      `UPDATE organizations SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    log.error('更新组织失败:', error);
    throw error;
  }
}

/**
 * 删除组织
 */
export async function deleteOrganization(id: string): Promise<boolean> {
  // 使用导入的pool
  
  try {
    const result = await pool.query(
      'DELETE FROM organizations WHERE id = $1',
      [id]
    );
    
    if ((result.rowCount ?? 0) > 0) {
      log.info('删除组织', { id });
    }
    
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    log.error('删除组织失败:', error);
    throw error;
  }
}

/**
 * 创建工作区
 */
export async function createWorkspace(request: CreateWorkspaceRequest): Promise<Workspace> {
  // 使用导入的pool
  
  try {
    const result = await pool.query(
      `INSERT INTO workspaces (name, description, owner_id, organization_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [request.name, request.description || null, request.ownerId, request.organizationId]
    );
    
    log.info('创建工作区', {
      id: result.rows[0].id,
      name: request.name,
      organizationId: request.organizationId
    });
    
    return mapRowToWorkspace(result.rows[0]);
  } catch (error) {
    log.error('创建工作区失败:', error);
    throw error;
  }
}

/**
 * 获取组织的所有工作区
 */
export async function getWorkspacesByOrganization(organizationId: string): Promise<Workspace[]> {
  // 使用导入的pool
  
  try {
    const result = await pool.query(
      `SELECT * FROM workspaces 
       WHERE organization_id = $1 
       ORDER BY created_at DESC`,
      [organizationId]
    );
    
    return result.rows.map(mapRowToWorkspace);
  } catch (error) {
    log.error('获取组织工作区失败:', error);
    throw error;
  }
}

/**
 * 分配用户角色
 */
export async function assignUserRole(
  userId: number,
  organizationId: string,
  role: UserRole
): Promise<boolean> {
  // 使用导入的pool
  const id = uuidv4();
  
  try {
    // 使用 UPSERT 模式更新或插入角色
    const result = await pool.query(
      `INSERT INTO user_organization_roles (id, user_id, organization_id, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, organization_id) 
       DO UPDATE SET role = EXCLUDED.role`,
      [id, userId, organizationId, role]
    );
    
    log.info('分配用户角色', {
      userId,
      organizationId,
      role
    });
    
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    log.error('分配用户角色失败:', error);
    throw error;
  }
}

/**
 * 移除用户角色
 */
export async function removeUserRole(
  userId: number,
  organizationId: string
): Promise<boolean> {
  // 使用导入的pool
  
  try {
    const result = await pool.query(
      `DELETE FROM user_organization_roles 
       WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    
    if ((result.rowCount ?? 0) > 0) {
      log.info('移除用户角色', {
        userId,
        organizationId
      });
    }
    
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    log.error('移除用户角色失败:', error);
    throw error;
  }
}

/**
 * 获取用户在组织中的角色
 */
export async function getUserRole(
  userId: number,
  organizationId: string
): Promise<UserRole | null> {
  // 使用导入的pool
  
  try {
    const result = await pool.query(
      `SELECT role FROM user_organization_roles 
       WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].role as UserRole;
  } catch (error) {
    log.error('获取用户角色失败:', error);
    throw error;
  }
}

/**
 * 获取组织的所有用户
 */
export async function getOrganizationUsers(organizationId: string): Promise<UserOrganizationRole[]> {
  // 使用导入的pool
  
  try {
    const result = await pool.query(
      `SELECT user_id, organization_id, role, created_at, updated_at
       FROM user_organization_roles 
       WHERE organization_id = $1
       ORDER BY created_at ASC`,
      [organizationId]
    );
    
    return result.rows.map(row => ({
      userId: row.user_id,
      organizationId: row.organization_id,
      role: row.role as UserRole,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  } catch (error) {
    log.error('获取组织用户失败:', error);
    throw error;
  }
}

/**
 * 将数据库行映射为组织对象
 */
function mapRowToOrganization(row: any): Organization {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    metadata: row.metadata
  };
}

/**
 * 将数据库行映射为工作区对象
 */
function mapRowToWorkspace(row: any): Workspace {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    ownerId: row.owner_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}
