/**
 * WebSocket 服务器 - 实时协作
 * 集成 Yjs 和 JWT 认证
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import * as Y from 'yjs';
import { setupWSConnection } from 'y-websocket/dist/src/y-websocket.js';
import jwt from 'jsonwebtoken';
import { log } from '@/core/logger';

// WebSocket 连接元数据
interface ConnectionMetadata {
  userId: number;
  documentId: string;
  organizationId?: string;
  isAuthenticated: boolean;
}

// 扩展 WebSocket 类型
interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  documentId?: string;
  organizationId?: string;
  isAlive?: boolean;
}

// 房间管理
const rooms = new Map<string, Set<AuthenticatedWebSocket>>();

// 创建 WebSocket 服务器
const wss = new WebSocketServer({
  port: parseInt(process.env.WEBSOCKET_PORT || '3002'),
  verifyClient: async (info, cb) => {
    // 验证客户端连接
    const token = extractToken(info.req);
    
    if (!token) {
      cb(false, 401, 'Unauthorized');
      return;
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      // 将用户信息附加到请求对象
      (info.req as any).userId = decoded.sub || decoded.userId;
      cb(true);
    } catch (error) {
      log.error('WebSocket 认证失败:', error);
      cb(false, 401, 'Unauthorized');
    }
  }
});

// 提取认证令牌
function extractToken(req: IncomingMessage): string | null {
  // 从 Authorization 头提取
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 从查询参数提取（用于浏览器 WebSocket）
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  
  return token;
}

// 处理 WebSocket 连接
wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
  // 获取文档 ID
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const documentId = url.pathname.slice(1) || 'default';
  const userId = (req as any).userId;
  
  // 设置连接元数据
  ws.userId = userId;
  ws.documentId = documentId;
  ws.isAlive = true;
  
  log.info('WebSocket 连接建立', {
    userId,
    documentId,
    ip: req.socket.remoteAddress
  });
  
  // 加入房间
  joinRoom(documentId, ws);
  
  // 设置 Yjs 连接
  try {
    setupWSConnection(ws as WebSocket, req, {
      docName: documentId,
      gc: true,
    });
  } catch (error) {
    log.error('设置 Yjs 连接失败:', error);
    ws.close(1011, 'Yjs setup failed');
    return;
  }
  
  // 心跳检测
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  // 处理断开连接
  ws.on('close', () => {
    leaveRoom(documentId, ws);
    log.info('WebSocket 连接断开', {
      userId,
      documentId
    });
  });
  
  // 处理错误
  ws.on('error', (error) => {
    log.error('WebSocket 错误:', error);
  });
  
  // 通知其他用户有新用户加入
  broadcastUserJoined(documentId, userId, ws);
});

// 加入房间
function joinRoom(roomId: string, ws: AuthenticatedWebSocket): void {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  
  const room = rooms.get(roomId)!;
  room.add(ws);
  
  log.debug('用户加入房间', {
    roomId,
    userId: ws.userId,
    roomSize: room.size
  });
}

// 离开房间
function leaveRoom(roomId: string, ws: AuthenticatedWebSocket): void {
  const room = rooms.get(roomId);
  
  if (room) {
    room.delete(ws);
    
    // 如果房间为空，删除房间
    if (room.size === 0) {
      rooms.delete(roomId);
      
      // 可选：清理 Yjs 文档
      const ydoc = getYDoc(roomId, false);
      if (ydoc) {
        ydoc.destroy();
      }
    }
    
    // 通知其他用户有用户离开
    broadcastUserLeft(roomId, ws.userId!, ws);
  }
}

// 广播用户加入
function broadcastUserJoined(
  roomId: string, 
  userId: number, 
  excludeWs: AuthenticatedWebSocket
): void {
  const room = rooms.get(roomId);
  if (!room) return;
  
  const message = JSON.stringify({
    type: 'user-joined',
    userId,
    timestamp: new Date().toISOString()
  });
  
  room.forEach(ws => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// 广播用户离开
function broadcastUserLeft(
  roomId: string, 
  userId: number, 
  excludeWs: AuthenticatedWebSocket
): void {
  const room = rooms.get(roomId);
  if (!room) return;
  
  const message = JSON.stringify({
    type: 'user-left',
    userId,
    timestamp: new Date().toISOString()
  });
  
  room.forEach(ws => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// 获取房间内的用户列表
export function getRoomUsers(roomId: string): number[] {
  const room = rooms.get(roomId);
  if (!room) return [];
  
  const users: number[] = [];
  room.forEach(ws => {
    if (ws.userId && ws.readyState === WebSocket.OPEN) {
      users.push(ws.userId);
    }
  });
  
  return [...new Set(users)]; // 去重
}

// 心跳检测 - 每 30 秒检查一次
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws: WebSocket) => {
    const authWs = ws as AuthenticatedWebSocket;
    
    if (authWs.isAlive === false) {
      log.debug('终止无响应的连接', { userId: authWs.userId });
      return authWs.terminate();
    }
    
    authWs.isAlive = false;
    authWs.ping();
  });
}, 30000);

// 清理函数
wss.on('close', () => {
  clearInterval(heartbeatInterval);
  
  // 清理所有房间
  rooms.clear();
  
  log.info('WebSocket 服务器已关闭');
});

// 获取服务器统计信息
export function getServerStats() {
  const stats = {
    totalConnections: wss.clients.size,
    totalRooms: rooms.size,
    rooms: {} as Record<string, number>
  };
  
  rooms.forEach((room, roomId) => {
    stats.rooms[roomId] = room.size;
  });
  
  return stats;
}

// 启动日志
log.info('WebSocket 服务器启动', {
  port: process.env.WEBSOCKET_PORT || 3002
});

// 优雅关闭
process.on('SIGTERM', () => {
  log.info('收到 SIGTERM 信号，关闭 WebSocket 服务器');
  
  wss.close(() => {
    log.info('WebSocket 服务器已优雅关闭');
    process.exit(0);
  });
});

export default wss;