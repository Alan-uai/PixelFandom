-- =====================================================
-- ADD SLUG COLUMN TO WIKI_ARTICLES
-- Enables human-readable URLs for wiki pages
-- =====================================================

ALTER TABLE wiki_articles ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE INDEX IF NOT EXISTS idx_wiki_articles_slug_tenant ON wiki_articles(tenant_id, slug);

COMMENT ON COLUMN wiki_articles.slug IS 'URL-friendly identifier for the article, unique per tenant';
