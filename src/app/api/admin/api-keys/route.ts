import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import { authenticateApiKey, checkApiPermission } from '@/core/api/api-auth';
import {
  createApiKey,
  getAllApiKeys,
  deleteApiKey,
  cleanupExpiredApiKeys,
  CreateApiKeyRequest
} from '@/core/api/api-keys';

/**
 * 验证管理员权限（支持 JWT token 和 API Key）
 */
async function authenticateAdmin(request: NextRequest): Promise<{ success: boolean; error?: string }> {
  // 首先尝试 JWT token 认证
  const user = authenticateRequest(request);
  if (user && user.role === 'admin') {
    return { success: true };
  }

  // 然后尝试 API Key 认证
  const apiAuthResult = await authenticateApiKey(request);
  if (apiAuthResult.success && apiAuthResult.apiKey) {
    // 检查是否有管理员权限
    if (checkApiPermission(apiAuthResult.apiKey, 'admin')) {
      return { success: true };
    }
    return { success: false, error: 'API Key 缺少管理员权限' };
  }

  return { success: false, error: '需要管理员权限' };
}

// GET - 获取所有 API 密钥
export async function GET(request: NextRequest) {
  try {
    // 验证管理员认证
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '需要管理员权限' },
        { status: 403 }
      );
    }

    const apiKeys = await getAllApiKeys();

    // 隐藏敏感信息
    const safeApiKeys = apiKeys.map(key => ({
      ...key,
      keyHash: undefined, // 不返回哈希值
      keyPrefix: key.keyPrefix, // 只显示前缀
    }));

    return NextResponse.json({
      success: true,
      data: safeApiKeys,
      total: safeApiKeys.length,
      message: 'API 密钥列表获取成功'
    });
  } catch (error) {
    console.error('获取 API 密钥列表失败:', error);
    return NextResponse.json(
      { error: '获取 API 密钥列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新的 API 密钥
export async function POST(request: NextRequest) {
  try {
    // 验证管理员认证
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '需要管理员权限' },
        { status: 403 }
      );
    }

    const requestData = await request.json();

    // 验证必需字段
    if (!requestData.name || typeof requestData.name !== 'string') {
      return NextResponse.json(
        { error: 'API 密钥名称不能为空' },
        { status: 400 }
      );
    }

    // 构建创建请求
    const createRequest: CreateApiKeyRequest = {
      name: requestData.name.trim(),
      permissions: requestData.permissions || ['read', 'write'],
      expiresAt: requestData.expiresAt ? new Date(requestData.expiresAt) : undefined,
      rateLimit: requestData.rateLimit || 1000,
      description: requestData.description?.trim(),
      createdBy: 'api-key-admin', // API Key 认证时使用默认值
    };

    // 验证权限格式
    if (!Array.isArray(createRequest.permissions)) {
      return NextResponse.json(
        { error: '权限必须是数组格式' },
        { status: 400 }
      );
    }

    // 验证过期时间
    if (createRequest.expiresAt && createRequest.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: '过期时间必须是未来时间' },
        { status: 400 }
      );
    }

    // 验证速率限制
    if (createRequest.rateLimit && (createRequest.rateLimit < 1 || createRequest.rateLimit > 10000)) {
      return NextResponse.json(
        { error: '速率限制必须在 1-10000 之间' },
        { status: 400 }
      );
    }

    const result = await createApiKey(createRequest);

    return NextResponse.json({
      success: true,
      data: {
        apiKey: {
          ...result.apiKey,
          keyHash: undefined, // 不返回哈希值
        },
        secretKey: result.secretKey, // 只在创建时返回一次
      },
      message: 'API 密钥创建成功'
    });
  } catch (error) {
    console.error('创建 API 密钥失败:', error);
    return NextResponse.json(
      { error: '创建 API 密钥失败' },
      { status: 500 }
    );
  }
}

// DELETE - 清理过期的 API 密钥
export async function DELETE(request: NextRequest) {
  try {
    // 验证管理员认证
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '需要管理员权限' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'cleanup') {
      // 清理过期的 API 密钥
      const cleanedCount = await cleanupExpiredApiKeys();

      return NextResponse.json({
        success: true,
        data: { cleanedCount },
        message: `清理了 ${cleanedCount} 个过期的 API 密钥`
      });
    }

    return NextResponse.json(
      { error: '无效的操作' },
      { status: 400 }
    );
  } catch (error) {
    console.error('清理 API 密钥失败:', error);
    return NextResponse.json(
      { error: '清理 API 密钥失败' },
      { status: 500 }
    );
  }
}
