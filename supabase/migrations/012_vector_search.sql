CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

ALTER TABLE wiki_articles ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE wiki_articles ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_wiki_articles_embedding
  ON wiki_articles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_wiki_articles_search
  ON wiki_articles USING GIN (search_vector);

CREATE OR REPLACE FUNCTION get_wiki_data(
  p_slug TEXT,
  p_search TEXT DEFAULT NULL,
  p_embedding vector(1536) DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_tenant_id UUID;
  v_result JSONB;
  v_search_results JSONB;
  v_articles JSONB;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = p_slug;
  IF v_tenant_id IS NULL THEN RETURN NULL; END IF;

  -- Parallel: search + articles list
  IF p_search IS NOT NULL AND p_embedding IS NOT NULL THEN
    WITH semantic AS (
      SELECT id, title, slug, summary, content, tags, image_url, updated_at,
             1 - (embedding <=> p_embedding) AS score, 'semantic' AS match_type
      FROM wiki_articles
      WHERE tenant_id = v_tenant_id AND embedding IS NOT NULL
      ORDER BY embedding <=> p_embedding LIMIT 10
    ),
    fallback AS (
      SELECT id, title, slug, summary, content, tags, image_url, updated_at,
             0 AS score, 'fulltext' AS match_type
      FROM wiki_articles
      WHERE tenant_id = v_tenant_id
        AND search_vector @@ plainto_tsquery('portuguese', p_search)
      LIMIT 10
    )
    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.score DESC)
    INTO v_search_results
    FROM (SELECT * FROM semantic UNION ALL SELECT * FROM fallback WHERE id NOT IN (SELECT id FROM semantic)) t;
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'id', a.id, 'title', a.title, 'slug', a.slug,
    'summary', a.summary, 'tags', a.tags, 'image_url', a.image_url,
    'updated_at', a.updated_at
  ) ORDER BY a.updated_at DESC)
  INTO v_articles
  FROM wiki_articles a WHERE a.tenant_id = v_tenant_id;

  SELECT jsonb_build_object(
    'tenant', row_to_json(t)::jsonb,
    'articles', COALESCE(v_articles, '[]'::jsonb),
    'search_results', COALESCE(v_search_results, '[]'::jsonb)
  ) INTO v_result
  FROM tenants t WHERE t.id = v_tenant_id;

  RETURN v_result;
END;
$$;
