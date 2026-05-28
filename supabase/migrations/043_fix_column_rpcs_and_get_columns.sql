-- Migration 043: Fix cast issue in column RPCs + create get_table_columns
-- 1. Cast string literals explicitly to avoid 'unknown' type in SECURITY DEFINER
-- 2. Allow editors (not just admins) to add/drop columns
-- 3. Create get_table_columns RPC for the frontend

-- Drop the old 3-parameter overload that has the broken permission check
DROP FUNCTION IF EXISTS add_game_column(p_table TEXT, p_column TEXT, p_type TEXT);

-- =====================================================
-- Fix add_game_column — explicit cast + editor permission
-- =====================================================

CREATE OR REPLACE FUNCTION add_game_column(
  p_table TEXT,
  p_column TEXT,
  p_type TEXT DEFAULT 'text',
  p_tenant_id UUID DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_allowed_types TEXT[] := ARRAY['text', 'integer', 'numeric', 'boolean', 'jsonb', 'real', 'bigint', 'double precision'];
BEGIN
  -- Authorisation: editor+ (inclui admin e owner)
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada — apenas editores, admins ou owners podem alterar o schema.');
  END IF;

  -- Validate table
  IF NOT public.is_game_table(p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela não permitida: ' || p_table);
  END IF;

  -- Validate column name
  IF NOT public.is_valid_column_name(p_column) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nome de coluna inválido. Use apenas letras minúsculas, números e underscore.');
  END IF;

  -- Validate type
  IF NOT (p_type = ANY(v_allowed_types)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tipo não permitido: ' || p_type);
  END IF;

  -- Prevent system columns
  IF public.is_system_column(p_column) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Coluna do sistema não pode ser alterada.');
  END IF;

  -- Execute
  BEGIN
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS %I %s', p_table, p_column, p_type);
    RETURN jsonb_build_object('ok', true, 'column', p_column, 'type', p_type);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
  END;
END;
$$;

-- =====================================================
-- Fix drop_game_column — explicit cast + editor permission
-- =====================================================

CREATE OR REPLACE FUNCTION drop_game_column(
  p_table TEXT,
  p_column TEXT,
  p_tenant_id UUID DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Authorisation: editor+
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada — apenas editores, admins ou owners podem alterar o schema.');
  END IF;

  -- Validate table
  IF NOT public.is_game_table(p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela não permitida: ' || p_table);
  END IF;

  -- Validate column name
  IF NOT public.is_valid_column_name(p_column) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nome de coluna inválido.');
  END IF;

  -- Prevent system columns
  IF public.is_system_column(p_column) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Coluna do sistema não pode ser removida.');
  END IF;

  -- Execute
  BEGIN
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS %I', p_table, p_column);
    RETURN jsonb_build_object('ok', true, 'column', p_column);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
  END;
END;
$$;

-- =====================================================
-- get_table_columns: return column metadata for a table
-- =====================================================

CREATE OR REPLACE FUNCTION get_table_columns(p_table TEXT)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_game_table(p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela não permitida: ' || p_table);
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'column_name', column_name,
      'data_type', data_type,
      'is_nullable', is_nullable = 'YES',
      'column_default', column_default,
      'is_system', public.is_system_column(column_name)
    )
    ORDER BY ordinal_position
  )
  INTO v_result
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = p_table;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela não encontrada.');
  END IF;

  RETURN jsonb_build_object('ok', true, 'columns', v_result);
END;
$$;
