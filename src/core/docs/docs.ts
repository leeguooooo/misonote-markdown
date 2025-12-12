import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { docsCache } from './docs-cache';

// This module should only be used on the server side

export interface DocFile {
  id: string;
  title: string;
  content: string;
  path: string;
  slug: string[];
  lastModified: Date;
  frontmatter: Record<string, any>;
}

export interface DocTree {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DocTree[];
  file?: DocFile;
}

const DOCS_DIR = path.join(process.cwd(), 'docs');
const DOC_TREE_TTL_MS = 5000;

let cachedDocTree: DocTree | null = null;
let cachedDocTreeMtime: number | null = null;
let cachedDocTreeAt = 0;

export function getAllDocs(): DocFile[] {
  // 使用智能缓存获取所有文档
  return docsCache.getAllDocs();
}

export function getDocBySlug(slug: string[]): DocFile | null {
  // 直接使用缓存获取单个文档，避免扫描所有文档
  return docsCache.getDocBySlug(slug);
}

export function getDocTree(): DocTree {
  const now = Date.now();

  if (cachedDocTree && cachedDocTreeMtime !== null && now - cachedDocTreeAt < DOC_TREE_TTL_MS) {
    try {
      const stat = fs.statSync(DOCS_DIR);
      if (stat.mtime.getTime() === cachedDocTreeMtime) {
        return cachedDocTree;
      }
    } catch {
    }
  }

  function buildTree(dir: string, basePath: string[] = []): DocTree {
    const name = path.basename(dir);
    const items = fs.readdirSync(dir);
    const children: DocTree[] = [];

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        children.push(buildTree(fullPath, [...basePath, item]));
      } else if (item.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const { data: frontmatter, content: markdownContent } = matter(content);

        const slug = [...basePath, item.replace('.md', '')];
        const id = slug.join('/');

        const file: DocFile = {
          id,
          title: frontmatter.title || extractTitleFromContent(markdownContent) || item.replace('.md', ''),
          content: '',
          path: fullPath,
          slug,
          lastModified: stat.mtime,
          frontmatter,
        };

        children.push({
          name: item.replace('.md', ''),
          path: slug.join('/'), // 使用相对路径而不是绝对路径
          type: 'file',
          file,
        });
      }
    }

    // Sort children: directories first, then files
    children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      name,
      path: basePath.join('/'), // 使用相对路径而不是绝对路径
      type: 'directory',
      children,
    };
  }

  if (!fs.existsSync(DOCS_DIR)) {
    const emptyTree: DocTree = {
      name: 'docs',
      path: DOCS_DIR,
      type: 'directory',
      children: [],
    };

    cachedDocTree = emptyTree;
    cachedDocTreeMtime = null;
    cachedDocTreeAt = now;
    return emptyTree;
  }

  const tree = buildTree(DOCS_DIR);
  try {
    const stat = fs.statSync(DOCS_DIR);
    cachedDocTreeMtime = stat.mtime.getTime();
  } catch {
    cachedDocTreeMtime = null;
  }
  cachedDocTree = tree;
  cachedDocTreeAt = now;
  return tree;
}

function extractTitleFromContent(content: string): string | null {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.substring(2).trim();
    }
  }
  return null;
}

export function searchDocs(query: string): DocFile[] {
  if (!query.trim()) return [];

  const docs = getAllDocs();
  const searchTerm = query.toLowerCase();

  return docs.filter(doc => {
    const titleMatch = doc.title.toLowerCase().includes(searchTerm);
    const contentMatch = doc.content.toLowerCase().includes(searchTerm);
    return titleMatch || contentMatch;
  }).sort((a, b) => {
    // Prioritize title matches
    const aTitleMatch = a.title.toLowerCase().includes(searchTerm);
    const bTitleMatch = b.title.toLowerCase().includes(searchTerm);

    if (aTitleMatch && !bTitleMatch) return -1;
    if (!aTitleMatch && bTitleMatch) return 1;

    return a.title.localeCompare(b.title);
  });
}

// 启动时预热缓存与监听（仅服务端）
if (typeof window === 'undefined' && process.env.PREWARM_DOCS_CACHE !== 'false') {
  const globalAny = globalThis as any;
  if (!globalAny.__misonote_docs_prewarmed) {
    globalAny.__misonote_docs_prewarmed = true;

    try {
      docsCache.getAllDocs();
      getDocTree();

      const shouldWatch =
        process.env.ENABLE_DOCS_WATCHER === 'true' ||
        process.env.NODE_ENV !== 'production';

      if (shouldWatch) {
        docsCache.startWatching();
      }
    } catch (error) {
      console.warn('预热 docs 缓存失败:', error);
    }
  }
}
