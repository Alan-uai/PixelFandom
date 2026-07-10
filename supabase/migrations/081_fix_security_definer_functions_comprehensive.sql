-- Migration 081: Fix all SECURITY DEFINER function warnings (comprehensive)
--
-- The previous migrations (077, 078, 080) used REVOKE FROM anon/authenticated,
-- but that doesn't actually remove EXECUTE because all roles inherit EXECUTE
-- from the PUBLIC pseudo-role in PostgreSQL.
--
-- Correct approach:
--   1. REVOKE EXECUTE FROM PUBLIC for functions that should NOT be callable
--      via /rest/v1/rpc/ by anyone
--   2. For functions that authenticated users SHOULD be able to call,
--      REVOKE FROM PUBLIC then GRANT TO authenticated
--   3. For truly public functions (get_wiki, get_wiki_data, search_all,
--      is_tenant_member, etc.), keep PUBLIC grant — the warning is accepted.
--
-- ============================================================
-- PART 1: INTERNAL FUNCTIONS — no one should call via RPC
-- These are trigger functions, scheduled jobs, or internal housekeeping.
-- REVOKE FROM PUBLIC (removes from both anon and authenticated).
-- ============================================================

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public._drop_orphan_columns(p_table text) FROM PUBLIC;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.handle_embedding_generation() FROM PUBLIC;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.update_collection_item_embedding(p_id uuid, p_embedding extensions.vector) FROM PUBLIC;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.update_wiki_article_embedding(p_id uuid, p_embedding extensions.vector) FROM PUBLIC;
EXCEPTION WHEN others THEN NULL; END; $$;


-- ============================================================
-- PART 2: EDITOR / MANAGEMENT FUNCTIONS
-- These need SECURITY DEFINER (DDL operations, bypass RLS)
-- and must be callable by authenticated users, but NOT by anon.
-- REVOKE FROM PUBLIC, GRANT TO authenticated.
-- ============================================================

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.add_game_column(p_table text, p_column text, p_type text, p_tenant_id uuid) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.add_game_column(p_table text, p_column text, p_type text, p_tenant_id uuid) TO authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.drop_game_column(p_table text, p_column text, p_tenant_id uuid) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.drop_game_column(p_table text, p_column text, p_tenant_id uuid) TO authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.ensure_game_table(p_table text, p_tenant_id uuid, p_label text) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.ensure_game_table(p_table text, p_tenant_id uuid, p_label text) TO authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.ensure_game_table(p_table text, p_tenant_id uuid, p_label text, p_icon text) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.ensure_game_table(p_table text, p_tenant_id uuid, p_label text, p_icon text) TO authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.get_child_tables(p_table text, p_tenant_id uuid) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.get_child_tables(p_table text, p_tenant_id uuid) TO authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.get_game_schema() FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.get_game_schema() TO authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.get_table_columns(p_table text) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.get_table_columns(p_table text) TO authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.list_available_columns(p_table text) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.list_available_columns(p_table text) TO authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.list_available_tables(p_tenant_id uuid) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.list_available_tables(p_tenant_id uuid) TO authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.list_potential_parents(p_table text, p_tenant_id uuid) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.list_potential_parents(p_table text, p_tenant_id uuid) TO authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.remove_tenant_table(p_table text, p_tenant_id uuid) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.remove_tenant_table(p_table text, p_tenant_id uuid) TO authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.rename_tenant_table(p_old_name text, p_new_name text, p_tenant_id uuid, p_new_label text) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.rename_tenant_table(p_old_name text, p_new_name text, p_tenant_id uuid, p_new_label text) TO authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.rename_tenant_table(p_old_name text, p_new_name text, p_tenant_id uuid, p_new_label text, p_new_icon text) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.rename_tenant_table(p_old_name text, p_new_name text, p_tenant_id uuid, p_new_label text, p_new_icon text) TO authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.update_table_icon(p_table text, p_tenant_id uuid, p_icon text) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.update_table_icon(p_table text, p_tenant_id uuid, p_icon text) TO authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.update_table_parent(p_table text, p_tenant_id uuid, p_parent_table text) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.update_table_parent(p_table text, p_tenant_id uuid, p_parent_table text) TO authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;


-- ============================================================
-- PART 3: RLS HELPER FUNCTIONS
-- These are called by RLS policies, which run for ALL roles
-- including anon. They MUST keep PUBLIC EXECUTE.
-- No change — these warnings are accepted and reviewed.
--   - is_tenant_member(uuid)
--   - is_tenant_member_with_role(uuid, text)
--   - get_tenant_id_from_collection_item(uuid)
-- ============================================================


-- ============================================================
-- PART 4: PUBLIC FUNCTIONS
-- These are called by anon users (unauthenticated) from the
-- client-side frontend to load wiki pages, search, etc.
-- They MUST keep PUBLIC EXECUTE.
-- No change — these warnings are accepted and reviewed.
--   - get_wiki(text, text, text)
--   - get_wiki_data(text, text, text)
--   - search_all(text, text, int, text)
-- ============================================================


-- ============================================================
-- PART 5: auth_leaked_password_protection
-- Enable via Supabase Dashboard → Authentication → Settings
-- → Security → Enable "Leaked password protection"
--
-- This cannot be done via SQL in all Supabase versions.
-- If your version supports it, uncomment:
--
-- UPDATE auth.config SET enable_leaked_password_protection = true;
-- ============================================================
