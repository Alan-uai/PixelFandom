-- Migration 042: RPCs to add/drop columns on game tables dynamically
-- Used by the dashboard data editor to let admins do schema CRUD.

-- =====================================================
-- Whitelist helpers (used by both RPCs)
-- =====================================================

CREATE OR REPLACE FUNCTION is_game_table(t TEXT) RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT t = ANY(ARRAY[
    'weapons', 'armors', 'enemies', 'bosses', 'rings',
    'potions', 'upgrades', 'worlds', 'codes', 'crafting_recipes',
    'resources', 'build_presets'
  ]);
$$;

CREATE OR REPLACE FUNCTION is_valid_column_name(c TEXT) RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT c ~ '^[a-z][a-z0-9_]{0,62}$';
$$;

-- Columns that can never be dropped
CREATE OR REPLACE FUNCTION is_system_column(c TEXT) RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT c = ANY(ARRAY['id', 'tenant_id', 'created_at', 'updated_at', 'embedding', 'slug']);
$$;

-- =====================================================
-- add_game_column: ALTER TABLE … ADD COLUMN
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
  -- Authorisation: caller must be owner/admin of the tenant
  IF p_tenant_id IS NULL OR NOT is_tenant_member_with_role(p_tenant_id, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada — apenas admins podem alterar o schema.');
  END IF;

  -- Validate table
  IF NOT is_game_table(p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela não permitida: ' || p_table);
  END IF;

  -- Validate column name
  IF NOT is_valid_column_name(p_column) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nome de coluna inválido. Use apenas letras minúsculas, números e underscore.');
  END IF;

  -- Validate type
  IF NOT (p_type = ANY(v_allowed_types)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tipo não permitido: ' || p_type);
  END IF;

  -- Prevent system columns
  IF is_system_column(p_column) THEN
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
-- drop_game_column: ALTER TABLE … DROP COLUMN
-- =====================================================

CREATE OR REPLACE FUNCTION drop_game_column(
  p_table TEXT,
  p_column TEXT,
  p_tenant_id UUID DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Authorisation
  IF p_tenant_id IS NULL OR NOT is_tenant_member_with_role(p_tenant_id, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada — apenas admins podem alterar o schema.');
  END IF;

  -- Validate table
  IF NOT is_game_table(p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela não permitida: ' || p_table);
  END IF;

  -- Validate column name
  IF NOT is_valid_column_name(p_column) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nome de coluna inválido.');
  END IF;

  -- Prevent system columns
  IF is_system_column(p_column) THEN
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
