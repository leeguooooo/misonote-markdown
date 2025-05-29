import { NextResponse } from 'next/server';
import { getAllDocs } from '@/lib/docs';

export async function GET() {
  try {
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
