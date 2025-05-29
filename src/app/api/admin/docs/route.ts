import { NextRequest, NextResponse } from 'next/server';
import { getAllDocs } from '@/lib/docs';
import { authenticateRequest } from '@/lib/auth';
import { fileSystemManager } from '@/lib/file-operations';

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

    const docs = getAllDocs();

    const formattedDocs = docs.map(doc => {
      const docPath = doc.slug.join('/');
      return {
        name: `${docPath}.md`,
        path: docPath,
        content: doc.content,
        title: doc.title,
        lastModified: doc.lastModified,
        isNew: false,
        isHidden: fileSystemManager.isHidden(docPath),
        metadata: fileSystemManager.getMetadata(docPath)
      };
    });

    return NextResponse.json({ docs: formattedDocs });
  } catch (error) {
    console.error('Get docs error:', error);
    return NextResponse.json(
      { error: 'Failed to get documents' },
      { status: 500 }
    );
  }
}
