# Supabase Schema — PixelFandom

*Auto-generated from live database — 46 tables*

## `activity_log`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `tenant_id` | `uuid` | NO |  |
| 3 | `actor_id` | `uuid` | YES |  |
| 4 | `actor_name` | `text` | YES |  |
| 5 | `type` | `text` | NO |  |
| 6 | `description` | `text` | NO |  |
| 7 | `metadata` | `jsonb` | YES | `'{}'::jsonb` |
| 8 | `link` | `text` | YES |  |
| 9 | `created_at` | `timestamp with time zone` | NO | `now()` |

---

## `armors`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `name` | `character varying` | NO |  |
| 3 | `rarity` | `USER-DEFINED` | NO |  |
| 4 | `world_name` | `character varying` | YES |  |
| 5 | `health_bonus` | `integer` | NO |  |
| 6 | `speed_bonus` | `integer` | NO |  |
| 7 | `energy_bonus` | `integer` | NO |  |
| 8 | `passive_ability` | `text` | YES |  |
| 9 | `passive_ability_level` | `integer` | YES |  |
| 10 | `obtain_method` | `character varying` | YES |  |
| 11 | `craft_cost` | `integer` | YES |  |
| 12 | `craft_materials` | `jsonb` | YES |  |
| 13 | `set_bonus` | `jsonb` | YES |  |
| 14 | `is_worth_crafting` | `boolean` | YES | `false` |
| 15 | `tier` | `USER-DEFINED` | YES | `'c'::tier_rank` |
| 16 | `notes` | `text` | YES |  |
| 17 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 18 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 19 | `tenant_id` | `uuid` | NO |  |
| 20 | `image_url` | `text` | YES |  |
| 21 | `embedding` | `USER-DEFINED` | YES |  |
| 22 | `slug` | `text` | YES |  |

---

## `article_comments`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `article_id` | `uuid` | NO |  |
| 3 | `tenant_id` | `uuid` | NO |  |
| 4 | `user_id` | `uuid` | NO |  |
| 5 | `parent_id` | `uuid` | YES |  |
| 6 | `content` | `text` | NO |  |
| 7 | `depth` | `integer` | NO | `0` |
| 8 | `edited_at` | `timestamp with time zone` | YES |  |
| 9 | `created_at` | `timestamp with time zone` | NO | `now()` |

---

## `article_reactions`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `user_id` | `uuid` | NO |  |
| 3 | `target_type` | `text` | NO |  |
| 4 | `target_id` | `uuid` | NO |  |
| 5 | `emoji` | `text` | NO | `'👍'::text` |
| 6 | `created_at` | `timestamp with time zone` | NO | `now()` |

---

## `article_versions`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `article_id` | `uuid` | NO |  |
| 3 | `version_number` | `integer` | NO |  |
| 4 | `title` | `text` | NO |  |
| 5 | `summary` | `text` | YES |  |
| 6 | `content` | `text` | YES |  |
| 7 | `tags` | `ARRAY` | YES |  |
| 8 | `image_url` | `text` | YES |  |
| 9 | `tables` | `jsonb` | YES |  |
| 10 | `created_by` | `uuid` | YES |  |
| 11 | `change_summary` | `text` | YES |  |
| 12 | `created_at` | `timestamp with time zone` | NO | `now()` |

---

## `badges`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `slug` | `text` | NO |  |
| 3 | `name` | `text` | NO |  |
| 4 | `description` | `text` | YES |  |
| 5 | `icon` | `text` | NO | `'🏆'::text` |
| 6 | `category` | `text` | NO | `'general'::text` |
| 7 | `criteria_type` | `text` | NO |  |
| 8 | `criteria_value` | `integer` | NO | `1` |
| 9 | `rarity` | `integer` | NO | `1` |
| 10 | `created_at` | `timestamp with time zone` | NO | `now()` |
| 11 | `image_url` | `text` | YES |  |

---

## `bosses`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `name` | `character varying` | NO |  |
| 3 | `world_name` | `character varying` | YES |  |
| 4 | `chapter` | `integer` | YES |  |
| 5 | `boss_type` | `character varying` | YES | `'boss'::character varying` |
| 6 | `description` | `text` | YES |  |
| 7 | `hp_level` | `character varying` | YES |  |
| 8 | `difficulty` | `character varying` | YES |  |
| 9 | `attacks` | `jsonb` | YES |  |
| 10 | `phase_mechanics` | `text` | YES |  |
| 11 | `weakness` | `ARRAY` | YES |  |
| 12 | `strategy` | `text` | YES |  |
| 13 | `tips` | `ARRAY` | YES |  |
| 14 | `xp_drop` | `character varying` | YES |  |
| 15 | `items_dropped` | `jsonb` | YES |  |
| 16 | `notable_loot` | `jsonb` | YES |  |
| 17 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 18 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 19 | `tenant_id` | `uuid` | NO |  |
| 20 | `image_url` | `text` | YES |  |
| 21 | `embedding` | `USER-DEFINED` | YES |  |
| 22 | `slug` | `text` | YES |  |

---

## `bot_config`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `key` | `character varying` | NO |  |
| 3 | `value` | `jsonb` | YES |  |
| 4 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 5 | `updated_at` | `timestamp with time zone` | YES | `now()` |

---

## `build_presets`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `build_name` | `character varying` | NO |  |
| 3 | `build_type` | `character varying` | NO |  |
| 4 | `recommended_upgrades` | `jsonb` | NO |  |
| 5 | `recommended_armor` | `character varying` | YES |  |
| 6 | `recommended_weapon` | `character varying` | YES |  |
| 7 | `strategy` | `text` | YES |  |
| 8 | `difficulty_level` | `character varying` | YES |  |
| 9 | `is_meta` | `boolean` | YES | `false` |
| 10 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 11 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 12 | `tenant_id` | `uuid` | NO |  |
| 13 | `image_url` | `text` | YES |  |

---

## `chat_logs`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `tenant_id` | `uuid` | NO |  |
| 3 | `session_id` | `text` | YES |  |
| 4 | `user_id` | `uuid` | YES |  |
| 5 | `question` | `text` | NO |  |
| 6 | `answer_length` | `integer` | YES | `0` |
| 7 | `model_used` | `text` | YES |  |
| 8 | `provider` | `text` | YES |  |
| 9 | `latency_ms` | `integer` | YES |  |
| 10 | `had_context` | `boolean` | YES | `false` |
| 11 | `feedback` | `text` | YES |  |
| 12 | `created_at` | `timestamp with time zone` | NO | `now()` |

---

## `chat_messages`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `session_id` | `uuid` | NO |  |
| 3 | `role` | `text` | NO |  |
| 4 | `content` | `text` | NO | `''::text` |
| 5 | `provider` | `text` | YES | `'text'::text` |
| 6 | `citations` | `jsonb` | YES | `'[]'::jsonb` |
| 7 | `feedback` | `text` | YES |  |
| 8 | `feedback_updated_at` | `timestamp with time zone` | YES |  |
| 9 | `metadata` | `jsonb` | YES | `'{}'::jsonb` |
| 10 | `created_at` | `timestamp with time zone` | NO | `now()` |

---

## `chat_sessions`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `tenant_id` | `uuid` | NO |  |
| 3 | `user_id` | `uuid` | NO |  |
| 4 | `title` | `text` | NO | `'Nova conversa'::text` |
| 5 | `provider` | `text` | NO | `'text'::text` |
| 6 | `model` | `text` | YES |  |
| 7 | `voice_name` | `text` | YES |  |
| 8 | `status` | `text` | NO | `'active'::text` |
| 9 | `gemini_resumption_handle` | `text` | YES |  |
| 10 | `metadata` | `jsonb` | YES | `'{}'::jsonb` |
| 11 | `message_count` | `integer` | NO | `0` |
| 12 | `created_at` | `timestamp with time zone` | NO | `now()` |
| 13 | `updated_at` | `timestamp with time zone` | NO | `now()` |

---

## `codes`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `code` | `character varying` | NO |  |
| 3 | `rewards` | `jsonb` | NO |  |
| 4 | `reward_type` | `character varying` | YES |  |
| 5 | `code_type` | `character varying` | YES |  |
| 6 | `is_active` | `boolean` | YES | `true` |
| 7 | `verified_date` | `date` | YES |  |
| 8 | `verified_by` | `character varying` | YES |  |
| 9 | `is_expired` | `boolean` | YES | `false` |
| 10 | `expired_date` | `date` | YES |  |
| 11 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 12 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 13 | `tenant_id` | `uuid` | NO |  |
| 14 | `image_url` | `text` | YES |  |

---

## `content_suggestions`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `user_id` | `uuid` | YES |  |
| 3 | `user_email` | `text` | YES |  |
| 4 | `title` | `text` | NO |  |
| 5 | `content` | `text` | NO |  |
| 6 | `attachment_urls` | `ARRAY` | YES |  |
| 7 | `status` | `text` | YES | `'pending'::text` |
| 8 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 9 | `tenant_id` | `uuid` | YES |  |

---

## `crafting_recipes`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `item_name` | `character varying` | NO |  |
| 3 | `item_type` | `character varying` | NO |  |
| 4 | `rarity` | `USER-DEFINED` | YES |  |
| 5 | `gold_cost` | `integer` | NO |  |
| 6 | `materials` | `jsonb` | NO |  |
| 7 | `is_worth_crafting` | `boolean` | YES | `false` |
| 8 | `worth_notes` | `text` | YES |  |
| 9 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 10 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 11 | `tenant_id` | `uuid` | NO |  |
| 12 | `image_url` | `text` | YES |  |

---

## `discord_guilds`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `guild_id` | `text` | NO |  |
| 2 | `tenant_id` | `uuid` | YES |  |
| 3 | `channel_id` | `text` | YES |  |
| 4 | `bot_enabled` | `boolean` | YES | `true` |
| 5 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 6 | `icon_url` | `text` | YES |  |

---

## `enemies`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `name` | `character varying` | NO |  |
| 3 | `world_name` | `character varying` | YES |  |
| 4 | `chapters` | `jsonb` | YES |  |
| 5 | `enemy_type` | `character varying` | YES |  |
| 6 | `description` | `text` | YES |  |
| 7 | `health_level` | `character varying` | YES |  |
| 8 | `speed_level` | `character varying` | YES |  |
| 9 | `strength_level` | `character varying` | YES |  |
| 10 | `difficulty` | `character varying` | YES |  |
| 11 | `attacks` | `jsonb` | YES |  |
| 12 | `effects` | `jsonb` | YES |  |
| 13 | `xp_drop` | `character varying` | YES |  |
| 14 | `coin_drop` | `character varying` | YES |  |
| 15 | `items_dropped` | `jsonb` | YES |  |
| 16 | `weakness` | `ARRAY` | YES |  |
| 17 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 18 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 19 | `tenant_id` | `uuid` | NO |  |
| 20 | `image_url` | `text` | YES |  |
| 21 | `embedding` | `USER-DEFINED` | YES |  |
| 22 | `slug` | `text` | YES |  |

---

## `game_config`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `config_key` | `character varying` | NO |  |
| 3 | `config_value` | `jsonb` | NO |  |
| 4 | `category` | `character varying` | YES |  |
| 5 | `description` | `text` | YES |  |
| 6 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 7 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 8 | `tenant_id` | `uuid` | YES |  |

---

## `import_jobs`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `tenant_id` | `uuid` | NO |  |
| 3 | `source` | `text` | NO |  |
| 4 | `status` | `text` | NO | `'pending'::text` |
| 5 | `total_count` | `integer` | NO | `0` |
| 6 | `completed_count` | `integer` | NO | `0` |
| 7 | `failed_count` | `integer` | NO | `0` |
| 8 | `options` | `jsonb` | YES | `'{}'::jsonb` |
| 9 | `result` | `jsonb` | YES | `'{}'::jsonb` |
| 10 | `created_by` | `uuid` | YES |  |
| 11 | `created_at` | `timestamp with time zone` | NO | `now()` |
| 12 | `completed_at` | `timestamp with time zone` | YES |  |

---

## `import_log`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `job_id` | `uuid` | NO |  |
| 3 | `article_title` | `text` | YES |  |
| 4 | `original_slug` | `text` | YES |  |
| 5 | `new_slug` | `text` | YES |  |
| 6 | `status` | `text` | NO |  |
| 7 | `error` | `text` | YES |  |
| 8 | `created_at` | `timestamp with time zone` | NO | `now()` |

---

## `invitations`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `tenant_id` | `uuid` | NO |  |
| 3 | `invited_by` | `uuid` | NO |  |
| 4 | `email` | `text` | NO |  |
| 5 | `role` | `text` | NO | `'viewer'::text` |
| 6 | `token` | `text` | NO |  |
| 7 | `expires_at` | `timestamp with time zone` | YES |  |
| 8 | `accepted_at` | `timestamp with time zone` | YES |  |
| 9 | `created_at` | `timestamp with time zone` | NO | `now()` |

---

## `negative_feedback`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `user_id` | `uuid` | YES |  |
| 3 | `user_email` | `text` | YES |  |
| 4 | `question` | `text` | NO |  |
| 5 | `negative_response` | `text` | NO |  |
| 6 | `ai_suggestion` | `text` | YES |  |
| 7 | `reputation_points_awarded` | `integer` | YES | `1` |
| 8 | `status` | `text` | YES | `'pending'::text` |
| 9 | `reviewed_by` | `text` | YES |  |
| 10 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 11 | `tenant_id` | `uuid` | YES |  |

---

## `notifications`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `user_id` | `uuid` | NO |  |
| 3 | `tenant_id` | `uuid` | YES |  |
| 4 | `type` | `text` | NO |  |
| 5 | `title` | `text` | NO |  |
| 6 | `body` | `text` | YES |  |
| 7 | `metadata` | `jsonb` | YES | `'{}'::jsonb` |
| 8 | `link` | `text` | YES |  |
| 9 | `read_at` | `timestamp with time zone` | YES |  |
| 10 | `created_at` | `timestamp with time zone` | NO | `now()` |

---

## `page_views`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `tenant_id` | `uuid` | NO |  |
| 3 | `article_id` | `uuid` | YES |  |
| 4 | `page_path` | `text` | NO |  |
| 5 | `page_title` | `text` | YES |  |
| 6 | `viewer_id` | `uuid` | YES |  |
| 7 | `viewer_ip_hash` | `text` | YES |  |
| 8 | `user_agent` | `text` | YES |  |
| 9 | `referrer` | `text` | YES |  |
| 10 | `viewed_at` | `timestamp with time zone` | NO | `now()` |

---

## `potions`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `name` | `character varying` | NO |  |
| 3 | `effects` | `jsonb` | NO |  |
| 4 | `shop_price` | `integer` | YES |  |
| 5 | `crafting_cost` | `integer` | YES |  |
| 6 | `crafting_materials` | `jsonb` | YES |  |
| 7 | `savings_percentage` | `integer` | YES |  |
| 8 | `unlock_level` | `integer` | YES |  |
| 9 | `second_slot_unlock_level` | `integer` | YES |  |
| 10 | `max_uses_per_run` | `integer` | YES | `3` |
| 11 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 12 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 13 | `tenant_id` | `uuid` | NO |  |
| 14 | `image_url` | `text` | YES |  |
| 15 | `embedding` | `USER-DEFINED` | YES |  |
| 16 | `slug` | `text` | YES |  |

---

## `profiles`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO |  |
| 2 | `username` | `text` | YES |  |
| 3 | `display_name` | `text` | YES |  |
| 4 | `email` | `text` | YES |  |
| 5 | `avatar_url` | `text` | YES |  |
| 6 | `role` | `text` | NO | `'user'::text` |
| 7 | `reputation_points` | `integer` | NO | `0` |
| 8 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 9 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 10 | `streak_days` | `integer` | NO | `0` |
| 11 | `articles_count` | `integer` | NO | `0` |
| 12 | `edits_count` | `integer` | NO | `0` |
| 13 | `comments_count` | `integer` | NO | `0` |
| 14 | `reactions_received` | `integer` | NO | `0` |
| 15 | `last_active_at` | `timestamp with time zone` | YES | `now()` |
| 16 | `bio` | `text` | YES |  |
| 17 | `cover_image` | `text` | YES |  |

---

## `resources`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `resource_name` | `character varying` | NO |  |
| 3 | `resource_type` | `character varying` | NO |  |
| 4 | `source_world` | `character varying` | YES |  |
| 5 | `source_method` | `character varying` | YES |  |
| 6 | `usage_description` | `text` | YES |  |
| 7 | `items_crafted` | `jsonb` | YES |  |
| 8 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 9 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 10 | `tenant_id` | `uuid` | NO |  |
| 11 | `image_url` | `text` | YES |  |

---

## `ring_quality_tiers`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `tier_name` | `character varying` | NO |  |
| 3 | `quality_min` | `integer` | NO |  |
| 4 | `quality_max` | `integer` | NO |  |
| 5 | `description` | `text` | YES |  |
| 6 | `aura_color` | `character varying` | YES |  |
| 7 | `action` | `character varying` | YES |  |
| 8 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 9 | `image_url` | `text` | YES |  |

---

## `ring_stat_formulas`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `stat_type` | `character varying` | NO |  |
| 3 | `formula` | `character varying` | NO |  |
| 4 | `coefficient_a` | `numeric` | YES |  |
| 5 | `coefficient_b` | `numeric` | YES |  |
| 6 | `highest_scaling_range` | `character varying` | YES |  |
| 7 | `stardust_to_level_8` | `integer` | YES |  |
| 8 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 9 | `image_url` | `text` | YES |  |

---

## `rings`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `name` | `character varying` | NO |  |
| 3 | `tier` | `USER-DEFINED` | NO |  |
| 4 | `rarity` | `USER-DEFINED` | NO |  |
| 5 | `description` | `text` | YES |  |
| 6 | `starting_banner` | `character varying` | YES |  |
| 7 | `key_buffs` | `jsonb` | YES |  |
| 8 | `possible_stats` | `jsonb` | YES |  |
| 9 | `synergy` | `text` | YES |  |
| 10 | `is_craftable` | `boolean` | YES | `false` |
| 11 | `craft_cost` | `integer` | YES |  |
| 12 | `craft_materials` | `jsonb` | YES |  |
| 13 | `is_worth_crafting` | `boolean` | YES | `false` |
| 14 | `obtain_method` | `character varying` | YES |  |
| 15 | `drop_wave_requirement` | `integer` | YES |  |
| 16 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 17 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 18 | `tenant_id` | `uuid` | NO |  |
| 19 | `image_url` | `text` | YES |  |
| 20 | `embedding` | `USER-DEFINED` | YES |  |
| 21 | `slug` | `text` | YES |  |

---

## `saved_answers`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `user_id` | `uuid` | NO |  |
| 3 | `question` | `text` | YES |  |
| 4 | `answer` | `text` | NO |  |
| 5 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 6 | `tenant_id` | `uuid` | YES |  |

---

## `spirit_capacity_synergy`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `capacity` | `integer` | NO |  |
| 3 | `max_damage_bonus` | `character varying` | YES |  |
| 4 | `max_speed_bonus` | `character varying` | YES |  |
| 5 | `notes` | `character varying` | YES |  |
| 6 | `created_at` | `timestamp with time zone` | YES | `now()` |

---

## `spirit_system_config`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `default_capacity` | `integer` | YES | `2` |
| 3 | `max_capacity` | `integer` | YES | `10` |
| 4 | `recommended_minimum` | `integer` | YES | `6` |
| 5 | `per_spirit_speed_bonus` | `numeric` | YES | `5.0` |
| 6 | `per_spirit_damage_bonus` | `numeric` | YES | `8.0` |
| 7 | `boss_spirit_value` | `integer` | YES | `2` |
| 8 | `boss_spirit_speed_multiplier` | `numeric` | YES | `2.0` |
| 9 | `created_at` | `timestamp with time zone` | YES | `now()` |

---

## `tenant_game_tables`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `tenant_id` | `uuid` | NO |  |
| 3 | `table_name` | `text` | NO |  |
| 4 | `display_label` | `text` | NO |  |
| 5 | `created_at` | `timestamp with time zone` | NO | `now()` |
| 6 | `parent_table` | `text` | YES |  |

---

## `tenant_members`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `tenant_id` | `uuid` | NO |  |
| 2 | `user_id` | `uuid` | NO |  |
| 3 | `role` | `text` | NO | `'viewer'::text` |
| 4 | `invited_by` | `uuid` | YES |  |
| 5 | `created_at` | `timestamp with time zone` | YES | `now()` |

---

## `tenant_pages`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `tenant_id` | `uuid` | NO |  |
| 3 | `layout` | `jsonb` | NO | `'{"blocks": []}'::jsonb` |
| 4 | `published_layout` | `jsonb` | YES |  |
| 5 | `updated_at` | `timestamp with time zone` | NO | `now()` |
| 6 | `created_at` | `timestamp with time zone` | NO | `now()` |
| 7 | `floating_islands` | `jsonb` | NO | `'[]'::jsonb` |
| 8 | `page_type` | `text` | NO | `'landing'::text` |

---

## `tenant_templates`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `tenant_id` | `uuid` | NO |  |
| 3 | `name` | `text` | NO |  |
| 4 | `category` | `text` | YES | `'custom'::text` |
| 5 | `blocks` | `jsonb` | NO | `'[]'::jsonb` |
| 6 | `thumbnail` | `text` | YES |  |
| 7 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 8 | `updated_at` | `timestamp with time zone` | YES | `now()` |

---

## `tenants`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `name` | `text` | NO |  |
| 3 | `slug` | `text` | NO |  |
| 4 | `custom_domain` | `text` | YES |  |
| 5 | `logo_url` | `text` | YES |  |
| 6 | `description` | `text` | YES |  |
| 7 | `theme` | `jsonb` | YES | `'{}'::jsonb` |
| 8 | `ai_enabled` | `boolean` | YES | `false` |
| 9 | `ai_config` | `jsonb` | YES | `'{}'::jsonb` |
| 10 | `is_public` | `boolean` | YES | `true` |
| 11 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 12 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 13 | `discord_config` | `jsonb` | YES | `'{}'::jsonb` |
| 14 | `cover_image` | `text` | YES |  |
| 15 | `discord_url` | `text` | YES |  |
| 16 | `game_url` | `text` | YES |  |
| 17 | `favicon_url` | `text` | YES |  |
| 18 | `og_image` | `text` | YES |  |
| 19 | `domain_verified` | `boolean` | NO | `false` |
| 20 | `domain_verified_at` | `timestamp with time zone` | YES |  |
| 21 | `domain_last_checked_at` | `timestamp with time zone` | YES |  |

---

## `upgrades`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `name` | `character varying` | NO |  |
| 3 | `category` | `character varying` | NO |  |
| 4 | `description` | `text` | YES |  |
| 5 | `effect` | `text` | NO |  |
| 6 | `per_rank_effect` | `character varying` | YES |  |
| 7 | `max_ranks` | `integer` | YES | `4` |
| 8 | `damage_per_spirit` | `numeric` | YES |  |
| 9 | `speed_per_spirit` | `numeric` | YES |  |
| 10 | `tier` | `USER-DEFINED` | NO |  |
| 11 | `priority_order` | `integer` | YES |  |
| 12 | `is_must_pick` | `boolean` | YES | `false` |
| 13 | `notes` | `text` | YES |  |
| 14 | `important_notes` | `ARRAY` | YES |  |
| 15 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 16 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 17 | `tenant_id` | `uuid` | NO |  |
| 18 | `image_url` | `text` | YES |  |
| 19 | `embedding` | `USER-DEFINED` | YES |  |
| 20 | `slug` | `text` | YES |  |

---

## `user_badges`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `user_id` | `uuid` | NO |  |
| 3 | `badge_id` | `uuid` | NO |  |
| 4 | `tenant_id` | `uuid` | YES |  |
| 5 | `earned_at` | `timestamp with time zone` | NO | `now()` |

---

## `user_follows`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `user_id` | `uuid` | NO |  |
| 3 | `tenant_id` | `uuid` | NO |  |
| 4 | `created_at` | `timestamp with time zone` | NO | `now()` |

---

## `user_preferences`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `user_id` | `uuid` | NO |  |
| 3 | `preferences` | `jsonb` | NO | `'{}'::jsonb` |
| 4 | `created_at` | `timestamp with time zone` | NO | `now()` |
| 5 | `updated_at` | `timestamp with time zone` | NO | `now()` |

---

## `votes`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `gen_random_uuid()` |
| 2 | `user_id` | `uuid` | NO |  |
| 3 | `target_type` | `text` | NO |  |
| 4 | `target_id` | `uuid` | NO |  |
| 5 | `vote_type` | `text` | NO |  |
| 6 | `created_at` | `timestamp with time zone` | NO | `now()` |

---

## `weapons`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `name` | `character varying` | NO |  |
| 3 | `rarity` | `USER-DEFINED` | NO |  |
| 4 | `weapon_type` | `character varying` | NO |  |
| 5 | `damage_min` | `integer` | NO |  |
| 6 | `damage_max` | `integer` | NO |  |
| 7 | `crit_chance_min` | `numeric` | NO |  |
| 8 | `crit_chance_max` | `numeric` | NO |  |
| 9 | `attack_speed` | `USER-DEFINED` | NO |  |
| 10 | `knockback` | `numeric` | NO |  |
| 11 | `element` | `USER-DEFINED` | YES | `'none'::element_type` |
| 12 | `ability_name` | `character varying` | YES |  |
| 13 | `ability_description` | `text` | YES |  |
| 14 | `ability_energy_cost` | `integer` | YES |  |
| 15 | `ability_cooldown` | `integer` | YES |  |
| 16 | `ability_effect` | `text` | YES |  |
| 17 | `obtain_method` | `character varying` | YES |  |
| 18 | `craft_cost` | `integer` | YES |  |
| 19 | `craft_materials` | `jsonb` | YES |  |
| 20 | `is_worth_crafting` | `boolean` | YES | `false` |
| 21 | `drop_rate_multiplier` | `numeric` | YES |  |
| 22 | `drop_rate_percentage` | `numeric` | YES |  |
| 23 | `tier` | `USER-DEFINED` | YES | `'c'::tier_rank` |
| 24 | `notes` | `text` | YES |  |
| 25 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 26 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 27 | `tenant_id` | `uuid` | NO |  |
| 28 | `image_url` | `text` | YES |  |
| 29 | `embedding` | `USER-DEFINED` | YES |  |
| 30 | `slug` | `text` | YES |  |

---

## `wiki_articles`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `title` | `text` | NO |  |
| 3 | `summary` | `text` | YES |  |
| 4 | `content` | `text` | YES |  |
| 5 | `tags` | `ARRAY` | YES |  |
| 6 | `image_url` | `text` | YES |  |
| 7 | `tables` | `jsonb` | YES |  |
| 8 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 9 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 10 | `tenant_id` | `uuid` | YES |  |
| 11 | `slug` | `text` | YES |  |
| 12 | `embedding` | `USER-DEFINED` | YES |  |
| 13 | `search_vector` | `tsvector` | YES |  |
| 14 | `status` | `text` | NO | `'published'::text` |
| 15 | `banner_image` | `text` | YES |  |
| 16 | `og_image` | `text` | YES |  |
| 17 | `created_by` | `uuid` | YES |  |

---

## `worlds`

| # | Column | Type | Nullable | Default |
|---|--------|------|----------|---------|
| 1 | `id` | `uuid` | NO | `uuid_generate_v4()` |
| 2 | `world_name` | `character varying` | NO |  |
| 3 | `world_number` | `integer` | NO |  |
| 4 | `world_type` | `character varying` | YES |  |
| 5 | `level_range` | `character varying` | YES |  |
| 6 | `status` | `character varying` | YES | `'available'::character varying` |
| 7 | `description` | `text` | YES |  |
| 8 | `environment` | `text` | YES |  |
| 9 | `chapters` | `integer` | YES | `3` |
| 10 | `levels_per_chapter` | `integer` | YES | `5` |
| 11 | `difficulties` | `jsonb` | YES |  |
| 12 | `is_coming_soon` | `boolean` | YES | `false` |
| 13 | `created_at` | `timestamp with time zone` | YES | `now()` |
| 14 | `updated_at` | `timestamp with time zone` | YES | `now()` |
| 15 | `tenant_id` | `uuid` | NO |  |
| 16 | `image_url` | `text` | YES |  |

---

