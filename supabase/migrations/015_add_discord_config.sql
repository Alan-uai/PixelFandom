ALTER TABLE tenants ADD COLUMN IF NOT EXISTS discord_config JSONB DEFAULT '{}'::jsonb;
