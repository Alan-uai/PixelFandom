CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

ALTER TABLE collection_items ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS idx_collection_items_embedding
  ON collection_items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE OR REPLACE FUNCTION search_collection_items(
  p_tenant_slug TEXT,
  p_embedding vector(1536) DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INT DEFAULT 5
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_tenant_id UUID;
  v_results JSONB;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = p_tenant_slug;
  IF v_tenant_id IS NULL THEN RETURN '[]'::jsonb; END IF;

  IF p_embedding IS NOT NULL THEN
    SELECT jsonb_agg(jsonb_build_object(
      'id', ci.id,
      'collection_id', ci.collection_id,
      'collection_name', cc.name,
      'collection_slug', cc.slug,
      'name', ci.data->>'name',
      'description', ci.data->>'description',
      'data', ci.data,
      'score', 1 - (ci.embedding <=> p_embedding),
      'match_type', 'semantic'
    ) ORDER BY ci.embedding <=> p_embedding)
    INTO v_results
    FROM collection_items ci
    JOIN custom_collections cc ON cc.id = ci.collection_id
    WHERE cc.tenant_id = v_tenant_id AND ci.embedding IS NOT NULL
    LIMIT p_limit;
  END IF;

  IF (v_results IS NULL OR v_results = '[]'::jsonb) AND p_search IS NOT NULL THEN
    SELECT jsonb_agg(jsonb_build_object(
      'id', ci.id,
      'collection_id', ci.collection_id,
      'collection_name', cc.name,
      'collection_slug', cc.slug,
      'name', ci.data->>'name',
      'description', ci.data->>'description',
      'data', ci.data,
      'score', 0,
      'match_type', 'fulltext'
    ))
    INTO v_results
    FROM collection_items ci
    JOIN custom_collections cc ON cc.id = ci.collection_id
    WHERE cc.tenant_id = v_tenant_id
      AND (ci.data->>'name' ILIKE '%' || p_search || '%'
        OR ci.data->>'description' ILIKE '%' || p_search || '%')
    LIMIT p_limit;
  END IF;

  RETURN COALESCE(v_results, '[]'::jsonb);
END;
$$;
