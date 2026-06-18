-- Migration 071: Fix all database linter warnings
--
-- Fixes:
--   25x function_search_path_mutable  — add SET search_path = 'public' to all functions
--    2x materialized_view_in_api      — revoke SELECT from anon/authenticated
--    1x public_bucket_allows_listing  — drop broad SELECT policy on game-items
--   14x rls_enabled_no_policy         — add policies to tables missing them
--
-- ============================================================
-- PART 1: function_search_path_mutable
-- Add SET search_path = 'public' to all 25 functions
-- ============================================================

-- 1. slugify (sql IMMUTABLE)
CREATE OR REPLACE FUNCTION public.slugify(text)
 RETURNS text
 LANGUAGE sql IMMUTABLE SET search_path = 'public'
AS $function$
  SELECT lower(regexp_replace(regexp_replace($1, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', 'g'));
$function$;

-- 2. get_wiki (plpgsql SECURITY DEFINER — critical: live version was missing search_path)
CREATE OR REPLACE FUNCTION public.get_wiki(p_slug text, p_article_slug text DEFAULT NULL::text, p_search text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $function$
DECLARE
    v_tenant_id UUID;
    v_tenant JSONB;
    v_articles JSONB;
    v_article JSONB;
    v_search_results JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', id, 'name', name, 'slug', slug, 'logo_url', logo_url,
        'description', description, 'custom_domain', custom_domain,
        'theme', theme, 'ai_enabled', ai_enabled, 'ai_config', ai_config,
        'discord_config', discord_config, 'is_public', is_public,
        'created_at', created_at, 'updated_at', updated_at
    ) INTO v_tenant FROM tenants WHERE slug = p_slug;

    IF v_tenant IS NULL THEN
        RETURN jsonb_build_object(
            'tenant', NULL::JSONB, 'articles', '[]'::JSONB,
            'collections', '[]'::JSONB, 'article', NULL::JSONB,
            'search_results', '[]'::JSONB
        );
    END IF;

    v_tenant_id := (v_tenant->>'id')::UUID;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id, 'title', title, 'slug', slug, 'summary', summary,
        'content', content, 'tags', tags, 'image_url', image_url,
        'created_at', created_at, 'updated_at', updated_at
    ) ORDER BY updated_at DESC NULLS LAST), '[]'::JSONB) INTO v_articles
    FROM wiki_articles WHERE tenant_id = v_tenant_id;

    v_article := NULL;
    IF p_article_slug IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', id, 'title', title, 'slug', slug, 'summary', summary,
            'content', content, 'tags', tags, 'image_url', image_url,
            'tables', tables, 'created_at', created_at, 'updated_at', updated_at
        ) INTO v_article FROM wiki_articles
        WHERE tenant_id = v_tenant_id AND slug = p_article_slug LIMIT 1;
    END IF;

    v_search_results := '[]'::JSONB;
    IF p_search IS NOT NULL AND p_search <> '' THEN
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'id', id, 'title', title, 'slug', slug, 'summary', summary,
            'content', content, 'tags', tags, 'image_url', image_url,
            'score', ts_rank(
                to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(content,'')),
                plainto_tsquery('portuguese', p_search)
            ),
            'match_type', 'fulltext'
        ) ORDER BY updated_at DESC NULLS LAST), '[]'::JSONB) INTO v_search_results
        FROM wiki_articles
        WHERE tenant_id = v_tenant_id
          AND to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(content,''))
              @@ plainto_tsquery('portuguese', p_search)
        LIMIT 20;
    END IF;

    RETURN jsonb_build_object(
        'tenant', v_tenant, 'articles', v_articles,
        'collections', '[]'::JSONB, 'article', v_article,
        'search_results', v_search_results
    );
END;
$function$;

-- 3. refresh_analytics_views (plpgsql)
CREATE OR REPLACE FUNCTION public.refresh_analytics_views()
 RETURNS void
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_page_views;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_chat_stats;
END;
$function$;

-- 4. notify_tenant_members (plpgsql)
CREATE OR REPLACE FUNCTION public.notify_tenant_members(p_tenant_id uuid, p_type text, p_title text, p_body text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb, p_link text DEFAULT NULL::text, p_exclude_user_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
BEGIN
    INSERT INTO notifications (user_id, tenant_id, type, title, body, metadata, link)
    SELECT tm.user_id, p_tenant_id, p_type, p_title, p_body, p_metadata, p_link
    FROM tenant_members tm
    WHERE tm.tenant_id = p_tenant_id
      AND (p_exclude_user_id IS NULL OR tm.user_id != p_exclude_user_id);
END;
$function$;

-- 5. save_article_version (plpgsql trigger)
CREATE OR REPLACE FUNCTION public.save_article_version()
 RETURNS trigger
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
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
$function$;

-- 6. update_last_version_summary (plpgsql)
CREATE OR REPLACE FUNCTION public.update_last_version_summary(p_article_id uuid, p_summary text)
 RETURNS void
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
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
$function$;

-- 7. update_chat_session_timestamp (plpgsql trigger)
CREATE OR REPLACE FUNCTION public.update_chat_session_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
BEGIN
    UPDATE chat_sessions
    SET updated_at = now(),
        message_count = message_count + 1
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$function$;

-- 8. auto_title_chat_session (plpgsql trigger)
CREATE OR REPLACE FUNCTION public.auto_title_chat_session()
 RETURNS trigger
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
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
$function$;

-- 9. update_user_streak (plpgsql trigger)
CREATE OR REPLACE FUNCTION public.update_user_streak()
 RETURNS trigger
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
DECLARE
    last_active TIMESTAMPTZ;
    current_streak INTEGER;
BEGIN
    SELECT last_active_at, streak_days INTO last_active, current_streak
    FROM profiles WHERE id = NEW.user_id;

    IF last_active IS NULL THEN
        UPDATE profiles SET streak_days = 1, last_active_at = now() WHERE id = NEW.user_id;
    ELSIF last_active::date = CURRENT_DATE THEN
        NULL;
    ELSIF last_active::date = CURRENT_DATE - 1 THEN
        UPDATE profiles SET streak_days = streak_days + 1, last_active_at = now() WHERE id = NEW.user_id;
    ELSE
        UPDATE profiles SET streak_days = 1, last_active_at = now() WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$function$;

-- 10. update_article_count (plpgsql trigger)
CREATE OR REPLACE FUNCTION public.update_article_count()
 RETURNS trigger
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET articles_count = articles_count + 1 WHERE id = NEW.created_by;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET articles_count = GREATEST(0, articles_count - 1) WHERE id = OLD.created_by;
    END IF;
    RETURN NULL;
END;
$function$;

-- 11. update_comment_count (plpgsql trigger)
CREATE OR REPLACE FUNCTION public.update_comment_count()
 RETURNS trigger
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET comments_count = comments_count + 1 WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$function$;

-- 12. update_reactions_received (plpgsql trigger)
CREATE OR REPLACE FUNCTION public.update_reactions_received()
 RETURNS trigger
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
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
$function$;

-- 13. check_and_award_badge (plpgsql — latest version with edits_made + notification)
CREATE OR REPLACE FUNCTION public.check_and_award_badge(p_user_id uuid, p_tenant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
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
$function$;

-- 14. is_game_table (sql STABLE — hybrid version from 059)
CREATE OR REPLACE FUNCTION public.is_game_table(t text)
 RETURNS boolean
 LANGUAGE sql STABLE SET search_path = 'public'
AS $function$
  SELECT t = ANY(ARRAY[
    'weapons', 'armors', 'enemies', 'bosses', 'rings',
    'potions', 'upgrades', 'worlds', 'codes', 'crafting_recipes',
    'resources', 'build_presets'
  ]) OR EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = t
      AND column_name = 'tenant_id'
      AND t NOT IN (
        'tenants', 'tenant_members', 'tenant_game_tables',
        'tenant_templates', 'wiki_articles', 'user_preferences',
        'chat_sessions', 'chat_messages', 'content_suggestions',
        'negative_feedback', 'saved_answers', 'tenant_pages',
        'custom_collections', 'collection_items', 'notification_log',
        'discord_guilds', 'follows', 'votes', 'notifications',
        'article_versions', 'floating_islands', 'chat_invitations',
        'import_jobs', 'analytics_events', 'search_vectors'
      )
  );
$function$;

-- 15. is_valid_column_name (sql IMMUTABLE)
CREATE OR REPLACE FUNCTION public.is_valid_column_name(c text)
 RETURNS boolean
 LANGUAGE sql IMMUTABLE SET search_path = 'public'
AS $function$
  SELECT c ~ '^[a-z][a-z0-9_]{0,62}$';
$function$;

-- 16. is_system_column (sql IMMUTABLE)
CREATE OR REPLACE FUNCTION public.is_system_column(c text)
 RETURNS boolean
 LANGUAGE sql IMMUTABLE SET search_path = 'public'
AS $function$
  SELECT c = ANY(ARRAY['id', 'tenant_id', 'created_at', 'updated_at', 'embedding', 'slug']);
$function$;

-- 17. update_article_vote_reactions (plpgsql trigger)
CREATE OR REPLACE FUNCTION public.update_article_vote_reactions()
 RETURNS trigger
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
DECLARE
    target_author UUID;
BEGIN
    IF NEW.target_type = 'article' AND NEW.vote_type = 'up' THEN
        SELECT created_by INTO target_author FROM wiki_articles WHERE id = NEW.target_id::uuid;
        IF target_author IS NOT NULL THEN
            UPDATE profiles SET reactions_received = reactions_received + 1 WHERE id = target_author;
        END IF;
    END IF;
    RETURN NULL;
END;
$function$;

-- 18. remove_article_vote_reactions (plpgsql trigger)
CREATE OR REPLACE FUNCTION public.remove_article_vote_reactions()
 RETURNS trigger
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
DECLARE
    target_author UUID;
BEGIN
    IF OLD.target_type = 'article' AND OLD.vote_type = 'up' THEN
        SELECT created_by INTO target_author FROM wiki_articles WHERE id = OLD.target_id::uuid;
        IF target_author IS NOT NULL THEN
            UPDATE profiles SET reactions_received = GREATEST(0, reactions_received - 1) WHERE id = target_author;
        END IF;
    END IF;
    RETURN NULL;
END;
$function$;

-- 19. notify_wiki_followers (plpgsql)
CREATE OR REPLACE FUNCTION public.notify_wiki_followers(p_tenant_id uuid, p_type text, p_title text, p_body text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb, p_link text DEFAULT NULL::text, p_exclude_user_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
BEGIN
    INSERT INTO notifications (user_id, tenant_id, type, title, body, metadata, link)
    SELECT uf.user_id, p_tenant_id, p_type, p_title, p_body, p_metadata, p_link
    FROM user_follows uf
    WHERE uf.tenant_id = p_tenant_id
      AND (p_exclude_user_id IS NULL OR uf.user_id != p_exclude_user_id);
END;
$function$;

-- 20. trg_notify_followers_article (plpgsql trigger)
CREATE OR REPLACE FUNCTION public.trg_notify_followers_article()
 RETURNS trigger
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
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
$function$;

-- 21. is_game_table_dynamic (sql STABLE — extracted live from database; not in any migration file)
CREATE OR REPLACE FUNCTION public.is_game_table_dynamic(t text)
 RETURNS boolean
 LANGUAGE sql STABLE SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = t
      AND column_name = 'tenant_id'
      AND t NOT IN (
        'tenants', 'tenant_members', 'tenant_game_tables',
        'tenant_templates', 'wiki_articles', 'user_preferences',
        'chat_sessions', 'chat_messages', 'content_suggestions',
        'negative_feedback', 'saved_answers', 'tenant_pages',
        'custom_collections', 'collection_items', 'notification_log',
        'discord_guilds', 'follows', 'votes', 'notifications',
        'article_versions', 'floating_islands', 'chat_invitations',
        'import_jobs', 'analytics_events', 'search_vectors'
      )
  );
$function$;

-- 22. detect_parent_table (plpgsql STABLE)
CREATE OR REPLACE FUNCTION public.detect_parent_table(p_table text)
 RETURNS text
 LANGUAGE plpgsql STABLE SET search_path = 'public'
AS $function$
DECLARE
  parts TEXT[];
  candidate TEXT;
  i INT;
BEGIN
  IF p_table IS NULL OR p_table = '' THEN RETURN NULL; END IF;

  parts := string_to_array(p_table, '_');
  IF array_length(parts, 1) < 2 THEN RETURN NULL; END IF;

  FOR i IN REVERSE array_length(parts, 1) - 1 .. 1 LOOP
    candidate := array_to_string(parts[1:i], '_');
    IF candidate = p_table THEN CONTINUE; END IF;

    IF public.is_game_table(candidate) THEN
      RETURN candidate;
    END IF;

    IF public.is_game_table(candidate || 's') THEN
      RETURN candidate || 's';
    END IF;

    IF public.is_game_table(candidate || 'es') THEN
      RETURN candidate || 'es';
    END IF;

    IF candidate LIKE '%y' THEN
      DECLARE ies TEXT := left(candidate, -1) || 'ies';
      BEGIN
        IF public.is_game_table(ies) THEN
          RETURN ies;
        END IF;
      END;
    END IF;
  END LOOP;

  RETURN NULL;
END;
$function$;

-- 23. update_edit_count (plpgsql trigger)
CREATE OR REPLACE FUNCTION public.update_edit_count()
 RETURNS trigger
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
BEGIN
    IF NEW.created_by IS NOT NULL THEN
        UPDATE profiles
        SET edits_count = edits_count + 1
        WHERE id = NEW.created_by;
    END IF;
    RETURN NULL;
END;
$function$;

-- 24. trigger_badge_check (plpgsql trigger — latest with edits_count)
CREATE OR REPLACE FUNCTION public.trigger_badge_check()
 RETURNS trigger
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
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
$function$;

-- 25. execute_scheduled_actions (plpgsql)
CREATE OR REPLACE FUNCTION public.execute_scheduled_actions()
 RETURNS TABLE(action_id uuid, target_type text, target_id uuid)
 LANGUAGE plpgsql SET search_path = 'public'
AS $function$
BEGIN
    RETURN QUERY
    WITH updated AS (
        UPDATE scheduled_actions
        SET status = 'executed', executed_at = now()
        WHERE status = 'pending' AND scheduled_at <= now()
        RETURNING id, target_type, target_id
    )
    UPDATE wiki_articles wa
    SET status = 'published'
    FROM updated u
    WHERE u.target_type = 'article'
      AND u.target_id = wa.id
      AND wa.status = 'draft'
    RETURNING u.id, u.target_type, u.target_id;

    RETURN QUERY
    SELECT u.id, u.target_type, u.target_id
    FROM updated u
    WHERE u.target_type != 'article';
END;
$function$;


-- ============================================================
-- PART 2: materialized_view_in_api
-- Revoke SELECT on materialized views from anon and authenticated
-- ============================================================

REVOKE SELECT ON mv_daily_page_views FROM anon, authenticated;
REVOKE SELECT ON mv_daily_chat_stats FROM anon, authenticated;


-- ============================================================
-- PART 3: public_bucket_allows_listing
-- Drop broad SELECT policy on game-items bucket
-- Objects remain accessible via direct URL (bucket is public)
-- ============================================================

DROP POLICY IF EXISTS "Public read access on game-items" ON storage.objects;


-- ============================================================
-- PART 4: rls_enabled_no_policy
-- Add RLS policies to 14 tables that have RLS enabled but no policies
-- ============================================================

-- -------------------------------------------------------
-- 4a. Game static data (no tenant_id, shared across all wikis)
--     Public SELECT, service_role-only DML
-- -------------------------------------------------------

CREATE POLICY "Public read on ring_quality_tiers" ON ring_quality_tiers
  FOR SELECT USING (true);

CREATE POLICY "Public read on ring_stat_formulas" ON ring_stat_formulas
  FOR SELECT USING (true);

CREATE POLICY "Public read on spirit_capacity_synergy" ON spirit_capacity_synergy
  FOR SELECT USING (true);

CREATE POLICY "Public read on spirit_system_config" ON spirit_system_config
  FOR SELECT USING (true);

-- -------------------------------------------------------
-- 4b. article_versions — article version history
--     SELECT by original author or admin of article's tenant
--     INSERT/UPDATE/DELETE only via trigger (no API policies)
-- -------------------------------------------------------

CREATE POLICY "article_versions_select" ON article_versions
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM wiki_articles
      WHERE wiki_articles.id = article_versions.article_id
        AND is_tenant_member_with_role(wiki_articles.tenant_id, 'admin')
    )
  );

-- -------------------------------------------------------
-- 4c. push_subscriptions — user-owned push notification subscriptions
--     User can read/insert/delete their own
-- -------------------------------------------------------

CREATE POLICY "push_subscriptions_select" ON push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "push_subscriptions_insert" ON push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subscriptions_delete" ON push_subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- -------------------------------------------------------
-- 4d. sandbox_drafts — user-owned sandbox drafts
--     User CRUD own drafts; admin can read all in tenant
-- -------------------------------------------------------

CREATE POLICY "sandbox_drafts_select" ON sandbox_drafts
  FOR SELECT USING (
    user_id = auth.uid() OR
    is_tenant_member_with_role(tenant_id, 'admin')
  );

CREATE POLICY "sandbox_drafts_insert" ON sandbox_drafts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "sandbox_drafts_update" ON sandbox_drafts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "sandbox_drafts_delete" ON sandbox_drafts
  FOR DELETE USING (user_id = auth.uid());

-- -------------------------------------------------------
-- 4e. import_jobs — editor+ can manage
-- -------------------------------------------------------

CREATE POLICY "import_jobs_select" ON import_jobs
  FOR SELECT USING (is_tenant_member_with_role(tenant_id, 'editor'));

CREATE POLICY "import_jobs_insert" ON import_jobs
  FOR INSERT WITH CHECK (is_tenant_member_with_role(tenant_id, 'editor'));

CREATE POLICY "import_jobs_update" ON import_jobs
  FOR UPDATE USING (is_tenant_member_with_role(tenant_id, 'editor'));

CREATE POLICY "import_jobs_delete" ON import_jobs
  FOR DELETE USING (is_tenant_member_with_role(tenant_id, 'admin'));

-- -------------------------------------------------------
-- 4f. import_log — editor+ can view (no direct tenant_id; join via import_jobs)
-- -------------------------------------------------------

CREATE POLICY "import_log_select" ON import_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM import_jobs
      WHERE import_jobs.id = import_log.job_id
        AND is_tenant_member_with_role(import_jobs.tenant_id, 'editor')
    )
  );

-- -------------------------------------------------------
-- 4g. scheduled_actions — editor+ can manage
-- -------------------------------------------------------

CREATE POLICY "scheduled_actions_select" ON scheduled_actions
  FOR SELECT USING (is_tenant_member_with_role(tenant_id, 'editor'));

CREATE POLICY "scheduled_actions_insert" ON scheduled_actions
  FOR INSERT WITH CHECK (is_tenant_member_with_role(tenant_id, 'editor'));

CREATE POLICY "scheduled_actions_update" ON scheduled_actions
  FOR UPDATE USING (is_tenant_member_with_role(tenant_id, 'editor'));

CREATE POLICY "scheduled_actions_delete" ON scheduled_actions
  FOR DELETE USING (is_tenant_member_with_role(tenant_id, 'admin'));

-- -------------------------------------------------------
-- 4h. bot_config — global bot configuration (no tenant_id)
--     No direct API access; only service_role (server-side) may touch it
-- -------------------------------------------------------

CREATE POLICY "No direct API access for bot_config" ON bot_config
  FOR ALL USING (false);

-- -------------------------------------------------------
-- 4i. page_views — analytics; only wiki admins can view
-- -------------------------------------------------------

CREATE POLICY "page_views_select" ON page_views
  FOR SELECT USING (is_tenant_member_with_role(tenant_id, 'admin'));

-- -------------------------------------------------------
-- 4j. chat_logs — analytics; only wiki admins can view
-- -------------------------------------------------------

CREATE POLICY "chat_logs_select" ON chat_logs
  FOR SELECT USING (is_tenant_member_with_role(tenant_id, 'admin'));
