/**
 * 存储适配器接口
 * 提供统一的存储抽象层，支持多种存储后端
 */

export interface StorageMetadata {
  size: number;
  lastModified: Date;
  contentType: string;
  encoding?: string;
  hash?: string;
  version?: number;
  [key: string]: any;
}

export interface StorageOptions {
  encoding?: 'utf8' | 'binary';
  contentType?: string;
  metadata?: Record<string, any>;
  version?: number;
  createOnly?: boolean;
  overwrite?: boolean;
}

export interface StorageResult {
  success: boolean;
  path: string;
  metadata?: StorageMetadata;
  error?: string;
}

export interface ListResult {
  files: Array<{
    path: string;
    metadata: StorageMetadata;
    isDirectory: boolean;
  }>;
  hasMore: boolean;
  nextToken?: string;
}

/**
 * 存储适配器接口
 */
export interface StorageAdapter {
  /**
   * 读取文件内容
   */
  readFile(path: string, options?: { encoding?: 'utf8' | 'binary' }): Promise<string | Buffer>;
  
  /**
   * 写入文件内容
   */
  writeFile(path: string, content: string | Buffer, options?: StorageOptions): Promise<StorageResult>;
  
  /**
   * 检查文件是否存在
   */
  exists(path: string): Promise<boolean>;
  
  /**
   * 获取文件元数据
   */
  getMetadata(path: string): Promise<StorageMetadata | null>;
  
  /**
   * 删除文件
   */
  deleteFile(path: string): Promise<boolean>;
  
  /**
   * 移动/重命名文件
   */
  moveFile(sourcePath: string, targetPath: string): Promise<StorageResult>;
  
  /**
   * 复制文件
   */
  copyFile(sourcePath: string, targetPath: string): Promise<StorageResult>;
  
  /**
   * 列出目录内容
   */
  listFiles(path: string, options?: { 
    recursive?: boolean; 
    limit?: number; 
    nextToken?: string;
    pattern?: string;
  }): Promise<ListResult>;
  
  /**
   * 创建目录
   */
  createDirectory(path: string): Promise<boolean>;
  
  /**
   * 删除目录
   */
  deleteDirectory(path: string, recursive?: boolean): Promise<boolean>;
  
  /**
   * 获取存储统计信息
   */
  getStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    usedSpace: number;
    availableSpace?: number;
  }>;
}

/**
 * 文档存储接口
 */
export interface DocumentStorage {
  /**
   * 保存文档内容
   */
  saveDocument(documentId: string, content: string, options?: {
    version?: number;
    contentType?: 'markdown' | 'yjs_update' | 'snapshot';
    metadata?: Record<string, any>;
  }): Promise<StorageResult>;
  
  /**
   * 读取文档内容
   */
  loadDocument(documentId: string, version?: number): Promise<{
    content: string;
    metadata: StorageMetadata;
    version: number;
  } | null>;
  
  /**
   * 保存Yjs状态
   */
  saveYjsState(documentId: string, state: Uint8Array): Promise<boolean>;
  
  /**
   * 加载Yjs状态
   */
  loadYjsState(documentId: string): Promise<Uint8Array | null>;
  
  /**
   * 获取文档版本列表
   */
  getVersions(documentId: string): Promise<Array<{
    version: number;
    createdAt: Date;
    createdBy?: string;
    size: number;
    hash: string;
  }>>;
  
  /**
   * 创建文档快照
   */
  createSnapshot(documentId: string, name?: string): Promise<string>;
  
  /**
   * 恢复文档快照
   */
  restoreSnapshot(documentId: string, snapshotId: string): Promise<boolean>;
}

/**
 * 存储策略枚举
 */
export enum StorageStrategy {
  DATABASE_ONLY = 'database_only',      // 仅数据库存储
  FILESYSTEM_ONLY = 'filesystem_only',  // 仅文件系统存储
  HYBRID = 'hybrid',                    // 混合存储
  OBJECT_STORAGE = 'object_storage'     // 对象存储
}

/**
 * 存储配置
 */
export interface StorageConfig {
  strategy: StorageStrategy;
  
  // 数据库配置
  database?: {
    enabled: boolean;
    storeContent: boolean;
    storeMetadata: boolean;
    compression?: boolean;
  };
  
  // 文件系统配置
  filesystem?: {
    enabled: boolean;
    basePath: string;
    maxFileSize: number;
    allowedExtensions: string[];
    compression?: boolean;
  };
  
  // 对象存储配置
  objectStorage?: {
    enabled: boolean;
    provider: 'aws' | 'gcp' | 'azure' | 'minio';
    bucket: string;
    region?: string;
    credentials?: Record<string, any>;
  };
  
  // 缓存配置
  cache?: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  
  // 版本控制配置
  versioning?: {
    enabled: boolean;
    maxVersions: number;
    autoSnapshot: boolean;
    snapshotInterval: number;
  };
}

/**
 * 存储事件
 */
export interface StorageEvent {
  type: 'read' | 'write' | 'delete' | 'move' | 'copy';
  path: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * 存储事件监听器
 */
export interface StorageEventListener {
  onEvent(event: StorageEvent): void | Promise<void>;
}

/**
 * 抽象存储适配器基类
 */
export abstract class BaseStorageAdapter implements StorageAdapter {
  protected config: StorageConfig;
  protected listeners: StorageEventListener[] = [];
  
  constructor(config: StorageConfig) {
    this.config = config;
  }
  
  /**
   * 添加事件监听器
   */
  addListener(listener: StorageEventListener): void {
    this.listeners.push(listener);
  }
  
  /**
   * 移除事件监听器
   */
  removeListener(listener: StorageEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * 触发事件
   */
  protected async emitEvent(event: StorageEvent): Promise<void> {
    for (const listener of this.listeners) {
      try {
        await listener.onEvent(event);
      } catch (error) {
        console.error('Storage event listener error:', error);
      }
    }
  }
  
  /**
   * 验证路径安全性
   */
  protected validatePath(path: string): boolean {
    // 防止路径遍历攻击
    if (path.includes('..') || path.includes('~') || path.startsWith('/')) {
      return false;
    }
    
    // 检查路径长度
    if (path.length > 500) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 计算内容哈希
   */
  protected calculateHash(content: string | Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  // 抽象方法，由具体实现类实现
  abstract readFile(path: string, options?: { encoding?: 'utf8' | 'binary' }): Promise<string | Buffer>;
  abstract writeFile(path: string, content: string | Buffer, options?: StorageOptions): Promise<StorageResult>;
  abstract exists(path: string): Promise<boolean>;
  abstract getMetadata(path: string): Promise<StorageMetadata | null>;
  abstract deleteFile(path: string): Promise<boolean>;
  abstract moveFile(sourcePath: string, targetPath: string): Promise<StorageResult>;
  abstract copyFile(sourcePath: string, targetPath: string): Promise<StorageResult>;
  abstract listFiles(path: string, options?: any): Promise<ListResult>;
  abstract createDirectory(path: string): Promise<boolean>;
  abstract deleteDirectory(path: string, recursive?: boolean): Promise<boolean>;
  abstract getStats(): Promise<any>;
}
