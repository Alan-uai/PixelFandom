-- Migration 084: Add is_hidden column to tenant_game_tables + toggle RPC
-- Allows editors to hide tables from public wiki view.

-- =====================================================
-- 1. Add is_hidden column (default false = visible)
-- =====================================================

ALTER TABLE tenant_game_tables
ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- =====================================================
-- 2. toggle_table_visibility RPC
-- =====================================================

CREATE OR REPLACE FUNCTION toggle_table_visibility(
  p_table TEXT,
  p_tenant_id UUID
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_current boolean;
BEGIN
  -- Permission: minimum editor role
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  -- Check catalog entry exists
  IF NOT EXISTS (SELECT 1 FROM public.tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela não encontrada no catálogo.');
  END IF;

  UPDATE public.tenant_game_tables
  SET is_hidden = NOT is_hidden
  WHERE tenant_id = p_tenant_id AND table_name = p_table
  RETURNING is_hidden INTO v_current;

  RETURN jsonb_build_object('ok', true, 'table', p_table, 'is_hidden', v_current);
END;
$$;

-- =====================================================
-- 3. Grant execute to authenticated users
-- =====================================================

GRANT EXECUTE ON FUNCTION public.toggle_table_visibility(text, uuid) TO authenticated;
