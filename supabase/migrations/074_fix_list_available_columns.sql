-- Migration 074: Allow description and image_url in list_available_columns suggestions
-- The old version excluded name, slug, description, image_url from suggestions.
-- is_system_column() already excludes slug, so the extra NOT IN is redundant.
-- We want description and image_url to appear as suggestions when adding fields.
-- name is also allowed — it gets filtered client-side since it's already in the form.

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
    AND NOT public.is_system_column(column_name);

  RETURN COALESCE(v_result, jsonb_build_array());
END;
$$;
