import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { authenticateApiKey, checkApiPermission } from '@/lib/api-auth';
import { getDatabase } from '@/lib/database';

/**
 * 验证管理员权限（支持 JWT token 和 API Key）
 */
function authenticateAdmin(request: NextRequest): { success: boolean; error?: string } {
  // 首先尝试 JWT token 认证
  const user = authenticateRequest(request);
  if (user && user.role === 'admin') {
    return { success: true };
  }

  // 然后尝试 API Key 认证
  const apiAuthResult = authenticateApiKey(request);
  if (apiAuthResult.success && apiAuthResult.apiKey) {
    // 检查是否有管理员权限
    if (checkApiPermission(apiAuthResult.apiKey, 'admin')) {
      return { success: true };
    }
    return { success: false, error: 'API Key 缺少管理员权限' };
  }

  return { success: false, error: '需要管理员权限' };
}

// GET - 获取系统设置
export async function GET(request: NextRequest) {
  try {
    // 验证管理员认证
    const authResult = authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '需要管理员权限' },
        { status: 403 }
      );
    }

    const db = getDatabase();
    const settings = db.prepare(`
      SELECT key, value, type, description, updated_at 
      FROM system_settings 
      ORDER BY key
    `).all();

    // 转换为对象格式
    const settingsObj: Record<string, any> = {};
    settings.forEach((setting: any) => {
      let value = setting.value;
      
      // 根据类型转换值
      switch (setting.type) {
        case 'boolean':
          value = value === 'true';
          break;
        case 'number':
          value = parseFloat(value);
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch {
            value = null;
          }
          break;
        default:
          // string 类型保持原样
          break;
      }
      
      settingsObj[setting.key] = {
        value,
        type: setting.type,
        description: setting.description,
        updated_at: setting.updated_at
      };
    });

    return NextResponse.json({
      success: true,
      data: settingsObj
    });

  } catch (error) {
    console.error('获取系统设置失败:', error);
    return NextResponse.json(
      { error: '获取系统设置失败' },
      { status: 500 }
    );
  }
}

// POST - 更新系统设置
export async function POST(request: NextRequest) {
  try {
    // 验证管理员认证
    const authResult = authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '需要管理员权限' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: '无效的设置数据' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    // 开始事务
    const updateSetting = db.prepare(`
      INSERT OR REPLACE INTO system_settings (key, value, type, description, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const transaction = db.transaction((settingsToUpdate: Array<{key: string, value: any, type: string, description?: string}>) => {
      for (const setting of settingsToUpdate) {
        let valueStr = setting.value;
        
        // 根据类型转换值为字符串
        switch (setting.type) {
          case 'boolean':
            valueStr = setting.value ? 'true' : 'false';
            break;
          case 'number':
            valueStr = setting.value.toString();
            break;
          case 'json':
            valueStr = JSON.stringify(setting.value);
            break;
          default:
            valueStr = String(setting.value);
            break;
        }
        
        updateSetting.run(
          setting.key,
          valueStr,
          setting.type,
          setting.description || ''
        );
      }
    });

    // 准备更新的设置
    const settingsToUpdate = Object.entries(settings).map(([key, config]: [string, any]) => ({
      key,
      value: config.value,
      type: config.type || 'string',
      description: config.description || ''
    }));

    transaction(settingsToUpdate);

    return NextResponse.json({
      success: true,
      message: '系统设置更新成功',
      updated_count: settingsToUpdate.length
    });

  } catch (error) {
    console.error('更新系统设置失败:', error);
    return NextResponse.json(
      { error: '更新系统设置失败' },
      { status: 500 }
    );
  }
}
