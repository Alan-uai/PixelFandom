-- Migration 054: Redefine is_game_table with heuristic instead of hardcoded array
-- Dynamically detects game tables by checking for tenant_id + name-like column
-- Any new table with tenant_id + name/code/_name is automatically discovered

CREATE OR REPLACE FUNCTION is_game_table(t TEXT) RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns c1
    WHERE c1.table_schema = 'public' AND c1.table_name = t AND c1.column_name = 'tenant_id'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns c2
    WHERE c2.table_schema = 'public' AND c2.table_name = t
      AND (c2.column_name = 'name'
           OR c2.column_name LIKE '%_name'
           OR c2.column_name = 'code')
  )
  AND t <> 'tenant_templates';
$$;
