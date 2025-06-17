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

    const body = await request.json();
    const { 
      format = 'zip', // 'markdown', 'json', 'zip'
      paths = [], // 要导出的文档路径，空数组表示全部
      includeMetadata = true,
      includeComments = false,
      includeAnnotations = false
    } = body;

    // 获取要导出的文档
    let documentsToExport;
    if (paths.length === 0) {
      // 导出所有文档
      documentsToExport = fileSystemManager.getFileSystemStructure()
        .filter(item => item.type === 'file');
    } else {
      // 导出指定文档
      documentsToExport = paths.map(path => 
        fileSystemManager.getFileSystemStructure()
          .find(item => item.path === path && item.type === 'file')
      ).filter(Boolean);
    }

    if (documentsToExport.length === 0) {
      return NextResponse.json(
        { error: '没有找到要导出的文档' },
        { status: 400 }
      );
    }

    // 根据格式处理导出
    switch (format) {
      case 'markdown':
        return await exportAsMarkdown(documentsToExport);
      
      case 'json':
        return await exportAsJSON(documentsToExport, includeMetadata, includeComments, includeAnnotations);
      
      case 'zip':
        return await exportAsZip(documentsToExport, includeMetadata, includeComments, includeAnnotations);
      
      default:
        return NextResponse.json(
          { error: '不支持的导出格式' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: '导出失败' },
      { status: 500 }
    );
  }
}

async function exportAsMarkdown(documents: any[]) {
  if (documents.length === 1) {
    // 单个文档直接返回markdown内容
    const doc = documents[0];
    // 确保文件名有 .md 后缀
    const filename = doc.name.endsWith('.md') ? doc.name : `${doc.name}.md`;
    return new NextResponse(doc.content, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } else {
    // 多个文档合并
    const combinedContent = documents.map(doc => {
      return `# ${doc.name.replace('.md', '')}\n\n${doc.content}\n\n---\n\n`;
    }).join('');

    return new NextResponse(combinedContent, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': 'attachment; filename="exported-documents.md"'
      }
    });
  }
}

async function exportAsJSON(documents: any[], includeMetadata: boolean, includeComments: boolean, includeAnnotations: boolean) {
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalDocuments: documents.length,
    format: 'misonote-json-v1',
    documents: documents.map(doc => ({
      name: doc.name,
      path: doc.path,
      content: doc.content,
      lastModified: doc.lastModified,
      metadata: includeMetadata ? doc.metadata : undefined,
      // TODO: 添加评论和注释数据
      comments: includeComments ? [] : undefined,
      annotations: includeAnnotations ? [] : undefined
    }))
  };

  return NextResponse.json(exportData, {
    headers: {
      'Content-Disposition': 'attachment; filename="misonote-export.json"'
    }
  });
}

async function exportAsZip(documents: any[], includeMetadata: boolean, includeComments: boolean, includeAnnotations: boolean) {
  const zip = new JSZip();

  // 添加文档文件
  documents.forEach(doc => {
    // 保持原始目录结构
    let relativePath = doc.path.startsWith('/') ? doc.path.slice(1) : doc.path;
    // 确保文件有 .md 后缀
    if (!relativePath.endsWith('.md')) {
      relativePath = `${relativePath}.md`;
    }
    zip.file(relativePath, doc.content);
  });

  // 添加元数据文件
  if (includeMetadata) {
    const metadata = {
      exportedAt: new Date().toISOString(),
      totalDocuments: documents.length,
      format: 'misonote-zip-v1',
      documents: documents.map(doc => ({
        name: doc.name,
        path: doc.path,
        lastModified: doc.lastModified,
        metadata: doc.metadata
      }))
    };
    zip.file('misonote-metadata.json', JSON.stringify(metadata, null, 2));
  }

  // 生成ZIP文件
  const zipContent = await zip.generateAsync({ type: 'uint8array' });

  return new NextResponse(zipContent, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="misonote-export.zip"'
    }
  });
}

// GET 方法用于获取导出选项
export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const documents = fileSystemManager.getFileSystemStructure()
      .filter(item => item.type === 'file');

    return NextResponse.json({
      totalDocuments: documents.length,
      supportedFormats: ['markdown', 'json', 'zip'],
      options: {
        includeMetadata: true,
        includeComments: false, // TODO: 实现后启用
        includeAnnotations: false // TODO: 实现后启用
      }
    });

  } catch (error) {
    console.error('Export options error:', error);
    return NextResponse.json(
      { error: '获取导出选项失败' },
      { status: 500 }
    );
  }
}