/**
 * 系统设置管理模块
 */

import { getDatabase } from './database';
import { log } from '../logger';

export interface SystemSetting {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  updated_at?: string;
}

/**
 * 获取系统设置值
 */
export function getSystemSetting(key: string, defaultValue?: any): any {
  try {
    const db = getDatabase();
    const setting = db.prepare(`
      SELECT value, type FROM system_settings WHERE key = ?
    `).get(key) as { value: string; type: string } | undefined;

    if (!setting) {
      return defaultValue;
    }

    // 根据类型转换值
    switch (setting.type) {
      case 'boolean':
        return setting.value === 'true';
      case 'number':
        return parseFloat(setting.value);
      case 'json':
        try {
          return JSON.parse(setting.value);
        } catch {
          return defaultValue;
        }
      default:
        return setting.value;
    }
  } catch (error) {
    log.error(`获取系统设置失败: ${key}`, error);
    return defaultValue;
  }
}

/**
 * 设置系统设置值
 */
export function setSystemSetting(
  key: string, 
  value: any, 
  type: SystemSetting['type'] = 'string',
  description?: string
): boolean {
  try {
    const db = getDatabase();
    
    let valueStr = value;
    
    // 根据类型转换值为字符串
    switch (type) {
      case 'boolean':
        valueStr = value ? 'true' : 'false';
        break;
      case 'number':
        valueStr = value.toString();
        break;
      case 'json':
        valueStr = JSON.stringify(value);
        break;
      default:
        valueStr = String(value);
        break;
    }

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO system_settings (key, value, type, description, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(key, valueStr, type, description || '');
    
    log.info(`系统设置已更新: ${key} = ${valueStr}`);
    return true;
  } catch (error) {
    log.error(`设置系统设置失败: ${key}`, error);
    return false;
  }
}

/**
 * 获取所有系统设置
 */
export function getAllSystemSettings(): Record<string, SystemSetting> {
  try {
    const db = getDatabase();
    const settings = db.prepare(`
      SELECT key, value, type, description, updated_at 
      FROM system_settings 
      ORDER BY key
    `).all() as Array<{
      key: string;
      value: string;
      type: string;
      description: string;
      updated_at: string;
    }>;

    const result: Record<string, SystemSetting> = {};
    
    settings.forEach(setting => {
      let value: string | number | boolean | object | null = setting.value;
      
      // 根据类型转换值
      switch (setting.type) {
        case 'boolean':
          value = setting.value === 'true';
          break;
        case 'number':
          value = parseFloat(setting.value);
          break;
        case 'json':
          try {
            value = JSON.parse(setting.value);
          } catch {
            value = null;
          }
          break;
      }
      
      result[setting.key] = {
        key: setting.key,
        value,
        type: setting.type as SystemSetting['type'],
        description: setting.description,
        updated_at: setting.updated_at
      };
    });

    return result;
  } catch (error) {
    log.error('获取所有系统设置失败', error);
    return {};
  }
}

/**
 * 删除系统设置
 */
export function deleteSystemSetting(key: string): boolean {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`DELETE FROM system_settings WHERE key = ?`);
    const result = stmt.run(key);
    
    log.info(`系统设置已删除: ${key}`);
    return result.changes > 0;
  } catch (error) {
    log.error(`删除系统设置失败: ${key}`, error);
    return false;
  }
}

/**
 * 初始化默认系统设置
 */
export function initializeDefaultSettings(): void {
  const defaultSettings = [
    {
      key: 'site_name',
      value: 'Misonote Markdown',
      type: 'string' as const,
      description: '网站名称'
    },
    {
      key: 'site_description',
      value: '现代化的 Markdown 文档管理系统',
      type: 'string' as const,
      description: '网站描述'
    },
    {
      key: 'base_url',
      value: '',
      type: 'string' as const,
      description: '网站基础 URL（如：https://your-domain.com）'
    },
    {
      key: 'enable_comments',
      value: true,
      type: 'boolean' as const,
      description: '是否启用评论功能'
    },
    {
      key: 'enable_annotations',
      value: true,
      type: 'boolean' as const,
      description: '是否启用文档标注功能'
    },
    {
      key: 'max_file_size',
      value: 10,
      type: 'number' as const,
      description: '最大文件上传大小（MB）'
    },
    {
      key: 'mcp_webhook_enabled',
      value: false,
      type: 'boolean' as const,
      description: '是否启用 MCP Webhook 功能'
    },
    {
      key: 'mcp_webhook_secret',
      value: '',
      type: 'string' as const,
      description: 'MCP Webhook 签名密钥'
    }
  ];

  defaultSettings.forEach(setting => {
    // 只有当设置不存在时才创建
    const existing = getSystemSetting(setting.key);
    if (existing === undefined) {
      setSystemSetting(setting.key, setting.value, setting.type, setting.description);
    }
  });
}

// 便捷的设置获取函数
export const SystemSettings = {
  getSiteName: () => getSystemSetting('site_name', 'Misonote Markdown'),
  getSiteDescription: () => getSystemSetting('site_description', '现代化的 Markdown 文档管理系统'),
  getBaseUrl: () => getSystemSetting('base_url', ''),
  getEnableComments: () => getSystemSetting('enable_comments', true),
  getEnableAnnotations: () => getSystemSetting('enable_annotations', true),
  getMaxFileSize: () => getSystemSetting('max_file_size', 10),
  getMcpWebhookEnabled: () => getSystemSetting('mcp_webhook_enabled', false),
  getMcpWebhookSecret: () => getSystemSetting('mcp_webhook_secret', ''),
  
  setSiteName: (value: string) => setSystemSetting('site_name', value, 'string', '网站名称'),
  setSiteDescription: (value: string) => setSystemSetting('site_description', value, 'string', '网站描述'),
  setBaseUrl: (value: string) => setSystemSetting('base_url', value, 'string', '网站基础 URL'),
  setEnableComments: (value: boolean) => setSystemSetting('enable_comments', value, 'boolean', '是否启用评论功能'),
  setEnableAnnotations: (value: boolean) => setSystemSetting('enable_annotations', value, 'boolean', '是否启用文档标注功能'),
  setMaxFileSize: (value: number) => setSystemSetting('max_file_size', value, 'number', '最大文件上传大小（MB）'),
  setMcpWebhookEnabled: (value: boolean) => setSystemSetting('mcp_webhook_enabled', value, 'boolean', '是否启用 MCP Webhook 功能'),
  setMcpWebhookSecret: (value: string) => setSystemSetting('mcp_webhook_secret', value, 'string', 'MCP Webhook 签名密钥'),
};
