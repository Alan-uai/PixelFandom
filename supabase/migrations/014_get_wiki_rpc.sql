-- =====================================================
-- RPC: get_wiki — single-call loader for all wiki data
-- Returns tenant, articles, collections+items, article, search
-- =====================================================

CREATE OR REPLACE FUNCTION get_wiki(
  p_slug TEXT,
  p_article_slug TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant_id UUID;
  v_result JSONB;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = p_slug;
  IF v_tenant_id IS NULL THEN RETURN NULL; END IF;

  WITH
  tenant_data AS (
    SELECT row_to_json(t)::jsonb AS data
    FROM tenants t WHERE t.id = v_tenant_id
  ),
  articles_data AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', a.id,
      'title', a.title,
      'slug', a.slug,
      'summary', a.summary,
      'tags', a.tags,
      'image_url', a.image_url,
      'updated_at', a.updated_at
    ) ORDER BY a.updated_at DESC), '[]'::jsonb) AS data
    FROM wiki_articles a WHERE a.tenant_id = v_tenant_id
  ),
  collections_data AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'slug', c.slug,
      'description', c.description,
      'icon', c.icon,
      'item_count', c.item_count,
      'items', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', i.id,
          'data', i.data,
          'created_at', i.created_at,
          'updated_at', i.updated_at
        ) ORDER BY i.created_at)
        FROM collection_items i WHERE i.collection_id = c.id
      ), '[]'::jsonb)
    ) ORDER BY c.name), '[]'::jsonb) AS data
    FROM custom_collections c WHERE c.tenant_id = v_tenant_id
  ),
  article_data AS (
    SELECT row_to_json(a)::jsonb AS data
    FROM wiki_articles a
    WHERE a.tenant_id = v_tenant_id
      AND a.slug = p_article_slug
    LIMIT 1
  ),
  search_data AS (
    SELECT COALESCE(jsonb_agg(row_to_json(a)::jsonb ORDER BY a.updated_at DESC), '[]'::jsonb) AS data
    FROM wiki_articles a
    WHERE a.tenant_id = v_tenant_id
      AND p_search IS NOT NULL
      AND p_search != ''
      AND (
        a.title ILIKE '%' || p_search || '%'
        OR a.summary ILIKE '%' || p_search || '%'
        OR a.content ILIKE '%' || p_search || '%'
      )
    LIMIT 30
  )
  SELECT jsonb_build_object(
    'tenant', (SELECT data FROM tenant_data),
    'articles', (SELECT data FROM articles_data),
    'collections', (SELECT data FROM collections_data),
    'article', (SELECT data FROM article_data),
    'search_results', (SELECT data FROM search_data)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- =====================================================
-- Set aymatsu00@gmail.com as owner of pixel-blade
-- =====================================================

INSERT INTO tenant_members (tenant_id, user_id, role)
SELECT
  '00000000-0000-0000-0000-000000000001',
  id,
  'owner'
FROM auth.users
WHERE email = 'aymatsu00@gmail.com'
ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = 'owner';
