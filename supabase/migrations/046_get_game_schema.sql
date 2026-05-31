-- Migration 046: get_game_schema RPC — return all game table schemas in one call
-- Used by the auto-discovery system for chat prompts and search categories.

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
    SELECT unnest(ARRAY[
      'weapons', 'armors', 'enemies', 'bosses', 'rings',
      'potions', 'upgrades', 'worlds', 'codes', 'crafting_recipes',
      'resources', 'build_presets'
    ])
  LOOP
    IF NOT public.is_game_table(v_table) THEN
      CONTINUE;
    END IF;

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
