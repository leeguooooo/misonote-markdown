/**
 * 用户权限管理工具类
 * 处理社区版和企业版的用户权限验证
 */

import pool from './config';

// 权限类型定义
export enum Permission {
  // 文档权限
  DOCUMENT_VIEW = 'document.view',
  DOCUMENT_CREATE = 'document.create',
  DOCUMENT_EDIT = 'document.edit',
  DOCUMENT_DELETE = 'document.delete',
  DOCUMENT_SHARE = 'document.share',

  // 评论和标注权限
  COMMENT_CREATE = 'comment.create',
  COMMENT_EDIT = 'comment.edit',
  COMMENT_DELETE = 'comment.delete',
  COMMENT_MODERATE = 'comment.moderate',

  ANNOTATION_CREATE = 'annotation.create',
  ANNOTATION_EDIT = 'annotation.edit',
  ANNOTATION_DELETE = 'annotation.delete',

  // 用户管理权限
  USER_INVITE = 'user.invite',
  USER_MANAGE = 'user.manage',
  USER_DELETE = 'user.delete',

  // 组织和空间权限（企业版）
  ORG_MANAGE = 'org.manage',
  WORKSPACE_CREATE = 'workspace.create',
  WORKSPACE_MANAGE = 'workspace.manage',
  WORKSPACE_DELETE = 'workspace.delete',

  // 系统权限
  SYSTEM_ADMIN = 'system.admin',
  AUDIT_VIEW = 'audit.view',
  SETTINGS_MANAGE = 'settings.manage'
}

// 用户类型
export enum UserType {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

// 企业版角色类型
export enum EnterpriseRole {
  ORG_ADMIN = 'org_admin',
  SPACE_ADMIN = 'space_admin',
  EDITOR = 'editor',
  REVIEWER = 'reviewer',
  VIEWER = 'viewer'
}

// 权限检查结果
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  source: 'community' | 'enterprise' | 'document' | 'workspace';
}

/**
 * 用户权限管理器
 */
export class UserPermissionManager {

  /**
   * 检查用户是否有特定权限
   */
  static async checkPermission(
    userId: number,
    permission: Permission,
    resourceId?: string | number
  ): Promise<PermissionResult> {
    try {
      // 1. 获取用户基本信息
      const user = await this.getUserInfo(userId);
      if (!user) {
        return { allowed: false, reason: '用户不存在', source: 'community' };
      }

      // 2. 检查社区版权限
      const communityResult = await this.checkCommunityPermission(user, permission);
      if (communityResult.allowed) {
        return communityResult;
      }

      // 3. 检查企业版权限（如果启用）
      const enterpriseEnabled = await this.isEnterpriseEnabled();
      if (enterpriseEnabled) {
        const enterpriseResult = await this.checkEnterprisePermission(userId, permission, resourceId);
        if (enterpriseResult.allowed) {
          return enterpriseResult;
        }
      }

      return { allowed: false, reason: '权限不足', source: 'community' };
    } catch (error) {
      console.error('权限检查失败:', error);
      return { allowed: false, reason: '权限检查失败', source: 'community' };
    }
  }

  /**
   * 获取用户信息
   */
  private static async getUserInfo(userId: number) {
    const result = await pool.query(`
      SELECT id, username, user_type, account_status,
             can_comment, can_create_annotations, can_edit_documents
      FROM users
      WHERE id = $1 AND account_status = 'active'
    `, [userId]);

    return result.rows[0] || null;
  }

  /**
   * 检查社区版权限
   */
  private static async checkCommunityPermission(user: any, permission: Permission): Promise<PermissionResult> {
    // 管理员拥有所有权限
    if (user.user_type === UserType.ADMIN) {
      return { allowed: true, source: 'community' };
    }

    // 根据权限类型检查
    switch (permission) {
      case Permission.DOCUMENT_VIEW:
        return { allowed: true, source: 'community' }; // 所有用户都可以查看公开文档

      case Permission.DOCUMENT_CREATE:
      case Permission.DOCUMENT_EDIT:
      case Permission.DOCUMENT_DELETE:
        return {
          allowed: user.can_edit_documents,
          reason: user.can_edit_documents ? undefined : '无文档编辑权限',
          source: 'community'
        };

      case Permission.COMMENT_CREATE:
        return {
          allowed: user.can_comment,
          reason: user.can_comment ? undefined : '无评论权限',
          source: 'community'
        };

      case Permission.ANNOTATION_CREATE:
        return {
          allowed: user.can_create_annotations,
          reason: user.can_create_annotations ? undefined : '无标注权限',
          source: 'community'
        };

      case Permission.SYSTEM_ADMIN:
      case Permission.USER_MANAGE:
      case Permission.SETTINGS_MANAGE:
        return {
          allowed: false,
          reason: '需要管理员权限',
          source: 'community'
        };

      default:
        return { allowed: false, reason: '未知权限', source: 'community' };
    }
  }

  /**
   * 检查企业版权限
   */
  private static async checkEnterprisePermission(
    userId: number,
    permission: Permission,
    resourceId?: string | number
  ): Promise<PermissionResult> {
    try {
      // 获取用户的企业角色和权限
      const userRoles = await this.getUserEnterpriseRoles(userId);

      // 检查角色权限
      for (const role of userRoles) {
        if (this.roleHasPermission(role.permissions, permission)) {
          return { allowed: true, source: 'enterprise' };
        }
      }

      // 检查文档级别权限
      if (resourceId && this.isDocumentPermission(permission)) {
        const documentPermission = await this.getDocumentPermission(userId, resourceId);
        if (documentPermission && this.documentPermissionAllows(documentPermission, permission)) {
          return { allowed: true, source: 'document' };
        }
      }

      return { allowed: false, reason: '企业版权限不足', source: 'enterprise' };
    } catch (error) {
      console.error('企业版权限检查失败:', error);
      return { allowed: false, reason: '企业版权限检查失败', source: 'enterprise' };
    }
  }

  /**
   * 获取用户的企业角色
   */
  private static async getUserEnterpriseRoles(userId: number) {
    const result = await pool.query(`
      SELECT r.permissions, r.name, r.slug
      FROM user_organizations uo
      JOIN enterprise_roles r ON uo.role_id = r.id
      WHERE uo.user_id = $1 AND uo.status = 'active'
    `, [userId]);

    return result.rows;
  }

  /**
   * 检查角色是否有特定权限
   */
  private static roleHasPermission(permissions: string[], permission: Permission): boolean {
    return permissions.includes(permission);
  }

  /**
   * 检查是否为文档相关权限
   */
  private static isDocumentPermission(permission: Permission): boolean {
    return permission.startsWith('document.');
  }

  /**
   * 获取文档级别权限
   */
  private static async getDocumentPermission(userId: number, documentId: string | number) {
    const result = await pool.query(`
      SELECT permission_type
      FROM document_permissions
      WHERE user_id = $1 AND document_id = $2
    `, [userId, documentId]);

    return result.rows[0]?.permission_type || null;
  }

  /**
   * 检查文档权限是否允许特定操作
   */
  private static documentPermissionAllows(documentPermission: string, permission: Permission): boolean {
    const permissionHierarchy = {
      'owner': [Permission.DOCUMENT_VIEW, Permission.DOCUMENT_EDIT, Permission.DOCUMENT_DELETE, Permission.DOCUMENT_SHARE],
      'editor': [Permission.DOCUMENT_VIEW, Permission.DOCUMENT_EDIT],
      'viewer': [Permission.DOCUMENT_VIEW],
      'commenter': [Permission.DOCUMENT_VIEW, Permission.COMMENT_CREATE]
    };

    return permissionHierarchy[documentPermission as keyof typeof permissionHierarchy]?.includes(permission) || false;
  }

  /**
   * 检查企业版是否启用
   */
  private static async isEnterpriseEnabled(): Promise<boolean> {
    try {
      const result = await pool.query(`
        SELECT setting_value
        FROM system_settings
        WHERE setting_key = 'enterprise_enabled'
      `);

      return result.rows[0]?.setting_value === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取用户权限列表
   */
  static async getUserPermissions(userId: number): Promise<Permission[]> {
    const permissions: Permission[] = [];

    try {
      const user = await this.getUserInfo(userId);
      if (!user) return permissions;

      // 社区版权限
      if (user.user_type === UserType.ADMIN) {
        permissions.push(...Object.values(Permission));
      } else {
        if (user.can_comment) permissions.push(Permission.COMMENT_CREATE);
        if (user.can_create_annotations) permissions.push(Permission.ANNOTATION_CREATE);
        if (user.can_edit_documents) {
          permissions.push(Permission.DOCUMENT_CREATE, Permission.DOCUMENT_EDIT);
        }
        permissions.push(Permission.DOCUMENT_VIEW);
      }

      // 企业版权限
      const enterpriseEnabled = await this.isEnterpriseEnabled();
      if (enterpriseEnabled) {
        const userRoles = await this.getUserEnterpriseRoles(userId);
        for (const role of userRoles) {
          permissions.push(...role.permissions);
        }
      }

      // 去重
      return [...new Set(permissions)];
    } catch (error) {
      console.error('获取用户权限失败:', error);
      return permissions;
    }
  }
}

/**
 * 权限装饰器（用于API路由）
 */
export function requirePermission(permission: Permission, resourceIdParam?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args[0]; // 假设第一个参数是request对象
      const userId = req.user?.id;

      if (!userId) {
        throw new Error('用户未登录');
      }

      const resourceId = resourceIdParam ? req.params[resourceIdParam] : undefined;
      const result = await UserPermissionManager.checkPermission(userId, permission, resourceId);

      if (!result.allowed) {
        throw new Error(result.reason || '权限不足');
      }

      return method.apply(this, args);
    };

    return descriptor;
  };
}
