-- Migration 060: Add RLS policies + index for game_config
-- game_config already has tenant_id from a previous migration.
-- This adds RLS policies and an index for tenant-scoped isolation.

-- =====================================================
-- 1. Index on tenant_id
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_game_config_tenant ON game_config(tenant_id);

-- =====================================================
-- 2. RLS policies
-- =====================================================
ALTER TABLE game_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_config_select" ON game_config FOR SELECT USING (
  (tenant_id IS NULL) OR
  (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = game_config.tenant_id AND (tenants.is_public = true OR is_tenant_member(tenants.id))))
);

CREATE POLICY "game_config_insert" ON game_config FOR INSERT WITH CHECK (
  tenant_id IS NULL OR is_tenant_member_with_role(tenant_id, 'editor')
);

CREATE POLICY "game_config_update" ON game_config FOR UPDATE USING (
  tenant_id IS NULL OR is_tenant_member_with_role(tenant_id, 'editor')
);

CREATE POLICY "game_config_delete" ON game_config FOR DELETE USING (
  tenant_id IS NULL OR is_tenant_member_with_role(tenant_id, 'admin')
);
