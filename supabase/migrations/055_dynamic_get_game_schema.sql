-- Migration 055: Dynamic get_game_schema — iterate information_schema instead of hardcoded array
-- Uses is_game_table() to filter, so new tables are automatically included

CREATE OR REPLACE FUNCTION get_game_schema()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_table TEXT;
  v_result jsonb;
  v_tables jsonb := '[]'::jsonb;
  v_columns jsonb;
BEGIN
  FOR v_table IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND public.is_game_table(table_name)
    ORDER BY table_name
  LOOP
    SELECT jsonb_agg(
      jsonb_build_object(
        'column_name', column_name,
        'data_type', data_type,
        'is_nullable', is_nullable = 'YES',
        'column_default', column_default,
        'is_system', public.is_system_column(column_name)
      )
      ORDER BY ordinal_position
    )
    INTO v_columns
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = v_table;

    IF v_columns IS NOT NULL THEN
      v_tables := v_tables || jsonb_build_object(
        'table_name', v_table,
        'columns', v_columns
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'tables', v_tables);
END;
$$;
