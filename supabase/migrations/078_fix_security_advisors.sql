-- Migration 078: Fix remaining security advisor warnings
--
-- Fixes:
--   3x public_bucket_allows_listing       — drop ALL SELECT policies on public buckets
--  18x anon_security_definer_function_executable — revoke EXECUTE from anon
--   6x authenticated_security_definer_function_executable — revoke from authenticated
--   1x auth_leaked_password_protection    — enable via dashboard (note at bottom)
--
-- ============================================================
-- PART 1: public_bucket_allows_listing
-- Drop ALL SELECT policies on game-items, wiki-assets, wiki-images
-- Objects remain accessible via direct URL (buckets are public)
-- Remove listing capability by removing SELECT policies
-- ============================================================

-- game-items: drop both known policy names
DROP POLICY IF EXISTS "Public read on game-items" ON storage.objects;
DROP POLICY IF EXISTS "Public read access on game-items" ON storage.objects;

-- wiki-assets: drop both old name and the overly-broad replacement from 077
DROP POLICY IF EXISTS "Public read on wiki-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read access on wiki-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read objects on wiki-assets" ON storage.objects;

-- wiki-images: drop both old name and the overly-broad replacement from 077
DROP POLICY IF EXISTS "Public read on wiki-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access on wiki-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read objects on wiki-images" ON storage.objects;


-- ============================================================
-- PART 2: anon_security_definer_function_executable
-- Revoke EXECUTE from anon for SECURITY DEFINER functions
-- that are meant for internal/server-side/authenticated-only use.
--
-- Functions already handled in migration 077:
--   _drop_orphan_columns, add_game_column, drop_game_column,
--   ensure_game_table (x2), get_child_tables, get_game_schema,
--   get_table_columns, get_tenant_id_from_collection_item,
--   cleanup_rate_limits, get_wiki
-- ============================================================

-- Public wiki data — needs to stay callable via API routes (service_role)
REVOKE EXECUTE ON FUNCTION public.get_wiki_data(p_slug text, p_search text, p_embedding text) FROM anon;

-- Public search
REVOKE EXECUTE ON FUNCTION public.search_all(p_tenant_slug text, p_query text, p_limit integer, p_embedding text) FROM anon;

-- Tenant membership checks — used by RLS policies, authenticated-only
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(_tenant_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_tenant_member_with_role(_tenant_id uuid, _min_role text) FROM anon;

-- Auth/session hooks — trigger functions, never publicly callable
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_embedding_generation() FROM anon;

-- Editor tooling — requires authentication + internal permission check
REVOKE EXECUTE ON FUNCTION public.list_available_columns(p_table text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_available_tables(p_tenant_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_potential_parents(p_table text, p_tenant_id uuid) FROM anon;

-- Admin-only game table management
REVOKE EXECUTE ON FUNCTION public.remove_tenant_table(p_table text, p_tenant_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rename_tenant_table(p_old_name text, p_new_name text, p_tenant_id uuid, p_new_label text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rename_tenant_table(p_old_name text, p_new_name text, p_tenant_id uuid, p_new_label text, p_new_icon text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_table_icon(p_table text, p_tenant_id uuid, p_icon text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_table_parent(p_table text, p_tenant_id uuid, p_parent_table text) FROM anon;

-- Internal embedding management — called server-side only
REVOKE EXECUTE ON FUNCTION public.update_collection_item_embedding(p_id uuid, p_embedding extensions.vector) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_wiki_article_embedding(p_id uuid, p_embedding extensions.vector) FROM anon;

-- Trigger function — never callable via API
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon;


-- ============================================================
-- PART 3: authenticated_security_definer_function_executable
-- Revoke EXECUTE from authenticated for internal-only functions
-- that should never be called via /rest/v1/rpc/ by any user.
--
-- Functions with internal permission checks (add_game_column,
-- ensure_game_table, remove_tenant_table, etc.) intentionally
-- remain callable by authenticated — the security runs inside.
-- ============================================================

-- Internal housekeeping
REVOKE EXECUTE ON FUNCTION public._drop_orphan_columns(p_table text) FROM authenticated;

-- Scheduled job only
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM authenticated;

-- Auth trigger
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Internal embedding management
REVOKE EXECUTE ON FUNCTION public.handle_embedding_generation() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_collection_item_embedding(p_id uuid, p_embedding extensions.vector) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_wiki_article_embedding(p_id uuid, p_embedding extensions.vector) FROM authenticated;

-- Trigger function
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM authenticated;


-- ============================================================
-- PART 4: auth_leaked_password_protection
-- This cannot be enabled via SQL migration.
-- 
-- To fix: Go to Supabase Dashboard → Authentication → Settings
-- → Security → Enable "Leaked password protection"
--
-- This checks passwords against HaveIBeenPwned.org on sign-up.
-- ============================================================
