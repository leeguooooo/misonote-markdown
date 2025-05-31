import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import { fileSystemManager } from '@/core/docs/file-operations';

export async function GET(request: NextRequest) {
  try {
    // 验证认证
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 获取完整的文件系统结构（包括空文件夹）
    const fileSystemItems = fileSystemManager.getFileSystemStructure();

    // 转换为管理界面需要的格式
    const formattedItems = fileSystemItems.map(item => {
      if (item.type === 'file') {
        return {
          name: item.name,
          path: item.path,
          content: item.content,
          title: item.name.replace('.md', ''),
          lastModified: item.lastModified,
          isNew: false,
          isHidden: item.isHidden,
          metadata: item.metadata,
          type: 'file'
        };
      } else {
        return {
          name: item.name,
          path: item.path,
          content: '',
          title: item.name,
          lastModified: item.lastModified,
          isNew: false,
          isHidden: item.isHidden,
          metadata: item.metadata,
          type: 'folder'
        };
      }
    });

    return NextResponse.json({
      docs: formattedItems,
      total: formattedItems.length,
      message: '文件列表获取成功'
    });
  } catch (error) {
    console.error('Get docs error:', error);
    return NextResponse.json(
      { error: 'Failed to get documents' },
      { status: 500 }
    );
  }
}
