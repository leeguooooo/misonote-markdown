import { NextRequest, NextResponse } from 'next/server';
import { getAllDocs } from '@/lib/docs';
import { authenticateRequest } from '@/lib/auth';

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

    const formattedDocs = docs.map(doc => ({
      name: `${doc.slug.join('/')}.md`,
      path: doc.slug.join('/'),
      content: doc.content,
      title: doc.title,
      lastModified: doc.lastModified,
      isNew: false
    }));

    return NextResponse.json({ docs: formattedDocs });
  } catch (error) {
    console.error('Get docs error:', error);
    return NextResponse.json(
      { error: 'Failed to get documents' },
      { status: 500 }
    );
  }
}
