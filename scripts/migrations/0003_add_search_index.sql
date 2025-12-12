-- 为文档搜索添加 PostgreSQL 全文检索索引（安全可重入）

DO $$
BEGIN
  IF to_regclass('public.documents') IS NOT NULL THEN
    EXECUTE $sql$
      CREATE INDEX IF NOT EXISTS idx_documents_title_fts
      ON documents
      USING GIN (to_tsvector('simple', COALESCE(title, '')))
    $sql$;
  END IF;

  IF to_regclass('public.document_contents') IS NOT NULL THEN
    EXECUTE $sql$
      CREATE INDEX IF NOT EXISTS idx_document_contents_fts
      ON document_contents
      USING GIN (to_tsvector('simple', COALESCE(content_text, '')))
      WHERE content_type = 'markdown'
    $sql$;
  END IF;
END $$;

