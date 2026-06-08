-- Migration 065: Add icon column to tenant_game_tables + RPCs
-- Each table can have a custom icon (Lucide icon name) chosen by the user.

-- =====================================================
-- 1. Add icon column
-- =====================================================

ALTER TABLE tenant_game_tables
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Database';

-- =====================================================
-- 2. Update ensure_game_table to accept p_icon
-- =====================================================

CREATE OR REPLACE FUNCTION ensure_game_table(
  p_table TEXT,
  p_tenant_id UUID,
  p_label TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL
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
  INSERT INTO tenant_game_tables (tenant_id, table_name, display_label, icon)
  VALUES (p_tenant_id, p_table, v_label, COALESCE(p_icon, 'Database'))
  ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = v_label, icon = COALESCE(p_icon, tenant_game_tables.icon);

  RETURN jsonb_build_object('ok', true, 'table', p_table, 'created', NOT v_exists);
END;
$$;

-- =====================================================
-- 3. update_table_icon: change just the icon
-- =====================================================

CREATE OR REPLACE FUNCTION update_table_icon(
  p_table TEXT,
  p_tenant_id UUID,
  p_icon TEXT
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Permission
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  -- Check catalog entry exists
  IF NOT EXISTS (SELECT 1 FROM tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela não encontrada no catálogo.');
  END IF;

  UPDATE tenant_game_tables
  SET icon = p_icon
  WHERE tenant_id = p_tenant_id AND table_name = p_table;

  RETURN jsonb_build_object('ok', true, 'table', p_table, 'icon', p_icon);
END;
$$;

-- =====================================================
-- 4. Update rename_tenant_table to preserve icon
-- =====================================================

CREATE OR REPLACE FUNCTION rename_tenant_table(
  p_old_name TEXT,
  p_new_name TEXT,
  p_tenant_id UUID,
  p_new_label TEXT DEFAULT NULL,
  p_new_icon TEXT DEFAULT NULL
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
  v_icon TEXT;
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

  -- Get current icon
  SELECT icon INTO v_icon FROM tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_old_name;
  v_icon := COALESCE(p_new_icon, v_icon, 'Database');

  -- Same name: just update display_label and/or icon
  IF p_old_name = p_new_name THEN
    UPDATE tenant_game_tables SET display_label = v_label, icon = v_icon
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
    INSERT INTO tenant_game_tables (tenant_id, table_name, display_label, icon)
    VALUES (p_tenant_id, p_new_name, v_label, v_icon)
    ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = v_label, icon = v_icon;

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
    UPDATE tenant_game_tables SET display_label = v_label, icon = v_icon
    WHERE tenant_id = p_tenant_id AND table_name = p_new_name;
  ELSE
    INSERT INTO tenant_game_tables (tenant_id, table_name, display_label, icon)
    VALUES (p_tenant_id, p_new_name, v_label, v_icon);
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
-- 5. Seed icons for existing tables based on known labels
-- =====================================================

UPDATE tenant_game_tables SET icon = 'Sword' WHERE table_name = 'weapons' AND icon = 'Database';
UPDATE tenant_game_tables SET icon = 'Shield' WHERE table_name = 'armors' AND icon = 'Database';
UPDATE tenant_game_tables SET icon = 'CircleDot' WHERE table_name = 'rings' AND icon = 'Database';
UPDATE tenant_game_tables SET icon = 'Skull' WHERE table_name = 'enemies' AND icon = 'Database';
UPDATE tenant_game_tables SET icon = 'Crown' WHERE table_name = 'bosses' AND icon = 'Database';
UPDATE tenant_game_tables SET icon = 'FlaskConical' WHERE table_name = 'potions' AND icon = 'Database';
UPDATE tenant_game_tables SET icon = 'ArrowUp' WHERE table_name = 'upgrades' AND icon = 'Database';
UPDATE tenant_game_tables SET icon = 'Globe' WHERE table_name = 'worlds' AND icon = 'Database';
UPDATE tenant_game_tables SET icon = 'Code' WHERE table_name = 'codes' AND icon = 'Database';
UPDATE tenant_game_tables SET icon = 'BookOpen' WHERE table_name = 'crafting_recipes' AND icon = 'Database';
UPDATE tenant_game_tables SET icon = 'Package' WHERE table_name = 'resources' AND icon = 'Database';
UPDATE tenant_game_tables SET icon = 'Wrench' WHERE table_name = 'build_presets' AND icon = 'Database';
UPDATE tenant_game_tables SET icon = 'Settings' WHERE table_name = 'game_config' AND icon = 'Database';
