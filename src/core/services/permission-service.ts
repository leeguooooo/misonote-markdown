/**
 * 权限服务 - RBAC (基于角色的访问控制)
 * 使用 LRU 缓存优化性能
 */

import { LRUCache } from 'lru-cache';
import { pool } from '../../../lib/db/config';
import { log } from '../logger';
import { getUserRole, UserRole } from './organization-service';

// 资源类型
export type ResourceType = 'document' | 'workspace' | 'organization' | 'user' | 'api_key';

// 操作类型
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

// 权限结果
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

// 角色权限映射
const ROLE_PERMISSIONS: Record<UserRole, {
  resources: Record<ResourceType, Action[]>;
  inherits?: UserRole;
}> = {
  owner: {
    resources: {
      organization: ['create', 'read', 'update', 'delete', 'manage'],
      workspace: ['create', 'read', 'update', 'delete', 'manage'],
      document: ['create', 'read', 'update', 'delete', 'manage'],
      user: ['create', 'read', 'update', 'delete', 'manage'],
      api_key: ['create', 'read', 'update', 'delete', 'manage']
    }
  },
  admin: {
    resources: {
      organization: ['read', 'update'],
      workspace: ['create', 'read', 'update', 'delete'],
      document: ['create', 'read', 'update', 'delete'],
      user: ['create', 'read', 'update'],
      api_key: ['create', 'read', 'update', 'delete']
    },
    inherits: 'member'
  },
  member: {
    resources: {
      organization: ['read'],
      workspace: ['read'],
      document: ['create', 'read', 'update'],
      user: ['read'],
      api_key: ['read']
    },
    inherits: 'viewer'
  },
  viewer: {
    resources: {
      organization: ['read'],
      workspace: ['read'],
      document: ['read'],
      user: [],
      api_key: []
    }
  }
};

// LRU 缓存配置
const permissionCache = new LRUCache<string, PermissionResult>({
  max: 1000, // 最多缓存 1000 个权限检查结果
  ttl: 1000 * 60 * 5, // 5 分钟过期
});

/**
 * 检查用户权限
 */
export async function checkPermission(
  userId: number,
  organizationId: string,
  resource: ResourceType,
  action: Action
): Promise<PermissionResult> {
  // 构建缓存键
  const cacheKey = `${userId}:${organizationId}:${resource}:${action}`;
  
  // 检查缓存
  const cached = permissionCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    // 获取用户角色
    const userRole = await getUserRole(userId, organizationId);
    
    if (!userRole) {
      const result = { allowed: false, reason: '用户不属于该组织' };
      permissionCache.set(cacheKey, result);
      return result;
    }
    
    // 检查角色权限
    const allowed = hasRolePermission(userRole, resource, action);
    const result = {
      allowed,
      reason: allowed ? undefined : `角色 ${userRole} 没有 ${action} ${resource} 的权限`
    };
    
    // 缓存结果
    permissionCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    log.error('检查权限失败:', error);
    return { allowed: false, reason: '权限检查失败' };
  }
}

/**
 * 检查角色是否有指定权限
 */
function hasRolePermission(role: UserRole, resource: ResourceType, action: Action): boolean {
  const roleConfig = ROLE_PERMISSIONS[role];
  
  if (!roleConfig) {
    return false;
  }
  
  // 检查直接权限
  const actions = roleConfig.resources[resource] || [];
  if (actions.includes(action)) {
    return true;
  }
  
  // 检查继承的权限
  if (roleConfig.inherits) {
    return hasRolePermission(roleConfig.inherits, resource, action);
  }
  
  return false;
}

/**
 * 批量检查权限
 */
export async function checkPermissions(
  userId: number,
  organizationId: string,
  permissions: Array<{ resource: ResourceType; action: Action }>
): Promise<Record<string, PermissionResult>> {
  const results: Record<string, PermissionResult> = {};
  
  // 并行检查所有权限
  const checks = permissions.map(async ({ resource, action }) => {
    const key = `${resource}:${action}`;
    const result = await checkPermission(userId, organizationId, resource, action);
    results[key] = result;
  });
  
  await Promise.all(checks);
  
  return results;
}

/**
 * 清除用户的权限缓存
 */
export function clearUserPermissionCache(userId: number, organizationId?: string): void {
  const pattern = organizationId 
    ? `${userId}:${organizationId}:*`
    : `${userId}:*`;
  
  // 遍历缓存并删除匹配的键
  for (const key of permissionCache.keys()) {
    if (key.startsWith(pattern.replace('*', ''))) {
      permissionCache.delete(key);
    }
  }
  
  log.debug('清除用户权限缓存', { userId, organizationId });
}

/**
 * 清除所有权限缓存
 */
export function clearAllPermissionCache(): void {
  permissionCache.clear();
  log.info('清除所有权限缓存');
}

/**
 * 获取角色的所有权限
 */
export function getRolePermissions(role: UserRole): Record<ResourceType, Action[]> {
  const permissions: Record<ResourceType, Action[]> = {
    document: [],
    workspace: [],
    organization: [],
    user: [],
    api_key: []
  };
  
  // 递归收集权限
  function collectPermissions(currentRole: UserRole) {
    const roleConfig = ROLE_PERMISSIONS[currentRole];
    if (!roleConfig) return;
    
    // 合并当前角色的权限
    for (const [resource, actions] of Object.entries(roleConfig.resources)) {
      const resourceType = resource as ResourceType;
      const currentActions = permissions[resourceType] || [];
      const newActions = actions.filter(a => !currentActions.includes(a));
      permissions[resourceType] = [...currentActions, ...newActions];
    }
    
    // 递归处理继承的角色
    if (roleConfig.inherits) {
      collectPermissions(roleConfig.inherits);
    }
  }
  
  collectPermissions(role);
  
  return permissions;
}

/**
 * 验证资源所有权
 */
export async function checkResourceOwnership(
  userId: number,
  resourceType: ResourceType,
  resourceId: string
): Promise<boolean> {
  // 使用导入的pool
  
  try {
    let query: string;
    let params: any[];
    
    switch (resourceType) {
      case 'document':
        query = 'SELECT 1 FROM documents WHERE id = $1 AND user_id = $2';
        params = [resourceId, userId];
        break;
        
      case 'workspace':
        query = 'SELECT 1 FROM workspaces WHERE id = $1 AND owner_id = $2';
        params = [resourceId, userId];
        break;
        
      case 'api_key':
        query = 'SELECT 1 FROM api_keys WHERE id = $1 AND user_id = $2';
        params = [resourceId, userId];
        break;
        
      default:
        return false;
    }
    
    const result = await pool.query(query, params);
    return result.rows.length > 0;
  } catch (error) {
    log.error('检查资源所有权失败:', error);
    return false;
  }
}

/**
 * 创建权限中间件
 */
export function requirePermission(
  resource: ResourceType,
  action: Action
): (userId: number, organizationId: string) => Promise<void> {
  return async (userId: number, organizationId: string) => {
    const result = await checkPermission(userId, organizationId, resource, action);
    
    if (!result.allowed) {
      throw new Error(result.reason || '权限不足');
    }
  };
}

/**
 * 获取权限缓存统计信息
 */
export function getPermissionCacheStats() {
  return {
    size: permissionCache.size,
    calculatedSize: permissionCache.calculatedSize,
    maxSize: permissionCache.max,
    ttl: permissionCache.ttl
  };
}