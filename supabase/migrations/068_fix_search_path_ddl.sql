-- Migration 068: Fix DDL/DML inside EXECUTE format() calls in all RPCs
-- Migration 067 fixed direct table references (tenant_game_tables → public.tenant_game_tables)
-- but forgot to fix table names inside EXECUTE format() calls for DDL and DML.
-- With SET search_path = '', unqualified %I identifiers in DDL/DML fail with:
--   "no schema has been selected to create in" (CREATE TABLE)
--   "relation "X" does not exist" (ALTER TABLE, SELECT, DELETE, INSERT, DROP, etc.)

-- All changes: add public. prefix to %I placeholders that reference table names

-- =====================================================
-- 1. _drop_orphan_columns (058)
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
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE %I IS NOT NULL LIMIT 1)', p_table, rec.column_name)
    INTO v_has_data;
    IF NOT v_has_data THEN
      EXECUTE format('ALTER TABLE public.%I DROP COLUMN IF EXISTS %I', p_table, rec.column_name);
      dropped_column := rec.column_name;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- =====================================================
-- 2. add_game_column (043)
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
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada — apenas editores, admins ou owners podem alterar o schema.');
  END IF;

  IF NOT public.is_game_table(p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela não permitida: ' || p_table);
  END IF;

  IF NOT public.is_valid_column_name(p_column) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nome de coluna inválido. Use apenas letras minúsculas, números e underscore.');
  END IF;

  IF NOT (p_type = ANY(v_allowed_types)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tipo não permitido: ' || p_type);
  END IF;

  IF public.is_system_column(p_column) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Coluna do sistema não pode ser alterada.');
  END IF;

  BEGIN
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I %s', p_table, p_column, p_type);
    RETURN jsonb_build_object('ok', true, 'column', p_column, 'type', p_type);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
  END;
END;
$$;

-- =====================================================
-- 3. drop_game_column (043)
-- =====================================================

CREATE OR REPLACE FUNCTION drop_game_column(
  p_table TEXT,
  p_column TEXT,
  p_tenant_id UUID DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada — apenas editores, admins ou owners podem alterar o schema.');
  END IF;

  IF NOT public.is_game_table(p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela não permitida: ' || p_table);
  END IF;

  IF NOT public.is_valid_column_name(p_column) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nome de coluna inválido.');
  END IF;

  IF public.is_system_column(p_column) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Coluna do sistema não pode ser removida.');
  END IF;

  BEGIN
    EXECUTE format('ALTER TABLE public.%I DROP COLUMN IF EXISTS %I', p_table, p_column);
    RETURN jsonb_build_object('ok', true, 'column', p_column);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
  END;
END;
$$;

-- =====================================================
-- 4. ensure_game_table (067)
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
      CREATE TABLE public.%I (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        name TEXT,
        slug TEXT,
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )', p_table);

    EXECUTE format('CREATE INDEX idx_%I_tenant ON public.%I(tenant_id)', p_table, p_table);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);

    EXECUTE format(
      'CREATE POLICY "Game %I readable" ON public.%I FOR SELECT USING (
        (tenant_id IS NULL) OR (
          EXISTS (SELECT 1 FROM tenants WHERE tenants.id = public.%I.tenant_id AND (tenants.is_public = true OR is_tenant_member(tenants.id)))
        )
      )',
      p_table, p_table, p_table
    );
    EXECUTE format(
      'CREATE POLICY "Game %I insert" ON public.%I FOR INSERT WITH CHECK (is_tenant_member_with_role(tenant_id, ''editor''))',
      p_table, p_table
    );
    EXECUTE format(
      'CREATE POLICY "Game %I update" ON public.%I FOR UPDATE USING (is_tenant_member_with_role(tenant_id, ''editor''))',
      p_table, p_table
    );
    EXECUTE format(
      'CREATE POLICY "Game %I delete" ON public.%I FOR DELETE USING (is_tenant_member_with_role(tenant_id, ''admin''))',
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
-- 5. remove_tenant_table (067)
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

  EXECUTE format('DELETE FROM public.%I WHERE tenant_id = $1', p_table) USING p_tenant_id;

  DELETE FROM public.tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table;

  v_system_cols := ARRAY['id', 'tenant_id', 'created_at', 'updated_at', 'embedding', 'slug', 'name', 'description', 'image_url'];

  FOR v_col IN
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table
      AND column_name <> ALL (v_system_cols)
  LOOP
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE %I IS NOT NULL LIMIT 1)', p_table, v_col.column_name)
    INTO v_has_other_tenants;
    IF NOT v_has_other_tenants THEN
      BEGIN
        EXECUTE format('ALTER TABLE public.%I DROP COLUMN %I', p_table, v_col.column_name);
        v_dropped_columns := array_append(v_dropped_columns, v_col.column_name);
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END LOOP;

  EXECUTE format('SELECT COUNT(*) FROM public.%I', p_table) INTO v_row_count;

  IF v_row_count = 0 THEN
    EXECUTE format('DROP TABLE public.%I CASCADE', p_table);
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
-- 6. rename_tenant_table (067)
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
    EXECUTE format('ALTER TABLE public.%I RENAME TO public.%I', p_old_name, p_new_name);
    BEGIN
      EXECUTE format('ALTER INDEX public.idx_%I_tenant RENAME TO public.idx_%I_tenant', p_old_name, p_new_name);
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
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I %s', p_new_name, v_col.column_name, v_col.data_type);
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
      INSERT INTO public.%I (%s)
      SELECT %s FROM public.%I WHERE tenant_id = $1
      ON CONFLICT DO NOTHING',
      p_new_name, v_insert_cols, v_select_cols, p_old_name
    ) USING p_tenant_id;
  END IF;

  EXECUTE format('DELETE FROM public.%I WHERE tenant_id = $1', p_old_name) USING p_tenant_id;

  FOR v_col IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_old_name
      AND NOT public.is_system_column(column_name)
      AND column_name NOT IN ('name', 'description', 'image_url', 'slug')
  LOOP
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE %I IS NOT NULL LIMIT 1)', p_old_name, v_col.column_name)
    INTO v_new_exists;
    IF NOT v_new_exists THEN
      BEGIN
        EXECUTE format('ALTER TABLE public.%I DROP COLUMN %I', p_old_name, v_col.column_name);
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END IF;
  END LOOP;

  EXECUTE format('SELECT COUNT(*) FROM public.%I', p_old_name) INTO v_row_count;
  IF v_row_count = 0 THEN
    EXECUTE format('DROP TABLE public.%I CASCADE', p_old_name);
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
