import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import {
  getOrganizationUsers,
  assignUserRole,
  removeUserRole,
  UserRole
} from '@/core/services/organization-service';
import { checkPermission } from '@/core/services/permission-service';
import { log } from '@/core/logger';

/**
 * GET /api/organizations/[id]/members
 * 获取组织成员列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证认证
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { id: organizationId } = await params;

    // 检查权限
    const permission = await checkPermission(
      user.id,
      organizationId,
      'organization',
      'read'
    );

    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || '权限不足' },
        { status: 403 }
      );
    }

    // 获取组织成员
    const members = await getOrganizationUsers(organizationId);

    return NextResponse.json({
      success: true,
      data: members,
      total: members.length
    });
  } catch (error) {
    log.error('获取组织成员失败:', error);
    return NextResponse.json(
      { error: '获取组织成员失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[id]/members
 * 添加组织成员
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证认证
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { id: organizationId } = await params;

    // 检查权限 - 需要管理用户的权限
    const permission = await checkPermission(
      user.id,
      organizationId,
      'user',
      'create'
    );

    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || '权限不足' },
        { status: 403 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { userId, role } = body;

    // 验证参数
    if (!userId || typeof userId !== 'number') {
      return NextResponse.json(
        { error: '用户ID无效' },
        { status: 400 }
      );
    }

    const validRoles: UserRole[] = ['owner', 'admin', 'member', 'viewer'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: '角色无效，必须是: owner, admin, member, viewer' },
        { status: 400 }
      );
    }

    // 防止非所有者分配所有者角色
    if (role === 'owner') {
      const currentUserPermission = await checkPermission(
        user.id,
        organizationId,
        'organization',
        'manage'
      );
      
      if (!currentUserPermission.allowed) {
        return NextResponse.json(
          { error: '只有当前所有者可以分配所有者角色' },
          { status: 403 }
        );
      }
    }

    // 分配角色
    const success = await assignUserRole(userId, organizationId, role);

    if (!success) {
      return NextResponse.json(
        { error: '分配角色失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '成员添加成功'
    });
  } catch (error) {
    log.error('添加组织成员失败:', error);
    return NextResponse.json(
      { error: '添加组织成员失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]/members
 * 移除组织成员
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证认证
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { id: organizationId } = await params;

    // 检查权限
    const permission = await checkPermission(
      user.id,
      organizationId,
      'user',
      'delete'
    );

    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || '权限不足' },
        { status: 403 }
      );
    }

    // 获取要移除的用户ID
    const url = new URL(request.url);
    const userIdStr = url.searchParams.get('userId');
    
    if (!userIdStr) {
      return NextResponse.json(
        { error: '缺少用户ID参数' },
        { status: 400 }
      );
    }

    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: '用户ID无效' },
        { status: 400 }
      );
    }

    // 防止移除最后一个所有者
    const members = await getOrganizationUsers(organizationId);
    const owners = members.filter(m => m.role === 'owner');
    const isRemovingOwner = owners.some(o => o.userId === userId);
    
    if (isRemovingOwner && owners.length === 1) {
      return NextResponse.json(
        { error: '不能移除最后一个所有者' },
        { status: 400 }
      );
    }

    // 移除用户
    const success = await removeUserRole(userId, organizationId);

    if (!success) {
      return NextResponse.json(
        { error: '移除成员失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '成员移除成功'
    });
  } catch (error) {
    log.error('移除组织成员失败:', error);
    return NextResponse.json(
      { error: '移除组织成员失败' },
      { status: 500 }
    );
  }
}
