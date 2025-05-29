import fs from 'fs';
import path from 'path';

export interface FileOperation {
  type: 'move' | 'rename' | 'delete' | 'create' | 'copy';
  source: string;
  target?: string;
  content?: string;
}

export interface FileSystemNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  parentId?: string;
  children?: FileSystemNode[];
  isHidden?: boolean;
  metadata?: {
    size: number;
    lastModified: Date;
    created: Date;
    isHidden?: boolean;
  };
}

/**
 * 文件系统操作类
 * 提供安全的文件操作接口
 */
export class FileSystemManager {
  private basePath: string;

  constructor(basePath: string = path.join(process.cwd(), 'docs')) {
    this.basePath = basePath;
    this.ensureBaseDirectory();
  }

  private ensureBaseDirectory() {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  /**
   * 验证路径安全性
   */
  private validatePath(filePath: string): boolean {
    const resolvedPath = path.resolve(this.basePath, filePath);
    return resolvedPath.startsWith(this.basePath);
  }

  /**
   * 获取完整路径
   */
  private getFullPath(filePath: string): string {
    return path.join(this.basePath, filePath);
  }

  /**
   * 移动文件或目录
   */
  async moveFile(sourcePath: string, targetPath: string): Promise<void> {
    if (!this.validatePath(sourcePath) || !this.validatePath(targetPath)) {
      throw new Error('Invalid path');
    }

    const fullSourcePath = this.getFullPath(sourcePath);
    const fullTargetPath = this.getFullPath(targetPath);

    // 确保目标目录存在
    const targetDir = path.dirname(fullTargetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 检查源文件是否存在
    if (!fs.existsSync(fullSourcePath)) {
      throw new Error('Source file does not exist');
    }

    // 检查目标文件是否已存在
    if (fs.existsSync(fullTargetPath)) {
      throw new Error('Target file already exists');
    }

    fs.renameSync(fullSourcePath, fullTargetPath);
  }

  /**
   * 重命名文件或目录
   */
  async renameFile(filePath: string, newName: string): Promise<string> {
    if (!this.validatePath(filePath)) {
      throw new Error('Invalid path');
    }

    const fullPath = this.getFullPath(filePath);
    const directory = path.dirname(fullPath);
    const newPath = path.join(directory, newName);
    const relativePath = path.relative(this.basePath, newPath);

    if (fs.existsSync(newPath)) {
      throw new Error('File with new name already exists');
    }

    fs.renameSync(fullPath, newPath);
    return relativePath;
  }

  /**
   * 创建目录
   */
  async createDirectory(dirPath: string): Promise<void> {
    if (!this.validatePath(dirPath)) {
      throw new Error('Invalid path');
    }

    const fullPath = this.getFullPath(dirPath);
    fs.mkdirSync(fullPath, { recursive: true });
  }

  /**
   * 删除文件或目录
   */
  async deleteFile(filePath: string): Promise<void> {
    if (!this.validatePath(filePath)) {
      throw new Error('Invalid path');
    }

    const fullPath = this.getFullPath(filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error('File does not exist');
    }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }

    // 清理空的父目录
    this.cleanupEmptyDirectories(path.dirname(fullPath));
  }

  /**
   * 清理空目录
   */
  private cleanupEmptyDirectories(dirPath: string): void {
    if (dirPath === this.basePath) return;

    try {
      const files = fs.readdirSync(dirPath);
      if (files.length === 0) {
        fs.rmdirSync(dirPath);
        this.cleanupEmptyDirectories(path.dirname(dirPath));
      }
    } catch (error) {
      // 忽略错误，可能目录不为空或不存在
    }
  }

  /**
   * 复制文件
   */
  async copyFile(sourcePath: string, targetPath: string): Promise<void> {
    if (!this.validatePath(sourcePath) || !this.validatePath(targetPath)) {
      throw new Error('Invalid path');
    }

    const fullSourcePath = this.getFullPath(sourcePath);
    const fullTargetPath = this.getFullPath(targetPath);

    // 确保目标目录存在
    const targetDir = path.dirname(fullTargetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.copyFileSync(fullSourcePath, fullTargetPath);
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filePath: string): Promise<FileSystemNode> {
    if (!this.validatePath(filePath)) {
      throw new Error('Invalid path');
    }

    const fullPath = this.getFullPath(filePath);
    const stat = fs.statSync(fullPath);
    const name = path.basename(fullPath);

    return {
      id: filePath,
      name,
      path: filePath,
      type: stat.isDirectory() ? 'directory' : 'file',
      metadata: {
        size: stat.size,
        lastModified: stat.mtime,
        created: stat.birthtime,
      },
    };
  }

  /**
   * 检查路径是否存在
   */
  exists(filePath: string): boolean {
    if (!this.validatePath(filePath)) {
      return false;
    }
    return fs.existsSync(this.getFullPath(filePath));
  }

  /**
   * 生成唯一文件名
   */
  generateUniqueFileName(dirPath: string, baseName: string, extension: string = ''): string {
    let counter = 1;
    let fileName = baseName + extension;
    let fullPath = path.join(dirPath, fileName);

    while (this.exists(fullPath)) {
      fileName = `${baseName} (${counter})${extension}`;
      fullPath = path.join(dirPath, fileName);
      counter++;
    }

    return fileName;
  }

  /**
   * 验证文件名
   */
  validateFileName(fileName: string): boolean {
    // 检查非法字符
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(fileName)) {
      return false;
    }

    // 检查保留名称
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
    if (reservedNames.test(fileName)) {
      return false;
    }

    // 检查长度
    if (fileName.length === 0 || fileName.length > 255) {
      return false;
    }

    return true;
  }

  /**
   * 切换文件/文件夹的隐藏状态
   */
  async toggleHidden(filePath: string): Promise<void> {
    if (!this.validatePath(filePath)) {
      throw new Error('Invalid path');
    }

    const fullPath = this.getFullPath(filePath);
    const metadataPath = fullPath + '.metadata.json';

    let metadata: any = {};

    // 读取现有元数据
    if (fs.existsSync(metadataPath)) {
      try {
        const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
        metadata = JSON.parse(metadataContent);
      } catch (error) {
        // 如果元数据文件损坏，创建新的
        metadata = {};
      }
    }

    // 切换隐藏状态
    metadata.isHidden = !metadata.isHidden;
    metadata.lastModified = new Date().toISOString();

    // 保存元数据
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * 检查文件/文件夹是否隐藏
   */
  isHidden(filePath: string): boolean {
    if (!this.validatePath(filePath)) {
      return false;
    }

    const fullPath = this.getFullPath(filePath);
    const metadataPath = fullPath + '.metadata.json';

    if (!fs.existsSync(metadataPath)) {
      return false;
    }

    try {
      const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent);
      return metadata.isHidden === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取文件元数据
   */
  getMetadata(filePath: string): any {
    if (!this.validatePath(filePath)) {
      return {};
    }

    const fullPath = this.getFullPath(filePath);
    const metadataPath = fullPath + '.metadata.json';

    if (!fs.existsSync(metadataPath)) {
      return {};
    }

    try {
      const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
      return JSON.parse(metadataContent);
    } catch (error) {
      return {};
    }
  }
}

export const fileSystemManager = new FileSystemManager();
