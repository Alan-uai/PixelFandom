-- Migration 035: Notifications and activity log tables

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'article_created', 'article_updated', 'article_deleted',
        'member_invited', 'member_joined', 'member_left',
        'suggestion_submitted', 'suggestion_approved', 'suggestion_rejected',
        'ai_feedback_reviewed', 'import_completed',
        'domain_verified', 'domain_failed'
    )),
    title TEXT NOT NULL,
    body TEXT,
    metadata JSONB DEFAULT '{}',
    link TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications (user_id, read_at NULLS FIRST, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant
    ON notifications (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_name TEXT,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_tenant
    ON activity_log (tenant_id, created_at DESC);

-- Function to notify tenant members
CREATE OR REPLACE FUNCTION notify_tenant_members(
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
    SELECT tm.user_id, p_tenant_id, p_type, p_title, p_body, p_metadata, p_link
    FROM tenant_members tm
    WHERE tm.tenant_id = p_tenant_id
      AND (p_exclude_user_id IS NULL OR tm.user_id != p_exclude_user_id);
END;
$$;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Members can view activity"
    ON activity_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_id = activity_log.tenant_id
              AND user_id = auth.uid()
        )
    );
