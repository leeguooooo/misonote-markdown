#!/usr/bin/env tsx

/**
 * 文档迁移脚本
 * 将现有的文件系统文档迁移到数据库
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { DatabaseAdapter } from '../lib/storage/database-adapter';

interface MigrationStats {
  totalFiles: number;
  migratedFiles: number;
  skippedFiles: number;
  errorFiles: number;
  errors: Array<{ file: string; error: string }>;
}

class DocumentMigrator {
  private dbAdapter: DatabaseAdapter;
  private docsDir: string;
  private stats: MigrationStats;
  
  constructor() {
    this.dbAdapter = new DatabaseAdapter();
    
    this.docsDir = path.join(process.cwd(), 'docs');
    this.stats = {
      totalFiles: 0,
      migratedFiles: 0,
      skippedFiles: 0,
      errorFiles: 0,
      errors: []
    };
  }
  
  /**
   * 开始迁移
   */
  async migrate(options: {
    dryRun?: boolean;
    force?: boolean;
    verbose?: boolean;
  } = {}): Promise<MigrationStats> {
    const { dryRun = false, force = false, verbose = false } = options;
    
    console.log('🚀 开始文档迁移...');
    console.log(`📁 源目录: ${this.docsDir}`);
    console.log(`🔄 模式: ${dryRun ? '预览模式' : '实际迁移'}`);
    console.log('');
    
    if (!fs.existsSync(this.docsDir)) {
      throw new Error(`文档目录不存在: ${this.docsDir}`);
    }
    
    // 扫描所有markdown文件
    const files = await this.scanMarkdownFiles(this.docsDir);
    this.stats.totalFiles = files.length;
    
    console.log(`📊 发现 ${files.length} 个markdown文件`);
    console.log('');
    
    // 迁移每个文件
    for (const filePath of files) {
      try {
        await this.migrateFile(filePath, { dryRun, force, verbose });
      } catch (error) {
        this.stats.errorFiles++;
        this.stats.errors.push({
          file: filePath,
          error: error instanceof Error ? error.message : String(error)
        });
        
        if (verbose) {
          console.error(`❌ ${filePath}: ${error instanceof Error ? error.message : error}`);
        }
      }
    }
    
    // 输出统计信息
    this.printStats();
    
    return this.stats;
  }
  
  /**
   * 扫描markdown文件
   */
  private async scanMarkdownFiles(dir: string, basePath: string = ''): Promise<string[]> {
    const files: string[] = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = basePath ? `${basePath}/${item}` : item;
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 递归扫描子目录
        const subFiles = await this.scanMarkdownFiles(fullPath, relativePath);
        files.push(...subFiles);
      } else if (item.endsWith('.md')) {
        files.push(relativePath);
      }
    }
    
    return files;
  }
  
  /**
   * 迁移单个文件
   */
  private async migrateFile(relativePath: string, options: {
    dryRun: boolean;
    force: boolean;
    verbose: boolean;
  }): Promise<void> {
    const { dryRun, force, verbose } = options;
    const fullPath = path.join(this.docsDir, relativePath);
    
    if (verbose) {
      console.log(`🔄 处理: ${relativePath}`);
    }
    
    // 检查文档是否已存在
    if (!force) {
      const exists = await this.dbAdapter.exists(relativePath);
      if (exists) {
        this.stats.skippedFiles++;
        if (verbose) {
          console.log(`⏭️  跳过 (已存在): ${relativePath}`);
        }
        return;
      }
    }
    
    // 读取文件内容
    const content = fs.readFileSync(fullPath, 'utf8');
    const stat = fs.statSync(fullPath);
    
    // 解析frontmatter
    const { data: frontmatter, content: markdownContent } = matter(content);
    
    // 提取标题
    const title = frontmatter.title || this.extractTitleFromContent(markdownContent) || this.getFileNameFromPath(relativePath);
    
    // 构建完整的frontmatter
    const completeFrontmatter = {
      title,
      status: frontmatter.status || 'published',
      public: frontmatter.public !== false,
      created: frontmatter.created || stat.birthtime.toISOString(),
      updated: frontmatter.updated || stat.mtime.toISOString(),
      ...frontmatter
    };
    
    // 构建完整内容
    const fullContent = matter.stringify(markdownContent, completeFrontmatter);
    
    if (!dryRun) {
      // 实际写入数据库
      const result = await this.dbAdapter.writeFile(relativePath, fullContent);
      
      if (!result.success) {
        throw new Error(result.error || '写入数据库失败');
      }
    }
    
    this.stats.migratedFiles++;
    
    if (verbose) {
      console.log(`✅ ${dryRun ? '预览' : '迁移'}: ${relativePath} (${title})`);
    }
  }
  
  /**
   * 输出统计信息
   */
  private printStats(): void {
    console.log('');
    console.log('📊 迁移统计:');
    console.log(`   总文件数: ${this.stats.totalFiles}`);
    console.log(`   迁移成功: ${this.stats.migratedFiles}`);
    console.log(`   跳过文件: ${this.stats.skippedFiles}`);
    console.log(`   错误文件: ${this.stats.errorFiles}`);
    
    if (this.stats.errors.length > 0) {
      console.log('');
      console.log('❌ 错误详情:');
      for (const error of this.stats.errors) {
        console.log(`   ${error.file}: ${error.error}`);
      }
    }
    
    console.log('');
    if (this.stats.errorFiles === 0) {
      console.log('🎉 迁移完成！');
    } else {
      console.log('⚠️  迁移完成，但有部分文件失败');
    }
  }
  
  /**
   * 验证迁移结果
   */
  async verify(): Promise<{
    success: boolean;
    missingFiles: string[];
    extraFiles: string[];
  }> {
    console.log('🔍 验证迁移结果...');
    
    // 获取文件系统中的文件
    const fsFiles = await this.scanMarkdownFiles(this.docsDir);
    
    // 获取数据库中的文件
    const dbResult = await this.dbAdapter.listFiles('/', { recursive: true });
    const dbFiles = dbResult.files.map(f => f.path);
    
    // 比较差异
    const missingFiles = fsFiles.filter(f => !dbFiles.includes(f));
    const extraFiles = dbFiles.filter(f => !fsFiles.includes(f));
    
    console.log(`📁 文件系统: ${fsFiles.length} 个文件`);
    console.log(`💾 数据库: ${dbFiles.length} 个文件`);
    console.log(`❌ 缺失: ${missingFiles.length} 个文件`);
    console.log(`➕ 额外: ${extraFiles.length} 个文件`);
    
    if (missingFiles.length > 0) {
      console.log('缺失文件:', missingFiles);
    }
    
    if (extraFiles.length > 0) {
      console.log('额外文件:', extraFiles);
    }
    
    const success = missingFiles.length === 0 && extraFiles.length === 0;
    
    return {
      success,
      missingFiles,
      extraFiles
    };
  }
  
  // 辅助方法
  
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
  
  private getFileNameFromPath(filePath: string): string {
    const fileName = path.basename(filePath);
    return fileName.replace('.md', '');
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  const force = args.includes('--force') || args.includes('-f');
  const verbose = args.includes('--verbose') || args.includes('-v');
  const verify = args.includes('--verify');
  
  const migrator = new DocumentMigrator();
  
  try {
    if (verify) {
      await migrator.verify();
    } else {
      await migrator.migrate({ dryRun, force, verbose });
    }
  } catch (error) {
    console.error('💥 迁移失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

export { DocumentMigrator };
