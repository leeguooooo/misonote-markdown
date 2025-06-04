/**
 * 数据库存储适配器
 * 实现文档的数据库存储操作
 */

import { StorageAdapter, StorageResult, StorageMetadata, StorageOptions, ListResult, DocumentStorage } from './storage-adapter';
import { db } from '../db/operations';
import * as crypto from 'crypto';
import matter from 'gray-matter';

export class DatabaseAdapter implements StorageAdapter, DocumentStorage {
  
  /**
   * 读取文件内容
   */
  async readFile(path: string, options?: { encoding?: 'utf8' | 'binary' }): Promise<string | Buffer> {
    try {
      const result = await db.queryOne(`
        SELECT content_text, content_data, encoding 
        FROM document_contents dc
        JOIN documents d ON dc.document_id = d.id
        WHERE d.file_path = $1 AND dc.content_type = 'markdown'
        ORDER BY dc.version_number DESC
        LIMIT 1
      `, [path]);
      
      if (!result) {
        throw new Error(`Document not found: ${path}`);
      }
      
      if (options?.encoding === 'binary' && result.content_data) {
        return Buffer.from(result.content_data);
      }
      
      return result.content_text || '';
    } catch (error) {
      console.error('Database read error:', error);
      throw error;
    }
  }
  
  /**
   * 写入文件内容
   */
  async writeFile(path: string, content: string | Buffer, options?: StorageOptions): Promise<StorageResult> {
    try {
      const contentStr = content instanceof Buffer ? content.toString('utf8') : content;
      const contentHash = this.calculateHash(contentStr);
      const contentSize = Buffer.byteLength(contentStr, 'utf8');
      
      // 解析frontmatter
      const { data: frontmatter, content: markdownContent } = matter(contentStr);
      const title = frontmatter.title || this.extractTitleFromContent(markdownContent) || this.getFileNameFromPath(path);
      
      return await db.transaction(async (client) => {
        // 1. 查找或创建文档记录
        let document = await client.query(`
          SELECT id, content_hash FROM documents WHERE file_path = $1
        `, [path]);
        
        let documentId: number;
        
        if (document.rows.length === 0) {
          // 创建新文档
          const insertResult = await client.query(`
            INSERT INTO documents (
              title, file_path, content_hash, file_size, 
              status, is_public, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, 'published', true, NOW(), NOW())
            RETURNING id
          `, [title, path, contentHash, contentSize]);
          
          documentId = insertResult.rows[0].id;
        } else {
          documentId = document.rows[0].id;
          
          // 检查内容是否有变化
          if (document.rows[0].content_hash === contentHash) {
            return {
              success: true,
              path,
              metadata: {
                size: contentSize,
                lastModified: new Date(),
                contentType: 'text/markdown',
                hash: contentHash
              }
            };
          }
          
          // 更新文档记录
          await client.query(`
            UPDATE documents 
            SET title = $1, content_hash = $2, file_size = $3, updated_at = NOW()
            WHERE id = $4
          `, [title, contentHash, contentSize, documentId]);
        }
        
        // 2. 获取下一个版本号
        const versionResult = await client.query(`
          SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
          FROM document_contents 
          WHERE document_id = $1
        `, [documentId]);
        
        const nextVersion = versionResult.rows[0].next_version;
        
        // 3. 保存文档内容
        await client.query(`
          INSERT INTO document_contents (
            id, document_id, content_type, content_data, content_text,
            version_number, created_at, metadata
          ) VALUES ($1, $2, 'markdown', $3, $4, $5, NOW(), $6)
        `, [
          crypto.randomUUID(),
          documentId,
          Buffer.from(contentStr, 'utf8'),
          contentStr,
          nextVersion,
          JSON.stringify({
            frontmatter,
            encoding: 'utf8',
            originalPath: path
          })
        ]);
        
        return {
          success: true,
          path,
          metadata: {
            size: contentSize,
            lastModified: new Date(),
            contentType: 'text/markdown',
            hash: contentHash,
            version: nextVersion
          }
        };
      });
    } catch (error) {
      console.error('Database write error:', error);
      return {
        success: false,
        path,
        error: error.message
      };
    }
  }
  
  /**
   * 检查文件是否存在
   */
  async exists(path: string): Promise<boolean> {
    try {
      const result = await db.queryOne(`
        SELECT 1 FROM documents WHERE file_path = $1
      `, [path]);
      
      return !!result;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 获取文件元数据
   */
  async getMetadata(path: string): Promise<StorageMetadata | null> {
    try {
      const result = await db.queryOne(`
        SELECT 
          d.file_size as size,
          d.updated_at as last_modified,
          d.created_at,
          d.content_hash,
          dc.version_number
        FROM documents d
        LEFT JOIN document_contents dc ON d.id = dc.document_id 
          AND dc.content_type = 'markdown'
        WHERE d.file_path = $1
        ORDER BY dc.version_number DESC
        LIMIT 1
      `, [path]);
      
      if (!result) {
        return null;
      }
      
      return {
        size: result.size || 0,
        lastModified: new Date(result.last_modified),
        contentType: 'text/markdown',
        hash: result.content_hash,
        version: result.version_number
      };
    } catch (error) {
      console.error('Get metadata error:', error);
      return null;
    }
  }
  
  /**
   * 删除文件
   */
  async deleteFile(path: string): Promise<boolean> {
    try {
      const result = await db.delete(`
        DELETE FROM documents WHERE file_path = $1
      `, [path]);
      
      return result > 0;
    } catch (error) {
      console.error('Delete file error:', error);
      return false;
    }
  }
  
  /**
   * 移动/重命名文件
   */
  async moveFile(sourcePath: string, targetPath: string): Promise<StorageResult> {
    try {
      const result = await db.update(`
        UPDATE documents 
        SET file_path = $1, updated_at = NOW()
        WHERE file_path = $2
      `, [targetPath, sourcePath]);
      
      if (result === 0) {
        return {
          success: false,
          path: targetPath,
          error: 'Source file not found'
        };
      }
      
      return {
        success: true,
        path: targetPath
      };
    } catch (error) {
      return {
        success: false,
        path: targetPath,
        error: error.message
      };
    }
  }
  
  /**
   * 复制文件
   */
  async copyFile(sourcePath: string, targetPath: string): Promise<StorageResult> {
    try {
      return await db.transaction(async (client) => {
        // 获取源文档
        const sourceDoc = await client.query(`
          SELECT * FROM documents WHERE file_path = $1
        `, [sourcePath]);
        
        if (sourceDoc.rows.length === 0) {
          throw new Error('Source document not found');
        }
        
        const source = sourceDoc.rows[0];
        
        // 创建新文档
        const newDocResult = await client.query(`
          INSERT INTO documents (
            title, file_path, content_hash, file_size,
            status, is_public, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id
        `, [
          source.title + ' (Copy)',
          targetPath,
          source.content_hash,
          source.file_size,
          source.status,
          source.is_public
        ]);
        
        const newDocId = newDocResult.rows[0].id;
        
        // 复制最新版本的内容
        const latestContent = await client.query(`
          SELECT * FROM document_contents 
          WHERE document_id = $1 AND content_type = 'markdown'
          ORDER BY version_number DESC
          LIMIT 1
        `, [source.id]);
        
        if (latestContent.rows.length > 0) {
          const content = latestContent.rows[0];
          await client.query(`
            INSERT INTO document_contents (
              id, document_id, content_type, content_data, content_text,
              version_number, created_at, metadata
            ) VALUES ($1, $2, $3, $4, $5, 1, NOW(), $6)
          `, [
            crypto.randomUUID(),
            newDocId,
            content.content_type,
            content.content_data,
            content.content_text,
            content.metadata
          ]);
        }
        
        return {
          success: true,
          path: targetPath
        };
      });
    } catch (error) {
      return {
        success: false,
        path: targetPath,
        error: error.message
      };
    }
  }
  
  /**
   * 列出目录内容
   */
  async listFiles(path: string, options?: { 
    recursive?: boolean; 
    limit?: number; 
    nextToken?: string;
    pattern?: string;
  }): Promise<ListResult> {
    try {
      let query = `
        SELECT 
          d.file_path,
          d.title,
          d.file_size,
          d.updated_at,
          d.created_at,
          d.status,
          d.is_public
        FROM documents d
        WHERE 1=1
      `;
      
      const params: any[] = [];
      
      if (path && path !== '/') {
        if (options?.recursive) {
          query += ` AND d.file_path LIKE $${params.length + 1}`;
          params.push(`${path}%`);
        } else {
          // 只获取直接子文件
          query += ` AND d.file_path LIKE $${params.length + 1} AND d.file_path NOT LIKE $${params.length + 2}`;
          params.push(`${path}/%`);
          params.push(`${path}/%/%`);
        }
      }
      
      if (options?.pattern) {
        query += ` AND d.file_path ILIKE $${params.length + 1}`;
        params.push(`%${options.pattern}%`);
      }
      
      query += ` ORDER BY d.file_path`;
      
      if (options?.limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(options.limit);
      }
      
      const results = await db.query(query, params);
      
      const files = results.map((row: any) => ({
        path: row.file_path,
        metadata: {
          size: row.file_size || 0,
          lastModified: new Date(row.updated_at),
          contentType: 'text/markdown'
        },
        isDirectory: false
      }));
      
      return {
        files,
        hasMore: false // 简化实现，后续可以添加分页
      };
    } catch (error) {
      console.error('List files error:', error);
      return {
        files: [],
        hasMore: false
      };
    }
  }
  
  /**
   * 创建目录 (数据库中不需要显式创建目录)
   */
  async createDirectory(path: string): Promise<boolean> {
    // 数据库存储中目录是隐式的，通过文件路径体现
    return true;
  }
  
  /**
   * 删除目录
   */
  async deleteDirectory(path: string, recursive?: boolean): Promise<boolean> {
    try {
      if (recursive) {
        const result = await db.delete(`
          DELETE FROM documents WHERE file_path LIKE $1
        `, [`${path}%`]);
        return result > 0;
      } else {
        // 检查是否有子文件
        const hasChildren = await db.queryOne(`
          SELECT 1 FROM documents WHERE file_path LIKE $1 LIMIT 1
        `, [`${path}/%`]);
        
        if (hasChildren) {
          throw new Error('Directory not empty');
        }
        
        return true;
      }
    } catch (error) {
      console.error('Delete directory error:', error);
      return false;
    }
  }
  
  /**
   * 获取存储统计信息
   */
  async getStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    usedSpace: number;
    availableSpace?: number;
  }> {
    try {
      const result = await db.queryOne(`
        SELECT 
          COUNT(*) as total_files,
          COALESCE(SUM(file_size), 0) as total_size
        FROM documents
      `);
      
      return {
        totalFiles: parseInt(result.total_files),
        totalSize: parseInt(result.total_size),
        usedSpace: parseInt(result.total_size)
      };
    } catch (error) {
      return {
        totalFiles: 0,
        totalSize: 0,
        usedSpace: 0
      };
    }
  }
  
  // DocumentStorage 接口实现
  
  async saveDocument(documentId: string, content: string, options?: {
    version?: number;
    contentType?: 'markdown' | 'yjs_update' | 'snapshot';
    metadata?: Record<string, any>;
  }) {
    const path = documentId.endsWith('.md') ? documentId : `${documentId}.md`;
    return await this.writeFile(path, content, options);
  }
  
  async loadDocument(documentId: string, version?: number) {
    const path = documentId.endsWith('.md') ? documentId : `${documentId}.md`;
    
    try {
      let query = `
        SELECT 
          dc.content_text as content,
          dc.version_number,
          dc.created_at,
          dc.metadata,
          d.title,
          d.file_size
        FROM document_contents dc
        JOIN documents d ON dc.document_id = d.id
        WHERE d.file_path = $1 AND dc.content_type = 'markdown'
      `;
      
      const params = [path];
      
      if (version) {
        query += ` AND dc.version_number = $2`;
        params.push(version);
      } else {
        query += ` ORDER BY dc.version_number DESC LIMIT 1`;
      }
      
      const result = await db.queryOne(query, params);
      
      if (!result) {
        return null;
      }
      
      return {
        content: result.content,
        metadata: {
          size: result.file_size || 0,
          lastModified: new Date(result.created_at),
          contentType: 'text/markdown',
          title: result.title
        },
        version: result.version_number
      };
    } catch (error) {
      console.error('Load document error:', error);
      return null;
    }
  }
  
  async saveYjsState(documentId: string, state: Uint8Array): Promise<boolean> {
    try {
      const path = documentId.endsWith('.md') ? documentId : `${documentId}.md`;
      
      await db.query(`
        INSERT INTO collaboration_states (id, document_id, yjs_state, last_sync_at)
        SELECT $1, d.id, $2, NOW()
        FROM documents d
        WHERE d.file_path = $3
        ON CONFLICT (document_id) 
        DO UPDATE SET yjs_state = $2, last_sync_at = NOW()
      `, [crypto.randomUUID(), state, path]);
      
      return true;
    } catch (error) {
      console.error('Save Yjs state error:', error);
      return false;
    }
  }
  
  async loadYjsState(documentId: string): Promise<Uint8Array | null> {
    try {
      const path = documentId.endsWith('.md') ? documentId : `${documentId}.md`;
      
      const result = await db.queryOne(`
        SELECT cs.yjs_state
        FROM collaboration_states cs
        JOIN documents d ON cs.document_id = d.id
        WHERE d.file_path = $1
      `, [path]);
      
      return result ? new Uint8Array(result.yjs_state) : null;
    } catch (error) {
      console.error('Load Yjs state error:', error);
      return null;
    }
  }
  
  async getVersions(documentId: string) {
    try {
      const path = documentId.endsWith('.md') ? documentId : `${documentId}.md`;
      
      const results = await db.query(`
        SELECT 
          dc.version_number as version,
          dc.created_at,
          dc.created_by,
          LENGTH(dc.content_text) as size,
          d.content_hash as hash
        FROM document_contents dc
        JOIN documents d ON dc.document_id = d.id
        WHERE d.file_path = $1 AND dc.content_type = 'markdown'
        ORDER BY dc.version_number DESC
      `, [path]);
      
      return results.map((row: any) => ({
        version: row.version,
        createdAt: new Date(row.created_at),
        createdBy: row.created_by,
        size: row.size,
        hash: row.hash
      }));
    } catch (error) {
      console.error('Get versions error:', error);
      return [];
    }
  }
  
  async createSnapshot(documentId: string, name?: string): Promise<string> {
    // 实现快照创建逻辑
    const snapshotId = crypto.randomUUID();
    // TODO: 实现快照逻辑
    return snapshotId;
  }
  
  async restoreSnapshot(documentId: string, snapshotId: string): Promise<boolean> {
    // 实现快照恢复逻辑
    // TODO: 实现恢复逻辑
    return true;
  }
  
  // 辅助方法
  
  private calculateHash(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
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
}
