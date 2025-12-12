import fs from 'fs';
import path from 'path';
import { DocFile, DocTree } from './docs';

interface CacheEntry {
  data: any;
  lastModified: Date;
  filePath: string;
}

interface DirectoryCache {
  files: Map<string, CacheEntry>;
  lastScan: Date;
  directoryMtime: Date;
}

/**
 * 智能文档缓存管理器
 * 基于文件修改时间的缓存策略，只有文件真正变化时才重新读取
 */
class DocsCache {
  private cache = new Map<string, CacheEntry>();
  private directoryCache = new Map<string, DirectoryCache>();
  private readonly CACHE_TTL = 5000; // 5秒缓存过期时间
  private readonly DOCS_DIR = path.join(process.cwd(), 'docs');
  private watcher: fs.FSWatcher | null = null;

  /**
 * 检查文件是否需要重新读取
 */
  private needsRefresh(filePath: string, currentMtime: Date): boolean {
    const cached = this.cache.get(filePath);
    if (!cached) return true;

    // 检查文件修改时间
    return currentMtime.getTime() !== cached.lastModified.getTime();
  }

  /**
 * 检查目录是否需要重新扫描
 */
  private needsDirectoryScan(dirPath: string): boolean {
    const cached = this.directoryCache.get(dirPath);
    if (!cached) return true;

    try {
      const stat = fs.statSync(dirPath);
      const now = new Date();

      // 检查缓存是否过期
      if (now.getTime() - cached.lastScan.getTime() > this.CACHE_TTL) {
        return true;
      }

      // 检查目录修改时间
      return stat.mtime.getTime() !== cached.directoryMtime.getTime();
    } catch (error) {
      return true;
    }
  }

  /**
 * 获取单个文档（带缓存）
 */
  getDocBySlug(slug: string[]): DocFile | null {
    const filePath = path.join(this.DOCS_DIR, ...slug) + '.md';

    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const stat = fs.statSync(filePath);

      // 检查是否需要重新读取
      if (!this.needsRefresh(filePath, stat.mtime)) {
        const cached = this.cache.get(filePath);
        if (cached) {
          console.log(`📋 缓存命中: ${slug.join('/')}`);
          return cached.data as DocFile;
        }
      }

      // 重新读取文件
      console.log(`📖 重新读取: ${slug.join('/')}`);
      const content = fs.readFileSync(filePath, 'utf-8');
      const matter = require('gray-matter');
      const { data: frontmatter, content: markdownContent } = matter(content);

      const doc: DocFile = {
        id: slug.join('/'),
        title: frontmatter.title || this.extractTitleFromContent(markdownContent) || slug[slug.length - 1],
        content: markdownContent,
        path: filePath,
        slug,
        lastModified: stat.mtime,
        frontmatter,
      };

      // 更新缓存
      this.cache.set(filePath, {
        data: doc,
        lastModified: stat.mtime,
        filePath
      });

      return doc;
    } catch (error) {
      console.error(`读取文档失败: ${slug.join('/')}`, error);
      return null;
    }
  }

  /**
 * 获取所有文档（带缓存）
 */
  getAllDocs(): DocFile[] {
    if (!this.needsDirectoryScan(this.DOCS_DIR)) {
      const cached = this.directoryCache.get(this.DOCS_DIR);
      if (cached) {
        console.log('📋 目录缓存命中，返回所有文档');
        return Array.from(cached.files.values()).map(entry => entry.data);
      }
    }

    console.log('📖 重新扫描目录');
    const docs: DocFile[] = [];
    const files = new Map<string, CacheEntry>();

    const scanDirectory = (dir: string, basePath: string[] = []): void => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath, [...basePath, item]);
        } else if (item.endsWith('.md')) {
          const slug = [...basePath, item.replace('.md', '')];
          const doc = this.getDocBySlug(slug);
          if (doc) {
            docs.push(doc);
            files.set(fullPath, {
              data: doc,
              lastModified: stat.mtime,
              filePath: fullPath
            });
          }
        }
      }
    };

    scanDirectory(this.DOCS_DIR);

    // 更新目录缓存
    const dirStat = fs.statSync(this.DOCS_DIR);
    this.directoryCache.set(this.DOCS_DIR, {
      files,
      lastScan: new Date(),
      directoryMtime: dirStat.mtime
    });

    return docs;
  }

  /**
 * 清除缓存
 */
  clearCache(): void {
    this.cache.clear();
    this.directoryCache.clear();
    console.log('🗑️ 缓存已清除');
  }

  /**
   * 启动文档目录监听（开发/自建环境使用）
   */
  startWatching(): void {
    if (typeof window !== 'undefined' || this.watcher) return;
    if (process.env.DISABLE_DOCS_WATCHER === 'true') return;
    if (!fs.existsSync(this.DOCS_DIR)) return;

    try {
      this.watcher = fs.watch(this.DOCS_DIR, { recursive: true }, () => {
        this.clearCache();
      });
    } catch (error) {
      try {
        this.watcher = fs.watch(this.DOCS_DIR, () => {
          this.clearCache();
        });
      } catch (fallbackError) {
        console.warn('启动 docs 目录监听失败:', fallbackError);
      }
    }
  }

  /**
 * 清除特定文件的缓存
 */
  clearFileCache(filePath: string): void {
    this.cache.delete(filePath);
    console.log(`🗑️ 已清除文件缓存: ${filePath}`);
  }

  /**
 * 获取缓存统计信息
 */
  getCacheStats() {
    return {
      filesCached: this.cache.size,
      directoriesCached: this.directoryCache.size,
      cacheHitRate: this.calculateHitRate()
    };
  }

  private calculateHitRate(): number {
    // 这里可以实现更复杂的命中率计算
    return 0;
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
}

// 单例实例
export const docsCache = new DocsCache();
