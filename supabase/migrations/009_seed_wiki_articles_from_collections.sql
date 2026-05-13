-- =====================================================
-- SEED WIKI ARTICLES FROM COLLECTION ITEMS
-- Creates wiki_articles for the Pixel Blade tenant
-- from data stored in custom_collections/collection_items
-- =====================================================

DO $$
DECLARE
    pixel_tenant_id CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
    col RECORD;
    item RECORD;
    article_slug TEXT;
    article_title TEXT;
BEGIN
    FOR col IN
        SELECT id, slug, name
        FROM public.custom_collections
        WHERE tenant_id = pixel_tenant_id
    LOOP
        FOR item IN
            SELECT ci.id, ci.data
            FROM public.collection_items ci
            WHERE ci.collection_id = col.id
        LOOP
            -- Determine title: use 'name' field, then 'title', then 'world_name', then 'code', then collection name + index
            article_title := COALESCE(
                item.data->>'name',
                item.data->>'title',
                item.data->>'world_name',
                item.data->>'code',
                col.name || ' ' || substring(item.id::text, 1, 8)
            );

            -- Generate slug from title
            article_slug := lower(regexp_replace(article_title, '[^a-zA-Z0-9]+', '-', 'g'));
            article_slug := trim(BOTH '-' FROM article_slug);
            IF article_slug = '' THEN
                article_slug := col.slug || '-' || substring(item.id::text, 1, 8);
            END IF;

            -- Insert as wiki_article if not already exists (by slug + tenant_id)
            INSERT INTO public.wiki_articles (tenant_id, title, slug, content, summary, tags, created_at, updated_at)
            VALUES (
                pixel_tenant_id,
                article_title,
                article_slug,
                item.data::text,
                item.data->>'description',
                ARRAY[col.slug],
                COALESCE(item.created_at, NOW()),
                COALESCE(item.updated_at, NOW())
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- VERIFY
-- =====================================================

-- SELECT COUNT(*) AS wiki_articles_count FROM wiki_articles WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
