-- Migration 041: Add RLS policies to game tables (weapons, armors, etc.)
-- These tables had RLS enabled but no policies, causing default-deny.
-- Mirror the same policies as wiki_articles.

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'weapons', 'armors', 'enemies', 'bosses', 'rings',
    'potions', 'upgrades', 'worlds', 'codes', 'crafting_recipes',
    'resources', 'build_presets'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- SELECT: readable by tenant members, or publicly if tenant is public
    EXECUTE format(
      'CREATE POLICY "Game %I are readable by members and public if tenant public" ON %I FOR SELECT USING (
        (tenant_id IS NULL) OR (
          EXISTS (
            SELECT 1 FROM tenants
            WHERE tenants.id = %I.tenant_id
              AND (tenants.is_public = true OR is_tenant_member(tenants.id))
          )
        )
      );',
      tbl, tbl, tbl
    );

    -- INSERT: only editors+ can insert
    EXECUTE format(
      'CREATE POLICY "Members with editor role can insert %I" ON %I FOR INSERT WITH CHECK (
        is_tenant_member_with_role(tenant_id, ''editor'')
      );',
      tbl, tbl
    );

    -- UPDATE: only editors+ can update
    EXECUTE format(
      'CREATE POLICY "Members with editor role can update %I" ON %I FOR UPDATE USING (
        is_tenant_member_with_role(tenant_id, ''editor'')
      );',
      tbl, tbl
    );

    -- DELETE: only admins+ can delete
    EXECUTE format(
      'CREATE POLICY "Members with admin role can delete %I" ON %I FOR DELETE USING (
        is_tenant_member_with_role(tenant_id, ''admin'')
      );',
      tbl, tbl
    );
  END LOOP;
END;
$$;
