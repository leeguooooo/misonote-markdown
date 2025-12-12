import { NextRequest, NextResponse } from 'next/server';
import { searchDocs } from '@/core/docs/docs';
import { db } from '../../../../lib/db/operations';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  // 优先使用 PostgreSQL 全文检索；若数据库未升级则回退到文件系统搜索
  try {
    const rows = await db.query(`
      WITH latest_contents AS (
        SELECT DISTINCT ON (document_id)
          document_id,
          content_text
        FROM document_contents
        WHERE content_type = 'markdown'
        ORDER BY document_id, version_number DESC
      )
      SELECT
        d.id,
        d.title,
        d.file_path,
        d.updated_at,
        lc.content_text,
        ts_rank_cd(
          to_tsvector('simple', COALESCE(d.title, '') || ' ' || COALESCE(lc.content_text, '')),
          plainto_tsquery('simple', $1)
        ) AS rank
      FROM documents d
      JOIN latest_contents lc ON lc.document_id = d.id
      WHERE d.is_public = true
        AND to_tsvector('simple', COALESCE(d.title, '') || ' ' || COALESCE(lc.content_text, ''))
          @@ plainto_tsquery('simple', $1)
      ORDER BY rank DESC, d.updated_at DESC
      LIMIT 10
    `, [query]);

    const results = rows.map((row: any) => ({
      id: String(row.id),
      title: row.title || row.file_path?.split('/').pop()?.replace(/\.md$/, '') || 'Untitled',
      slug: String(row.file_path || '')
        .replace(/\.md$/, '')
        .split('/')
        .filter(Boolean),
      content: row.content_text ? String(row.content_text).substring(0, 400) : '',
      path: row.file_path,
      lastModified: new Date(row.updated_at),
      frontmatter: {}
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.warn('PG 全文检索不可用，回退到文件系统搜索:', error);

    try {
      const results = searchDocs(query)
        .slice(0, 10)
        .map(doc => ({
          id: doc.id,
          title: doc.title,
          slug: doc.slug,
          content: doc.content.substring(0, 400),
          path: doc.path,
          lastModified: doc.lastModified,
          frontmatter: doc.frontmatter
        }));

      return NextResponse.json({ results });
    } catch (fallbackError) {
      console.error('Search error:', fallbackError);
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      );
    }
  }
}
