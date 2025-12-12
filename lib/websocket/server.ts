/**
 * WebSocket 服务器 - 实时协作
 * 使用 y-websocket 协议（sync + awareness），并在握手阶段做 JWT 认证。
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { log } from '@/core/logger';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  documentId?: string;
  isAlive?: boolean;
  awarenessStates?: Set<number>;
}

const COLLAB_TOKEN_SECRET = process.env.COLLAB_TOKEN_SECRET || process.env.JWT_SECRET || 'collab-secret';
const LEGACY_JWT_SECRET = process.env.JWT_SECRET;

const messageSync = 0;
const messageAwareness = 1;
const messageAuth = 2;
const messageQueryAwareness = 3;

type DocEntry = {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  conns: Set<AuthenticatedWebSocket>;
};

const docs = new Map<string, DocEntry>();

const wss = new WebSocketServer({
  port: parseInt(process.env.WEBSOCKET_PORT || '3002'),
  verifyClient: async (info, cb) => {
    const token = extractToken(info.req);
    if (!token) {
      cb(false, 401, 'Unauthorized');
      return;
    }

    const payload = verifyCollaborationToken(token);
    if (!payload) {
      cb(false, 401, 'Unauthorized');
      return;
    }

    (info.req as any).authPayload = payload;
    cb(true);
  }
});

function verifyWithSecret(secret: string | undefined, token: string): JwtPayload | null {
  if (!secret) return null;
  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'string') {
      return { sub: decoded };
    }
    return decoded;
  } catch {
    return null;
  }
}

function verifyCollaborationToken(token: string): { userId: string; documentId?: string } | null {
  const decoded = verifyWithSecret(COLLAB_TOKEN_SECRET, token);
  if (decoded) {
    const userId = decoded.userId ?? decoded.sub ?? decoded.id;
    if (userId == null) return null;
    return {
      userId: String(userId),
      documentId: (decoded as any).documentId,
    };
  }

  const legacy = verifyWithSecret(LEGACY_JWT_SECRET, token);
  if (legacy) {
    log.warn('使用 legacy JWT 令牌进行协作认证，请尽快迁移到短期协作令牌。');
    const userId = legacy.userId ?? legacy.sub ?? legacy.id;
    if (userId == null) return null;
    return { userId: String(userId) };
  }

  log.warn('协作令牌验证失败');
  return null;
}

function extractToken(req: IncomingMessage): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  return url.searchParams.get('token');
}

function getDoc(documentId: string): DocEntry {
  let entry = docs.get(documentId);
  if (entry) return entry;

  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);
  const conns = new Set<AuthenticatedWebSocket>();

  entry = { doc, awareness, conns };
  docs.set(documentId, entry);

  doc.on('update', (update: Uint8Array, origin: unknown) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);

    conns.forEach((conn) => {
      if (conn !== origin && conn.readyState === WebSocket.OPEN) {
        conn.send(message);
      }
    });
  });

  awareness.on('update', ({ added, updated, removed }: any, origin: unknown) => {
    const changed = added.concat(updated, removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, changed)
    );
    const message = encoding.toUint8Array(encoder);

    conns.forEach((conn) => {
      if (conn !== origin && conn.readyState === WebSocket.OPEN) {
        conn.send(message);
      }
    });
  });

  return entry;
}

function trackAwarenessStates(conn: AuthenticatedWebSocket, update: Uint8Array) {
  if (!conn.awarenessStates) return;
  const decoder = decoding.createDecoder(update);
  const len = decoding.readVarUint(decoder);
  for (let i = 0; i < len; i++) {
    const clientId = decoding.readVarUint(decoder);
    decoding.readVarUint(decoder); // clock
    const state = JSON.parse(decoding.readVarString(decoder));
    if (state === null) {
      conn.awarenessStates.delete(clientId);
    } else {
      conn.awarenessStates.add(clientId);
    }
  }
}

function setupWSConnection(conn: AuthenticatedWebSocket, req: IncomingMessage, documentId: string) {
  const { doc, awareness, conns } = getDoc(documentId);

  conn.documentId = documentId;
  conn.isAlive = true;
  conn.awarenessStates = new Set();
  conns.add(conn);

  // send sync step1
  {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    conn.send(encoding.toUint8Array(encoder));
  }

  // send current awareness states
  {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys()))
    );
    conn.send(encoding.toUint8Array(encoder));
  }

  conn.on('message', (data: Buffer) => {
    try {
      const decoder = decoding.createDecoder(new Uint8Array(data));
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case messageSync: {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, messageSync);
          syncProtocol.readSyncMessage(decoder, encoder, doc, conn);
          if (encoding.length(encoder) > 1) {
            conn.send(encoding.toUint8Array(encoder));
          }
          break;
        }
        case messageAwareness: {
          const update = decoding.readVarUint8Array(decoder);
          trackAwarenessStates(conn, update);
          awarenessProtocol.applyAwarenessUpdate(awareness, update, conn);
          break;
        }
        case messageQueryAwareness: {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, messageAwareness);
          encoding.writeVarUint8Array(
            encoder,
            awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys()))
          );
          conn.send(encoding.toUint8Array(encoder));
          break;
        }
        case messageAuth:
        default:
          break;
      }
    } catch (error) {
      log.error('处理 WebSocket 消息失败:', error);
    }
  });

  conn.on('pong', () => {
    conn.isAlive = true;
  });

  conn.on('close', () => {
    conns.delete(conn);
    if (conn.awarenessStates && conn.awarenessStates.size > 0) {
      awarenessProtocol.removeAwarenessStates(
        awareness,
        Array.from(conn.awarenessStates),
        conn
      );
    }

    if (conns.size === 0) {
      awareness.destroy();
      doc.destroy();
      docs.delete(documentId);
    }

    log.info('WebSocket 连接断开', { documentId, userId: conn.userId });
  });

  conn.on('error', (error) => {
    log.error('WebSocket 错误:', error);
  });

  log.info('WebSocket 连接建立', {
    documentId,
    userId: conn.userId,
    ip: req.socket.remoteAddress
  });
}

wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const documentId = url.pathname.slice(1) || 'default';
  const authPayload = (req as any).authPayload as { userId?: string; documentId?: string };

  if (authPayload?.userId == null) {
    ws.close(4401, 'Unauthorized');
    return;
  }

  if (authPayload.documentId && authPayload.documentId !== documentId) {
    log.warn('协作令牌与文档不匹配', {
      tokenDoc: authPayload.documentId,
      requestedDoc: documentId,
      userId: authPayload.userId,
    });
    ws.close(4403, 'Document mismatch');
    return;
  }

  ws.userId = authPayload.userId;
  setupWSConnection(ws, req, documentId);
});

const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const conn = ws as AuthenticatedWebSocket;
    if (conn.isAlive === false) {
      return conn.terminate();
    }
    conn.isAlive = false;
    conn.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
  docs.forEach((entry) => {
    entry.awareness.destroy();
    entry.doc.destroy();
  });
  docs.clear();
});

export function getServerStats() {
  const stats = {
    totalConnections: wss.clients.size,
    totalRooms: docs.size,
    rooms: {} as Record<string, number>
  };

  docs.forEach((entry, roomId) => {
    stats.rooms[roomId] = entry.conns.size;
  });

  return stats;
}

log.info('WebSocket 服务器启动', {
  port: process.env.WEBSOCKET_PORT || 3002
});

process.on('SIGTERM', () => {
  log.info('收到 SIGTERM 信号，关闭 WebSocket 服务器');
  wss.close(() => {
    log.info('WebSocket 服务器已优雅关闭');
    process.exit(0);
  });
});

export default wss;

