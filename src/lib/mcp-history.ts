/**
 * MCP 推送历史管理模块
 */

import fs from 'fs';
import path from 'path';
import { MCPPushHistory } from '@/types/mcp';
import { log } from './logger';

const MCP_HISTORY_FILE = path.join(process.cwd(), 'data', 'mcp-history.json');
const MAX_HISTORY_RECORDS = 100; // 最多保留 100 条历史记录

/**
 * 确保数据目录存在
 */
function ensureDataDirectory(): void {
  const dataDir = path.dirname(MCP_HISTORY_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    log.info('创建 MCP 历史数据目录: ' + dataDir);
  }
}

/**
 * 读取推送历史
 */
export function readMCPHistory(): MCPPushHistory[] {
  try {
    ensureDataDirectory();
    
    if (!fs.existsSync(MCP_HISTORY_FILE)) {
      return [];
    }

    const historyData = fs.readFileSync(MCP_HISTORY_FILE, 'utf8');
    const history = JSON.parse(historyData);
    
    // 确保是数组格式
    if (!Array.isArray(history)) {
      log.warn('MCP 历史数据格式错误，重置为空数组');
      return [];
    }

    // 按时间倒序排列
    return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    log.error('读取 MCP 推送历史失败', error);
    return [];
  }
}

/**
 * 写入推送历史
 */
export function writeMCPHistory(history: MCPPushHistory[]): void {
  try {
    ensureDataDirectory();
    
    // 限制历史记录数量
    const limitedHistory = history.slice(0, MAX_HISTORY_RECORDS);
    
    const historyData = JSON.stringify(limitedHistory, null, 2);
    fs.writeFileSync(MCP_HISTORY_FILE, historyData, 'utf8');
    
    log.debug('MCP 推送历史保存成功，记录数量: ' + limitedHistory.length);
  } catch (error) {
    log.error('保存 MCP 推送历史失败', error);
    throw new Error('保存 MCP 推送历史失败');
  }
}

/**
 * 添加推送历史记录
 */
export function addMCPHistoryRecord(record: Omit<MCPPushHistory, 'id' | 'timestamp'>): MCPPushHistory {
  const history = readMCPHistory();
  
  const newRecord: MCPPushHistory = {
    ...record,
    id: generateHistoryId(),
    timestamp: new Date(),
  };

  history.unshift(newRecord); // 添加到开头
  writeMCPHistory(history);
  
  log.info('添加 MCP 推送历史记录', {
    serverId: newRecord.serverId,
    operation: newRecord.operation,
    documentCount: newRecord.documentCount,
    status: newRecord.status,
  });
  
  return newRecord;
}

/**
 * 根据 ID 获取历史记录
 */
export function getMCPHistoryById(id: string): MCPPushHistory | null {
  const history = readMCPHistory();
  return history.find(record => record.id === id) || null;
}

/**
 * 获取指定服务器的推送历史
 */
export function getMCPHistoryByServerId(serverId: string): MCPPushHistory[] {
  const history = readMCPHistory();
  return history.filter(record => record.serverId === serverId);
}

/**
 * 获取最近的推送历史
 */
export function getRecentMCPHistory(limit: number = 20): MCPPushHistory[] {
  const history = readMCPHistory();
  return history.slice(0, limit);
}

/**
 * 删除历史记录
 */
export function deleteMCPHistoryRecord(id: string): boolean {
  const history = readMCPHistory();
  const index = history.findIndex(record => record.id === id);
  
  if (index === -1) {
    log.warn('MCP 推送历史记录不存在: ' + id);
    return false;
  }

  history.splice(index, 1);
  writeMCPHistory(history);
  
  log.info('删除 MCP 推送历史记录: ' + id);
  return true;
}

/**
 * 清理旧的历史记录
 */
export function cleanupOldMCPHistory(daysToKeep: number = 30): number {
  const history = readMCPHistory();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const filteredHistory = history.filter(record => 
    new Date(record.timestamp) > cutoffDate
  );
  
  const removedCount = history.length - filteredHistory.length;
  
  if (removedCount > 0) {
    writeMCPHistory(filteredHistory);
    log.info(`清理 MCP 推送历史记录: 删除 ${removedCount} 条记录`);
  }
  
  return removedCount;
}

/**
 * 获取推送统计信息
 */
export function getMCPPushStatistics(): {
  totalPushes: number;
  successfulPushes: number;
  failedPushes: number;
  totalDocuments: number;
  successfulDocuments: number;
  failedDocuments: number;
  serverStats: Record<string, {
    serverName: string;
    pushCount: number;
    successCount: number;
    documentCount: number;
  }>;
} {
  const history = readMCPHistory();
  
  const stats = {
    totalPushes: history.length,
    successfulPushes: 0,
    failedPushes: 0,
    totalDocuments: 0,
    successfulDocuments: 0,
    failedDocuments: 0,
    serverStats: {} as Record<string, any>,
  };

  history.forEach(record => {
    // 推送统计
    if (record.status === 'success') {
      stats.successfulPushes++;
    } else {
      stats.failedPushes++;
    }

    // 文档统计
    stats.totalDocuments += record.documentCount;
    stats.successfulDocuments += record.successCount;
    stats.failedDocuments += record.errorCount;

    // 服务器统计
    if (!stats.serverStats[record.serverId]) {
      stats.serverStats[record.serverId] = {
        serverName: record.serverName,
        pushCount: 0,
        successCount: 0,
        documentCount: 0,
      };
    }

    const serverStat = stats.serverStats[record.serverId];
    serverStat.pushCount++;
    serverStat.documentCount += record.documentCount;
    
    if (record.status === 'success') {
      serverStat.successCount++;
    }
  });

  return stats;
}

/**
 * 生成历史记录 ID
 */
function generateHistoryId(): string {
  return 'history_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 验证历史记录格式
 */
export function validateHistoryRecord(record: any): string[] {
  const errors: string[] = [];

  if (!record.serverId || typeof record.serverId !== 'string') {
    errors.push('服务器 ID 无效');
  }

  if (!record.serverName || typeof record.serverName !== 'string') {
    errors.push('服务器名称无效');
  }

  if (!['single', 'batch'].includes(record.operation)) {
    errors.push('操作类型无效');
  }

  if (typeof record.documentCount !== 'number' || record.documentCount < 0) {
    errors.push('文档数量无效');
  }

  if (typeof record.successCount !== 'number' || record.successCount < 0) {
    errors.push('成功数量无效');
  }

  if (typeof record.errorCount !== 'number' || record.errorCount < 0) {
    errors.push('错误数量无效');
  }

  if (!['success', 'partial', 'failed'].includes(record.status)) {
    errors.push('状态无效');
  }

  return errors;
}
