-- Migration 058: Tenant game tables catalog + CRUD RPCs
-- Each tenant controls which game tables appear in their editor.
-- Tables are global resources — shared across tenants.
-- When a tenant "deletes" a table, only their data is removed;
-- columns and tables are only dropped if no other tenant uses them.

-- =====================================================
-- 1. Tenant Game Tables catalog
-- =====================================================

CREATE TABLE IF NOT EXISTS tenant_game_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  display_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, table_name)
);

ALTER TABLE tenant_game_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_members_select_tgt" ON tenant_game_tables
  FOR SELECT USING (is_tenant_member(tenant_id));

CREATE POLICY "editors_insert_tgt" ON tenant_game_tables
  FOR INSERT WITH CHECK (is_tenant_member_with_role(tenant_id, 'editor'));

CREATE POLICY "editors_update_tgt" ON tenant_game_tables
  FOR UPDATE USING (is_tenant_member_with_role(tenant_id, 'editor'));

CREATE POLICY "editors_delete_tgt" ON tenant_game_tables
  FOR DELETE USING (is_tenant_member_with_role(tenant_id, 'editor'));

-- =====================================================
-- 2. Helper: column cleanup within a table
-- =====================================================

CREATE OR REPLACE FUNCTION _drop_orphan_columns(p_table TEXT)
RETURNS TABLE(dropped_column TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  rec RECORD;
  v_has_data BOOLEAN;
BEGIN
  FOR rec IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table
      AND NOT public.is_system_column(column_name)
      AND column_name NOT IN ('name', 'description', 'image_url', 'slug')
  LOOP
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE %I IS NOT NULL LIMIT 1)', p_table, rec.column_name)
    INTO v_has_data;
    IF NOT v_has_data THEN
      EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS %I', p_table, rec.column_name);
      dropped_column := rec.column_name;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- =====================================================
-- 3. ensure_game_table: create or adopt a game table
-- =====================================================

CREATE OR REPLACE FUNCTION ensure_game_table(
  p_table TEXT,
  p_tenant_id UUID,
  p_label TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_exists BOOLEAN;
  v_label TEXT;
BEGIN
  -- Permission
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  -- Validate name
  IF NOT public.is_valid_column_name(p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nome de tabela inválido. Use apenas letras minúsculas, números e underscore.');
  END IF;

  -- Check if tenant already has this table in catalog
  IF EXISTS (SELECT 1 FROM tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Você já tem esta tabela na sua Wiki.');
  END IF;

  -- Check if display_label already exists (case-insensitive)
  IF p_label IS NOT NULL AND EXISTS (
    SELECT 1 FROM tenant_game_tables
    WHERE tenant_id = p_tenant_id AND LOWER(display_label) = LOWER(p_label)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Você já tem uma tabela com este nome de exibição na sua Wiki.');
  END IF;

  v_label := COALESCE(p_label, p_table);

  -- Check if PG table exists
  SELECT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = p_table AND relkind = 'r'
  ) INTO v_exists;

  IF NOT v_exists THEN
    -- Create new table
    EXECUTE format('
      CREATE TABLE %I (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        name TEXT,
        slug TEXT,
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )', p_table);

    EXECUTE format('CREATE INDEX idx_%I_tenant ON %I(tenant_id)', p_table, p_table);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table);

    -- RLS policies (same pattern as migration 041)
    EXECUTE format(
      'CREATE POLICY "Game %I readable" ON %I FOR SELECT USING (
        (tenant_id IS NULL) OR (
          EXISTS (SELECT 1 FROM tenants WHERE tenants.id = %I.tenant_id AND (tenants.is_public = true OR is_tenant_member(tenants.id)))
        )
      )',
      p_table, p_table, p_table
    );
    EXECUTE format(
      'CREATE POLICY "Game %I insert" ON %I FOR INSERT WITH CHECK (is_tenant_member_with_role(tenant_id, ''editor''))',
      p_table, p_table
    );
    EXECUTE format(
      'CREATE POLICY "Game %I update" ON %I FOR UPDATE USING (is_tenant_member_with_role(tenant_id, ''editor''))',
      p_table, p_table
    );
    EXECUTE format(
      'CREATE POLICY "Game %I delete" ON %I FOR DELETE USING (is_tenant_member_with_role(tenant_id, ''admin''))',
      p_table, p_table
    );
  END IF;

  -- Add catalog entry
  INSERT INTO tenant_game_tables (tenant_id, table_name, display_label)
  VALUES (p_tenant_id, p_table, v_label)
  ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = v_label;

  RETURN jsonb_build_object('ok', true, 'table', p_table, 'created', NOT v_exists);
END;
$$;

-- =====================================================
-- 4. remove_tenant_table: tenant stops using a table
-- =====================================================

CREATE OR REPLACE FUNCTION remove_tenant_table(
  p_table TEXT,
  p_tenant_id UUID
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_dropped_columns TEXT[] := ARRAY[]::TEXT[];
  v_col RECORD;
  v_has_other_tenants BOOLEAN;
  v_col_count INT;
  v_row_count INT;
  v_system_cols TEXT[];
BEGIN
  -- Permission
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  -- Check table exists
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = p_table AND relkind = 'r') THEN
    DELETE FROM tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table;
    RETURN jsonb_build_object('ok', true, 'table', p_table, 'dropped_table', false, 'dropped_columns', jsonb_build_array());
  END IF;

  -- 1. Delete tenant's data
  EXECUTE format('DELETE FROM %I WHERE tenant_id = $1', p_table) USING p_tenant_id;

  -- 2. Remove catalog entry
  DELETE FROM tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table;

  -- 3. Check orphan columns
  v_system_cols := ARRAY['id', 'tenant_id', 'created_at', 'updated_at', 'embedding', 'slug', 'name', 'description', 'image_url'];

  FOR v_col IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table
      AND column_name <> ALL (v_system_cols)
  LOOP
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE %I IS NOT NULL LIMIT 1)', p_table, v_col.column_name)
    INTO v_has_other_tenants;
    IF NOT v_has_other_tenants THEN
      BEGIN
        EXECUTE format('ALTER TABLE %I DROP COLUMN %I', p_table, v_col.column_name);
        v_dropped_columns := array_append(v_dropped_columns, v_col.column_name);
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END LOOP;

  -- 4. Check if table is empty — drop it
  EXECUTE format('SELECT COUNT(*) FROM %I', p_table) INTO v_row_count;

  IF v_row_count = 0 THEN
    EXECUTE format('DROP TABLE %I CASCADE', p_table);
    RETURN jsonb_build_object(
      'ok', true,
      'table', p_table,
      'dropped_table', true,
      'dropped_columns', to_jsonb(v_dropped_columns)
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'table', p_table,
    'dropped_table', false,
    'dropped_columns', to_jsonb(v_dropped_columns)
  );
END;
$$;

-- =====================================================
-- 5. rename_tenant_table: rename or merge table
-- =====================================================

CREATE OR REPLACE FUNCTION rename_tenant_table(
  p_old_name TEXT,
  p_new_name TEXT,
  p_tenant_id UUID,
  p_new_label TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_new_exists BOOLEAN;
  v_col RECORD;
  v_added_cols TEXT[] := ARRAY[]::TEXT[];
  v_insert_cols TEXT;
  v_select_cols TEXT;
  v_label TEXT;
  v_row_count INT;
BEGIN
  -- Permission
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  -- Validate names
  IF NOT public.is_valid_column_name(p_new_name) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Novo nome de tabela inválido.');
  END IF;

  -- Check old table exists
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = p_old_name AND relkind = 'r') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela de origem não encontrada.');
  END IF;

  v_label := COALESCE(p_new_label, p_new_name);

  -- Same name: just update display_label
  IF p_old_name = p_new_name THEN
    UPDATE tenant_game_tables SET display_label = v_label
    WHERE tenant_id = p_tenant_id AND table_name = p_old_name;
    RETURN jsonb_build_object('ok', true, 'table', p_old_name, 'merged', false, 'label_only', true);
  END IF;

  -- Check if new name already exists
  SELECT EXISTS (SELECT 1 FROM pg_class WHERE relname = p_new_name AND relkind = 'r') INTO v_new_exists;

  IF NOT v_new_exists THEN
    -- Simple rename
    EXECUTE format('ALTER TABLE %I RENAME TO %I', p_old_name, p_new_name);
    -- Rename index
    BEGIN
      EXECUTE format('ALTER INDEX idx_%I_tenant RENAME TO idx_%I_tenant', p_old_name, p_new_name);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    -- Update catalog
    DELETE FROM tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_old_name;
    INSERT INTO tenant_game_tables (tenant_id, table_name, display_label)
    VALUES (p_tenant_id, p_new_name, v_label)
    ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = v_label;

    RETURN jsonb_build_object('ok', true, 'table', p_new_name, 'merged', false);
  END IF;

  -- MERGE: new table already exists — migrate columns + data
  -- Add missing columns from old table to new table
  FOR v_col IN
    SELECT c1.column_name, c1.data_type, c1.is_nullable
    FROM information_schema.columns c1
    WHERE c1.table_schema = 'public' AND c1.table_name = p_old_name
      AND c1.column_name NOT IN ('id', 'embedding')
      AND NOT public.is_system_column(c1.column_name)
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns c2
        WHERE c2.table_schema = 'public' AND c2.table_name = p_new_name
          AND c2.column_name = c1.column_name
      )
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', p_new_name, v_col.column_name, v_col.data_type);
      v_added_cols := array_append(v_added_cols, v_col.column_name);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  -- Migrate tenant data from old table to new table
  SELECT string_agg(quote_ident(column_name), ', ')
  INTO v_insert_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = p_new_name
    AND column_name <> ALL (ARRAY['id', 'embedding']);

  SELECT string_agg(quote_ident(column_name), ', ')
  INTO v_select_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = p_old_name
    AND column_name <> ALL (ARRAY['id', 'embedding'])
    AND column_name IN (
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = p_new_name
    );

  IF v_insert_cols IS NOT NULL AND v_select_cols IS NOT NULL THEN
    EXECUTE format('
      INSERT INTO %I (%s)
      SELECT %s FROM %I WHERE tenant_id = $1
      ON CONFLICT DO NOTHING',
      p_new_name, v_insert_cols, v_select_cols, p_old_name
    ) USING p_tenant_id;
  END IF;

  -- Delete tenant data from old table
  EXECUTE format('DELETE FROM %I WHERE tenant_id = $1', p_old_name) USING p_tenant_id;

  -- Clean up old table
  FOR v_col IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_old_name
      AND NOT public.is_system_column(column_name)
      AND column_name NOT IN ('name', 'description', 'image_url', 'slug')
  LOOP
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE %I IS NOT NULL LIMIT 1)', p_old_name, v_col.column_name)
    INTO v_new_exists;
    IF NOT v_new_exists THEN
      BEGIN
        EXECUTE format('ALTER TABLE %I DROP COLUMN %I', p_old_name, v_col.column_name);
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END IF;
  END LOOP;

  -- Drop old table if empty
  EXECUTE format('SELECT COUNT(*) FROM %I', p_old_name) INTO v_row_count;
  IF v_row_count = 0 THEN
    EXECUTE format('DROP TABLE %I CASCADE', p_old_name);
  END IF;

  -- Update catalog: remove old, add new
  DELETE FROM tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_old_name;

  IF EXISTS (SELECT 1 FROM tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_new_name) THEN
    UPDATE tenant_game_tables SET display_label = v_label
    WHERE tenant_id = p_tenant_id AND table_name = p_new_name;
  ELSE
    INSERT INTO tenant_game_tables (tenant_id, table_name, display_label)
    VALUES (p_tenant_id, p_new_name, v_label);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'table', p_new_name,
    'merged', true,
    'added_columns', to_jsonb(v_added_cols)
  );
END;
$$;

-- =====================================================
-- 6. list_available_tables: tables tenant can adopt
-- =====================================================

CREATE OR REPLACE FUNCTION list_available_tables(p_tenant_id UUID)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF p_tenant_id IS NULL THEN
    RETURN jsonb_build_array();
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'table_name', c.table_name,
      'display_label', COALESCE(tgt.display_label, c.table_name),
      'row_count', (
        SELECT COUNT(*) FROM information_schema.columns c2
        WHERE c2.table_schema = 'public' AND c2.table_name = c.table_name
      )
    )
  )
  INTO v_result
  FROM (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'tenant_id'
      AND table_name NOT IN ('tenants', 'tenant_templates', 'tenant_game_tables', 'wiki_articles', 'user_preferences', 'chat_sessions', 'chat_messages')
      AND table_name NOT LIKE '_%'
      AND table_name NOT LIKE 'pg_%'
  ) c
  LEFT JOIN tenant_game_tables tgt ON tgt.table_name = c.table_name AND tgt.tenant_id = p_tenant_id
  WHERE tgt.id IS NULL;

  RETURN COALESCE(v_result, jsonb_build_array());
END;
$$;

-- =====================================================
-- 7. list_available_columns: existing columns in a table
-- =====================================================

CREATE OR REPLACE FUNCTION list_available_columns(p_table TEXT)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'column_name', column_name,
      'data_type', data_type,
      'is_nullable', is_nullable = 'YES'
    )
    ORDER BY ordinal_position
  )
  INTO v_result
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = p_table
    AND NOT public.is_system_column(column_name)
    AND column_name NOT IN ('name', 'slug', 'description', 'image_url');

  RETURN COALESCE(v_result, jsonb_build_array());
END;
$$;

-- =====================================================
-- 8. Seed: populate tenant_game_tables for existing tenants
-- =====================================================

INSERT INTO tenant_game_tables (tenant_id, table_name, display_label)
SELECT t.id, v.table_name, v.display_label
FROM tenants t
CROSS JOIN (VALUES
  ('weapons', 'Armas'),
  ('armors', 'Armaduras'),
  ('rings', 'Anéis'),
  ('potions', 'Poções'),
  ('upgrades', 'Upgrades'),
  ('enemies', 'Inimigos'),
  ('bosses', 'Bosses'),
  ('codes', 'Códigos'),
  ('crafting_recipes', 'Receitas'),
  ('resources', 'Recursos'),
  ('worlds', 'Mundos'),
  ('build_presets', 'Presets'),
  ('game_config', 'Config')
) AS v(table_name, display_label)
ON CONFLICT (tenant_id, table_name) DO NOTHING;
