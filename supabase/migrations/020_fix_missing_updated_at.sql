-- Migration 020: Fix missing updated_at columns on build_presets and crafting_recipes
-- The original migration 001 created these tables WITHOUT updated_at but added
-- triggers that reference NEW.updated_at. This causes any UPDATE on these tables
-- to fail with "record new has no field updated_at".

ALTER TABLE build_presets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE crafting_recipes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE weapon_abilities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
