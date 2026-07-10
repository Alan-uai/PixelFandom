-- Migration 079: Fix performance advisor warnings
--
-- Fixes:
--  46x auth_rls_initplan           — wrap auth.uid()/auth.role() in (SELECT ...)
--   4x multiple_permissive_policies — drop duplicate permissive policies
--   4x dashboard-created policies   — recreate with (SELECT auth.uid()) wrapping
--
-- ============================================================
-- PART 1: auth_rls_initplan
-- Replace auth.uid() with (SELECT auth.uid()) and auth.role()
-- with (SELECT auth.role()) in RLS policies so Postgres creates
-- an initplan that evaluates the function once per query instead
-- of once per row.
--
-- For detailed guidance, see:
--   https://supabase.com/docs/guides/database/postgres/row-level-security
--     #call-functions-with-select
-- ============================================================

-- ---------------------------------------------------------
-- 022: user_preferences
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "user_preferences_own" ON user_preferences;
CREATE POLICY "user_preferences_own" ON user_preferences
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ---------------------------------------------------------
-- 035: notifications
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- ---------------------------------------------------------
-- 035: activity_log (auth.uid() inside EXISTS subquery)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Members can view activity" ON activity_log;
CREATE POLICY "Members can view activity" ON activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = activity_log.tenant_id
        AND user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------
-- 039: chat_sessions (direct auth.uid())
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
  FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own chat sessions" ON chat_sessions;
CREATE POLICY "Users can create own chat sessions" ON chat_sessions
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
CREATE POLICY "Users can update own chat sessions" ON chat_sessions
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;
CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ---------------------------------------------------------
-- 039: chat_messages (auth.uid() inside EXISTS subquery)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can view messages from own sessions" ON chat_messages;
CREATE POLICY "Users can view messages from own sessions" ON chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE id = chat_messages.session_id
        AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert messages to own sessions" ON chat_messages;
CREATE POLICY "Users can insert messages to own sessions" ON chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE id = chat_messages.session_id
        AND user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------
-- 039: invitations (auth.uid() inside EXISTS)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Tenant admins can view invitations" ON invitations;
CREATE POLICY "Tenant admins can view invitations" ON invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = invitations.tenant_id
        AND user_id = (select auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Tenant admins can create invitations" ON invitations;
CREATE POLICY "Tenant admins can create invitations" ON invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = invitations.tenant_id
        AND user_id = (select auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Tenant admins can delete invitations" ON invitations;
CREATE POLICY "Tenant admins can delete invitations" ON invitations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = invitations.tenant_id
        AND user_id = (select auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------
-- 040: gamification (direct auth.uid())
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can earn badges" ON user_badges;
CREATE POLICY "Users can earn badges" ON user_badges
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create comments" ON article_comments;
CREATE POLICY "Users can create comments" ON article_comments
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON article_comments;
CREATE POLICY "Users can update own comments" ON article_comments
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON article_comments;
CREATE POLICY "Users can delete own comments" ON article_comments
  FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can react" ON article_reactions;
CREATE POLICY "Users can react" ON article_reactions
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can remove own reactions" ON article_reactions;
CREATE POLICY "Users can remove own reactions" ON article_reactions
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ---------------------------------------------------------
-- 050: tenant_templates (auth.uid() inside IN subquery)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their tenant templates" ON tenant_templates;
CREATE POLICY "Users can manage their tenant templates" ON tenant_templates
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members
      WHERE user_id = (select auth.uid())
      AND role IN ('owner', 'admin', 'editor')
    )
  );

-- ---------------------------------------------------------
-- 051: votes (direct auth.uid())
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can vote" ON votes;
CREATE POLICY "Users can vote" ON votes
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can remove own votes" ON votes;
CREATE POLICY "Users can remove own votes" ON votes
  FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own votes" ON votes;
CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ---------------------------------------------------------
-- 052: user_follows (direct auth.uid())
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can follow" ON user_follows;
CREATE POLICY "Users can follow" ON user_follows
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can unfollow" ON user_follows;
CREATE POLICY "Users can unfollow" ON user_follows
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ---------------------------------------------------------
-- 057: tenant_pages (auth.uid() inside EXISTS)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "tenant_pages_insert" ON tenant_pages;
CREATE POLICY "tenant_pages_insert" ON tenant_pages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = tenant_pages.tenant_id
        AND user_id = (select auth.uid())
        AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "tenant_pages_update" ON tenant_pages;
CREATE POLICY "tenant_pages_update" ON tenant_pages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = tenant_pages.tenant_id
        AND user_id = (select auth.uid())
        AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "tenant_pages_delete" ON tenant_pages;
CREATE POLICY "tenant_pages_delete" ON tenant_pages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = tenant_pages.tenant_id
        AND user_id = (select auth.uid())
        AND role IN ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------
-- 069: wiki_media (mixed direct + IN subquery)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "wiki_media_select" ON wiki_media;
CREATE POLICY "wiki_media_select" ON wiki_media
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "wiki_media_insert" ON wiki_media;
CREATE POLICY "wiki_media_insert" ON wiki_media
  FOR INSERT
  WITH CHECK (
    uploaded_by = (select auth.uid())
    AND tenant_id IN (
      SELECT tenant_id FROM tenant_members
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "wiki_media_delete" ON wiki_media;
CREATE POLICY "wiki_media_delete" ON wiki_media
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
    )
    OR uploaded_by = (select auth.uid())
  );

-- ---------------------------------------------------------
-- 071: article_versions (mixed direct + EXISTS)
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "article_versions_select" ON article_versions;
CREATE POLICY "article_versions_select" ON article_versions
  FOR SELECT
  USING (
    created_by = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM wiki_articles
      WHERE wiki_articles.id = article_versions.article_id
        AND is_tenant_member_with_role(wiki_articles.tenant_id, 'admin')
    )
  );

-- ---------------------------------------------------------
-- 071: push_subscriptions (direct auth.uid())
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "push_subscriptions_select" ON push_subscriptions;
CREATE POLICY "push_subscriptions_select" ON push_subscriptions
  FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "push_subscriptions_insert" ON push_subscriptions;
CREATE POLICY "push_subscriptions_insert" ON push_subscriptions
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "push_subscriptions_delete" ON push_subscriptions;
CREATE POLICY "push_subscriptions_delete" ON push_subscriptions
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ---------------------------------------------------------
-- 071: sandbox_drafts (direct auth.uid())
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "sandbox_drafts_select" ON sandbox_drafts;
CREATE POLICY "sandbox_drafts_select" ON sandbox_drafts
  FOR SELECT
  USING (user_id = (select auth.uid()) OR is_tenant_member_with_role(tenant_id, 'admin'));

DROP POLICY IF EXISTS "sandbox_drafts_insert" ON sandbox_drafts;
CREATE POLICY "sandbox_drafts_insert" ON sandbox_drafts
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "sandbox_drafts_update" ON sandbox_drafts;
CREATE POLICY "sandbox_drafts_update" ON sandbox_drafts
  FOR UPDATE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "sandbox_drafts_delete" ON sandbox_drafts;
CREATE POLICY "sandbox_drafts_delete" ON sandbox_drafts
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ---------------------------------------------------------
-- 075: security tables (auth.role() — wrap in SELECT)
-- ---------------------------------------------------------

-- ip_blocks
DROP POLICY IF EXISTS "ip_blocks_select" ON ip_blocks;
CREATE POLICY "ip_blocks_select" ON ip_blocks
  FOR SELECT
  USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "ip_blocks_insert" ON ip_blocks;
CREATE POLICY "ip_blocks_insert" ON ip_blocks
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role' OR (select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "ip_blocks_update" ON ip_blocks;
CREATE POLICY "ip_blocks_update" ON ip_blocks
  FOR UPDATE
  USING ((select auth.role()) = 'authenticated');

-- request_fingerprints
DROP POLICY IF EXISTS "fingerprints_select" ON request_fingerprints;
CREATE POLICY "fingerprints_select" ON request_fingerprints
  FOR SELECT
  USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "fingerprints_insert" ON request_fingerprints;
CREATE POLICY "fingerprints_insert" ON request_fingerprints
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role' OR (select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "fingerprints_update" ON request_fingerprints;
CREATE POLICY "fingerprints_update" ON request_fingerprints
  FOR UPDATE
  USING ((select auth.role()) = 'service_role' OR (select auth.role()) = 'authenticated');

-- threat_events
DROP POLICY IF EXISTS "threat_events_select" ON threat_events;
CREATE POLICY "threat_events_select" ON threat_events
  FOR SELECT
  USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "threat_events_insert" ON threat_events;
CREATE POLICY "threat_events_insert" ON threat_events
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role' OR (select auth.role()) = 'authenticated');

-- rate_limits
DROP POLICY IF EXISTS "rate_limits_select" ON rate_limits;
CREATE POLICY "rate_limits_select" ON rate_limits
  FOR SELECT
  USING ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "rate_limits_insert" ON rate_limits;
CREATE POLICY "rate_limits_insert" ON rate_limits
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "rate_limits_delete" ON rate_limits;
CREATE POLICY "rate_limits_delete" ON rate_limits
  FOR DELETE
  USING ((select auth.role()) = 'service_role');


-- ============================================================
-- PART 2: multiple_permissive_policies
-- Drop duplicate or excessively permissive policies that apply
-- to the same table + command + role combination.
--
-- Supabase performance advisor detects when >1 permissive
-- policy applies to the same role+action on a table, which
-- forces Postgres to OR them together — slower evaluation.
-- ============================================================

-- ---------------------------------------------------------
-- codes: Seed file creates short-named policies (codes_readable,
-- codes_insert, codes_update, codes_delete) that duplicate the
-- descriptive-named policies from migration 041. Drop the seed
-- duplicates — the 041 policies are the canonical ones.
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "codes_readable" ON codes;
DROP POLICY IF EXISTS "codes_insert" ON codes;
DROP POLICY IF EXISTS "codes_update" ON codes;
DROP POLICY IF EXISTS "codes_delete" ON codes;

-- ---------------------------------------------------------
-- invitations: Two SELECT policies — "Anyone can read" (USING true)
-- and "Tenant admins can view" (EXISTS check). Since USING(true)
-- already allows everything, the admin EXISTS check is redundant.
-- Combine into a single policy that preserves both intents.
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON invitations;
CREATE POLICY "Anyone can read invitation by token" ON invitations
  FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = invitations.tenant_id
          AND user_id = (select auth.uid())
          AND role IN ('owner', 'admin')
      )
    )
    OR (select auth.role()) IS NULL
  );

-- ---------------------------------------------------------
-- tenant_game_tables: Two SELECT policies — tenant_members_select_tgt
-- (is_tenant_member check) and public_select_tgt (is_public check).
-- Merge into a single policy.
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "tenant_members_select_tgt" ON tenant_game_tables;
DROP POLICY IF EXISTS "public_select_tgt" ON tenant_game_tables;
CREATE POLICY "tenant_members_select_tgt" ON tenant_game_tables
  FOR SELECT
  USING (
    is_tenant_member(tenant_id)
    OR
    EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id AND is_public = true)
  );

-- ---------------------------------------------------------
-- tenant_pages: Dashboard-created *_policy duplicates
-- (tenant_pages_insert_policy, tenant_pages_update_policy).
-- Drop them — migration 057 policies are the canonical ones.
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "tenant_pages_insert_policy" ON tenant_pages;
DROP POLICY IF EXISTS "tenant_pages_update_policy" ON tenant_pages;


-- ============================================================
-- PART 3: auth_rls_initplan — dashboard-created policies
-- These policies were created via the Supabase Dashboard (not
-- in migration files), so their definitions are inferred from
-- the policy names and table schemas.
--
-- Tables: tenant_members, saved_answers, tenants, content_suggestions
-- ============================================================

-- ---------------------------------------------------------
-- tenant_members: "Owners and admins can manage members"
-- Self-referential policy: the EXISTS subquery would normally
-- cause RLS recursion, so we use the SECURITY DEFINER function
-- is_tenant_member_with_role() which bypasses RLS internally.
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Owners and admins can manage members" ON tenant_members;
CREATE POLICY "Owners and admins can manage members" ON tenant_members
  FOR ALL
  USING (is_tenant_member_with_role(tenant_id, 'admin'))
  WITH CHECK (is_tenant_member_with_role(tenant_id, 'admin'));

-- ---------------------------------------------------------
-- saved_answers: "Users can read/insert/delete own saved answers"
-- Table has user_id column — policies check user owns the row.
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own saved answers" ON saved_answers;
CREATE POLICY "Users can read own saved answers" ON saved_answers
  FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own saved answers" ON saved_answers;
CREATE POLICY "Users can insert own saved answers" ON saved_answers
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own saved answers" ON saved_answers;
CREATE POLICY "Users can delete own saved answers" ON saved_answers
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ---------------------------------------------------------
-- tenants: "Authenticated users can create tenants"
-- Restrict INSERT to authenticated users only.
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;
CREATE POLICY "Authenticated users can create tenants" ON tenants
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'authenticated');

-- ---------------------------------------------------------
-- content_suggestions: "Users can insert suggestions to their tenant"
-- Any authenticated user can make suggestions for any Wiki.
-- No membership check — just authentication.
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert suggestions to their tenant" ON content_suggestions;
CREATE POLICY "Users can insert suggestions to their tenant" ON content_suggestions
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'authenticated');
