-- Migration 039: Floating islands for wiki pages
-- Each tenant can have up to 3 floating islands (left / center / right)
-- stored as a JSONB array on tenant_pages

ALTER TABLE tenant_pages
  ADD COLUMN IF NOT EXISTS floating_islands JSONB NOT NULL DEFAULT '[]'::jsonb;
