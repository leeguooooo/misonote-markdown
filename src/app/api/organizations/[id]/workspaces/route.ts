import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import {
  createWorkspace,
  getWorkspacesByOrganization,
  CreateWorkspaceRequest
} from '@/core/services/organization-service';
import { checkPermission } from '@/core/services/permission-service';
import { log } from '@/core/logger';

/**
 * GET /api/organizations/[id]/workspaces
 * 获取组织的工作区列表
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
      'workspace',
      'read'
    );

    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || '权限不足' },
        { status: 403 }
      );
    }

    // 获取工作区列表
    const workspaces = await getWorkspacesByOrganization(organizationId);

    return NextResponse.json({
      success: true,
      data: workspaces,
      total: workspaces.length
    });
  } catch (error) {
    log.error('获取工作区列表失败:', error);
    return NextResponse.json(
      { error: '获取工作区列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[id]/workspaces
 * 创建新工作区
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

    // 检查权限
    const permission = await checkPermission(
      user.id,
      organizationId,
      'workspace',
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
    const { name, description } = body;

    // 验证必填字段
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '工作区名称不能为空' },
        { status: 400 }
      );
    }

    const numericUserId = Number(user.id);
    if (!Number.isFinite(numericUserId)) {
      return NextResponse.json(
        { error: '用户ID无效，无法创建工作区' },
        { status: 400 }
      );
    }

    // 创建工作区请求
    const createRequest: CreateWorkspaceRequest = {
      organizationId,
      name: name.trim(),
      description: description || undefined,
      ownerId: numericUserId
    };

    // 创建工作区
    const workspace = await createWorkspace(createRequest);

    return NextResponse.json({
      success: true,
      data: workspace,
      message: '工作区创建成功'
    });
  } catch (error) {
    log.error('创建工作区失败:', error);
    return NextResponse.json(
      { error: '创建工作区失败' },
      { status: 500 }
    );
  }
}
