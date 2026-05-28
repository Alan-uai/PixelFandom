-- Migration 036: Article versioning and drafts

ALTER TABLE wiki_articles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'archived'));

CREATE TABLE IF NOT EXISTS article_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    tags TEXT[],
    image_url TEXT,
    tables JSONB,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    change_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (article_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_article_versions_article
    ON article_versions (article_id, version_number DESC);

-- Auto-create version on article insert/update
CREATE OR REPLACE FUNCTION save_article_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_next_version := 1;
    ELSE
        SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
        FROM article_versions WHERE article_id = NEW.id;
    END IF;

    INSERT INTO article_versions (article_id, version_number, title, summary, content, tags, image_url, tables, created_by, change_summary)
    VALUES (NEW.id, v_next_version, NEW.title, NEW.summary, NEW.content, NEW.tags, NEW.image_url, NEW.tables, auth.uid(), 'Auto-saved');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_save_article_version ON wiki_articles;
CREATE TRIGGER trg_save_article_version
    AFTER INSERT OR UPDATE ON wiki_articles
    FOR EACH ROW EXECUTE FUNCTION save_article_version();

CREATE OR REPLACE FUNCTION update_last_version_summary(
    p_article_id UUID,
    p_summary TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE article_versions
    SET change_summary = p_summary
    WHERE id = (
        SELECT id FROM article_versions
        WHERE article_id = p_article_id
        ORDER BY version_number DESC
        LIMIT 1
    );
END;
$$;
