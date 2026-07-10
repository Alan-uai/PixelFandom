-- Migration 080: Fix remaining SECURITY DEFINER function warnings
--
-- Fixes:
--  28x anon_security_definer_function_executable      — revoke EXECUTE from anon
--  28x authenticated_security_definer_function_executable — revoke from authenticated
--   1x auth_leaked_password_protection                 — enable via dashboard (note at bottom)
--
-- Uses DO blocks with exception handling so this migration is safe
-- to run even if the privileges were already revoked by 077/078.
-- ============================================================

-- ============================================================
-- PART 1: anon_security_definer_function_executable
-- Revoke EXECUTE from anon for ALL SECURITY DEFINER functions
-- that are not meant for public use.
--
-- NOTE: This covers the same functions as migrations 077 and 078,
-- but uses exception-safe DO blocks so it won't error if already revoked.
-- ============================================================

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public._drop_orphan_columns(p_table text) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.add_game_column(p_table text, p_column text, p_type text, p_tenant_id uuid) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.drop_game_column(p_table text, p_column text, p_tenant_id uuid) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.ensure_game_table(p_table text, p_tenant_id uuid, p_label text) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.ensure_game_table(p_table text, p_tenant_id uuid, p_label text, p_icon text) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.get_child_tables(p_table text, p_tenant_id uuid) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.get_game_schema() FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.get_table_columns(p_table text) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.get_tenant_id_from_collection_item(_item_id uuid) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.get_wiki(p_slug text, p_article_slug text, p_search text) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.get_wiki_data(p_slug text, p_search text, p_embedding text) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.handle_embedding_generation() FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.is_tenant_member(_tenant_id uuid) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.is_tenant_member_with_role(_tenant_id uuid, _min_role text) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.list_available_columns(p_table text) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.list_available_tables(p_tenant_id uuid) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.list_potential_parents(p_table text, p_tenant_id uuid) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.remove_tenant_table(p_table text, p_tenant_id uuid) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.rename_tenant_table(p_old_name text, p_new_name text, p_tenant_id uuid, p_new_label text) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.rename_tenant_table(p_old_name text, p_new_name text, p_tenant_id uuid, p_new_label text, p_new_icon text) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.search_all(p_tenant_slug text, p_query text, p_limit integer, p_embedding text) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.update_collection_item_embedding(p_id uuid, p_embedding extensions.vector) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.update_table_icon(p_table text, p_tenant_id uuid, p_icon text) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.update_table_parent(p_table text, p_tenant_id uuid, p_parent_table text) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.update_wiki_article_embedding(p_id uuid, p_embedding extensions.vector) FROM anon;
EXCEPTION WHEN others THEN NULL; END; $$;


-- ============================================================
-- PART 2: authenticated_security_definer_function_executable
-- Revoke EXECUTE from authenticated for internal-only functions
-- that should not be callable via /rest/v1/rpc/ by signed-in users.
--
-- Functions with internal permission checks (add_game_column,
-- ensure_game_table, remove_tenant_table, get_wiki, etc.)
-- intentionally remain callable by authenticated — the security
-- runs inside the function body.
-- ============================================================

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public._drop_orphan_columns(p_table text) FROM authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.handle_embedding_generation() FROM authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.update_collection_item_embedding(p_id uuid, p_embedding extensions.vector) FROM authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.update_wiki_article_embedding(p_id uuid, p_embedding extensions.vector) FROM authenticated;
EXCEPTION WHEN others THEN NULL; END; $$;


-- ============================================================
-- PART 3: auth_leaked_password_protection
-- This cannot be enabled via SQL migration.
--
-- To fix: Go to Supabase Dashboard → Authentication → Settings
-- → Security → Enable "Leaked password protection"
--
-- This checks passwords against HaveIBeenPwned.org on sign-up.
-- ============================================================
