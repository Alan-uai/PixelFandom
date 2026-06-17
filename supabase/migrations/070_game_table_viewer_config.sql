-- Add viewer_config JSONB column to tenant_game_tables for table viewer customization
ALTER TABLE tenant_game_tables
ADD COLUMN viewer_config jsonb NOT NULL DEFAULT '{}'::jsonb;
