-- Migration 067: Fix search_path on all RPCs referencing tenant_game_tables
-- Functions with SET search_path = '' need fully qualified table references
-- because with empty search_path, only pg_catalog is searched — not public.

-- =====================================================
-- 1. ensure_game_table (latest: 065)
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
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  IF NOT public.is_valid_column_name(p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nome de tabela inválido. Use apenas letras minúsculas, números e underscore.');
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Você já tem esta tabela na sua Wiki.');
  END IF;

  IF p_label IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.tenant_game_tables
    WHERE tenant_id = p_tenant_id AND LOWER(display_label) = LOWER(p_label)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Você já tem uma tabela com este nome de exibição na sua Wiki.');
  END IF;

  v_label := COALESCE(p_label, p_table);

  SELECT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = p_table AND relkind = 'r'
  ) INTO v_exists;

  IF NOT v_exists THEN
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

  INSERT INTO public.tenant_game_tables (tenant_id, table_name, display_label, icon)
  VALUES (p_tenant_id, p_table, v_label, COALESCE(p_icon, 'Database'))
  ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = v_label, icon = COALESCE(p_icon, public.tenant_game_tables.icon);

  RETURN jsonb_build_object('ok', true, 'table', p_table, 'created', NOT v_exists);
END;
$$;

-- =====================================================
-- 2. remove_tenant_table (latest: 059)
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
  v_row_count INT;
  v_system_cols TEXT[];
BEGIN
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  UPDATE public.tenant_game_tables
  SET parent_table = NULL
  WHERE tenant_id = p_tenant_id AND parent_table = p_table;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = p_table AND relkind = 'r') THEN
    DELETE FROM public.tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table;
    RETURN jsonb_build_object('ok', true, 'table', p_table, 'dropped_table', false, 'dropped_columns', jsonb_build_array());
  END IF;

  EXECUTE format('DELETE FROM %I WHERE tenant_id = $1', p_table) USING p_tenant_id;

  DELETE FROM public.tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table;

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
-- 3. rename_tenant_table (latest: 065)
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
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  IF NOT public.is_valid_column_name(p_new_name) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Novo nome de tabela inválido.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = p_old_name AND relkind = 'r') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela de origem não encontrada.');
  END IF;

  v_label := COALESCE(p_new_label, p_new_name);

  SELECT icon INTO v_icon FROM public.tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_old_name;
  v_icon := COALESCE(p_new_icon, v_icon, 'Database');

  IF p_old_name = p_new_name THEN
    UPDATE public.tenant_game_tables SET display_label = v_label, icon = v_icon
    WHERE tenant_id = p_tenant_id AND table_name = p_old_name;
    RETURN jsonb_build_object('ok', true, 'table', p_old_name, 'merged', false, 'label_only', true);
  END IF;

  SELECT EXISTS (SELECT 1 FROM pg_class WHERE relname = p_new_name AND relkind = 'r') INTO v_new_exists;

  IF NOT v_new_exists THEN
    EXECUTE format('ALTER TABLE %I RENAME TO %I', p_old_name, p_new_name);
    BEGIN
      EXECUTE format('ALTER INDEX idx_%I_tenant RENAME TO idx_%I_tenant', p_old_name, p_new_name);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    DELETE FROM public.tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_old_name;
    INSERT INTO public.tenant_game_tables (tenant_id, table_name, display_label, icon)
    VALUES (p_tenant_id, p_new_name, v_label, v_icon)
    ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = v_label, icon = v_icon;

    RETURN jsonb_build_object('ok', true, 'table', p_new_name, 'merged', false);
  END IF;

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

  EXECUTE format('DELETE FROM %I WHERE tenant_id = $1', p_old_name) USING p_tenant_id;

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

  EXECUTE format('SELECT COUNT(*) FROM %I', p_old_name) INTO v_row_count;
  IF v_row_count = 0 THEN
    EXECUTE format('DROP TABLE %I CASCADE', p_old_name);
  END IF;

  DELETE FROM public.tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_old_name;

  IF EXISTS (SELECT 1 FROM public.tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_new_name) THEN
    UPDATE public.tenant_game_tables SET display_label = v_label, icon = v_icon
    WHERE tenant_id = p_tenant_id AND table_name = p_new_name;
  ELSE
    INSERT INTO public.tenant_game_tables (tenant_id, table_name, display_label, icon)
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
-- 4. update_table_parent (059)
-- =====================================================

CREATE OR REPLACE FUNCTION update_table_parent(
  p_table TEXT,
  p_tenant_id UUID,
  p_parent_table TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela não encontrada no catálogo.');
  END IF;

  IF p_parent_table IS NOT NULL AND NOT public.is_game_table(p_parent_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela pai não encontrada ou inválida.');
  END IF;

  IF p_parent_table = p_table THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Uma tabela não pode ser pai de si mesma.');
  END IF;

  UPDATE public.tenant_game_tables
  SET parent_table = p_parent_table
  WHERE tenant_id = p_tenant_id AND table_name = p_table;

  RETURN jsonb_build_object('ok', true, 'table', p_table, 'parent_table', p_parent_table);
END;
$$;

-- =====================================================
-- 5. list_potential_parents (059)
-- =====================================================

CREATE OR REPLACE FUNCTION list_potential_parents(
  p_table TEXT,
  p_tenant_id UUID
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF p_tenant_id IS NULL THEN
    RETURN jsonb_build_array();
  END IF;

  WITH RECURSIVE descendants AS (
    SELECT table_name FROM public.tenant_game_tables
    WHERE tenant_id = p_tenant_id AND parent_table = p_table
    UNION ALL
    SELECT t.table_name FROM public.tenant_game_tables t
    INNER JOIN descendants d ON d.table_name = t.parent_table
    WHERE t.tenant_id = p_tenant_id
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'table_name', tgt.table_name,
      'display_label', tgt.display_label
    )
    ORDER BY tgt.display_label
  )
  INTO v_result
  FROM public.tenant_game_tables tgt
  WHERE tgt.tenant_id = p_tenant_id
    AND tgt.table_name != p_table
    AND tgt.table_name NOT IN (SELECT table_name FROM descendants);

  RETURN COALESCE(v_result, jsonb_build_array());
END;
$$;

-- =====================================================
-- 6. get_child_tables (059)
-- =====================================================

CREATE OR REPLACE FUNCTION get_child_tables(
  p_table TEXT,
  p_tenant_id UUID
) RETURNS jsonb
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
      'table_name', tgt.table_name,
      'display_label', tgt.display_label
    )
    ORDER BY tgt.display_label
  )
  INTO v_result
  FROM public.tenant_game_tables tgt
  WHERE tgt.tenant_id = p_tenant_id
    AND tgt.parent_table = p_table;

  RETURN COALESCE(v_result, jsonb_build_array());
END;
$$;

-- =====================================================
-- 7. update_table_icon (065)
-- =====================================================

CREATE OR REPLACE FUNCTION update_table_icon(
  p_table TEXT,
  p_tenant_id UUID,
  p_icon TEXT
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela não encontrada no catálogo.');
  END IF;

  UPDATE public.tenant_game_tables
  SET icon = p_icon
  WHERE tenant_id = p_tenant_id AND table_name = p_table;

  RETURN jsonb_build_object('ok', true, 'table', p_table, 'icon', p_icon);
END;
$$;

-- =====================================================
-- 8. list_available_tables (058)
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
  LEFT JOIN public.tenant_game_tables tgt ON tgt.table_name = c.table_name AND tgt.tenant_id = p_tenant_id
  WHERE tgt.id IS NULL;

  RETURN COALESCE(v_result, jsonb_build_array());
END;
$$;
