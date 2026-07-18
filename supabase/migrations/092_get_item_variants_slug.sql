-- Migration 092: get_item_variants retorna item_slug
-- Adiciona o slug de cada item variante para permitir carregamento
-- in-place (sem navegação) e links corretos por slug.

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
