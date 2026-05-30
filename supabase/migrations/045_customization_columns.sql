-- Migration 045: Add customization columns for images, icons, banners
-- Adds new columns for image uploads across all feature areas

-- ============================================================
-- 1. TENANTS — favicon, og_image, theme colors
-- ============================================================
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS og_image TEXT;

-- ============================================================
-- 2. WIKI_ARTICLES — banner, og_image, icon/emoji
-- ============================================================
ALTER TABLE wiki_articles
  ADD COLUMN IF NOT EXISTS banner_image TEXT,
  ADD COLUMN IF NOT EXISTS og_image TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT;

-- ============================================================
-- 3. PROFILES — bio, cover_image
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- ============================================================
-- 4. BADGES — image_url (replaces emoji-only icons)
-- ============================================================
ALTER TABLE badges
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ============================================================
-- 5. DISCORD_GUILDS — icon_url
-- ============================================================
ALTER TABLE discord_guilds
  ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- ============================================================
-- 6. GAME TABLES — add image_url to all remaining tables
-- ============================================================
ALTER TABLE worlds ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE codes ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE crafting_recipes ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE build_presets ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE weapon_abilities ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE ring_quality_tiers ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE ring_stat_formulas ADD COLUMN IF NOT EXISTS image_url TEXT;
