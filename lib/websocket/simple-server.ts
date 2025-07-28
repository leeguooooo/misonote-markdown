/**
 * 简化的 WebSocket 服务器 - 实时协作
 * 集成 Yjs 和 JWT 认证
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import * as Y from 'yjs';
import jwt from 'jsonwebtoken';

// WebSocket 连接元数据
interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  documentId?: string;
  organizationId?: string;
  isAlive?: boolean;
  ydoc?: Y.Doc;
}

// 房间管理
const rooms = new Map<string, Set<AuthenticatedWebSocket>>();
const documents = new Map<string, Y.Doc>();

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
      console.error('WebSocket 认证失败:', error);
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

// 获取或创建文档
function getYDoc(documentId: string): Y.Doc {
  if (!documents.has(documentId)) {
    const doc = new Y.Doc();
    documents.set(documentId, doc);
    
    // 监听文档更新，广播给房间内的所有客户端
    doc.on('update', (update: Uint8Array) => {
      broadcastToRoom(documentId, update);
    });
  }
  
  return documents.get(documentId)!;
}

// 加入房间
function joinRoom(documentId: string, ws: AuthenticatedWebSocket) {
  if (!rooms.has(documentId)) {
    rooms.set(documentId, new Set());
  }
  
  rooms.get(documentId)!.add(ws);
  
  // 发送当前文档状态
  const ydoc = getYDoc(documentId);
  const state = Y.encodeStateAsUpdate(ydoc);
  
  if (state.length > 0) {
    ws.send(state);
  }
}

// 离开房间
function leaveRoom(documentId: string, ws: AuthenticatedWebSocket) {
  const room = rooms.get(documentId);
  if (room) {
    room.delete(ws);
    
    // 如果房间为空，清理文档
    if (room.size === 0) {
      rooms.delete(documentId);
      documents.delete(documentId);
    }
  }
}

// 广播到房间
function broadcastToRoom(documentId: string, data: Uint8Array) {
  const room = rooms.get(documentId);
  if (!room) return;
  
  room.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
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
  ws.ydoc = getYDoc(documentId);
  
  console.log('WebSocket 连接建立', {
    userId,
    documentId,
    ip: req.socket.remoteAddress
  });
  
  // 加入房间
  joinRoom(documentId, ws);
  
  // 处理消息
  ws.on('message', (data: Buffer) => {
    try {
      // 应用 Yjs 更新
      Y.applyUpdate(ws.ydoc!, new Uint8Array(data));
    } catch (error) {
      console.error('处理 Yjs 更新失败:', error);
    }
  });
  
  // 处理连接关闭
  ws.on('close', () => {
    console.log('WebSocket 连接关闭', { userId, documentId });
    leaveRoom(documentId, ws);
  });
  
  // 处理错误
  ws.on('error', (error) => {
    console.error('WebSocket 错误:', error);
    leaveRoom(documentId, ws);
  });
  
  // 心跳检测
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

// 心跳检测
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws: AuthenticatedWebSocket) => {
    if (ws.isAlive === false) {
      if (ws.documentId) {
        leaveRoom(ws.documentId, ws);
      }
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// 优雅关闭
process.on('SIGINT', () => {
  console.log('正在关闭 WebSocket 服务器...');
  clearInterval(heartbeat);
  
  wss.close(() => {
    console.log('WebSocket 服务器已关闭');
    process.exit(0);
  });
});

console.log(`🚀 WebSocket 服务器运行在端口 ${parseInt(process.env.WEBSOCKET_PORT || '3002')}`);
console.log('等待客户端连接...');

export { wss, getYDoc };