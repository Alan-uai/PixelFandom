-- Migration 063: Dynamic search_all — discovers tables via information_schema + is_game_table()
-- Replaces the hardcoded per-table CTEs from migration 033.
-- Any table with tenant_id + name/code/_name column is automatically searched.
-- Scoring uses column name heuristics: slug=20, name=12, description=6, other text cols=3.
-- Falls back gracefully if a table lacks expected columns.

SET search_path TO public, extensions;

DROP FUNCTION IF EXISTS search_all;

CREATE OR REPLACE FUNCTION search_all(
    p_tenant_slug TEXT,
    p_query TEXT,
    p_limit INT DEFAULT 20,
    p_embedding TEXT DEFAULT NULL
)
RETURNS TABLE(
    source_type TEXT,
    id UUID,
    title TEXT,
    slug TEXT,
    summary TEXT,
    content JSONB,
    raw_data JSONB,
    rank INT,
    image_url TEXT,
    tags TEXT[],
    item_stats JSONB,
    match_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, extensions'
AS $$
DECLARE
    v_tenant_id UUID;
    v_q TEXT;
    v_like_q TEXT;
    v_embedding_vector extensions.VECTOR(1536);
    v_has_vector BOOLEAN;
    v_table TEXT;
    v_name_col TEXT;
    v_slug_col TEXT;
    v_desc_col TEXT;
    v_image_col TEXT;
    v_has_embedding BOOLEAN;
    v_rank_cases TEXT[];
    v_filter_conds TEXT[];
    v_select_title TEXT;
    v_select_slug TEXT;
    v_select_desc TEXT;
    v_select_image TEXT;
    v_sql TEXT;
    v_col RECORD;
BEGIN
    v_q := COALESCE(TRIM(p_query), '');
    IF v_q = '' THEN RETURN; END IF;
    v_like_q := '%' || v_q || '%';

    SELECT id INTO v_tenant_id FROM tenants WHERE slug = p_tenant_slug;
    IF v_tenant_id IS NULL THEN RETURN; END IF;

    v_has_vector := FALSE;
    IF p_embedding IS NOT NULL AND p_embedding <> '' THEN
        BEGIN
            v_embedding_vector := p_embedding::extensions.VECTOR(1536);
            v_has_vector := TRUE;
        EXCEPTION WHEN OTHERS THEN
            v_has_vector := FALSE;
        END;
    END IF;

    CREATE TEMP TABLE IF NOT EXISTS _sad_results (
        source_type TEXT, id UUID, title TEXT, slug TEXT, summary TEXT,
        content JSONB, raw_data JSONB, rank INT, image_url TEXT,
        tags TEXT[], item_stats JSONB, match_type TEXT
    ) ON COMMIT DROP;
    DELETE FROM _sad_results;

    -- ═══════════════════════════════════════════════════════════
    -- 1. Wiki articles (fixed schema — no dynamic SQL needed)
    -- ═══════════════════════════════════════════════════════════
    INSERT INTO _sad_results
    SELECT 'wiki_article', a.id, a.title, a.slug, a.summary,
           to_jsonb(a.content), a.content::jsonb,
           CASE
               WHEN a.slug = v_q THEN 20
               WHEN a.title = v_q THEN 12
               WHEN a.title ILIKE v_like_q THEN 10
               WHEN a.slug ILIKE v_like_q THEN 8
               WHEN a.summary ILIKE v_like_q THEN 6
               WHEN a.content ILIKE v_like_q THEN 4
               WHEN EXISTS (SELECT 1 FROM unnest(a.tags) tag WHERE tag ILIKE v_like_q) THEN 3
               ELSE 0
           END,
           a.image_url, a.tags, NULL::JSONB, 'fulltext'
    FROM wiki_articles a
    WHERE a.tenant_id = v_tenant_id;

    IF v_has_vector THEN
        INSERT INTO _sad_results
        SELECT 'wiki_article', a.id, a.title, a.slug, a.summary,
               to_jsonb(a.content), a.content::jsonb,
               COALESCE((1 - (a.embedding <=> v_embedding_vector)) * 20, 0)::INT,
               a.image_url, a.tags, NULL::JSONB, 'semantic'
        FROM wiki_articles a
        WHERE a.tenant_id = v_tenant_id AND a.embedding IS NOT NULL
        ORDER BY a.embedding <=> v_embedding_vector
        LIMIT 20;
    END IF;

    -- ═══════════════════════════════════════════════════════════
    -- 2. Dynamic game tables — iterate & build per-table SQL
    -- ═══════════════════════════════════════════════════════════
    FOR v_table IN
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND is_game_table(t.table_name)
        ORDER BY t.table_name
    LOOP
        -- ── discover key columns ──
        SELECT c.column_name INTO v_name_col
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = v_table
          AND c.column_name IN ('name','item_name','title','world_name','resource_name','build_name','code')
        ORDER BY array_position(ARRAY['name','title','item_name','world_name','resource_name','build_name','code'], c.column_name)
        LIMIT 1;

        SELECT c.column_name INTO v_slug_col
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = v_table AND c.column_name = 'slug'
        LIMIT 1;

        SELECT c.column_name INTO v_desc_col
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = v_table
          AND c.column_name IN ('description','notes','summary','effect')
        ORDER BY array_position(ARRAY['description','notes','summary','effect'], c.column_name)
        LIMIT 1;

        SELECT c.column_name INTO v_image_col
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = v_table AND c.column_name = 'image_url'
        LIMIT 1;

        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_schema = 'public' AND c.table_name = v_table AND c.column_name = 'embedding'
        ) INTO v_has_embedding;

        -- ── build dynamic cases ──
        v_rank_cases := ARRAY[]::TEXT[];
        v_filter_conds := ARRAY[]::TEXT[];

        IF v_slug_col IS NOT NULL THEN
            v_rank_cases := v_rank_cases || format('WHEN %I = %L THEN 20', v_slug_col, v_q);
            v_rank_cases := v_rank_cases || format('WHEN %I::text ILIKE %L THEN 8', v_slug_col, v_like_q);
            v_filter_conds := v_filter_conds || format('%I::text ILIKE %L', v_slug_col, v_like_q);
        END IF;

        IF v_name_col IS NOT NULL THEN
            v_rank_cases := v_rank_cases || format('WHEN %I = %L THEN 12', v_name_col, v_q);
            v_rank_cases := v_rank_cases || format('WHEN %I::text ILIKE %L THEN 10', v_name_col, v_like_q);
            v_filter_conds := v_filter_conds || format('%I::text ILIKE %L', v_name_col, v_like_q);
        END IF;

        IF v_desc_col IS NOT NULL THEN
            v_rank_cases := v_rank_cases || format('WHEN %I::text ILIKE %L THEN 6', v_desc_col, v_like_q);
            v_filter_conds := v_filter_conds || format('%I::text ILIKE %L', v_desc_col, v_like_q);
        END IF;

        FOR v_col IN
            SELECT c.column_name
            FROM information_schema.columns c
            WHERE c.table_schema = 'public' AND c.table_name = v_table
              AND c.data_type IN ('text','character varying','character')
              AND NOT c.column_name = ANY(ARRAY['id','tenant_id','created_at','updated_at','embedding'])
              AND c.column_name <> ALL(ARRAY[COALESCE(v_slug_col,''), COALESCE(v_name_col,''), COALESCE(v_desc_col,'')])
            ORDER BY c.ordinal_position
        LOOP
            v_rank_cases := v_rank_cases || format('WHEN %I::text ILIKE %L THEN 3', v_col.column_name, v_like_q);
            v_filter_conds := v_filter_conds || format('%I::text ILIKE %L', v_col.column_name, v_like_q);
        END LOOP;

        IF array_length(v_filter_conds, 1) IS NULL THEN
            CONTINUE;
        END IF;

        -- Title / slug / desc / image select expressions
        v_select_title := COALESCE(v_name_col, 'id::text');
        v_select_slug := COALESCE(v_slug_col, v_name_col, 'id::text');
        v_select_desc := CASE WHEN v_desc_col IS NOT NULL THEN quote_ident(v_desc_col) ELSE 'NULL::TEXT' END;
        v_select_image := CASE WHEN v_image_col IS NOT NULL THEN quote_ident(v_image_col) ELSE 'NULL::TEXT' END;

        -- ── fulltext search ──
        v_sql := format(
            'INSERT INTO _sad_results
             SELECT ''game_item'', t.id,
               t.%s::TEXT,
               t.%s::TEXT,
               %s,
               NULL::JSONB,
               row_to_json(t.*)::JSONB,
               CASE %s ELSE 0 END,
               %s,
               NULL::TEXT[], NULL::JSONB, ''fulltext''
             FROM %I t
             WHERE t.tenant_id = %L
               AND (%s)',
            v_select_title,
            v_select_slug,
            v_select_desc,
            array_to_string(v_rank_cases, ' '),
            v_select_image,
            v_table,
            v_tenant_id,
            array_to_string(v_filter_conds, ' OR ')
        );

        BEGIN
            EXECUTE v_sql;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;

        -- ── semantic search ──
        IF v_has_vector AND v_has_embedding THEN
            v_sql := format(
                'INSERT INTO _sad_results
                 SELECT ''game_item'', t.id,
                   t.%s::TEXT,
                   t.%s::TEXT,
                   %s,
                   NULL::JSONB,
                   row_to_json(t.*)::JSONB,
                   COALESCE((1 - (t.embedding <=> %L::vector(1536))) * 20, 0)::INT,
                   %s,
                   NULL::TEXT[], NULL::JSONB, ''semantic''
                 FROM %I t
                 WHERE t.tenant_id = %L
                   AND t.embedding IS NOT NULL
                 ORDER BY t.embedding <=> %L::vector(1536)
                 LIMIT 20',
                v_select_title,
                v_select_slug,
                v_select_desc,
                p_embedding,
                v_select_image,
                v_table,
                v_tenant_id,
                p_embedding
            );

            BEGIN
                EXECUTE v_sql;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;
    END LOOP;

    -- ═══════════════════════════════════════════════════════════
    -- 3. Deduplicate & rank
    -- ═══════════════════════════════════════════════════════════
    RETURN QUERY
    SELECT DISTINCT ON (r.source_type, r.id)
           r.source_type, r.id, r.title, r.slug, r.summary,
           r.content, r.raw_data, r.rank, r.image_url,
           r.tags, r.item_stats, r.match_type
    FROM _sad_results r
    WHERE r.rank > 0
    ORDER BY r.source_type, r.id, r.rank DESC
    LIMIT p_limit;
END;
$$;
