-- Migration 085: Add favicon_url and og_image to get_wiki RPC output
-- These columns were added in migration 045 but never included in the RPC's jsonb_build_object

CREATE OR REPLACE FUNCTION public.get_wiki(p_slug text, p_article_slug text DEFAULT NULL::text, p_search text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $function$
DECLARE
    v_tenant_id UUID;
    v_tenant JSONB;
    v_articles JSONB;
    v_article JSONB;
    v_search_results JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', id, 'name', name, 'slug', slug, 'logo_url', logo_url,
        'description', description, 'custom_domain', custom_domain,
        'theme', theme, 'ai_enabled', ai_enabled, 'ai_config', ai_config,
        'discord_config', discord_config, 'is_public', is_public,
        'cover_image', cover_image,
        'favicon_url', favicon_url,
        'og_image', og_image,
        'created_at', created_at, 'updated_at', updated_at
    ) INTO v_tenant FROM tenants WHERE slug = p_slug;

    IF v_tenant IS NULL THEN
        RETURN jsonb_build_object(
            'tenant', NULL::JSONB, 'articles', '[]'::JSONB,
            'collections', '[]'::JSONB, 'article', NULL::JSONB,
            'search_results', '[]'::JSONB
        );
    END IF;

    v_tenant_id := (v_tenant->>'id')::UUID;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id, 'title', title, 'slug', slug, 'summary', summary,
        'content', content, 'tags', tags, 'image_url', image_url,
        'created_at', created_at, 'updated_at', updated_at
    ) ORDER BY updated_at DESC NULLS LAST), '[]'::JSONB) INTO v_articles
    FROM wiki_articles WHERE tenant_id = v_tenant_id;

    v_article := NULL;
    IF p_article_slug IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', id, 'title', title, 'slug', slug, 'summary', summary,
            'content', content, 'tags', tags, 'image_url', image_url,
            'tables', tables, 'created_at', created_at, 'updated_at', updated_at
        ) INTO v_article FROM wiki_articles
        WHERE tenant_id = v_tenant_id AND slug = p_article_slug LIMIT 1;
    END IF;

    v_search_results := '[]'::JSONB;
    IF p_search IS NOT NULL AND p_search <> '' THEN
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', id, 'title', title, 'slug', slug, 'summary', summary,
            'content', content, 'tags', tags, 'image_url', image_url,
            'score', ts_rank(
                to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(content,'')),
                plainto_tsquery('portuguese', p_search)
            ),
            'match_type', 'fulltext'
        ) ORDER BY updated_at DESC NULLS LAST), '[]'::JSONB) INTO v_search_results
        FROM wiki_articles
        WHERE tenant_id = v_tenant_id
          AND to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(content,''))
              @@ plainto_tsquery('portuguese', p_search)
        LIMIT 20;
    END IF;

    RETURN jsonb_build_object(
        'tenant', v_tenant, 'articles', v_articles,
        'collections', '[]'::JSONB, 'article', v_article,
        'search_results', v_search_results
    );
END;
$function$;
