-- Migration 066: Gamification — edits count trigger & badge-earned notifications

-- 1. Trigger to increment edits_count when a new article version is created
CREATE OR REPLACE FUNCTION update_edit_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.created_by IS NOT NULL THEN
        UPDATE profiles
        SET edits_count = edits_count + 1
        WHERE id = NEW.created_by;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_edit_count
    AFTER INSERT ON article_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_edit_count();

-- 2. Modify badge auto-award to also create a notification
-- First drop the old function & trigger (they have no dependencies)
DROP TRIGGER IF EXISTS trg_badge_check ON profiles;
DROP FUNCTION IF EXISTS trigger_badge_check();

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
            WHEN 'edits_made' THEN
                qualifies := profile.edits_count >= badge.criteria_value;
            ELSE
                qualifies := FALSE;
        END CASE;

        IF qualifies THEN
            INSERT INTO user_badges (user_id, badge_id, tenant_id)
            VALUES (p_user_id, badge.id, p_tenant_id)
            ON CONFLICT (user_id, badge_id) DO NOTHING;

            IF FOUND THEN
                INSERT INTO notifications (user_id, tenant_id, type, title, body, metadata)
                VALUES (
                    p_user_id,
                    p_tenant_id,
                    'badge_earned',
                    'Conquista desbloqueada! 🏆',
                    'Você ganhou o badge "' || badge.name || '"',
                    jsonb_build_object(
                        'badge_id', badge.id,
                        'badge_slug', badge.slug,
                        'badge_name', badge.name,
                        'badge_icon', badge.icon,
                        'rarity', badge.rarity
                    )
                );
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- 3. Re-create trigger with edits_count included
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
        OR NEW.edits_count != OLD.edits_count
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
