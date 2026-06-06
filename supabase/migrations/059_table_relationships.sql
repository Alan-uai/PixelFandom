-- Migration 059: Automatic parent-table detection via naming convention
-- Qualquer tabela filha é automaticamente linkada ao pai pelo prefixo do slug.
-- Suporte a aninhamento infinito: weapons → weapons_runes → weapons_runes_fire_element
-- Tudo dinâmico via information_schema — zero hardcoded além das tabelas legadas.

-- =====================================================
-- 1. Add parent_table column to catalog
-- =====================================================

ALTER TABLE tenant_game_tables ADD COLUMN IF NOT EXISTS parent_table TEXT;

-- =====================================================
-- 2. is_game_table() — hardcoded legado + detecção dinâmica
--    Qualquer tabela com coluna tenant_id é game table
-- =====================================================

CREATE OR REPLACE FUNCTION is_game_table(t TEXT) RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT t = ANY(ARRAY[
    'weapons', 'armors', 'enemies', 'bosses', 'rings',
    'potions', 'upgrades', 'worlds', 'codes', 'crafting_recipes',
    'resources', 'build_presets'
  ]) OR EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = t
      AND column_name = 'tenant_id'
      AND t NOT IN (
        'tenants', 'tenant_members', 'tenant_game_tables',
        'tenant_templates', 'wiki_articles', 'user_preferences',
        'chat_sessions', 'chat_messages', 'content_suggestions',
        'negative_feedback', 'saved_answers', 'tenant_pages',
        'custom_collections', 'collection_items', 'notification_log',
        'discord_guilds', 'follows', 'votes', 'notifications',
        'article_versions', 'floating_islands', 'chat_invitations',
        'import_jobs', 'analytics_events', 'search_vectors'
      )
  );
$$;

-- =====================================================
-- 3. Auto-detect parent from naming convention
--    weapons_runes_fire_element_achievements
--    → testa "weapons_runes_fire_element" primeiro (mais específico)
--    → depois "weapons_runes_fire"
--    → depois "weapons_runes"
--    → depois "weapons" (via plural de "weapon")
--    Primeiro match vence (mais longo primeiro)
-- =====================================================

CREATE OR REPLACE FUNCTION detect_parent_table(p_table TEXT)
RETURNS TEXT
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  parts TEXT[];
  candidate TEXT;
  i INT;
BEGIN
  IF p_table IS NULL OR p_table = '' THEN RETURN NULL; END IF;

  parts := string_to_array(p_table, '_');
  IF array_length(parts, 1) < 2 THEN RETURN NULL; END IF;

  FOR i IN REVERSE array_length(parts, 1) - 1 .. 1 LOOP
    candidate := array_to_string(parts[1:i], '_');
    IF candidate = p_table THEN CONTINUE; END IF;

    IF public.is_game_table(candidate) THEN
      RETURN candidate;
    END IF;

    IF public.is_game_table(candidate || 's') THEN
      RETURN candidate || 's';
    END IF;

    IF public.is_game_table(candidate || 'es') THEN
      RETURN candidate || 'es';
    END IF;

    IF candidate LIKE '%y' THEN
      DECLARE ies TEXT := left(candidate, -1) || 'ies';
      BEGIN
        IF public.is_game_table(ies) THEN
          RETURN ies;
        END IF;
      END;
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;

-- =====================================================
-- 4. ensure_game_table — auto-detect parent
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
  v_parent TEXT;
BEGIN
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  IF NOT public.is_valid_column_name(p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nome de tabela inválido. Use apenas letras minúsculas, números e underscore.');
  END IF;

  IF EXISTS (SELECT 1 FROM tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Você já tem esta tabela na sua Wiki.');
  END IF;

  IF p_label IS NOT NULL AND EXISTS (
    SELECT 1 FROM tenant_game_tables
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

  v_parent := public.detect_parent_table(p_table);

  INSERT INTO tenant_game_tables (tenant_id, table_name, display_label, parent_table)
  VALUES (p_tenant_id, p_table, v_label, v_parent)
  ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = v_label;

  RETURN jsonb_build_object(
    'ok', true,
    'table', p_table,
    'created', NOT v_exists,
    'parent_table', v_parent
  );
END;
$$;

-- =====================================================
-- 5. remove_tenant_table — limpa parent_table dos filhos
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

  UPDATE tenant_game_tables
  SET parent_table = NULL
  WHERE tenant_id = p_tenant_id AND parent_table = p_table;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = p_table AND relkind = 'r') THEN
    DELETE FROM tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table;
    RETURN jsonb_build_object('ok', true, 'table', p_table, 'dropped_table', false, 'dropped_columns', jsonb_build_array());
  END IF;

  EXECUTE format('DELETE FROM %I WHERE tenant_id = $1', p_table) USING p_tenant_id;

  DELETE FROM tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table;

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
-- 6. rename_tenant_table — re-detects parent + updates children
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
  v_new_parent TEXT;
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

  IF p_old_name = p_new_name THEN
    v_new_parent := public.detect_parent_table(p_old_name);
    UPDATE tenant_game_tables
    SET display_label = v_label, parent_table = v_new_parent
    WHERE tenant_id = p_tenant_id AND table_name = p_old_name;
    RETURN jsonb_build_object('ok', true, 'table', p_old_name, 'merged', false, 'label_only', true, 'parent_table', v_new_parent);
  END IF;

  SELECT EXISTS (SELECT 1 FROM pg_class WHERE relname = p_new_name AND relkind = 'r') INTO v_new_exists;

  IF NOT v_new_exists THEN
    EXECUTE format('ALTER TABLE %I RENAME TO %I', p_old_name, p_new_name);
    BEGIN
      EXECUTE format('ALTER INDEX idx_%I_tenant RENAME TO idx_%I_tenant', p_old_name, p_new_name);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    UPDATE tenant_game_tables
    SET parent_table = p_new_name
    WHERE tenant_id = p_tenant_id AND parent_table = p_old_name;

    v_new_parent := public.detect_parent_table(p_new_name);

    DELETE FROM tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_old_name;
    INSERT INTO tenant_game_tables (tenant_id, table_name, display_label, parent_table)
    VALUES (p_tenant_id, p_new_name, v_label, v_new_parent)
    ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = v_label, parent_table = COALESCE(v_new_parent, tenant_game_tables.parent_table);

    RETURN jsonb_build_object('ok', true, 'table', p_new_name, 'merged', false, 'parent_table', v_new_parent);
  END IF;

  -- MERGE path
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

  UPDATE tenant_game_tables
  SET parent_table = p_new_name
  WHERE tenant_id = p_tenant_id AND parent_table = p_old_name;

  v_new_parent := public.detect_parent_table(p_new_name);

  DELETE FROM tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_old_name;

  IF EXISTS (SELECT 1 FROM tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_new_name) THEN
    UPDATE tenant_game_tables SET display_label = v_label, parent_table = COALESCE(v_new_parent, tenant_game_tables.parent_table)
    WHERE tenant_id = p_tenant_id AND table_name = p_new_name;
  ELSE
    INSERT INTO tenant_game_tables (tenant_id, table_name, display_label, parent_table)
    VALUES (p_tenant_id, p_new_name, v_label, v_new_parent);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'table', p_new_name,
    'merged', true,
    'added_columns', to_jsonb(v_added_cols),
    'parent_table', v_new_parent
  );
END;
$$;

-- =====================================================
-- 7. RPC: update_table_parent — link/unlink manual
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

  IF NOT EXISTS (SELECT 1 FROM tenant_game_tables WHERE tenant_id = p_tenant_id AND table_name = p_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela não encontrada no catálogo.');
  END IF;

  IF p_parent_table IS NOT NULL AND NOT public.is_game_table(p_parent_table) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tabela pai não encontrada ou inválida.');
  END IF;

  IF p_parent_table = p_table THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Uma tabela não pode ser pai de si mesma.');
  END IF;

  UPDATE tenant_game_tables
  SET parent_table = p_parent_table
  WHERE tenant_id = p_tenant_id AND table_name = p_table;

  RETURN jsonb_build_object('ok', true, 'table', p_table, 'parent_table', p_parent_table);
END;
$$;

-- =====================================================
-- 8. RPC: list_potential_parents — dropdown de link manual
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
    SELECT table_name FROM tenant_game_tables
    WHERE tenant_id = p_tenant_id AND parent_table = p_table
    UNION ALL
    SELECT t.table_name FROM tenant_game_tables t
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
  FROM tenant_game_tables tgt
  WHERE tgt.tenant_id = p_tenant_id
    AND tgt.table_name != p_table
    AND tgt.table_name NOT IN (SELECT table_name FROM descendants);

  RETURN COALESCE(v_result, jsonb_build_array());
END;
$$;

-- =====================================================
-- 9. RPC: get_child_tables — descobre filhos de uma tabela
--      Usado pelo frontend para mostrar relacionamentos
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
  FROM tenant_game_tables tgt
  WHERE tgt.tenant_id = p_tenant_id
    AND tgt.parent_table = p_table;

  RETURN COALESCE(v_result, jsonb_build_array());
END;
$$;

-- =====================================================
-- 10. Backfill: detectar parent_table para registros existentes
-- =====================================================

DO $$
DECLARE
  v_rec RECORD;
  v_parent TEXT;
BEGIN
  FOR v_rec IN
    SELECT tenant_id, table_name FROM tenant_game_tables
    WHERE parent_table IS NULL
  LOOP
    v_parent := public.detect_parent_table(v_rec.table_name);
    IF v_parent IS NOT NULL THEN
      UPDATE tenant_game_tables
      SET parent_table = v_parent
      WHERE tenant_id = v_rec.tenant_id AND table_name = v_rec.table_name;
    END IF;
  END LOOP;
END;
$$;
