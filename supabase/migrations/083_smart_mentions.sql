-- Migration 083: Smart mentions support
-- 1. Add Discord columns to profiles
-- 2. Add pending_links to wiki_articles
-- 3. Remove tables column from wiki_articles

-- 1. Discord columns on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS discord_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS discord_username text,
  ADD COLUMN IF NOT EXISTS discord_global_name text,
  ADD COLUMN IF NOT EXISTS discord_avatar text;

-- 2. pending_links on wiki_articles (replaces tables jsonb)
ALTER TABLE wiki_articles
  ADD COLUMN IF NOT EXISTS pending_links jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 3. Remove old tables column
ALTER TABLE wiki_articles
  DROP COLUMN IF EXISTS tables;
