import { NextRequest, NextResponse } from 'next/server';
import { searchDocs } from '@/lib/docs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = searchDocs(query);
    
    // Limit results and add preview
    const limitedResults = results.slice(0, 10).map(doc => ({
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      preview: doc.content.substring(0, 200) + '...',
      lastModified: doc.lastModified,
    }));

    return NextResponse.json({ 
      results: limitedResults,
      total: results.length 
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
