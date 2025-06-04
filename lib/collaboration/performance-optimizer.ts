/**
 * 协同编辑性能优化器
 * 专门针对多用户实时协作场景的性能优化
 */

import * as Y from 'yjs';
import { LRUCache } from 'lru-cache';
import { EventEmitter } from 'events';

interface OptimizationConfig {
  // 更新批处理
  batchUpdateInterval: number; // 批处理间隔 (ms)
  maxBatchSize: number; // 最大批处理大小
  
  // 压缩优化
  enableCompression: boolean;
  compressionThreshold: number; // 压缩阈值 (bytes)
  
  // 内存管理
  maxDocumentAge: number; // 文档最大存活时间 (ms)
  gcInterval: number; // 垃圾回收间隔 (ms)
  
  // 网络优化
  enableDeltaSync: boolean; // 增量同步
  maxUpdateSize: number; // 最大更新大小 (bytes)
  
  // 冲突解决
  conflictResolutionStrategy: 'last-write-wins' | 'operational-transform' | 'crdt';
}

interface PerformanceStats {
  documentsInMemory: number;
  totalUpdates: number;
  compressedUpdates: number;
  averageUpdateSize: number;
  memoryUsage: number;
  operationsPerSecond: number;
  conflictResolutions: number;
}

/**
 * Yjs文档性能包装器
 */
class OptimizedYDoc extends EventEmitter {
  private ydoc: Y.Doc;
  private updateBuffer: Uint8Array[] = [];
  private lastFlush: number = Date.now();
  private compressionCache: LRUCache<string, Uint8Array>;
  private stats: PerformanceStats;
  
  constructor(
    private documentId: string,
    private config: OptimizationConfig
  ) {
    super();
    this.ydoc = new Y.Doc();
    this.compressionCache = new LRUCache({
      max: 100,
      ttl: 1000 * 60 * 10 // 10分钟
    });
    
    this.stats = {
      documentsInMemory: 1,
      totalUpdates: 0,
      compressedUpdates: 0,
      averageUpdateSize: 0,
      memoryUsage: 0,
      operationsPerSecond: 0,
      conflictResolutions: 0
    };
    
    this.setupOptimizations();
  }
  
  private setupOptimizations(): void {
    // 1. 批处理更新
    this.ydoc.on('update', (update: Uint8Array, origin: any) => {
      this.handleUpdate(update, origin);
    });
    
    // 2. 定期垃圾回收
    setInterval(() => {
      this.performGarbageCollection();
    }, this.config.gcInterval);
    
    // 3. 定期压缩
    setInterval(() => {
      this.compressDocument();
    }, 30000); // 30秒压缩一次
  }
  
  /**
   * 处理文档更新 - 批处理优化
   */
  private handleUpdate(update: Uint8Array, origin: any): void {
    this.stats.totalUpdates++;
    
    // 添加到批处理缓冲区
    this.updateBuffer.push(update);
    
    // 检查是否需要立即刷新
    const now = Date.now();
    const shouldFlush = 
      this.updateBuffer.length >= this.config.maxBatchSize ||
      (now - this.lastFlush) >= this.config.batchUpdateInterval ||
      this.getBufferSize() >= this.config.maxUpdateSize;
    
    if (shouldFlush) {
      this.flushUpdates();
    }
  }
  
  /**
   * 刷新批处理的更新
   */
  private flushUpdates(): void {
    if (this.updateBuffer.length === 0) return;
    
    const updates = this.updateBuffer.splice(0);
    this.lastFlush = Date.now();
    
    // 合并更新
    const mergedUpdate = this.mergeUpdates(updates);
    
    // 压缩处理
    const finalUpdate = this.config.enableCompression && mergedUpdate.length > this.config.compressionThreshold
      ? this.compressUpdate(mergedUpdate)
      : mergedUpdate;
    
    if (finalUpdate.length < mergedUpdate.length) {
      this.stats.compressedUpdates++;
    }
    
    // 发送合并后的更新
    this.emit('batchUpdate', finalUpdate, {
      originalCount: updates.length,
      compressed: finalUpdate.length < mergedUpdate.length,
      size: finalUpdate.length
    });
    
    // 更新统计
    this.updateStats(finalUpdate.length);
  }
  
  /**
   * 合并多个更新
   */
  private mergeUpdates(updates: Uint8Array[]): Uint8Array {
    if (updates.length === 1) {
      return updates[0];
    }
    
    // 创建临时文档来合并更新
    const tempDoc = new Y.Doc();
    for (const update of updates) {
      Y.applyUpdate(tempDoc, update);
    }
    
    return Y.encodeStateAsUpdate(tempDoc);
  }
  
  /**
   * 压缩更新数据
   */
  private compressUpdate(update: Uint8Array): Uint8Array {
    const updateHash = this.calculateHash(update);
    
    // 检查压缩缓存
    const cached = this.compressionCache.get(updateHash);
    if (cached) {
      return cached;
    }
    
    try {
      const zlib = require('zlib');
      const compressed = zlib.gzipSync(update);
      
      // 只有压缩效果明显才使用
      if (compressed.length < update.length * 0.8) {
        this.compressionCache.set(updateHash, compressed);
        return compressed;
      }
    } catch (error) {
      console.warn('压缩失败:', error);
    }
    
    return update;
  }
  
  /**
   * 文档压缩 - 减少内存占用
   */
  private compressDocument(): void {
    try {
      // 获取当前状态
      const currentState = Y.encodeStateAsUpdate(this.ydoc);
      
      // 创建新文档并应用状态
      const newDoc = new Y.Doc();
      Y.applyUpdate(newDoc, currentState);
      
      // 替换当前文档
      this.ydoc.destroy();
      this.ydoc = newDoc;
      
      // 重新设置监听器
      this.ydoc.on('update', (update: Uint8Array, origin: any) => {
        this.handleUpdate(update, origin);
      });
      
      this.emit('documentCompressed', {
        documentId: this.documentId,
        newSize: currentState.length
      });
    } catch (error) {
      console.error('文档压缩失败:', error);
    }
  }
  
  /**
   * 垃圾回收
   */
  private performGarbageCollection(): void {
    try {
      // 清理过期的压缩缓存
      this.compressionCache.clear();
      
      // 强制垃圾回收 (如果可用)
      if (global.gc) {
        global.gc();
      }
      
      // 更新内存使用统计
      this.updateMemoryStats();
    } catch (error) {
      console.error('垃圾回收失败:', error);
    }
  }
  
  /**
   * 增量同步优化
   */
  getDeltaUpdate(fromStateVector?: Uint8Array): Uint8Array {
    if (!this.config.enableDeltaSync || !fromStateVector) {
      return Y.encodeStateAsUpdate(this.ydoc);
    }
    
    try {
      return Y.encodeStateAsUpdate(this.ydoc, fromStateVector);
    } catch (error) {
      console.warn('增量同步失败，回退到全量同步:', error);
      return Y.encodeStateAsUpdate(this.ydoc);
    }
  }
  
  /**
   * 应用远程更新
   */
  applyRemoteUpdate(update: Uint8Array, origin?: any): boolean {
    try {
      // 检查更新大小
      if (update.length > this.config.maxUpdateSize) {
        console.warn('更新过大，可能存在问题:', update.length);
        return false;
      }
      
      // 尝试解压缩
      const decompressedUpdate = this.decompressUpdate(update);
      
      // 应用更新
      Y.applyUpdate(this.ydoc, decompressedUpdate, origin);
      
      return true;
    } catch (error) {
      console.error('应用远程更新失败:', error);
      this.stats.conflictResolutions++;
      return false;
    }
  }
  
  /**
   * 解压缩更新
   */
  private decompressUpdate(update: Uint8Array): Uint8Array {
    try {
      const zlib = require('zlib');
      
      // 尝试解压缩
      if (this.isCompressed(update)) {
        return zlib.gunzipSync(update);
      }
    } catch (error) {
      // 如果解压缩失败，假设是未压缩的数据
    }
    
    return update;
  }
  
  /**
   * 检查数据是否被压缩
   */
  private isCompressed(data: Uint8Array): boolean {
    // 检查gzip魔数
    return data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b;
  }
  
  /**
   * 获取缓冲区大小
   */
  private getBufferSize(): number {
    return this.updateBuffer.reduce((total, update) => total + update.length, 0);
  }
  
  /**
   * 计算哈希
   */
  private calculateHash(data: Uint8Array): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(data).digest('hex');
  }
  
  /**
   * 更新统计信息
   */
  private updateStats(updateSize: number): void {
    this.stats.averageUpdateSize = 
      (this.stats.averageUpdateSize * (this.stats.totalUpdates - 1) + updateSize) / this.stats.totalUpdates;
  }
  
  /**
   * 更新内存统计
   */
  private updateMemoryStats(): void {
    if (process.memoryUsage) {
      this.stats.memoryUsage = process.memoryUsage().heapUsed;
    }
  }
  
  /**
   * 获取性能统计
   */
  getStats(): PerformanceStats {
    return { ...this.stats };
  }
  
  /**
   * 获取文档状态向量
   */
  getStateVector(): Uint8Array {
    return Y.encodeStateVector(this.ydoc);
  }
  
  /**
   * 获取文档内容
   */
  getContent(): string {
    const ytext = this.ydoc.getText('content');
    return ytext.toString();
  }
  
  /**
   * 设置文档内容
   */
  setContent(content: string): void {
    const ytext = this.ydoc.getText('content');
    ytext.delete(0, ytext.length);
    ytext.insert(0, content);
  }
  
  /**
   * 销毁文档
   */
  destroy(): void {
    this.ydoc.destroy();
    this.compressionCache.clear();
    this.updateBuffer = [];
    this.removeAllListeners();
  }
  
  /**
   * 获取原始Yjs文档 (谨慎使用)
   */
  getRawDoc(): Y.Doc {
    return this.ydoc;
  }
}

/**
 * 协同编辑性能管理器
 */
export class CollaborationPerformanceManager {
  private documents: Map<string, OptimizedYDoc> = new Map();
  private config: OptimizationConfig;
  private globalStats: PerformanceStats;
  
  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      batchUpdateInterval: 100, // 100ms批处理
      maxBatchSize: 10,
      enableCompression: true,
      compressionThreshold: 1024, // 1KB
      maxDocumentAge: 1000 * 60 * 60, // 1小时
      gcInterval: 1000 * 60 * 5, // 5分钟
      enableDeltaSync: true,
      maxUpdateSize: 1024 * 1024, // 1MB
      conflictResolutionStrategy: 'crdt',
      ...config
    };
    
    this.globalStats = {
      documentsInMemory: 0,
      totalUpdates: 0,
      compressedUpdates: 0,
      averageUpdateSize: 0,
      memoryUsage: 0,
      operationsPerSecond: 0,
      conflictResolutions: 0
    };
    
    this.setupGlobalOptimizations();
  }
  
  /**
   * 获取或创建优化的文档
   */
  getDocument(documentId: string): OptimizedYDoc {
    let doc = this.documents.get(documentId);
    
    if (!doc) {
      doc = new OptimizedYDoc(documentId, this.config);
      this.documents.set(documentId, doc);
      this.globalStats.documentsInMemory++;
      
      // 设置文档事件监听
      doc.on('batchUpdate', (update, meta) => {
        this.handleGlobalUpdate(documentId, update, meta);
      });
    }
    
    return doc;
  }
  
  /**
   * 移除文档
   */
  removeDocument(documentId: string): boolean {
    const doc = this.documents.get(documentId);
    if (doc) {
      doc.destroy();
      this.documents.delete(documentId);
      this.globalStats.documentsInMemory--;
      return true;
    }
    return false;
  }
  
  /**
   * 处理全局更新
   */
  private handleGlobalUpdate(documentId: string, update: Uint8Array, meta: any): void {
    this.globalStats.totalUpdates++;
    if (meta.compressed) {
      this.globalStats.compressedUpdates++;
    }
    
    // 更新平均大小
    this.globalStats.averageUpdateSize = 
      (this.globalStats.averageUpdateSize * (this.globalStats.totalUpdates - 1) + meta.size) / 
      this.globalStats.totalUpdates;
  }
  
  /**
   * 设置全局优化
   */
  private setupGlobalOptimizations(): void {
    // 定期清理过期文档
    setInterval(() => {
      this.cleanupExpiredDocuments();
    }, this.config.gcInterval);
    
    // 定期更新全局统计
    setInterval(() => {
      this.updateGlobalStats();
    }, 10000); // 10秒
  }
  
  /**
   * 清理过期文档
   */
  private cleanupExpiredDocuments(): void {
    const now = Date.now();
    const expiredDocs: string[] = [];
    
    for (const [documentId, doc] of this.documents) {
      // 这里可以添加文档最后访问时间的检查
      // 暂时跳过自动清理，由业务逻辑控制
    }
    
    for (const documentId of expiredDocs) {
      this.removeDocument(documentId);
    }
  }
  
  /**
   * 更新全局统计
   */
  private updateGlobalStats(): void {
    if (process.memoryUsage) {
      this.globalStats.memoryUsage = process.memoryUsage().heapUsed;
    }
    
    // 计算每秒操作数
    this.globalStats.operationsPerSecond = this.globalStats.totalUpdates / 
      (Date.now() / 1000); // 简化计算
  }
  
  /**
   * 获取全局性能报告
   */
  getPerformanceReport(): {
    global: PerformanceStats;
    documents: Record<string, PerformanceStats>;
    config: OptimizationConfig;
  } {
    const documentStats: Record<string, PerformanceStats> = {};
    
    for (const [documentId, doc] of this.documents) {
      documentStats[documentId] = doc.getStats();
    }
    
    return {
      global: { ...this.globalStats },
      documents: documentStats,
      config: { ...this.config }
    };
  }
  
  /**
   * 优化配置更新
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
