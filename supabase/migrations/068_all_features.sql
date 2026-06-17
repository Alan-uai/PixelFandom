-- Migration 068: All features — schedule, notifications, badges, sandbox, push
-- Single migration consolidating all DB changes for 12 features.

-- ============================================================
-- 1. Schedule (#1) — scheduled_at on wiki_articles + scheduled_actions
-- ============================================================
ALTER TABLE wiki_articles ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS scheduled_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id UUID,
    action TEXT NOT NULL DEFAULT 'publish',
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    executed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_scheduled_actions_tenant_status
    ON scheduled_actions (tenant_id, status, scheduled_at);

-- ============================================================
-- 18. Badges visuals (#18) — extra columns for rarity visuals
-- ============================================================
ALTER TABLE badges ADD COLUMN IF NOT EXISTS rarity_color TEXT;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS rarity_icon TEXT;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS animation_url TEXT;

-- ============================================================
-- 8. Push subscriptions (#8)
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, endpoint)
);

-- ============================================================
-- 8. Notification channels preference in user_preferences
-- ============================================================
-- user_preferences already has a JSONB preferences column.
-- We just ensure the default channel config is set.
-- Notification channels are stored in preferences->'notification_channels'
-- with defaults: {"push": true, "email": false, "in_app": true}

-- ============================================================
-- 13. Sandbox drafts (#13)
-- ============================================================
CREATE TABLE IF NOT EXISTS sandbox_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_drafts_tenant_user
    ON sandbox_drafts (tenant_id, user_id);

-- ============================================================
-- 20. Feedback loop — add reviewed_at and resolution to negative_feedback
-- ============================================================
ALTER TABLE negative_feedback ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE negative_feedback ADD COLUMN IF NOT EXISTS resolution TEXT;

-- ============================================================
-- 15. Export job tracking
-- ============================================================
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'import';
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS file_url TEXT;

-- ============================================================
-- Helpful view for dashboard analytics (#2)
-- ============================================================
CREATE OR REPLACE VIEW v_user_tenant_stats AS
SELECT
    tm.user_id,
    tm.tenant_id,
    t.name AS tenant_name,
    t.slug AS tenant_slug,
    t.logo_url,
    t.cover_image,
    t.custom_domain,
    t.description,
    tm.role,
    (SELECT COUNT(*) FROM wiki_articles wa WHERE wa.tenant_id = t.id) AS articles_count,
    (SELECT COUNT(*) FROM tenant_members tm2 WHERE tm2.tenant_id = t.id) AS members_count,
    (SELECT COUNT(*) FROM page_views pv WHERE pv.tenant_id = t.id AND pv.viewed_at > now() - interval '30 days') AS views_30d,
    (SELECT COUNT(*) FROM chat_logs cl WHERE cl.tenant_id = t.id AND cl.created_at > now() - interval '30 days') AS chats_30d
FROM tenant_members tm
JOIN tenants t ON t.id = tm.tenant_id;

-- ============================================================
-- RPC to execute scheduled actions (called by cron)
-- ============================================================
CREATE OR REPLACE FUNCTION execute_scheduled_actions()
RETURNS TABLE (action_id UUID, target_type TEXT, target_id UUID)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH updated AS (
        UPDATE scheduled_actions
        SET status = 'executed', executed_at = now()
        WHERE status = 'pending' AND scheduled_at <= now()
        RETURNING id, target_type, target_id
    )
    -- Publish articles
    UPDATE wiki_articles wa
    SET status = 'published'
    FROM updated u
    WHERE u.target_type = 'article'
      AND u.target_id = wa.id
      AND wa.status = 'draft'
    RETURNING u.id, u.target_type, u.target_id;

    -- Also return any actions that didn't match articles (e.g., table publish)
    RETURN QUERY
    SELECT u.id, u.target_type, u.target_id
    FROM updated u
    WHERE u.target_type != 'article';
END;
$$;
