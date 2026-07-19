-- Migration 093: item_variants presentation metadata (icon / color / display_label)
-- Permite ao usuário customizar cada variante no editor (ícone, cor e label
-- exibido no chip), unificando o detectar-automático com o editor de variantes.
-- O toggle "Atual / item v2 / item v3" na wiki lê esses campos para estilizar.

-- 1. Novas colunas
ALTER TABLE public.item_variants
  ADD COLUMN IF NOT EXISTS display_label TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT;

-- 2. RPC: update_item_variant_meta — upsert dos metadados de apresentação
CREATE OR REPLACE FUNCTION update_item_variant_meta(
  p_id UUID,
  p_tenant_id UUID,
  p_display_label TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_color TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_updated INT;
BEGIN
  IF p_tenant_id IS NULL OR NOT public.is_tenant_member_with_role(p_tenant_id, 'editor'::text) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Permissão negada.');
  END IF;

  UPDATE public.item_variants
  SET
    display_label = COALESCE(p_display_label, display_label),
    icon = COALESCE(p_icon, icon),
    color = COALESCE(p_color, color)
  WHERE id = p_id AND tenant_id = p_tenant_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Variante não encontrada.');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- 3. get_item_variants: retorna também display_label, icon e color
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
  v_has_slug BOOLEAN;
BEGIN
  SELECT group_key INTO v_group_key
  FROM public.item_variants
  WHERE tenant_id = p_tenant_id AND table_name = p_table AND item_id = p_item_id;

  IF v_group_key IS NULL THEN
    RETURN jsonb_build_array();
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table AND column_name = 'slug'
  ) INTO v_has_slug;

  IF v_has_slug THEN
    EXECUTE format('
      SELECT jsonb_agg(
        jsonb_build_object(
          ''id'', iv.id,
          ''item_id'', iv.item_id,
          ''item_slug'', t.slug,
          ''variant_label'', iv.variant_label,
          ''display_label'', iv.display_label,
          ''icon'', iv.icon,
          ''color'', iv.color,
          ''variant_order'', iv.variant_order,
          ''auto_detected'', iv.auto_detected
        ) ORDER BY iv.variant_order
      )
      FROM public.item_variants iv
      JOIN public.%I t ON t.id = iv.item_id
      WHERE iv.tenant_id = $1
        AND iv.table_name = $2
        AND iv.group_key = $3
    ', p_table)
    INTO v_result
    USING p_tenant_id, p_table, v_group_key;
  ELSE
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', iv.id,
        'item_id', iv.item_id,
        'item_slug', iv.item_id::text,
        'variant_label', iv.variant_label,
        'display_label', iv.display_label,
        'icon', iv.icon,
        'color', iv.color,
        'variant_order', iv.variant_order,
        'auto_detected', iv.auto_detected
      ) ORDER BY iv.variant_order
    ) INTO v_result
    FROM public.item_variants iv
    WHERE iv.tenant_id = p_tenant_id
      AND iv.table_name = p_table
      AND iv.group_key = v_group_key;
  END IF;

  RETURN COALESCE(v_result, jsonb_build_array());
END;
$$;

GRANT EXECUTE ON FUNCTION update_item_variant_meta(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated, service_role;
