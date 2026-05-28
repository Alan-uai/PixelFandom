-- Migration 032: Adicionar colunas discord_url e game_url para links sociais
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS discord_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS game_url TEXT;
