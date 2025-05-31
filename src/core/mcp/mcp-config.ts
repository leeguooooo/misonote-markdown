/**
 * MCP 配置管理模块
 */

import fs from 'fs';
import path from 'path';
import { MCPServerConfig, MCPConfigStorage } from '@/types/mcp';
import { log } from '../logger';

const MCP_CONFIG_FILE = path.join(process.cwd(), 'data', 'mcp-config.json');

// 默认配置
const DEFAULT_CONFIG: MCPConfigStorage = {
  servers: [],
  settings: {
    enableWebhooks: false,
    maxRetries: 3,
    retryDelay: 1000,
    connectionTimeout: 10000,
  },
  lastUpdated: new Date(),
};

/**
 * 确保数据目录存在
 */
function ensureDataDirectory(): void {
  const dataDir = path.dirname(MCP_CONFIG_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    log.info('创建 MCP 数据目录: ' + dataDir);
  }
}

/**
 * 读取 MCP 配置
 */
export function readMCPConfig(): MCPConfigStorage {
  try {
    ensureDataDirectory();
    
    if (!fs.existsSync(MCP_CONFIG_FILE)) {
      log.info('MCP 配置文件不存在，创建默认配置');
      writeMCPConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }

    const configData = fs.readFileSync(MCP_CONFIG_FILE, 'utf8');
    const config = JSON.parse(configData);
    
    // 确保配置结构完整
    const mergedConfig: MCPConfigStorage = {
      ...DEFAULT_CONFIG,
      ...config,
      settings: {
        ...DEFAULT_CONFIG.settings,
        ...config.settings,
      },
    };

    log.debug('读取 MCP 配置成功，服务器数量: ' + mergedConfig.servers.length);
    return mergedConfig;
  } catch (error) {
    log.error('读取 MCP 配置失败', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * 写入 MCP 配置
 */
export function writeMCPConfig(config: MCPConfigStorage): void {
  try {
    ensureDataDirectory();
    
    config.lastUpdated = new Date();
    const configData = JSON.stringify(config, null, 2);
    fs.writeFileSync(MCP_CONFIG_FILE, configData, 'utf8');
    
    log.info('MCP 配置保存成功');
  } catch (error) {
    log.error('保存 MCP 配置失败', error);
    throw new Error('保存 MCP 配置失败');
  }
}

/**
 * 获取所有 MCP 服务器配置
 */
export function getAllMCPServers(): MCPServerConfig[] {
  const config = readMCPConfig();
  return config.servers;
}

/**
 * 根据 ID 获取 MCP 服务器配置
 */
export function getMCPServerById(id: string): MCPServerConfig | null {
  const config = readMCPConfig();
  return config.servers.find(server => server.id === id) || null;
}

/**
 * 添加 MCP 服务器配置
 */
export function addMCPServer(serverConfig: Omit<MCPServerConfig, 'id' | 'createdAt' | 'updatedAt'>): MCPServerConfig {
  const config = readMCPConfig();
  
  const newServer: MCPServerConfig = {
    ...serverConfig,
    id: generateServerId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  config.servers.push(newServer);
  writeMCPConfig(config);
  
  log.info('添加 MCP 服务器: ' + newServer.name);
  return newServer;
}

/**
 * 更新 MCP 服务器配置
 */
export function updateMCPServer(id: string, updates: Partial<MCPServerConfig>): MCPServerConfig | null {
  const config = readMCPConfig();
  const serverIndex = config.servers.findIndex(server => server.id === id);
  
  if (serverIndex === -1) {
    log.warn('MCP 服务器不存在: ' + id);
    return null;
  }

  config.servers[serverIndex] = {
    ...config.servers[serverIndex],
    ...updates,
    updatedAt: new Date(),
  };

  writeMCPConfig(config);
  
  log.info('更新 MCP 服务器: ' + config.servers[serverIndex].name);
  return config.servers[serverIndex];
}

/**
 * 删除 MCP 服务器配置
 */
export function deleteMCPServer(id: string): boolean {
  const config = readMCPConfig();
  const serverIndex = config.servers.findIndex(server => server.id === id);
  
  if (serverIndex === -1) {
    log.warn('MCP 服务器不存在: ' + id);
    return false;
  }

  const serverName = config.servers[serverIndex].name;
  config.servers.splice(serverIndex, 1);
  writeMCPConfig(config);
  
  log.info('删除 MCP 服务器: ' + serverName);
  return true;
}

/**
 * 更新服务器连接状态
 */
export function updateServerConnectionStatus(
  id: string, 
  status: MCPServerConfig['connectionStatus'], 
  errorMessage?: string
): void {
  const updates: Partial<MCPServerConfig> = {
    connectionStatus: status,
    errorMessage,
  };

  if (status === 'connected') {
    updates.lastConnected = new Date();
    updates.errorMessage = undefined;
  }

  updateMCPServer(id, updates);
}

/**
 * 获取 MCP 设置
 */
export function getMCPSettings() {
  const config = readMCPConfig();
  return config.settings;
}

/**
 * 更新 MCP 设置
 */
export function updateMCPSettings(settings: Partial<MCPConfigStorage['settings']>): void {
  const config = readMCPConfig();
  config.settings = {
    ...config.settings,
    ...settings,
  };
  writeMCPConfig(config);
  
  log.info('更新 MCP 设置');
}

/**
 * 生成服务器 ID
 */
function generateServerId(): string {
  return 'mcp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 验证服务器配置
 */
export function validateServerConfig(config: Partial<MCPServerConfig>): string[] {
  const errors: string[] = [];

  if (!config.name || config.name.trim().length === 0) {
    errors.push('服务器名称不能为空');
  }

  if (!config.url || config.url.trim().length === 0) {
    errors.push('服务器地址不能为空');
  } else {
    try {
      new URL(config.url);
    } catch {
      errors.push('服务器地址格式无效');
    }
  }

  if (!config.apiKey || config.apiKey.trim().length === 0) {
    errors.push('API 密钥不能为空');
  }

  return errors;
}
