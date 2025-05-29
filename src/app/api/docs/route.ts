import { NextResponse } from 'next/server';
import { getAllDocs } from '@/lib/docs';
import { fileSystemManager } from '@/lib/file-operations';

export async function GET() {
  try {
    // 获取所有文档
    const docs = await getAllDocs();
    
    // 过滤隐藏文档（公共API不显示隐藏文档）
    const visibleDocs = docs.filter(doc => {
      const docPath = doc.slug.join('/');
      return !fileSystemManager.isHidden(docPath);
    });

    const formattedDocs = visibleDocs.map(doc => ({
      name: `${doc.slug.join('/')}.md`,
      path: doc.slug.join('/'),
      title: doc.title,
      lastModified: doc.lastModified,
      slug: doc.slug,
      excerpt: doc.content.substring(0, 200) + (doc.content.length > 200 ? '...' : '')
    }));

    return NextResponse.json({
      docs: formattedDocs,
      total: formattedDocs.length,
      message: '文档列表获取成功'
    });
  } catch (error) {
    console.error('获取文档列表失败:', error);
    return NextResponse.json(
      { error: '获取文档列表失败' },
      { status: 500 }
    );
  }
}
