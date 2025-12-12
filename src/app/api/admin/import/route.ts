import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import { fileSystemManager } from '@/core/docs/file-operations';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    // 验证认证
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const options = formData.get('options') ? JSON.parse(formData.get('options') as string) : {};
    
    const {
      overwriteExisting = false,
      preservePaths = true,
      targetFolder = '',
      importMetadata = true
    } = options;

    if (!file) {
      return NextResponse.json(
        { error: '请选择要导入的文件' },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const fileName = file.name.toLowerCase();

    let importResult;

    if (fileName.endsWith('.md')) {
      // 导入单个Markdown文件
      importResult = await importMarkdownFile(file, targetFolder, overwriteExisting);
    } else if (fileName.endsWith('.json')) {
      // 导入JSON格式的导出文件
      importResult = await importJSONFile(fileBuffer, preservePaths, overwriteExisting, importMetadata);
    } else if (fileName.endsWith('.zip')) {
      // 导入ZIP格式的导出文件
      importResult = await importZipFile(fileBuffer, preservePaths, targetFolder, overwriteExisting, importMetadata);
    } else {
      return NextResponse.json(
        { error: '不支持的文件格式。支持的格式：.md, .json, .zip' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '导入完成',
      ...importResult
    });

  } catch (error) {
    console.error('Import error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `导入失败: ${message}` },
      { status: 500 }
    );
  }
}

async function importMarkdownFile(file: File, targetFolder: string, overwriteExisting: boolean) {
  const content = await file.text();
  const fileName = file.name;
  
  // 确保文件名以.md结尾
  const safeName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
  
  // 构建目标路径
  const targetPath = targetFolder ? `${targetFolder}/${safeName}` : safeName;
  
  // 检查文件是否已存在
  const existingFiles = fileSystemManager.getFileSystemStructure();
  const exists = existingFiles.some(item => item.path === targetPath && item.type === 'file');
  
  if (exists && !overwriteExisting) {
    throw new Error(`文件 ${targetPath} 已存在`);
  }

  // 保存文件
  try {
    await fileSystemManager.writeFile(targetPath, content);
    return {
      importedFiles: 1,
      skippedFiles: 0,
      overwrittenFiles: exists ? 1 : 0,
      files: [{ path: targetPath, action: exists ? 'overwritten' : 'created' }]
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`保存文件失败: ${message}`);
  }
}

async function importJSONFile(fileBuffer: ArrayBuffer, preservePaths: boolean, overwriteExisting: boolean, importMetadata: boolean) {
  const content = new TextDecoder().decode(fileBuffer);
  const importData = JSON.parse(content);
  
  // 验证JSON格式
  if (!importData.documents || !Array.isArray(importData.documents)) {
    throw new Error('无效的JSON格式，缺少documents数组');
  }

  const results: {
    importedFiles: number;
    skippedFiles: number;
    overwrittenFiles: number;
    files: Array<{
      path: string;
      action: 'created' | 'overwritten' | 'skipped' | 'error';
      error?: string;
    }>;
  } = {
    importedFiles: 0,
    skippedFiles: 0,
    overwrittenFiles: 0,
    files: []
  };

  const existingFiles = fileSystemManager.getFileSystemStructure();

  for (const doc of importData.documents) {
    if (!doc.content || !doc.path) {
      console.warn('跳过无效文档:', doc);
      results.skippedFiles++;
      continue;
    }

    const targetPath = preservePaths ? doc.path : doc.name || doc.path.split('/').pop();
    const exists = existingFiles.some(item => item.path === targetPath && item.type === 'file');

    if (exists && !overwriteExisting) {
      results.skippedFiles++;
      results.files.push({ path: targetPath, action: 'skipped' });
      continue;
    }

    try {
      await fileSystemManager.writeFile(targetPath, doc.content);
      
      if (exists) {
        results.overwrittenFiles++;
        results.files.push({ path: targetPath, action: 'overwritten' });
      } else {
        results.importedFiles++;
        results.files.push({ path: targetPath, action: 'created' });
      }
    } catch (error) {
      console.error(`保存文档失败 ${targetPath}:`, error);
      results.skippedFiles++;
      const message = error instanceof Error ? error.message : String(error);
      results.files.push({ path: targetPath, action: 'error', error: message });
    }
  }

  return results;
}

async function importZipFile(fileBuffer: ArrayBuffer, preservePaths: boolean, targetFolder: string, overwriteExisting: boolean, importMetadata: boolean) {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(fileBuffer);

  const results: {
    importedFiles: number;
    skippedFiles: number;
    overwrittenFiles: number;
    files: Array<{
      path: string;
      action: 'created' | 'overwritten' | 'skipped' | 'error';
      error?: string;
    }>;
  } = {
    importedFiles: 0,
    skippedFiles: 0,
    overwrittenFiles: 0,
    files: []
  };

  const existingFiles = fileSystemManager.getFileSystemStructure();

  // 处理ZIP中的每个文件
  for (const [filePath, zipEntry] of Object.entries(zipContent.files)) {
    if (zipEntry.dir) continue; // 跳过目录
    if (filePath === 'misonote-metadata.json') continue; // 跳过元数据文件

    // 只处理.md文件
    if (!filePath.toLowerCase().endsWith('.md')) {
      console.warn('跳过非Markdown文件:', filePath);
      continue;
    }

    const content = await zipEntry.async('text');
    
    // 确定目标路径
    let targetPath: string;
    if (preservePaths) {
      targetPath = targetFolder ? `${targetFolder}/${filePath}` : filePath;
    } else {
      const fileName = filePath.split('/').pop() || filePath;
      targetPath = targetFolder ? `${targetFolder}/${fileName}` : fileName;
    }

    const exists = existingFiles.some(item => item.path === targetPath && item.type === 'file');

    if (exists && !overwriteExisting) {
      results.skippedFiles++;
      results.files.push({ path: targetPath, action: 'skipped' });
      continue;
    }

    try {
      await fileSystemManager.writeFile(targetPath, content);
      
      if (exists) {
        results.overwrittenFiles++;
        results.files.push({ path: targetPath, action: 'overwritten' });
      } else {
        results.importedFiles++;
        results.files.push({ path: targetPath, action: 'created' });
      }
    } catch (error) {
      console.error(`保存文档失败 ${targetPath}:`, error);
      results.skippedFiles++;
      const message = error instanceof Error ? error.message : String(error);
      results.files.push({ path: targetPath, action: 'error', error: message });
    }
  }

  return results;
}

// GET 方法用于获取导入选项
export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      supportedFormats: ['.md', '.json', '.zip'],
      maxFileSize: '10MB',
      options: {
        overwriteExisting: false,
        preservePaths: true,
        targetFolder: '',
        importMetadata: true
      },
      description: {
        markdown: '导入单个Markdown文件',
        json: '导入JSON格式的文档集合',
        zip: '导入包含多个文档的ZIP文件'
      }
    });

  } catch (error) {
    console.error('Import options error:', error);
    return NextResponse.json(
      { error: '获取导入选项失败' },
      { status: 500 }
    );
  }
}
