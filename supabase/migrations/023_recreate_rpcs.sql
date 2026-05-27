-- Migration 023: Recreate get_wiki and get_wiki_data without custom_collections/collection_items
-- These RPCs referenced tables dropped in migration 021

-- =====================================================
-- Drop old functions (if they exist)
-- =====================================================
DROP FUNCTION IF EXISTS get_wiki;
DROP FUNCTION IF EXISTS get_wiki_data;

-- =====================================================
-- get_wiki — returns tenant + articles + collections([]) + article + search_results
-- =====================================================
CREATE OR REPLACE FUNCTION get_wiki(
    p_slug TEXT,
    p_article_slug TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_tenant_id UUID;
    v_tenant JSONB;
    v_articles JSONB;
    v_article JSONB;
    v_search_results JSONB;
BEGIN
    -- 1. Get tenant
    SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'slug', slug,
        'logo_url', logo_url,
        'description', description,
        'custom_domain', custom_domain,
        'theme', theme,
        'ai_enabled', ai_enabled,
        'ai_config', ai_config,
        'discord_config', discord_config,
        'is_public', is_public,
        'cover_image', cover_image,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO v_tenant
    FROM tenants
    WHERE slug = p_slug;

    IF v_tenant IS NULL THEN
        RETURN jsonb_build_object(
            'tenant', NULL::JSONB,
            'articles', '[]'::JSONB,
            'collections', '[]'::JSONB,
            'article', NULL::JSONB,
            'search_results', '[]'::JSONB
        );
    END IF;

    v_tenant_id := (v_tenant->>'id')::UUID;

    -- 2. Get all articles for tenant
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'slug', slug,
            'summary', summary,
            'content', content,
            'tags', tags,
            'image_url', image_url,
            'created_at', created_at,
            'updated_at', updated_at
        ) ORDER BY updated_at DESC NULLS LAST
    ), '[]'::JSONB) INTO v_articles
    FROM wiki_articles
    WHERE tenant_id = v_tenant_id;

    -- 3. Get single article if p_article_slug provided
    v_article := NULL;
    IF p_article_slug IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', id,
            'title', title,
            'slug', slug,
            'summary', summary,
            'content', content,
            'tags', tags,
            'image_url', image_url,
            'tables', tables,
            'created_at', created_at,
            'updated_at', updated_at
        ) INTO v_article
        FROM wiki_articles
        WHERE tenant_id = v_tenant_id AND slug = p_article_slug
        LIMIT 1;
    END IF;

    -- 4. Search if p_search provided
    v_search_results := '[]'::JSONB;
    IF p_search IS NOT NULL AND p_search <> '' THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'title', title,
                'slug', slug,
                'summary', summary,
                'content', content,
                'tags', tags,
                'image_url', image_url,
                'score', ts_rank(
                    to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')),
                    plainto_tsquery('portuguese', p_search)
                ),
                'match_type', 'fulltext'
            ) ORDER BY ts_rank(
                to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')),
                plainto_tsquery('portuguese', p_search)
            ) DESC
        ), '[]'::JSONB) INTO v_search_results
        FROM wiki_articles
        WHERE tenant_id = v_tenant_id
          AND to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')) @@ plainto_tsquery('portuguese', p_search)
        LIMIT 20;
    END IF;

    RETURN jsonb_build_object(
        'tenant', v_tenant,
        'articles', v_articles,
        'collections', '[]'::JSONB,
        'article', v_article,
        'search_results', v_search_results
    );
END;
$$;

-- =====================================================
-- get_wiki_data — returns tenant + articles + search_results (supports embeddings)
-- =====================================================
CREATE OR REPLACE FUNCTION get_wiki_data(
    p_slug TEXT,
    p_search TEXT DEFAULT NULL,
    p_embedding TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_tenant_id UUID;
    v_tenant JSONB;
    v_articles JSONB;
    v_search_results JSONB;
    v_embedding_vector VECTOR(1536);
BEGIN
    -- 1. Get tenant
    SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'slug', slug,
        'logo_url', logo_url,
        'description', description,
        'custom_domain', custom_domain,
        'theme', theme,
        'ai_enabled', ai_enabled,
        'ai_config', ai_config,
        'discord_config', discord_config,
        'is_public', is_public,
        'cover_image', cover_image,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO v_tenant
    FROM tenants
    WHERE slug = p_slug;

    IF v_tenant IS NULL THEN
        RETURN jsonb_build_object(
            'tenant', NULL::JSONB,
            'articles', '[]'::JSONB,
            'search_results', '[]'::JSONB
        );
    END IF;

    v_tenant_id := (v_tenant->>'id')::UUID;

    -- 2. Get all articles for tenant
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'slug', slug,
            'summary', summary,
            'content', content,
            'tags', tags,
            'image_url', image_url,
            'created_at', created_at,
            'updated_at', updated_at
        ) ORDER BY updated_at DESC NULLS LAST
    ), '[]'::JSONB) INTO v_articles
    FROM wiki_articles
    WHERE tenant_id = v_tenant_id;

    -- 3. Search
    v_search_results := '[]'::JSONB;

    IF p_embedding IS NOT NULL AND p_embedding <> '' THEN
        -- Semantic search with embedding
        BEGIN
            v_embedding_vector := p_embedding::VECTOR(1536);

            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'title', title,
                    'slug', slug,
                    'summary', summary,
                    'content', content,
                    'tags', tags,
                    'image_url', image_url,
                    'score', 1 - (embedding <=> v_embedding_vector),
                    'match_type', 'semantic'
                ) ORDER BY (embedding <=> v_embedding_vector)
            ), '[]'::JSONB) INTO v_search_results
            FROM wiki_articles
            WHERE tenant_id = v_tenant_id
              AND embedding IS NOT NULL
            LIMIT 10;
        EXCEPTION WHEN OTHERS THEN
            v_search_results := '[]'::JSONB;
        END;
    ELSIF p_search IS NOT NULL AND p_search <> '' THEN
        -- Full-text search
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'title', title,
                'slug', slug,
                'summary', summary,
                'content', content,
                'tags', tags,
                'image_url', image_url,
                'score', ts_rank(
                    to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')),
                    plainto_tsquery('portuguese', p_search)
                ),
                'match_type', 'fulltext'
            ) ORDER BY ts_rank(
                to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')),
                plainto_tsquery('portuguese', p_search)
            ) DESC
        ), '[]'::JSONB) INTO v_search_results
        FROM wiki_articles
        WHERE tenant_id = v_tenant_id
          AND to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')) @@ plainto_tsquery('portuguese', p_search)
        LIMIT 20;
    END IF;

    RETURN jsonb_build_object(
        'tenant', v_tenant,
        'articles', v_articles,
        'search_results', v_search_results
    );
END;
$$;
