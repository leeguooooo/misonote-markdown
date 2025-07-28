/**
 * WebSocket 事件处理程序
 * 处理自定义协作事件
 */

import { WebSocket } from 'ws';
import { log } from '@/core/logger';

// 消息类型
export type MessageType = 
  | 'cursor-update'
  | 'selection-update'
  | 'user-presence'
  | 'sync-request'
  | 'typing-indicator'
  | 'save-status';

// 消息接口
export interface CollaborationMessage {
  type: MessageType;
  userId: number;
  documentId: string;
  data: any;
  timestamp: string;
}

// 光标位置数据
export interface CursorData {
  position: number;
  head?: {
    line: number;
    ch: number;
  };
}

// 选区数据
export interface SelectionData {
  anchor: {
    line: number;
    ch: number;
  };
  head: {
    line: number;
    ch: number;
  };
}

// 用户状态数据
export interface UserPresenceData {
  status: 'active' | 'idle' | 'away';
  lastActivity: string;
  metadata?: any;
}

// 处理协作消息
export function handleCollaborationMessage(
  ws: WebSocket,
  message: string,
  broadcast: (message: string, excludeWs?: WebSocket) => void
): void {
  try {
    const msg: CollaborationMessage = JSON.parse(message);
    
    switch (msg.type) {
      case 'cursor-update':
        handleCursorUpdate(ws, msg, broadcast);
        break;
        
      case 'selection-update':
        handleSelectionUpdate(ws, msg, broadcast);
        break;
        
      case 'user-presence':
        handleUserPresence(ws, msg, broadcast);
        break;
        
      case 'typing-indicator':
        handleTypingIndicator(ws, msg, broadcast);
        break;
        
      case 'save-status':
        handleSaveStatus(ws, msg, broadcast);
        break;
        
      default:
        log.warn('未知的协作消息类型', { type: msg.type });
    }
  } catch (error) {
    log.error('处理协作消息失败:', error);
  }
}

// 处理光标更新
function handleCursorUpdate(
  ws: WebSocket,
  msg: CollaborationMessage,
  broadcast: (message: string, excludeWs?: WebSocket) => void
): void {
  const cursorData = msg.data as CursorData;
  
  // 验证数据
  if (typeof cursorData.position !== 'number') {
    return;
  }
  
  // 广播给其他用户
  broadcast(JSON.stringify({
    type: 'cursor-update',
    userId: msg.userId,
    data: cursorData,
    timestamp: new Date().toISOString()
  }), ws);
  
  log.debug('光标更新', {
    userId: msg.userId,
    position: cursorData.position
  });
}

// 处理选区更新
function handleSelectionUpdate(
  ws: WebSocket,
  msg: CollaborationMessage,
  broadcast: (message: string, excludeWs?: WebSocket) => void
): void {
  const selectionData = msg.data as SelectionData;
  
  // 验证数据
  if (!selectionData.anchor || !selectionData.head) {
    return;
  }
  
  // 广播给其他用户
  broadcast(JSON.stringify({
    type: 'selection-update',
    userId: msg.userId,
    data: selectionData,
    timestamp: new Date().toISOString()
  }), ws);
  
  log.debug('选区更新', {
    userId: msg.userId,
    selection: selectionData
  });
}

// 处理用户状态
function handleUserPresence(
  ws: WebSocket,
  msg: CollaborationMessage,
  broadcast: (message: string, excludeWs?: WebSocket) => void
): void {
  const presenceData = msg.data as UserPresenceData;
  
  // 广播给所有用户（包括发送者）
  broadcast(JSON.stringify({
    type: 'user-presence',
    userId: msg.userId,
    data: presenceData,
    timestamp: new Date().toISOString()
  }));
  
  log.debug('用户状态更新', {
    userId: msg.userId,
    status: presenceData.status
  });
}

// 处理输入指示器
function handleTypingIndicator(
  ws: WebSocket,
  msg: CollaborationMessage,
  broadcast: (message: string, excludeWs?: WebSocket) => void
): void {
  const isTyping = msg.data.isTyping as boolean;
  
  // 广播给其他用户
  broadcast(JSON.stringify({
    type: 'typing-indicator',
    userId: msg.userId,
    data: { isTyping },
    timestamp: new Date().toISOString()
  }), ws);
  
  log.debug('输入指示器', {
    userId: msg.userId,
    isTyping
  });
}

// 处理保存状态
function handleSaveStatus(
  ws: WebSocket,
  msg: CollaborationMessage,
  broadcast: (message: string, excludeWs?: WebSocket) => void
): void {
  const saveData = msg.data as {
    status: 'saving' | 'saved' | 'error';
    message?: string;
  };
  
  // 广播给所有用户
  broadcast(JSON.stringify({
    type: 'save-status',
    userId: msg.userId,
    data: saveData,
    timestamp: new Date().toISOString()
  }));
  
  log.debug('保存状态更新', {
    userId: msg.userId,
    status: saveData.status
  });
}

// 创建广播函数
export function createBroadcastFunction(
  room: Set<WebSocket>
): (message: string, excludeWs?: WebSocket) => void {
  return (message: string, excludeWs?: WebSocket) => {
    room.forEach(ws => {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  };
}

// 发送错误消息
export function sendError(ws: WebSocket, error: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      error,
      timestamp: new Date().toISOString()
    }));
  }
}

// 发送系统消息
export function sendSystemMessage(ws: WebSocket, message: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'system',
      message,
      timestamp: new Date().toISOString()
    }));
  }
}