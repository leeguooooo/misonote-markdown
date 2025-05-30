/**
 * MCP (Model Context Protocol) 相关类型定义
 */

export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastConnected?: Date;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'testing';
  errorMessage?: string;
}

export interface MCPDocumentRequest {
  path: string;
  content: string;
  title?: string;
  metadata?: Record<string, any>;
  operation: 'create' | 'update' | 'delete';
  author?: string;
  timestamp?: Date;
}

export interface MCPDocumentResponse {
  success: boolean;
  message: string;
  data?: {
    path: string;
    url?: string;
    lastModified?: Date;
  };
  error?: string;
}

export interface MCPBatchRequest {
  documents: MCPDocumentRequest[];
  serverId: string;
  batchId?: string;
}

export interface MCPBatchResponse {
  success: boolean;
  batchId: string;
  results: MCPDocumentResponse[];
  totalCount: number;
  successCount: number;
  errorCount: number;
  errors?: string[];
}

export interface MCPConnectionTest {
  serverId: string;
  url: string;
  apiKey: string;
}

export interface MCPConnectionTestResult {
  success: boolean;
  responseTime: number;
  serverInfo?: {
    name: string;
    version: string;
    features: string[];
  };
  error?: string;
}

export interface MCPPushHistory {
  id: string;
  serverId: string;
  serverName: string;
  operation: 'single' | 'batch';
  documentCount: number;
  successCount: number;
  errorCount: number;
  timestamp: Date;
  status: 'success' | 'partial' | 'failed';
  details?: {
    documents: {
      path: string;
      status: 'success' | 'error';
      error?: string;
    }[];
  };
}

export interface MCPWebhookPayload {
  source: string;
  documents: MCPDocumentRequest[];
  metadata?: {
    editor: string;
    version: string;
    timestamp: Date;
  };
}

export interface MCPApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

// MCP 服务器能力定义
export interface MCPServerCapabilities {
  supportsBatch: boolean;
  supportsWebhooks: boolean;
  supportsMetadata: boolean;
  supportsVersioning: boolean;
  maxDocumentSize: number;
  maxBatchSize: number;
  supportedFormats: string[];
}

// MCP 配置存储格式
export interface MCPConfigStorage {
  servers: MCPServerConfig[];
  settings: {
    defaultServerId?: string;
    enableWebhooks: boolean;
    webhookSecret?: string;
    maxRetries: number;
    retryDelay: number;
    connectionTimeout: number;
  };
  lastUpdated: Date;
}
