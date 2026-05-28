-- Migration 044: Make save_article_version() trigger resilient
-- Prevents trigger failures from rolling back the article upsert.
-- If versioning fails, the article save still succeeds and the error is logged.

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
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'save_article_version() failed for article %: % (SQLSTATE %)', NEW.id, SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$;
