/**
 * 统一的存储错误处理系统
 */

export enum StorageErrorCode {
  // 通用错误
  UNKNOWN_ERROR = 'STORAGE_UNKNOWN_ERROR',
  INVALID_INPUT = 'STORAGE_INVALID_INPUT',

  // 文件/路径错误
  NOT_FOUND = 'STORAGE_NOT_FOUND',
  ALREADY_EXISTS = 'STORAGE_ALREADY_EXISTS',
  INVALID_PATH = 'STORAGE_INVALID_PATH',
  PATH_TOO_LONG = 'STORAGE_PATH_TOO_LONG',
  PATH_TRAVERSAL = 'STORAGE_PATH_TRAVERSAL',

  // 内容错误
  CONTENT_TOO_LARGE = 'STORAGE_CONTENT_TOO_LARGE',
  INVALID_CONTENT_TYPE = 'STORAGE_INVALID_CONTENT_TYPE',
  ENCODING_ERROR = 'STORAGE_ENCODING_ERROR',

  // 权限错误
  PERMISSION_DENIED = 'STORAGE_PERMISSION_DENIED',
  UNAUTHORIZED = 'STORAGE_UNAUTHORIZED',

  // 系统错误
  DATABASE_ERROR = 'STORAGE_DATABASE_ERROR',
  FILESYSTEM_ERROR = 'STORAGE_FILESYSTEM_ERROR',
  NETWORK_ERROR = 'STORAGE_NETWORK_ERROR',
  TIMEOUT = 'STORAGE_TIMEOUT',

  // 并发错误
  RATE_LIMITED = 'STORAGE_RATE_LIMITED',
  RESOURCE_BUSY = 'STORAGE_RESOURCE_BUSY',
  CONFLICT = 'STORAGE_CONFLICT'
}

export interface StorageErrorDetails {
  code: StorageErrorCode;
  message: string;
  details?: any;
  timestamp: Date;
  operation?: string;
  resource?: string;
  userId?: string;
}

export class StorageError extends Error {
  public readonly code: StorageErrorCode;
  public readonly details: StorageErrorDetails;

  constructor(
    code: StorageErrorCode,
    message: string,
    details?: any,
    operation?: string,
    resource?: string
  ) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.details = {
      code,
      message,
      details,
      timestamp: new Date(),
      operation,
      resource
    };
  }

  static fromError(error: any, operation?: string, resource?: string): StorageError {
    if (error instanceof StorageError) {
      return error;
    }

    // 数据库错误映射
    if (error.code === '23505') { // PostgreSQL unique violation
      return new StorageError(
        StorageErrorCode.ALREADY_EXISTS,
        'Resource already exists',
        error,
        operation,
        resource
      );
    }

    if (error.code === '23503') { // PostgreSQL foreign key violation
      return new StorageError(
        StorageErrorCode.NOT_FOUND,
        'Referenced resource not found',
        error,
        operation,
        resource
      );
    }

    // 文件系统错误映射
    if (error.code === 'ENOENT') {
      return new StorageError(
        StorageErrorCode.NOT_FOUND,
        'File or directory not found',
        error,
        operation,
        resource
      );
    }

    if (error.code === 'EACCES') {
      return new StorageError(
        StorageErrorCode.PERMISSION_DENIED,
        'Permission denied',
        error,
        operation,
        resource
      );
    }

    // 默认错误
    return new StorageError(
      StorageErrorCode.UNKNOWN_ERROR,
      error.message || 'Unknown error occurred',
      error,
      operation,
      resource
    );
  }
}

/**
 * 统一的操作结果接口
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: StorageErrorDetails;
  metadata?: {
    duration?: number;
    cached?: boolean;
    version?: number;
    [key: string]: any;
  };
}

/**
 * 创建成功结果
 */
export function createSuccessResult<T>(data: T, metadata?: any): OperationResult<T> {
  return {
    success: true,
    data,
    metadata
  };
}

/**
 * 创建错误结果
 */
export function createErrorResult(error: StorageError): OperationResult {
  return {
    success: false,
    error: error.details
  };
}

/**
 * 输入验证器
 */
export class InputValidator {
  private static readonly MAX_PATH_LENGTH = 500;
  private static readonly MAX_CONTENT_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly ALLOWED_EXTENSIONS = ['.md', '.txt', '.json'];

  /**
   * 验证文件路径
   */
  static validatePath(path: string): void {
    if (!path || typeof path !== 'string') {
      throw new StorageError(
        StorageErrorCode.INVALID_PATH,
        'Path is required and must be a string'
      );
    }

    if (path.length > this.MAX_PATH_LENGTH) {
      throw new StorageError(
        StorageErrorCode.PATH_TOO_LONG,
        `Path length ${path.length} exceeds maximum ${this.MAX_PATH_LENGTH}`
      );
    }

    // 检查路径遍历攻击
    if (path.includes('..') || path.includes('~') || path.startsWith('/')) {
      throw new StorageError(
        StorageErrorCode.PATH_TRAVERSAL,
        'Path contains invalid characters or traversal patterns'
      );
    }

    // 检查文件扩展名
    const ext = path.substring(path.lastIndexOf('.'));
    if (ext && !this.ALLOWED_EXTENSIONS.includes(ext.toLowerCase())) {
      throw new StorageError(
        StorageErrorCode.INVALID_CONTENT_TYPE,
        `File extension ${ext} is not allowed`
      );
    }
  }

  /**
   * 验证内容
   */
  static validateContent(content: string | Buffer, maxSize?: number): void {
    if (content === null || content === undefined) {
      throw new StorageError(
        StorageErrorCode.INVALID_INPUT,
        'Content is required'
      );
    }

    const size = Buffer.byteLength(content);
    const limit = maxSize || this.MAX_CONTENT_SIZE;

    if (size > limit) {
      throw new StorageError(
        StorageErrorCode.CONTENT_TOO_LARGE,
        `Content size ${size} bytes exceeds limit ${limit} bytes`
      );
    }
  }

  /**
   * 验证文档ID
   */
  static validateDocumentId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new StorageError(
        StorageErrorCode.INVALID_INPUT,
        'Document ID is required and must be a string'
      );
    }

    if (id.length > 255) {
      throw new StorageError(
        StorageErrorCode.INVALID_INPUT,
        'Document ID too long'
      );
    }

    // 检查特殊字符
    if (!/^[a-zA-Z0-9\-_\/\.]+$/.test(id)) {
      throw new StorageError(
        StorageErrorCode.INVALID_INPUT,
        'Document ID contains invalid characters'
      );
    }
  }
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, {
    count: number;
    totalDuration: number;
    errors: number;
    lastUpdate: Date;
  }>();

  /**
   * 记录操作指标
   */
  static recordOperation(operation: string, duration: number, success: boolean): void {
    const key = operation;
    const current = this.metrics.get(key) || {
      count: 0,
      totalDuration: 0,
      errors: 0,
      lastUpdate: new Date()
    };

    current.count++;
    current.totalDuration += duration;
    if (!success) current.errors++;
    current.lastUpdate = new Date();

    this.metrics.set(key, current);
  }

  /**
   * 获取性能指标
   */
  static getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [operation, metrics] of this.metrics) {
      result[operation] = {
        count: metrics.count,
        averageDuration: metrics.count > 0 ? metrics.totalDuration / metrics.count : 0,
        errorRate: metrics.count > 0 ? metrics.errors / metrics.count : 0,
        lastUpdate: metrics.lastUpdate
      };
    }

    return result;
  }

  /**
   * 清理旧指标
   */
  static cleanup(maxAge: number = 3600000): void { // 1小时
    const now = Date.now();
    for (const [key, metrics] of this.metrics) {
      if (now - metrics.lastUpdate.getTime() > maxAge) {
        this.metrics.delete(key);
      }
    }
  }
}

/**
 * 操作监控装饰器 - 暂时禁用
 */
export function Monitor(operation: string) {
  return function (target: any, propertyName: string, descriptor?: PropertyDescriptor) {
    // 暂时返回原始方法，避免装饰器问题
    return descriptor;
  };
}
