-- Migration 039: Chat sessions persistence + invitations

-- Chat sessions (text + voice)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Nova conversa',
    provider TEXT NOT NULL DEFAULT 'text' CHECK (provider IN ('text', 'voice', 'hybrid')),
    model TEXT,
    voice_name TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    gemini_resumption_handle TEXT,
    metadata JSONB DEFAULT '{}',
    message_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_tenant
    ON chat_sessions (tenant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user
    ON chat_sessions (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status
    ON chat_sessions (tenant_id, status);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL DEFAULT '',
    provider TEXT DEFAULT 'text',
    citations JSONB DEFAULT '[]',
    feedback TEXT CHECK (feedback IN ('positive', 'negative')),
    feedback_updated_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session
    ON chat_messages (session_id, created_at ASC);

-- Function to update chat_sessions.updated_at on new message
CREATE OR REPLACE FUNCTION update_chat_session_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE chat_sessions
    SET updated_at = now(),
        message_count = message_count + 1
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_chat_session_updated
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_session_timestamp();

-- Function to auto-title session from first user message
CREATE OR REPLACE FUNCTION auto_title_chat_session()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.role = 'user' THEN
        UPDATE chat_sessions
        SET title = LEFT(NEW.content, 80)
        WHERE id = NEW.session_id
          AND title = 'Nova conversa'
          AND (SELECT COUNT(*) FROM chat_messages WHERE session_id = NEW.session_id AND role = 'user') <= 1;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_chat_auto_title
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION auto_title_chat_session();

-- Invitations
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token
    ON invitations (token);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant
    ON invitations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email
    ON invitations (email);

-- Add new notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'article_created', 'article_updated', 'article_deleted',
        'member_invited', 'member_joined', 'member_left',
        'suggestion_submitted', 'suggestion_approved', 'suggestion_rejected',
        'ai_feedback_reviewed', 'import_completed',
        'domain_verified', 'domain_failed',
        'invitation_created', 'invitation_accepted',
        'chat_message', 'mention'
    ));

-- RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Chat sessions: user sees own, tenant members see relevant
CREATE POLICY "Users can view own chat sessions"
    ON chat_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions"
    ON chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
    ON chat_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
    ON chat_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Chat messages: through session ownership
CREATE POLICY "Users can view messages from own sessions"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE id = chat_messages.session_id
              AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to own sessions"
    ON chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE id = chat_messages.session_id
              AND user_id = auth.uid()
        )
    );

-- Invitations
CREATE POLICY "Tenant admins can view invitations"
    ON invitations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_id = invitations.tenant_id
              AND user_id = auth.uid()
              AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Tenant admins can create invitations"
    ON invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_id = invitations.tenant_id
              AND user_id = auth.uid()
              AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Tenant admins can delete invitations"
    ON invitations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_id = invitations.tenant_id
              AND user_id = auth.uid()
              AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Anyone can read invitation by token"
    ON invitations FOR SELECT
    USING (true);
