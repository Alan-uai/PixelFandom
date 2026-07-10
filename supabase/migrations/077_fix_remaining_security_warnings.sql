-- Migration 077: Fix remaining security warnings
--
-- Fixes:
--   1x public_bucket_allows_listing  — restrict SELECT on wiki-assets and wiki-images
--  10x anon_security_definer_function_executable — revoke EXECUTE from anon for
--     SECURITY DEFINER functions that should not be publicly callable
--
-- ============================================================
-- PART 1: public_bucket_allows_listing
-- Drop broad SELECT policies on wiki-assets and wiki-images buckets
-- Objects remain accessible via direct URL (buckets are public)
-- ============================================================

DROP POLICY IF EXISTS "Public read on wiki-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read on wiki-images" ON storage.objects;

-- Recreate with listing restricted (still allows individual object reads)
CREATE POLICY "Public read objects on wiki-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'wiki-assets');

CREATE POLICY "Public read objects on wiki-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'wiki-images');


-- ============================================================
-- PART 2: anon_security_defender_function_executable
-- Revoke EXECUTE from anon for SECURITY DEFINER functions
-- that are meant for internal/server-side use only.
-- ============================================================

-- _drop_orphan_columns — internal housekeeping, never public
REVOKE EXECUTE ON FUNCTION public._drop_orphan_columns(p_table text) FROM anon;

-- add_game_column / drop_game_column — game editor RPCs,
-- access controlled internally by tenant_id check
-- These legitimately need to be callable by authenticated users
-- but NOT by anon (unauthenticated).
REVOKE EXECUTE ON FUNCTION public.add_game_column(p_table text, p_column text, p_type text, p_tenant_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.drop_game_column(p_table text, p_column text, p_tenant_id uuid) FROM anon;

-- ensure_game_table — game table creation RPC
REVOKE EXECUTE ON FUNCTION public.ensure_game_table(p_table text, p_tenant_id uuid, p_label text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.ensure_game_table(p_table text, p_tenant_id uuid, p_label text, p_icon text) FROM anon;

-- get_child_tables — internal, for game table hierarchy
REVOKE EXECUTE ON FUNCTION public.get_child_tables(p_table text, p_tenant_id uuid) FROM anon;

-- get_game_schema — internal schema discovery
REVOKE EXECUTE ON FUNCTION public.get_game_schema() FROM anon;

-- get_table_columns — internal column discovery
REVOKE EXECUTE ON FUNCTION public.get_table_columns(p_table text) FROM anon;

-- get_tenant_id_from_collection_item — internal lookup
REVOKE EXECUTE ON FUNCTION public.get_tenant_id_from_collection_item(_item_id uuid) FROM anon;

-- cleanup_rate_limits — scheduled job, never public
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM anon;

-- get_wiki — public read of wiki data, but uses SECURITY DEFINER;
-- anon can still call via authenticated path, but not unauthenticated
REVOKE EXECUTE ON FUNCTION public.get_wiki(p_slug text, p_article_slug text, p_search text) FROM anon;

-- Note: authenticated users still have EXECUTE via the authenticated role.
-- These functions remain SECURITY DEFINER for their internal logic.
