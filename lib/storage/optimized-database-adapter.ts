/**
 * 高性能优化的数据库适配器
 * 专门解决文档列表和单文档读取的性能问题
 */

import { LRUCache } from 'lru-cache';
import { db } from '../db/operations';
import {
  StorageError,
  StorageErrorCode,
  OperationResult,
  createSuccessResult,
  createErrorResult,
  InputValidator,
  Monitor,
  PerformanceMonitor
} from './storage-errors';
import matter from 'gray-matter';

interface DocumentListItem {
  id: number;
  path: string;
  title: string;
  excerpt: string;
  lastModified: Date;
  status: string;
  isPublic: boolean;
  fileSize: number;
  slug: string[];
}

interface DocumentDetail {
  id: number;
  path: string;
  title: string;
  content: string;
  frontmatter: Record<string, any>;
  lastModified: Date;
  version: number;
  status: string;
  isPublic: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number;
}

/**
 * 高性能数据库适配器
 */
export class OptimizedDatabaseAdapter {
  // 多级缓存
  private listCache: LRUCache<string, CacheEntry<DocumentListItem[]>>;
  private documentCache: LRUCache<string, CacheEntry<DocumentDetail>>;
  private metadataCache: LRUCache<string, CacheEntry<any>>;

  // 性能配置
  private readonly config = {
    listCacheTTL: 300000, // 5分钟
    documentCacheTTL: 600000, // 10分钟
    metadataCacheTTL: 1800000, // 30分钟
    maxCacheSize: 1000,
    batchSize: 50
  };

  constructor() {
    this.listCache = new LRUCache({
      max: 100,
      ttl: this.config.listCacheTTL,
      updateAgeOnGet: true
    });

    this.documentCache = new LRUCache({
      max: this.config.maxCacheSize,
      ttl: this.config.documentCacheTTL,
      updateAgeOnGet: true
    });

    this.metadataCache = new LRUCache({
      max: this.config.maxCacheSize * 2,
      ttl: this.config.metadataCacheTTL,
      updateAgeOnGet: true
    });

    // 定期清理性能指标
    setInterval(() => {
      PerformanceMonitor.cleanup();
    }, 3600000); // 1小时
  }

  /**
   * 高性能获取文档列表
   * 只查询必要的元数据，不加载完整内容
   */
  async getDocumentList(options: {
    includePrivate?: boolean;
    status?: string;
    limit?: number;
    offset?: number;
    useCache?: boolean;
  } = {}): Promise<OperationResult<DocumentListItem[]>> {
    const startTime = Date.now();
    const {
      includePrivate = false,
      status,
      limit = 100,
      offset = 0,
      useCache = true
    } = options;

    try {
      // 生成缓存键
      const cacheKey = `list:${includePrivate}:${status}:${limit}:${offset}`;

      // 检查缓存
      if (useCache) {
        const cached = this.getCachedData(this.listCache, cacheKey);
        if (cached) {
          return createSuccessResult(cached, { cached: true });
        }
      }

      // 优化的SQL查询 - 只查询列表需要的字段
      let query = `
        SELECT
          d.id,
          d.file_path,
          d.title,
          d.file_size,
          d.updated_at,
          d.status,
          d.is_public,
          -- 从最新版本获取摘要（只取前200字符）
          LEFT(dc.content_text, 200) as excerpt,
          -- 提取frontmatter中的关键信息
          (dc.metadata->>'frontmatter')::jsonb as frontmatter_data
        FROM documents d
        LEFT JOIN LATERAL (
          SELECT content_text, metadata
          FROM document_contents
          WHERE document_id = d.id
            AND content_type = 'markdown'
          ORDER BY version_number DESC
          LIMIT 1
        ) dc ON true
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      // 添加过滤条件
      if (!includePrivate) {
        query += ` AND d.is_public = true`;
      }

      if (status) {
        query += ` AND d.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      // 排序和分页
      query += ` ORDER BY d.updated_at DESC`;

      if (limit > 0) {
        query += ` LIMIT $${paramIndex}`;
        params.push(limit);
        paramIndex++;
      }

      if (offset > 0) {
        query += ` OFFSET $${paramIndex}`;
        params.push(offset);
      }

      const results = await db.query(query, params);

      // 处理结果
      const documents: DocumentListItem[] = results.map((row: any) => {
        const frontmatter = row.frontmatter_data || {};
        const title = row.title || frontmatter.title || this.getFileNameFromPath(row.file_path);
        const excerpt = row.excerpt ?
          (row.excerpt.length > 200 ? row.excerpt.substring(0, 200) + '...' : row.excerpt) :
          '';

        return {
          id: row.id,
          path: row.file_path,
          title,
          excerpt,
          lastModified: new Date(row.updated_at),
          status: row.status || 'published',
          isPublic: row.is_public,
          fileSize: row.file_size || 0,
          slug: row.file_path.replace(/\.md$/, '').split('/').filter(Boolean)
        };
      });

      // 缓存结果
      if (useCache) {
        this.setCachedData(this.listCache, cacheKey, documents, this.config.listCacheTTL);
      }

      // 记录性能指标
      PerformanceMonitor.recordOperation('getDocumentList', Date.now() - startTime, true);

      return createSuccessResult(documents);

    } catch (error) {
      PerformanceMonitor.recordOperation('getDocumentList', Date.now() - startTime, false);
      const storageError = StorageError.fromError(error, 'getDocumentList');
      return createErrorResult(storageError);
    }
  }

  /**
   * 高性能获取单个文档
   */
  async getDocument(path: string, options: {
    version?: number;
    useCache?: boolean;
  } = {}): Promise<OperationResult<DocumentDetail>> {
    const { version, useCache = true } = options;

    try {
      InputValidator.validatePath(path);

      const cacheKey = `doc:${path}:${version || 'latest'}`;

      // 检查缓存
      if (useCache) {
        const cached = this.getCachedData(this.documentCache, cacheKey);
        if (cached) {
          return createSuccessResult(cached, { cached: true });
        }
      }

      // 优化的单文档查询
      let query = `
        SELECT
          d.id,
          d.file_path,
          d.title,
          d.updated_at,
          d.status,
          d.is_public,
          dc.content_text,
          dc.version_number,
          dc.metadata
        FROM documents d
        JOIN document_contents dc ON d.id = dc.document_id
        WHERE d.file_path = $1 AND dc.content_type = 'markdown'
      `;

      const params: Array<string | number> = [path];

      if (version) {
        query += ` AND dc.version_number = $2`;
        params.push(version);
      } else {
        query += ` ORDER BY dc.version_number DESC LIMIT 1`;
      }

      const result = await db.queryOne(query, params);

      if (!result) {
        throw new StorageError(
          StorageErrorCode.NOT_FOUND,
          `Document not found: ${path}`
        );
      }

      // 解析内容
      const { data: frontmatter, content: markdownContent } = matter(result.content_text);

      const document: DocumentDetail = {
        id: result.id,
        path: result.file_path,
        title: result.title || frontmatter.title || this.getFileNameFromPath(result.file_path),
        content: markdownContent,
        frontmatter,
        lastModified: new Date(result.updated_at),
        version: result.version_number,
        status: result.status || 'published',
        isPublic: result.is_public
      };

      // 缓存结果
      if (useCache) {
        this.setCachedData(this.documentCache, cacheKey, document, this.config.documentCacheTTL);
      }

      return createSuccessResult(document);

    } catch (error) {
      const storageError = StorageError.fromError(error, 'getDocument', path);
      return createErrorResult(storageError);
    }
  }

  /**
   * 批量获取文档元数据
   */
  async getDocumentMetadata(paths: string[]): Promise<OperationResult<Record<string, any>>> {
    try {
      if (!paths || paths.length === 0) {
        return createSuccessResult({});
      }

      // 验证所有路径
      paths.forEach(path => InputValidator.validatePath(path));

      const query = `
        SELECT
          d.file_path,
          d.title,
          d.file_size,
          d.updated_at,
          d.status,
          d.is_public
        FROM documents d
        WHERE d.file_path = ANY($1)
      `;

      const results = await db.query(query, [paths]);

      const metadata: Record<string, any> = {};
      for (const row of results) {
        metadata[row.file_path] = {
          title: row.title,
          fileSize: row.file_size,
          lastModified: new Date(row.updated_at),
          status: row.status,
          isPublic: row.is_public
        };
      }

      return createSuccessResult(metadata);

    } catch (error) {
      const storageError = StorageError.fromError(error, 'getDocumentMetadata');
      return createErrorResult(storageError);
    }
  }

  /**
   * 搜索文档
   */
  async searchDocuments(query: string, options: {
    limit?: number;
    offset?: number;
    includeContent?: boolean;
  } = {}): Promise<OperationResult<DocumentListItem[]>> {
    const { limit = 20, offset = 0, includeContent = false } = options;

    try {
      if (!query || query.trim().length < 2) {
        return createSuccessResult([]);
      }

      const searchTerm = `%${query.toLowerCase()}%`;

      let sqlQuery = `
        SELECT
          d.id,
          d.file_path,
          d.title,
          d.file_size,
          d.updated_at,
          d.status,
          d.is_public,
          ${includeContent ? 'dc.content_text,' : ''}
          ts_rank(to_tsvector('english', COALESCE(d.title, '') || ' ' || COALESCE(dc.content_text, '')),
                  plainto_tsquery('english', $1)) as rank
        FROM documents d
        LEFT JOIN LATERAL (
          SELECT content_text
          FROM document_contents
          WHERE document_id = d.id
            AND content_type = 'markdown'
          ORDER BY version_number DESC
          LIMIT 1
        ) dc ON true
        WHERE d.is_public = true
          AND (
            LOWER(d.title) LIKE $2
            OR to_tsvector('english', COALESCE(d.title, '') || ' ' || COALESCE(dc.content_text, ''))
               @@ plainto_tsquery('english', $1)
          )
        ORDER BY rank DESC, d.updated_at DESC
        LIMIT $3 OFFSET $4
      `;

      const results = await db.query(sqlQuery, [query, searchTerm, limit, offset]);

      const documents: DocumentListItem[] = results.map((row: any) => ({
        id: row.id,
        path: row.file_path,
        title: row.title || this.getFileNameFromPath(row.file_path),
        excerpt: includeContent && row.content_text ?
          row.content_text.substring(0, 200) + '...' : '',
        lastModified: new Date(row.updated_at),
        status: row.status || 'published',
        isPublic: row.is_public,
        fileSize: row.file_size || 0,
        slug: row.file_path.replace(/\.md$/, '').split('/').filter(Boolean)
      }));

      return createSuccessResult(documents);

    } catch (error) {
      const storageError = StorageError.fromError(error, 'searchDocuments');
      return createErrorResult(storageError);
    }
  }

  /**
   * 清除缓存
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      // 清除匹配模式的缓存
      for (const cache of [this.listCache, this.documentCache, this.metadataCache]) {
        for (const key of cache.keys()) {
          if (key.includes(pattern)) {
            cache.delete(key);
          }
        }
      }
    } else {
      // 清除所有缓存
      this.listCache.clear();
      this.documentCache.clear();
      this.metadataCache.clear();
    }
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    return {
      ...PerformanceMonitor.getMetrics(),
      cache: {
        listCache: {
          size: this.listCache.size,
          maxSize: this.listCache.max
        },
        documentCache: {
          size: this.documentCache.size,
          maxSize: this.documentCache.max
        },
        metadataCache: {
          size: this.metadataCache.size,
          maxSize: this.metadataCache.max
        }
      }
    };
  }

  // 私有辅助方法

  private getCachedData<T>(cache: LRUCache<string, CacheEntry<T>>, key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp.getTime() > entry.ttl) {
      cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCachedData<T>(
    cache: LRUCache<string, CacheEntry<T>>,
    key: string,
    data: T,
    ttl: number
  ): void {
    cache.set(key, {
      data,
      timestamp: new Date(),
      ttl
    });
  }

  private getFileNameFromPath(path: string): string {
    const fileName = path.split('/').pop() || path;
    return fileName.replace('.md', '');
  }
}

// 导出单例实例
export const optimizedDbAdapter = new OptimizedDatabaseAdapter();
