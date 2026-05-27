-- Migration 021: Remove custom_collections/collection_items, add image_url to game tables

-- =====================================================
-- Remove the search_collection_items RPC
-- =====================================================
DROP FUNCTION IF EXISTS search_collection_items;

-- =====================================================
-- Drop custom_collections and collection_items (cascade)
-- =====================================================
DROP TABLE IF EXISTS collection_items CASCADE;
DROP TABLE IF EXISTS custom_collections CASCADE;

-- =====================================================
-- Fix build_presets — missing tenant_id (018 was partial)
-- =====================================================
ALTER TABLE build_presets ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
UPDATE build_presets SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE build_presets ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_build_presets_tenant ON build_presets(tenant_id);

-- resources also missing tenant_id
ALTER TABLE resources ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
UPDATE resources SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE resources ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resources_tenant ON resources(tenant_id);

-- =====================================================
-- Add image_url to dedicated game tables
-- =====================================================
ALTER TABLE weapons     ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE armors      ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE enemies     ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE bosses      ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE rings       ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE potions     ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE upgrades    ADD COLUMN IF NOT EXISTS image_url TEXT;
