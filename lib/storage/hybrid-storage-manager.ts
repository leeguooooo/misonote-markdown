/**
 * 混合存储管理器
 * 针对协同编辑优化的高性能存储方案
 */

import { StorageAdapter, DocumentStorage, StorageConfig, StorageStrategy } from './storage-adapter';
import { DatabaseAdapter } from './database-adapter';
import { FileSystemAdapter } from './filesystem-adapter';
import { LRUCache } from 'lru-cache';

interface PerformanceMetrics {
  readLatency: number[];
  writeLatency: number[];
  cacheHitRate: number;
  concurrentUsers: number;
  operationsPerSecond: number;
}

interface CacheEntry {
  content: string;
  metadata: any;
  lastModified: Date;
  version: number;
  yjsState?: Uint8Array;
}

/**
 * 高性能混合存储管理器
 * 专为协同编辑场景优化
 */
export class HybridStorageManager implements DocumentStorage {
  private dbAdapter: DatabaseAdapter;
  private fsAdapter: FileSystemAdapter;
  private config: StorageConfig;
  
  // 多层缓存系统
  private contentCache: LRUCache<string, CacheEntry>;
  private metadataCache: LRUCache<string, any>;
  private yjsStateCache: LRUCache<string, Uint8Array>;
  
  // 性能监控
  private metrics: PerformanceMetrics;
  private operationQueue: Map<string, Promise<any>>;
  
  // 写入优化
  private writeBuffer: Map<string, {
    content: string;
    timestamp: Date;
    version: number;
  }>;
  private flushTimer: NodeJS.Timeout | null = null;
  
  constructor(config: StorageConfig) {
    this.config = config;
    this.dbAdapter = new DatabaseAdapter(config);
    this.fsAdapter = new FileSystemAdapter(config);
    
    // 初始化缓存
    this.contentCache = new LRUCache({
      max: 1000, // 最多缓存1000个文档
      ttl: 1000 * 60 * 30, // 30分钟过期
      updateAgeOnGet: true,
      allowStale: false
    });
    
    this.metadataCache = new LRUCache({
      max: 5000,
      ttl: 1000 * 60 * 10, // 10分钟过期
    });
    
    this.yjsStateCache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 5, // 5分钟过期
    });
    
    this.operationQueue = new Map();
    this.writeBuffer = new Map();
    
    this.metrics = {
      readLatency: [],
      writeLatency: [],
      cacheHitRate: 0,
      concurrentUsers: 0,
      operationsPerSecond: 0
    };
    
    this.setupPerformanceMonitoring();
    this.setupWriteBuffering();
  }
  
  /**
   * 高性能文档加载
   * 优先级：内存缓存 > 数据库 > 文件系统
   */
  async loadDocument(documentId: string, version?: number): Promise<{
    content: string;
    metadata: any;
    version: number;
  } | null> {
    const startTime = Date.now();
    const cacheKey = `${documentId}:${version || 'latest'}`;
    
    try {
      // 1. 检查内存缓存
      const cached = this.contentCache.get(cacheKey);
      if (cached && (!version || cached.version === version)) {
        this.recordMetric('read', Date.now() - startTime, true);
        return {
          content: cached.content,
          metadata: cached.metadata,
          version: cached.version
        };
      }
      
      // 2. 防止重复请求
      const existingOperation = this.operationQueue.get(cacheKey);
      if (existingOperation) {
        return await existingOperation;
      }
      
      // 3. 创建加载操作
      const loadOperation = this.performDocumentLoad(documentId, version);
      this.operationQueue.set(cacheKey, loadOperation);
      
      try {
        const result = await loadOperation;
        
        // 4. 更新缓存
        if (result) {
          this.contentCache.set(cacheKey, {
            content: result.content,
            metadata: result.metadata,
            lastModified: new Date(),
            version: result.version
          });
        }
        
        this.recordMetric('read', Date.now() - startTime, false);
        return result;
      } finally {
        this.operationQueue.delete(cacheKey);
      }
    } catch (error) {
      console.error(`文档加载失败: ${documentId}`, error);
      this.recordMetric('read', Date.now() - startTime, false, error);
      return null;
    }
  }
  
  /**
   * 实际执行文档加载
   */
  private async performDocumentLoad(documentId: string, version?: number) {
    // 优先从数据库加载（更快）
    try {
      const dbResult = await this.dbAdapter.loadDocument(documentId, version);
      if (dbResult) {
        return dbResult;
      }
    } catch (error) {
      console.warn('数据库加载失败，尝试文件系统:', error);
    }
    
    // 回退到文件系统
    return await this.fsAdapter.loadDocument(documentId, version);
  }
  
  /**
   * 高性能文档保存
   * 使用写入缓冲和批量提交
   */
  async saveDocument(documentId: string, content: string, options?: {
    version?: number;
    contentType?: 'markdown' | 'yjs_update' | 'snapshot';
    metadata?: Record<string, any>;
  }) {
    const startTime = Date.now();
    
    try {
      // 1. 立即更新内存缓存
      const version = options?.version || Date.now();
      const cacheKey = `${documentId}:latest`;
      
      this.contentCache.set(cacheKey, {
        content,
        metadata: options?.metadata || {},
        lastModified: new Date(),
        version
      });
      
      // 2. 添加到写入缓冲区
      this.writeBuffer.set(documentId, {
        content,
        timestamp: new Date(),
        version
      });
      
      // 3. 触发批量写入
      this.scheduleFlush();
      
      // 4. 立即写入数据库（协同编辑需要实时性）
      const dbResult = await this.dbAdapter.saveDocument(documentId, content, options);
      
      this.recordMetric('write', Date.now() - startTime, false);
      return dbResult;
    } catch (error) {
      console.error(`文档保存失败: ${documentId}`, error);
      this.recordMetric('write', Date.now() - startTime, false, error);
      throw error;
    }
  }
  
  /**
   * Yjs状态的高性能处理
   */
  async saveYjsState(documentId: string, state: Uint8Array): Promise<boolean> {
    try {
      // 1. 立即更新内存缓存
      this.yjsStateCache.set(documentId, state);
      
      // 2. 异步写入数据库
      setImmediate(async () => {
        try {
          await this.dbAdapter.saveYjsState(documentId, state);
        } catch (error) {
          console.error('Yjs状态保存失败:', error);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Yjs状态缓存失败:', error);
      return false;
    }
  }
  
  async loadYjsState(documentId: string): Promise<Uint8Array | null> {
    // 1. 检查内存缓存
    const cached = this.yjsStateCache.get(documentId);
    if (cached) {
      return cached;
    }
    
    // 2. 从数据库加载
    try {
      const state = await this.dbAdapter.loadYjsState(documentId);
      if (state) {
        this.yjsStateCache.set(documentId, state);
      }
      return state;
    } catch (error) {
      console.error('Yjs状态加载失败:', error);
      return null;
    }
  }
  
  /**
   * 批量写入调度
   */
  private scheduleFlush(): void {
    if (this.flushTimer) {
      return;
    }
    
    this.flushTimer = setTimeout(async () => {
      await this.flushWriteBuffer();
      this.flushTimer = null;
    }, 1000); // 1秒后批量写入
  }
  
  /**
   * 执行批量写入
   */
  private async flushWriteBuffer(): Promise<void> {
    if (this.writeBuffer.size === 0) {
      return;
    }
    
    const entries = Array.from(this.writeBuffer.entries());
    this.writeBuffer.clear();
    
    // 并行写入文件系统
    const writePromises = entries.map(async ([documentId, data]) => {
      try {
        await this.fsAdapter.saveDocument(documentId, data.content, {
          version: data.version,
          metadata: { lastModified: data.timestamp }
        });
      } catch (error) {
        console.error(`批量写入失败: ${documentId}`, error);
      }
    });
    
    await Promise.allSettled(writePromises);
  }
  
  /**
   * 性能监控设置
   */
  private setupPerformanceMonitoring(): void {
    // 每分钟计算性能指标
    setInterval(() => {
      this.calculateMetrics();
    }, 60000);
  }
  
  /**
   * 写入缓冲设置
   */
  private setupWriteBuffering(): void {
    // 进程退出时确保数据写入
    process.on('SIGINT', async () => {
      await this.flushWriteBuffer();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await this.flushWriteBuffer();
      process.exit(0);
    });
  }
  
  /**
   * 记录性能指标
   */
  private recordMetric(type: 'read' | 'write', latency: number, fromCache: boolean, error?: any): void {
    if (type === 'read') {
      this.metrics.readLatency.push(latency);
      if (fromCache) {
        this.metrics.cacheHitRate = (this.metrics.cacheHitRate * 0.9) + (1 * 0.1);
      } else {
        this.metrics.cacheHitRate = this.metrics.cacheHitRate * 0.9;
      }
    } else {
      this.metrics.writeLatency.push(latency);
    }
    
    // 保持最近1000次操作的记录
    if (this.metrics.readLatency.length > 1000) {
      this.metrics.readLatency = this.metrics.readLatency.slice(-1000);
    }
    if (this.metrics.writeLatency.length > 1000) {
      this.metrics.writeLatency = this.metrics.writeLatency.slice(-1000);
    }
  }
  
  /**
   * 计算性能指标
   */
  private calculateMetrics(): void {
    const totalOps = this.metrics.readLatency.length + this.metrics.writeLatency.length;
    this.metrics.operationsPerSecond = totalOps / 60; // 每秒操作数
  }
  
  /**
   * 获取性能报告
   */
  getPerformanceReport(): PerformanceMetrics & {
    avgReadLatency: number;
    avgWriteLatency: number;
    p95ReadLatency: number;
    p95WriteLatency: number;
    cacheSize: number;
  } {
    const avgRead = this.metrics.readLatency.length > 0 
      ? this.metrics.readLatency.reduce((a, b) => a + b, 0) / this.metrics.readLatency.length 
      : 0;
    
    const avgWrite = this.metrics.writeLatency.length > 0
      ? this.metrics.writeLatency.reduce((a, b) => a + b, 0) / this.metrics.writeLatency.length
      : 0;
    
    const p95Read = this.calculatePercentile(this.metrics.readLatency, 95);
    const p95Write = this.calculatePercentile(this.metrics.writeLatency, 95);
    
    return {
      ...this.metrics,
      avgReadLatency: avgRead,
      avgWriteLatency: avgWrite,
      p95ReadLatency: p95Read,
      p95WriteLatency: p95Write,
      cacheSize: this.contentCache.size
    };
  }
  
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
  
  // 实现其他DocumentStorage接口方法
  async getVersions(documentId: string) {
    return await this.dbAdapter.getVersions(documentId);
  }
  
  async createSnapshot(documentId: string, name?: string) {
    return await this.dbAdapter.createSnapshot(documentId, name);
  }
  
  async restoreSnapshot(documentId: string, snapshotId: string) {
    // 清除相关缓存
    this.contentCache.delete(`${documentId}:latest`);
    this.yjsStateCache.delete(documentId);
    
    return await this.dbAdapter.restoreSnapshot(documentId, snapshotId);
  }
}
