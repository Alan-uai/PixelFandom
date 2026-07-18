-- Migration 090: Fix search_path on all item_variants RPCs
-- Functions with SET search_path = '' need fully qualified table references
-- because with empty search_path, only pg_catalog is searched — not public.

-- =====================================================
-- 1. fix detect_item_variants
-- =====================================================

CREATE OR REPLACE FUNCTION detect_item_variants(
  p_table TEXT,
  p_tenant_id UUID,
  p_tier_columns TEXT[] DEFAULT ARRAY['rarity', 'tier', 'level', 'rank', 'grade', 'class']
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_group_key TEXT;
  v_base_name TEXT;
  v_item RECORD;
  v_count INT := 0;
  v_tier_col TEXT;
  v_col_exists BOOLEAN;
  v_tier_value TEXT;
  v_label TEXT;
  v_max_order INT;
BEGIN
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  FOR v_tier_col IN SELECT unnest(p_tier_columns) LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = p_table AND column_name = v_tier_col
    ) INTO v_col_exists;
    IF v_col_exists THEN
      EXIT;
    END IF;
  END LOOP;

  IF NOT v_col_exists THEN
    v_tier_col := NULL;
  END IF;

  FOR v_item IN
    EXECUTE format('
      SELECT id, name, slug, %s
      FROM public.%I
      WHERE tenant_id = $1 AND name IS NOT NULL AND name != $2
      ORDER BY name
    ', COALESCE(quote_ident(v_tier_col) || ' AS tier_val', 'NULL::text AS tier_val'), p_table)
    USING p_tenant_id, ''
  LOOP
    v_base_name := regexp_replace(v_item.name, ' ?[([{][^)\]}]*[)\]}]*$', '', 'g');
    v_base_name := regexp_replace(v_base_name, ' [-–—][^-–—]*$', '');
    v_base_name := regexp_replace(v_base_name, ' [Nn]v\.?\d+', '');
    v_base_name := trim(v_base_name);

    IF length(v_base_name) < 2 THEN CONTINUE; END IF;

    v_group_key := public.slugify(v_base_name || '-' || p_table);

    IF v_tier_col IS NOT NULL AND v_item.tier_val IS NOT NULL THEN
      v_label := v_item.tier_val;
    ELSE
      v_label := v_item.name;
    END IF;

    SELECT COALESCE(MAX(variant_order), -1) + 1 INTO v_max_order
    FROM public.item_variants
    WHERE tenant_id = p_tenant_id AND table_name = p_table AND group_key = v_group_key;

    INSERT INTO public.item_variants (tenant_id, table_name, group_key, item_id, variant_label, variant_order, auto_detected)
    VALUES (p_tenant_id, p_table, v_group_key, v_item.id, v_label, v_max_order, true)
    ON CONFLICT (tenant_id, table_name, item_id)
    DO UPDATE SET group_key = v_group_key, variant_label = v_label, variant_order = v_max_order, auto_detected = true;

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'variants_created', v_count);
END;
$$;

-- =====================================================
-- 2. fix get_item_variants
-- =====================================================

CREATE OR REPLACE FUNCTION get_item_variants(
  p_table TEXT,
  p_item_id UUID,
  p_tenant_id UUID
) RETURNS jsonb
LANGUAGE plpgsql STABLE SET search_path = ''
AS $$
DECLARE
  v_group_key TEXT;
  v_result jsonb;
BEGIN
  SELECT group_key INTO v_group_key
  FROM public.item_variants
  WHERE tenant_id = p_tenant_id AND table_name = p_table AND item_id = p_item_id;

  IF v_group_key IS NULL THEN
    RETURN jsonb_build_array();
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', iv.id,
      'item_id', iv.item_id,
      'variant_label', iv.variant_label,
      'variant_order', iv.variant_order,
      'auto_detected', iv.auto_detected
    ) ORDER BY iv.variant_order
  ) INTO v_result
  FROM public.item_variants iv
  WHERE iv.tenant_id = p_tenant_id
    AND iv.table_name = p_table
    AND iv.group_key = v_group_key;

  RETURN COALESCE(v_result, jsonb_build_array());
END;
$$;

-- =====================================================
-- 3. fix link_item_variant
-- =====================================================

CREATE OR REPLACE FUNCTION link_item_variant(
  p_table TEXT,
  p_item_id UUID,
  p_target_item_id UUID,
  p_tenant_id UUID,
  p_variant_label TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_group_key TEXT;
  v_max_order INT;
  v_target_name TEXT;
  v_label TEXT;
BEGIN
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  SELECT group_key INTO v_group_key
  FROM public.item_variants
  WHERE tenant_id = p_tenant_id AND table_name = p_table AND item_id = p_item_id
  LIMIT 1;

  IF v_group_key IS NULL THEN
    EXECUTE format('SELECT slug FROM public.%I WHERE id = $1', p_table) INTO v_group_key USING p_item_id;
    v_group_key := COALESCE(v_group_key, 'variant') || '-' || p_table;
  END IF;

  SELECT COALESCE(MAX(variant_order), 0) + 1 INTO v_max_order
  FROM public.item_variants
  WHERE tenant_id = p_tenant_id AND table_name = p_table AND group_key = v_group_key;

  IF p_variant_label IS NULL THEN
    EXECUTE format('SELECT name FROM public.%I WHERE id = $1', p_table) INTO v_target_name USING p_target_item_id;
    v_label := v_target_name;
  ELSE
    v_label := p_variant_label;
  END IF;

  INSERT INTO public.item_variants (tenant_id, table_name, group_key, item_id, variant_label, variant_order, auto_detected)
  VALUES (p_tenant_id, p_table, v_group_key, p_target_item_id, v_label, v_max_order, false)
  ON CONFLICT (tenant_id, table_name, item_id) DO UPDATE
  SET group_key = v_group_key, variant_label = v_label, variant_order = v_max_order;

  RETURN jsonb_build_object('ok', true, 'group_key', v_group_key);
END;
$$;

-- =====================================================
-- 4. fix unlink_item_variant
-- =====================================================

CREATE OR REPLACE FUNCTION unlink_item_variant(
  p_table TEXT,
  p_item_id UUID,
  p_tenant_id UUID
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  DELETE FROM public.item_variants
  WHERE tenant_id = p_tenant_id AND table_name = p_table AND item_id = p_item_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- =====================================================
-- 5. fix list_variant_groups
-- =====================================================

CREATE OR REPLACE FUNCTION list_variant_groups(
  p_table TEXT,
  p_tenant_id UUID
) RETURNS jsonb
LANGUAGE plpgsql STABLE SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'group_key', iv.group_key,
      'variant_count', COUNT(*),
      'variants', jsonb_agg(
        jsonb_build_object(
          'id', iv.id,
          'item_id', iv.item_id,
          'variant_label', iv.variant_label,
          'variant_order', iv.variant_order,
          'auto_detected', iv.auto_detected
        ) ORDER BY iv.variant_order
      )
    ) ORDER BY COUNT(*) DESC
  ) INTO v_result
  FROM public.item_variants iv
  WHERE iv.tenant_id = p_tenant_id AND iv.table_name = p_table
  GROUP BY iv.group_key;

  RETURN COALESCE(v_result, jsonb_build_array());
END;
$$;
