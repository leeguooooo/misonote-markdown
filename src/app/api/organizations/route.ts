import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import {
  createOrganization,
  getOrganizationsByUser,
  CreateOrganizationRequest
} from '@/core/services/organization-service';
import { log } from '@/core/logger';

/**
 * GET /api/organizations
 * 获取当前用户的所有组织
 */
export async function GET(request: NextRequest) {
  try {
    // 验证认证
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const numericUserId = Number(user.id);
    if (!Number.isFinite(numericUserId)) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0
      });
    }

    // 获取用户的组织列表
    const organizations = await getOrganizationsByUser(numericUserId);

    return NextResponse.json({
      success: true,
      data: organizations,
      total: organizations.length
    });
  } catch (error) {
    log.error('获取组织列表失败:', error);
    return NextResponse.json(
      { error: '获取组织列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations
 * 创建新组织
 */
export async function POST(request: NextRequest) {
  try {
    // 验证认证
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { name, description, metadata } = body;

    // 验证必填字段
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '组织名称不能为空' },
        { status: 400 }
      );
    }

    const numericUserId = Number(user.id);
    if (!Number.isFinite(numericUserId)) {
      return NextResponse.json(
        { error: '用户ID无效，无法创建组织' },
        { status: 400 }
      );
    }

    // 创建组织请求
    const createRequest: CreateOrganizationRequest = {
      name: name.trim(),
      description: description || undefined,
      ownerId: numericUserId,
      metadata: metadata || {}
    };

    // 创建组织
    const organization = await createOrganization(createRequest);

    return NextResponse.json({
      success: true,
      data: organization,
      message: '组织创建成功'
    });
  } catch (error) {
    log.error('创建组织失败:', error);
    return NextResponse.json(
      { error: '创建组织失败' },
      { status: 500 }
    );
  }
}
