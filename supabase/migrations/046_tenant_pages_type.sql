-- Migration 046: Add page_type to tenant_pages for footer and 404 pages
-- Alters the UNIQUE constraint to support multiple page types per tenant

ALTER TABLE tenant_pages DROP CONSTRAINT IF EXISTS tenant_pages_tenant_id_key;

ALTER TABLE tenant_pages ADD COLUMN IF NOT EXISTS page_type TEXT NOT NULL DEFAULT 'landing';

DROP INDEX IF EXISTS idx_tenant_pages_tenant_id;
CREATE UNIQUE INDEX idx_tenant_pages_tenant_type ON tenant_pages (tenant_id, page_type);
