import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import {
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  UpdateOrganizationRequest
} from '@/core/services/organization-service';
import { checkPermission } from '@/core/services/permission-service';
import { log } from '@/core/logger';

/**
 * GET /api/organizations/[id]
 * 获取单个组织详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const organizationId = params.id;

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

    // 获取组织信息
    const organization = await getOrganizationById(organizationId);

    if (!organization) {
      return NextResponse.json(
        { error: '组织不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: organization
    });
  } catch (error) {
    log.error('获取组织详情失败:', error);
    return NextResponse.json(
      { error: '获取组织详情失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organizations/[id]
 * 更新组织信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const organizationId = params.id;

    // 检查权限
    const permission = await checkPermission(
      user.id,
      organizationId,
      'organization',
      'update'
    );

    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || '权限不足' },
        { status: 403 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { name, description, metadata } = body;

    // 构建更新请求
    const updateRequest: UpdateOrganizationRequest = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: '组织名称不能为空' },
          { status: 400 }
        );
      }
      updateRequest.name = name.trim();
    }

    if (description !== undefined) {
      updateRequest.description = description;
    }

    if (metadata !== undefined) {
      updateRequest.metadata = metadata;
    }

    // 更新组织
    const success = await updateOrganization(organizationId, updateRequest);

    if (!success) {
      return NextResponse.json(
        { error: '组织不存在或更新失败' },
        { status: 404 }
      );
    }

    // 获取更新后的组织信息
    const updatedOrganization = await getOrganizationById(organizationId);

    return NextResponse.json({
      success: true,
      data: updatedOrganization,
      message: '组织更新成功'
    });
  } catch (error) {
    log.error('更新组织失败:', error);
    return NextResponse.json(
      { error: '更新组织失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]
 * 删除组织
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const organizationId = params.id;

    // 检查权限 - 只有所有者可以删除组织
    const permission = await checkPermission(
      user.id,
      organizationId,
      'organization',
      'delete'
    );

    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || '只有组织所有者可以删除组织' },
        { status: 403 }
      );
    }

    // 删除组织
    const success = await deleteOrganization(organizationId);

    if (!success) {
      return NextResponse.json(
        { error: '组织不存在或删除失败' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '组织删除成功'
    });
  } catch (error) {
    log.error('删除组织失败:', error);
    return NextResponse.json(
      { error: '删除组织失败' },
      { status: 500 }
    );
  }
}