/**
 * 文档管理器
 * 统一处理文档的CRUD操作，支持数据库和文件系统的混合存储
 */

import { DatabaseAdapter } from '../storage/database-adapter';
import { HybridStorageManager } from '../storage/hybrid-storage-manager';
import { StorageStrategy, StorageConfig } from '../storage/storage-adapter';
import { optimizedDbAdapter } from '../storage/optimized-database-adapter';
import matter from 'gray-matter';

export interface Document {
  id: string;
  title: string;
  content: string;
  path: string;
  slug: string[];
  lastModified: Date;
  created: Date;
  frontmatter: Record<string, any>;
  version?: number;
  status: 'draft' | 'published' | 'archived';
  isPublic: boolean;
  author?: {
    id: number;
    name: string;
  };
}

export interface DocumentTree {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DocumentTree[];
  document?: Document;
}

export interface CreateDocumentOptions {
  title?: string;
  content?: string;
  frontmatter?: Record<string, any>;
  status?: 'draft' | 'published';
  isPublic?: boolean;
  authorId?: number;
}

export interface UpdateDocumentOptions {
  title?: string;
  content?: string;
  frontmatter?: Record<string, any>;
  status?: 'draft' | 'published' | 'archived';
  isPublic?: boolean;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  status?: 'draft' | 'published' | 'archived';
  authorId?: number;
}

/**
 * 文档管理器类
 */
export class DocumentManager {
  private storageManager: HybridStorageManager;
  private dbAdapter: DatabaseAdapter;

  constructor(config?: Partial<StorageConfig>) {
    const defaultConfig: StorageConfig = {
      strategy: StorageStrategy.HYBRID,
      database: {
        enabled: true,
        storeContent: true,
        storeMetadata: true,
        compression: false
      },
      filesystem: {
        enabled: true,
        basePath: 'docs',
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedExtensions: ['.md', '.txt'],
        compression: false
      },
      cache: {
        enabled: true,
        ttl: 1800, // 30分钟
        maxSize: 1000
      },
      versioning: {
        enabled: true,
        maxVersions: 50,
        autoSnapshot: true,
        snapshotInterval: 3600 // 1小时
      }
    };

    const finalConfig = { ...defaultConfig, ...config };
    this.storageManager = new HybridStorageManager(finalConfig);
    // 暂时使用优化的适配器
    this.dbAdapter = optimizedDbAdapter as any;
  }

  /**
   * 获取所有文档
   */
  async getAllDocuments(): Promise<Document[]> {
    try {
      const files = await this.storageManager.listFiles('/', { recursive: true });
      const documents: Document[] = [];

      for (const file of files.files) {
        if (file.path.endsWith('.md')) {
          const doc = await this.getDocumentByPath(file.path);
          if (doc) {
            documents.push(doc);
          }
        }
      }

      return documents.sort((a, b) => a.path.localeCompare(b.path));
    } catch (error) {
      console.error('获取所有文档失败:', error);
      return [];
    }
  }

  /**
   * 根据路径获取文档
   */
  async getDocumentByPath(path: string): Promise<Document | null> {
    try {
      const result = await this.storageManager.loadDocument(path);
      if (!result) {
        return null;
      }

      const { data: frontmatter, content: markdownContent } = matter(result.content);
      const slug = this.pathToSlug(path);

      return {
        id: path,
        title: frontmatter.title || this.extractTitleFromContent(markdownContent) || this.getFileNameFromPath(path),
        content: markdownContent,
        path,
        slug,
        lastModified: new Date(result.metadata.lastModified),
        created: new Date(result.metadata.lastModified), // 简化处理
        frontmatter,
        version: result.version,
        status: frontmatter.status || 'published',
        isPublic: frontmatter.public !== false,
        author: frontmatter.author
      };
    } catch (error) {
      console.error(`获取文档失败: ${path}`, error);
      return null;
    }
  }

  /**
   * 根据slug获取文档
   */
  async getDocumentBySlug(slug: string[]): Promise<Document | null> {
    const path = this.slugToPath(slug);
    return await this.getDocumentByPath(path);
  }

  /**
   * 创建新文档
   */
  async createDocument(path: string, options: CreateDocumentOptions = {}): Promise<Document | null> {
    try {
      const {
        title = this.getFileNameFromPath(path),
        content = '',
        frontmatter = {},
        status = 'published',
        isPublic = true,
        authorId
      } = options;

      // 检查文档是否已存在
      const exists = await this.storageManager.exists(path);
      if (exists) {
        throw new Error('文档已存在');
      }

      // 构建完整的frontmatter
      const fullFrontmatter = {
        title,
        status,
        public: isPublic,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        ...frontmatter
      };

      if (authorId) {
        fullFrontmatter.author = { id: authorId };
      }

      // 构建完整内容
      const fullContent = matter.stringify(content, fullFrontmatter);

      // 保存文档
      const result = await this.storageManager.saveDocument(path, fullContent, {
        contentType: 'markdown',
        metadata: {
          title,
          status,
          isPublic,
          authorId
        }
      });

      if (!result.success) {
        throw new Error(result.error || '保存文档失败');
      }

      // 返回创建的文档
      return await this.getDocumentByPath(path);
    } catch (error) {
      console.error('创建文档失败:', error);
      return null;
    }
  }

  /**
   * 更新文档
   */
  async updateDocument(path: string, options: UpdateDocumentOptions): Promise<Document | null> {
    try {
      // 获取现有文档
      const existingDoc = await this.getDocumentByPath(path);
      if (!existingDoc) {
        throw new Error('文档不存在');
      }

      // 合并更新选项
      const updatedFrontmatter = {
        ...existingDoc.frontmatter,
        updated: new Date().toISOString()
      };

      if (options.title !== undefined) {
        updatedFrontmatter.title = options.title;
      }
      if (options.status !== undefined) {
        updatedFrontmatter.status = options.status;
      }
      if (options.isPublic !== undefined) {
        updatedFrontmatter.public = options.isPublic;
      }
      if (options.frontmatter) {
        Object.assign(updatedFrontmatter, options.frontmatter);
      }

      const updatedContent = options.content !== undefined ? options.content : existingDoc.content;

      // 构建完整内容
      const fullContent = matter.stringify(updatedContent, updatedFrontmatter);

      // 保存更新
      const result = await this.storageManager.saveDocument(path, fullContent, {
        contentType: 'markdown',
        metadata: updatedFrontmatter
      });

      if (!result.success) {
        throw new Error(result.error || '更新文档失败');
      }

      // 返回更新后的文档
      return await this.getDocumentByPath(path);
    } catch (error) {
      console.error('更新文档失败:', error);
      return null;
    }
  }

  /**
   * 删除文档
   */
  async deleteDocument(path: string): Promise<boolean> {
    try {
      return await this.dbAdapter.deleteFile(path);
    } catch (error) {
      console.error('删除文档失败:', error);
      return false;
    }
  }

  /**
   * 移动文档
   */
  async moveDocument(sourcePath: string, targetPath: string): Promise<boolean> {
    try {
      const result = await this.dbAdapter.moveFile(sourcePath, targetPath);
      return result.success;
    } catch (error) {
      console.error('移动文档失败:', error);
      return false;
    }
  }

  /**
   * 复制文档
   */
  async copyDocument(sourcePath: string, targetPath: string): Promise<boolean> {
    try {
      const result = await this.dbAdapter.copyFile(sourcePath, targetPath);
      return result.success;
    } catch (error) {
      console.error('复制文档失败:', error);
      return false;
    }
  }

  /**
   * 搜索文档
   */
  async searchDocuments(options: SearchOptions): Promise<Document[]> {
    try {
      const { query, limit = 50, offset = 0 } = options;

      if (!query.trim()) {
        return [];
      }

      // 获取所有文档进行搜索（简化实现）
      const allDocs = await this.getAllDocuments();
      const searchTerm = query.toLowerCase();

      const results = allDocs.filter(doc => {
        // 状态过滤
        if (options.status && doc.status !== options.status) {
          return false;
        }

        // 作者过滤
        if (options.authorId && doc.author?.id !== options.authorId) {
          return false;
        }

        // 内容搜索
        const titleMatch = doc.title.toLowerCase().includes(searchTerm);
        const contentMatch = doc.content.toLowerCase().includes(searchTerm);

        return titleMatch || contentMatch;
      });

      // 排序：标题匹配优先
      results.sort((a, b) => {
        const aTitleMatch = a.title.toLowerCase().includes(searchTerm);
        const bTitleMatch = b.title.toLowerCase().includes(searchTerm);

        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;

        return a.title.localeCompare(b.title);
      });

      // 分页
      return results.slice(offset, offset + limit);
    } catch (error) {
      console.error('搜索文档失败:', error);
      return [];
    }
  }

  /**
   * 获取文档树结构
   */
  async getDocumentTree(): Promise<DocumentTree> {
    try {
      const files = await this.storageManager.listFiles('/', { recursive: true });

      // 构建树结构
      const tree: DocumentTree = {
        name: 'docs',
        path: '/',
        type: 'directory',
        children: []
      };

      // 按路径组织文件
      const pathMap = new Map<string, DocumentTree>();
      pathMap.set('/', tree);

      for (const file of files.files) {
        if (!file.path.endsWith('.md')) continue;

        const pathParts = file.path.split('/').filter(Boolean);
        let currentPath = '';
        let currentNode = tree;

        // 创建目录节点
        for (let i = 0; i < pathParts.length - 1; i++) {
          currentPath += '/' + pathParts[i];

          if (!pathMap.has(currentPath)) {
            const dirNode: DocumentTree = {
              name: pathParts[i],
              path: currentPath,
              type: 'directory',
              children: []
            };

            currentNode.children = currentNode.children || [];
            currentNode.children.push(dirNode);
            pathMap.set(currentPath, dirNode);
          }

          currentNode = pathMap.get(currentPath)!;
        }

        // 创建文件节点
        const fileName = pathParts[pathParts.length - 1];
        const doc = await this.getDocumentByPath(file.path);

        if (doc) {
          const fileNode: DocumentTree = {
            name: fileName.replace('.md', ''),
            path: file.path,
            type: 'file',
            document: doc
          };

          currentNode.children = currentNode.children || [];
          currentNode.children.push(fileNode);
        }
      }

      // 排序子节点
      this.sortTreeNodes(tree);

      return tree;
    } catch (error) {
      console.error('获取文档树失败:', error);
      return {
        name: 'docs',
        path: '/',
        type: 'directory',
        children: []
      };
    }
  }

  /**
   * 获取文档版本列表
   */
  async getDocumentVersions(path: string) {
    return await this.dbAdapter.getVersions(path);
  }

  /**
   * 获取特定版本的文档
   */
  async getDocumentVersion(path: string, version: number): Promise<Document | null> {
    try {
      const result = await this.dbAdapter.loadDocument(path, version);
      if (!result) {
        return null;
      }

      const { data: frontmatter, content: markdownContent } = matter(result.content);
      const slug = this.pathToSlug(path);

      return {
        id: path,
        title: frontmatter.title || this.extractTitleFromContent(markdownContent) || this.getFileNameFromPath(path),
        content: markdownContent,
        path,
        slug,
        lastModified: new Date(result.metadata.lastModified),
        created: new Date(result.metadata.lastModified),
        frontmatter,
        version: result.version,
        status: frontmatter.status || 'published',
        isPublic: frontmatter.public !== false,
        author: frontmatter.author
      };
    } catch (error) {
      console.error(`获取文档版本失败: ${path}@${version}`, error);
      return null;
    }
  }

  // 辅助方法

  private pathToSlug(path: string): string[] {
    return path.replace(/\.md$/, '').split('/').filter(Boolean);
  }

  private slugToPath(slug: string[]): string {
    return slug.join('/') + '.md';
  }

  private extractTitleFromContent(content: string): string | null {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return trimmed.substring(2).trim();
      }
    }
    return null;
  }

  private getFileNameFromPath(path: string): string {
    const fileName = path.split('/').pop() || path;
    return fileName.replace('.md', '');
  }

  private sortTreeNodes(node: DocumentTree): void {
    if (!node.children) return;

    node.children.sort((a, b) => {
      // 目录优先
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    // 递归排序子节点
    for (const child of node.children) {
      this.sortTreeNodes(child);
    }
  }
}

// 导出单例实例
export const documentManager = new DocumentManager();
