import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { 
  getApiKeyById, 
  updateApiKey, 
  deleteApiKey 
} from '@/lib/api-keys';

// GET - 获取单个 API 密钥信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员认证
    const user = authenticateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const apiKey = getApiKeyById(id);
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 密钥不存在' },
        { status: 404 }
      );
    }

    // 隐藏敏感信息
    const safeApiKey = {
      ...apiKey,
      keyHash: undefined,
    };

    return NextResponse.json({
      success: true,
      data: safeApiKey,
      message: 'API 密钥信息获取成功'
    });
  } catch (error) {
    console.error('获取 API 密钥信息失败:', error);
    return NextResponse.json(
      { error: '获取 API 密钥信息失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新 API 密钥
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员认证
    const user = authenticateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const updateData = await request.json();

    // 检查 API 密钥是否存在
    const existingApiKey = getApiKeyById(id);
    if (!existingApiKey) {
      return NextResponse.json(
        { error: 'API 密钥不存在' },
        { status: 404 }
      );
    }

    // 验证更新数据
    const updates: any = {};

    if (updateData.name !== undefined) {
      if (typeof updateData.name !== 'string' || updateData.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'API 密钥名称不能为空' },
          { status: 400 }
        );
      }
      updates.name = updateData.name.trim();
    }

    if (updateData.permissions !== undefined) {
      if (!Array.isArray(updateData.permissions)) {
        return NextResponse.json(
          { error: '权限必须是数组格式' },
          { status: 400 }
        );
      }
      updates.permissions = updateData.permissions;
    }

    if (updateData.isActive !== undefined) {
      updates.isActive = Boolean(updateData.isActive);
    }

    if (updateData.expiresAt !== undefined) {
      if (updateData.expiresAt) {
        const expiresAt = new Date(updateData.expiresAt);
        if (expiresAt <= new Date()) {
          return NextResponse.json(
            { error: '过期时间必须是未来时间' },
            { status: 400 }
          );
        }
        updates.expiresAt = expiresAt;
      } else {
        updates.expiresAt = undefined;
      }
    }

    if (updateData.rateLimit !== undefined) {
      if (updateData.rateLimit < 1 || updateData.rateLimit > 10000) {
        return NextResponse.json(
          { error: '速率限制必须在 1-10000 之间' },
          { status: 400 }
        );
      }
      updates.rateLimit = updateData.rateLimit;
    }

    if (updateData.description !== undefined) {
      updates.description = updateData.description?.trim();
    }

    const success = updateApiKey(id, updates);
    
    if (!success) {
      return NextResponse.json(
        { error: '更新 API 密钥失败' },
        { status: 500 }
      );
    }

    // 获取更新后的数据
    const updatedApiKey = getApiKeyById(id);
    const safeApiKey = {
      ...updatedApiKey,
      keyHash: undefined,
    };

    return NextResponse.json({
      success: true,
      data: safeApiKey,
      message: 'API 密钥更新成功'
    });
  } catch (error) {
    console.error('更新 API 密钥失败:', error);
    return NextResponse.json(
      { error: '更新 API 密钥失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除 API 密钥
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员认证
    const user = authenticateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    // 检查 API 密钥是否存在
    const existingApiKey = getApiKeyById(id);
    if (!existingApiKey) {
      return NextResponse.json(
        { error: 'API 密钥不存在' },
        { status: 404 }
      );
    }

    const success = deleteApiKey(id);
    
    if (!success) {
      return NextResponse.json(
        { error: '删除 API 密钥失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API 密钥删除成功'
    });
  } catch (error) {
    console.error('删除 API 密钥失败:', error);
    return NextResponse.json(
      { error: '删除 API 密钥失败' },
      { status: 500 }
    );
  }
}
