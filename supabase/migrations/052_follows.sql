-- Migration 052: Follow system + card position notifications

-- Follows table
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_tenant ON user_follows (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_user ON user_follows (user_id);

-- RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read follows" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON user_follows FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow" ON user_follows FOR DELETE
    USING (auth.uid() = user_id);

-- Function: notify wiki followers
CREATE OR REPLACE FUNCTION notify_wiki_followers(
    p_tenant_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_body TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_link TEXT DEFAULT NULL,
    p_exclude_user_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO notifications (user_id, tenant_id, type, title, body, metadata, link)
    SELECT uf.user_id, p_tenant_id, p_type, p_title, p_body, p_metadata, p_link
    FROM user_follows uf
    WHERE uf.tenant_id = p_tenant_id
      AND (p_exclude_user_id IS NULL OR uf.user_id != p_exclude_user_id);
END;
$$;

-- Trigger: notify followers when article is created
CREATE OR REPLACE FUNCTION trg_notify_followers_article()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant_slug TEXT;
    v_article_slug TEXT;
BEGIN
    SELECT slug INTO v_tenant_slug FROM tenants WHERE id = NEW.tenant_id;
    v_article_slug := COALESCE(NEW.slug, NEW.id::text);

    IF TG_OP = 'INSERT' THEN
        PERFORM notify_wiki_followers(
            NEW.tenant_id,
            'follow_new_article',
            'Novo artigo: ' || NEW.title,
            NULL,
            jsonb_build_object('article_id', NEW.id, 'article_slug', v_article_slug, 'tenant_slug', v_tenant_slug),
            '/w/' || v_tenant_slug || '/' || v_article_slug,
            NEW.created_by
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM notify_wiki_followers(
            NEW.tenant_id,
            'follow_article_update',
            'Artigo atualizado: ' || NEW.title,
            NULL,
            jsonb_build_object('article_id', NEW.id, 'article_slug', v_article_slug, 'tenant_slug', v_tenant_slug),
            '/w/' || v_tenant_slug || '/' || v_article_slug,
            NEW.created_by
        );
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_followers_on_article
    AFTER INSERT OR UPDATE ON wiki_articles
    FOR EACH ROW
    EXECUTE FUNCTION trg_notify_followers_article();

-- Add follow notification types (these already exist or are new)
-- Note: The CHECK constraint already has 'follow' type from earlier migration
-- We add follow_new_article and follow_article_update
-- First check if constraint needs updating
DO $$
DECLARE
    v_constraint_name TEXT;
BEGIN
    SELECT con.conname INTO v_constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'notifications'
      AND con.contype = 'c';

    IF v_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE notifications DROP CONSTRAINT %I', v_constraint_name);
    END IF;
END $$;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'article_created', 'article_updated', 'article_deleted',
        'member_invited', 'member_joined', 'member_left',
        'suggestion_submitted', 'suggestion_approved', 'suggestion_rejected',
        'ai_feedback_reviewed', 'import_completed',
        'domain_verified', 'domain_failed',
        'follow_new_article', 'follow_article_update'
    ));
