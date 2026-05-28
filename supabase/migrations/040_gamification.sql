-- Migration 040: Gamification system (badges, comments, reactions, leaderboard)

-- Badges definitions
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT '🏆',
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
        'general', 'content', 'community', 'streak', 'milestone'
    )),
    criteria_type TEXT NOT NULL CHECK (criteria_type IN (
        'articles_created', 'comments_made', 'reactions_received',
        'reputation_points', 'streak_days', 'edits_made',
        'member_invited', 'manual'
    )),
    criteria_value INTEGER NOT NULL DEFAULT 1,
    rarity INTEGER NOT NULL DEFAULT 1 CHECK (rarity BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User earned badges
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges (user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges (badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_tenant ON user_badges (tenant_id);

-- Article comments (nested)
CREATE TABLE IF NOT EXISTS article_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES article_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    depth INTEGER NOT NULL DEFAULT 0,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_article ON article_comments (article_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON article_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON article_comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_tenant ON article_comments (tenant_id);

-- Reactions (on articles, comments)
CREATE TABLE IF NOT EXISTS article_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('article', 'comment')),
    target_id UUID NOT NULL,
    emoji TEXT NOT NULL DEFAULT '👍',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, target_type, target_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_target ON article_reactions (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON article_reactions (user_id);

-- Add gamification columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_days INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS articles_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS edits_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reactions_received INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();

-- Function to update streak
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    last_active TIMESTAMPTZ;
    current_streak INTEGER;
BEGIN
    SELECT last_active_at, streak_days INTO last_active, current_streak
    FROM profiles WHERE id = NEW.user_id;

    IF last_active IS NULL THEN
        UPDATE profiles SET streak_days = 1, last_active_at = now() WHERE id = NEW.user_id;
    ELSIF last_active::date = CURRENT_DATE THEN
        NULL; -- already active today
    ELSIF last_active::date = CURRENT_DATE - 1 THEN
        UPDATE profiles SET streak_days = streak_days + 1, last_active_at = now() WHERE id = NEW.user_id;
    ELSE
        UPDATE profiles SET streak_days = 1, last_active_at = now() WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger streak on new comment or article
CREATE TRIGGER trg_streak_on_comment
    AFTER INSERT ON article_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak();

-- Update article count
CREATE OR REPLACE FUNCTION update_article_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET articles_count = articles_count + 1 WHERE id = NEW.created_by;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET articles_count = GREATEST(0, articles_count - 1) WHERE id = OLD.created_by;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_article_count
    AFTER INSERT OR DELETE ON wiki_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_article_count();

-- Theme update on article content edit (we count TipTap edits via article_versions)
-- Comment count trigger
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET comments_count = comments_count + 1 WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_comment_count
    AFTER INSERT OR DELETE ON article_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_count();

-- Reactions count
CREATE OR REPLACE FUNCTION update_reactions_received()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    target_author UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.target_type = 'article' THEN
            SELECT created_by INTO target_author FROM wiki_articles WHERE id = NEW.target_id::uuid;
        ELSIF NEW.target_type = 'comment' THEN
            SELECT user_id INTO target_author FROM article_comments WHERE id = NEW.target_id::uuid;
        END IF;
        IF target_author IS NOT NULL THEN
            UPDATE profiles SET reactions_received = reactions_received + 1 WHERE id = target_author;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.target_type = 'article' THEN
            SELECT created_by INTO target_author FROM wiki_articles WHERE id = OLD.target_id::uuid;
        ELSIF OLD.target_type = 'comment' THEN
            SELECT user_id INTO target_author FROM article_comments WHERE id = OLD.target_id::uuid;
        END IF;
        IF target_author IS NOT NULL THEN
            UPDATE profiles SET reactions_received = GREATEST(0, reactions_received - 1) WHERE id = target_author;
        END IF;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_reactions_count
    AFTER INSERT OR DELETE ON article_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_reactions_received();

-- Auto-award badge function
CREATE OR REPLACE FUNCTION check_and_award_badge(
    p_user_id UUID,
    p_tenant_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    badge RECORD;
    profile RECORD;
    qualifies BOOLEAN;
BEGIN
    SELECT * INTO profile FROM profiles WHERE id = p_user_id;
    IF profile IS NULL THEN RETURN; END IF;

    FOR badge IN SELECT * FROM badges WHERE criteria_type != 'manual'
    LOOP
        qualifies := FALSE;
        CASE badge.criteria_type
            WHEN 'articles_created' THEN
                qualifies := profile.articles_count >= badge.criteria_value;
            WHEN 'comments_made' THEN
                qualifies := profile.comments_count >= badge.criteria_value;
            WHEN 'reactions_received' THEN
                qualifies := profile.reactions_received >= badge.criteria_value;
            WHEN 'reputation_points' THEN
                qualifies := profile.reputation_points >= badge.criteria_value;
            WHEN 'streak_days' THEN
                qualifies := profile.streak_days >= badge.criteria_value;
            ELSE
                qualifies := FALSE;
        END CASE;

        IF qualifies THEN
            INSERT INTO user_badges (user_id, badge_id, tenant_id)
            VALUES (p_user_id, badge.id, p_tenant_id)
            ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
    END LOOP;
END;
$$;

-- Trigger auto-badge check on profile update
CREATE OR REPLACE FUNCTION trigger_badge_check()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.articles_count != OLD.articles_count
        OR NEW.comments_count != OLD.comments_count
        OR NEW.reactions_received != OLD.reactions_received
        OR NEW.reputation_points != OLD.reputation_points
        OR NEW.streak_days != OLD.streak_days
    THEN
        PERFORM check_and_award_badge(NEW.id);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_badge_check
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_badge_check();

-- Seed badges
INSERT INTO badges (slug, name, description, icon, category, criteria_type, criteria_value, rarity) VALUES
    ('first-article', 'Primeiro Artigo', 'Criou seu primeiro artigo', '📝', 'content', 'articles_created', 1, 1),
    ('five-articles', 'Escritor', 'Criou 5 artigos', '✍️', 'content', 'articles_created', 5, 2),
    ('ten-articles', 'Autor', 'Criou 10 artigos', '📚', 'content', 'articles_created', 10, 3),
    ('twenty-five-articles', 'Enciclopedista', 'Criou 25 artigos', '📖', 'content', 'articles_created', 25, 4),
    ('first-comment', 'Primeira Palavra', 'Fez seu primeiro comentário', '💬', 'community', 'comments_made', 1, 1),
    ('ten-comments', 'Conversador', 'Fez 10 comentários', '🗣️', 'community', 'comments_made', 10, 2),
    ('fifty-comments', 'Comunitário', 'Fez 50 comentários', '👥', 'community', 'comments_made', 50, 3),
    ('first-like', 'Primeiro Like', 'Recebeu sua primeira reação', '👍', 'community', 'reactions_received', 1, 1),
    ('fifty-likes', 'Popular', 'Recebeu 50 reações', '🌟', 'community', 'reactions_received', 50, 3),
    ('hundred-likes', 'Celebridade', 'Recebeu 100 reações', '⭐', 'community', 'reactions_received', 100, 4),
    ('ten-rep', 'Iniciante', 'Alcançou 10 pontos de reputação', '🌱', 'general', 'reputation_points', 10, 1),
    ('fifty-rep', 'Contribuidor', 'Alcançou 50 pontos de reputação', '🌿', 'general', 'reputation_points', 50, 2),
    ('two-hundred-rep', 'Dedicado', 'Alcançou 200 pontos de reputação', '🌳', 'general', 'reputation_points', 200, 3),
    ('thousand-rep', 'Lendário', 'Alcançou 1000 pontos de reputação', '👑', 'general', 'reputation_points', 1000, 5),
    ('streak-3', 'Compromisso', 'Manteve streak de 3 dias', '🔥', 'streak', 'streak_days', 3, 1),
    ('streak-7', 'Dedicação Semanal', 'Manteve streak de 7 dias', '💪', 'streak', 'streak_days', 7, 2),
    ('streak-30', 'Maratona', 'Manteve streak de 30 dias', '🏃', 'streak', 'streak_days', 30, 4),
    ('streak-100', 'Imparável', 'Manteve streak de 100 dias', '⚡', 'streak', 'streak_days', 100, 5)
ON CONFLICT (slug) DO NOTHING;

-- Update notifications CHECK
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'article_created', 'article_updated', 'article_deleted',
        'member_invited', 'member_joined', 'member_left',
        'suggestion_submitted', 'suggestion_approved', 'suggestion_rejected',
        'ai_feedback_reviewed', 'import_completed',
        'domain_verified', 'domain_failed',
        'invitation_created', 'invitation_accepted',
        'chat_message', 'mention',
        'comment_added', 'comment_reply', 'reaction_added',
        'badge_earned', 'streak_milestone'
    ));

-- RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are public" ON badges FOR SELECT USING (true);
CREATE POLICY "User badges are public" ON user_badges FOR SELECT USING (true);
CREATE POLICY "Users can earn badges" ON user_badges FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comments are public to read" ON article_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON article_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON article_comments FOR UPDATE
    USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON article_comments FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Reactions are public" ON article_reactions FOR SELECT USING (true);
CREATE POLICY "Users can react" ON article_reactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON article_reactions FOR DELETE
    USING (auth.uid() = user_id);
