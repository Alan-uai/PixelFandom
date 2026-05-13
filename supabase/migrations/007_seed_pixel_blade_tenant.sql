-- =====================================================
-- SEED PIXEL BLADE TENANT
-- Creates the Pixel Blade wiki as a seeded tenant
-- with all game data in custom collections
-- =====================================================

-- =====================================================
-- TENANT
-- =====================================================

INSERT INTO tenants (id, name, slug, description, ai_enabled, is_public, ai_config)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Pixel Blade',
    'pixel-blade',
    'Wiki oficial do jogo Pixel Blade para Roblox. Informações sobre armas, armaduras, anéis, poções, upgrades, mundos, inimigos e chefes.',
    true,
    true,
    '{
        "model": "gpt-4o-mini",
        "system_prompt": "Você é um assistente especializado no jogo Pixel Blade para Roblox. Responda perguntas sobre armas, armaduras, anéis, poções, upgrades, mundos, inimigos, chefes, códigos e mecânicas do jogo.",
        "context_tables": ["weapons", "armors", "rings", "potions", "upgrades", "worlds", "enemies", "bosses", "codes", "crafting_recipes"]
    }'::jsonb
);

-- =====================================================
-- COLLECTIONS
-- =====================================================

-- Weapons collection
WITH coll AS (
    INSERT INTO custom_collections (tenant_id, name, slug, description, schema, icon)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Weapons',
        'weapons',
        'All weapons in Pixel Blade with stats, abilities, and drop rates',
        '{
            "fields": [
                {"name": "name", "type": "text", "required": true},
                {"name": "rarity", "type": "select", "options": ["common", "rare", "epic", "legendary", "vaulted"]},
                {"name": "weapon_type", "type": "text"},
                {"name": "damage_min", "type": "number"},
                {"name": "damage_max", "type": "number"},
                {"name": "crit_chance_min", "type": "number"},
                {"name": "crit_chance_max", "type": "number"},
                {"name": "attack_speed", "type": "select", "options": ["fast", "medium", "slow"]},
                {"name": "knockback", "type": "number"},
                {"name": "element", "type": "select", "options": ["fire", "frost", "poison", "dark", "ghost", "void", "earth", "none"]},
                {"name": "ability", "type": "json"},
                {"name": "tier", "type": "select", "options": ["s_plus", "s", "a", "b", "c", "d"]},
                {"name": "obtain_method", "type": "text"},
                {"name": "craft_cost", "type": "number"},
                {"name": "craft_materials", "type": "json"}
            ]
        }'::jsonb,
        'sword'
    )
    RETURNING id
)
INSERT INTO collection_items (collection_id, data, created_by)
SELECT coll.id, jsonb_build_object(
    'name', w.name,
    'rarity', w.rarity,
    'weapon_type', w.weapon_type,
    'damage_min', w.damage_min,
    'damage_max', w.damage_max,
    'crit_chance_min', w.crit_chance_min,
    'crit_chance_max', w.crit_chance_max,
    'attack_speed', w.attack_speed,
    'knockback', w.knockback,
    'element', w.element,
    'ability', jsonb_build_object(
        'name', w.ability_name,
        'description', w.ability_description,
        'energy_cost', w.ability_energy_cost,
        'cooldown', w.ability_cooldown,
        'effect', w.ability_effect
    ),
    'tier', w.tier,
    'obtain_method', w.obtain_method,
    'craft_cost', w.craft_cost,
    'craft_materials', w.craft_materials,
    'is_worth_crafting', w.is_worth_crafting,
    'drop_rate_multiplier', w.drop_rate_multiplier,
    'drop_rate_percentage', w.drop_rate_percentage,
    'notes', w.notes
), NULL
FROM weapons w, coll;

-- Armors collection
WITH coll AS (
    INSERT INTO custom_collections (tenant_id, name, slug, description, schema, icon)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Armors',
        'armors',
        'All armors with health/speed/energy bonuses',
        '{
            "fields": [
                {"name": "name", "type": "text", "required": true},
                {"name": "rarity", "type": "select", "options": ["common", "rare", "epic", "legendary", "vaulted"]},
                {"name": "health_bonus", "type": "number"},
                {"name": "speed_bonus", "type": "number"},
                {"name": "energy_bonus", "type": "number"},
                {"name": "tier", "type": "select", "options": ["s_plus", "s", "a", "b", "c", "d"]},
                {"name": "passive_ability", "type": "text"},
                {"name": "obtain_method", "type": "text"}
            ]
        }'::jsonb,
        'shield'
    )
    RETURNING id
)
INSERT INTO collection_items (collection_id, data, created_by)
SELECT coll.id, jsonb_build_object(
    'name', a.name,
    'rarity', a.rarity,
    'world_name', a.world_name,
    'health_bonus', a.health_bonus,
    'speed_bonus', a.speed_bonus,
    'energy_bonus', a.energy_bonus,
    'tier', a.tier,
    'passive_ability', a.passive_ability,
    'passive_ability_level', a.passive_ability_level,
    'obtain_method', a.obtain_method,
    'craft_cost', a.craft_cost,
    'craft_materials', a.craft_materials,
    'set_bonus', a.set_bonus,
    'is_worth_crafting', a.is_worth_crafting,
    'notes', a.notes
), NULL
FROM armors a, coll;

-- Rings collection
WITH coll AS (
    INSERT INTO custom_collections (tenant_id, name, slug, description, schema, icon)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Rings',
        'rings',
        'Rings with tiers, buffs, and crafting info',
        '{
            "fields": [
                {"name": "name", "type": "text", "required": true},
                {"name": "tier", "type": "select", "options": ["s_plus", "s", "a", "b", "c", "d"]},
                {"name": "rarity", "type": "select", "options": ["common", "rare", "epic", "legendary", "vaulted"]},
                {"name": "description", "type": "text"},
                {"name": "key_buffs", "type": "json"},
                {"name": "synergy", "type": "text"},
                {"name": "obtain_method", "type": "text"}
            ]
        }'::jsonb,
        'gem'
    )
    RETURNING id
)
INSERT INTO collection_items (collection_id, data, created_by)
SELECT coll.id, jsonb_build_object(
    'name', r.name,
    'tier', r.tier,
    'rarity', r.rarity,
    'description', r.description,
    'starting_banner', r.starting_banner,
    'key_buffs', r.key_buffs,
    'possible_stats', r.possible_stats,
    'synergy', r.synergy,
    'is_craftable', r.is_craftable,
    'craft_cost', r.craft_cost,
    'craft_materials', r.craft_materials,
    'is_worth_crafting', r.is_worth_crafting,
    'obtain_method', r.obtain_method,
    'drop_wave_requirement', r.drop_wave_requirement
), NULL
FROM rings r, coll;

-- Potions collection
WITH coll AS (
    INSERT INTO custom_collections (tenant_id, name, slug, description, schema, icon)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Potions',
        'potions',
        'Consumable potions with effects and costs',
        '{
            "fields": [
                {"name": "name", "type": "text", "required": true},
                {"name": "effects", "type": "json"},
                {"name": "shop_price", "type": "number"},
                {"name": "crafting_cost", "type": "number"},
                {"name": "unlock_level", "type": "number"},
                {"name": "max_uses_per_run", "type": "number"}
            ]
        }'::jsonb,
        'flask'
    )
    RETURNING id
)
INSERT INTO collection_items (collection_id, data, created_by)
SELECT coll.id, jsonb_build_object(
    'name', p.name,
    'effects', p.effects,
    'shop_price', p.shop_price,
    'crafting_cost', p.crafting_cost,
    'crafting_materials', p.crafting_materials,
    'savings_percentage', p.savings_percentage,
    'unlock_level', p.unlock_level,
    'second_slot_unlock_level', p.second_slot_unlock_level,
    'max_uses_per_run', p.max_uses_per_run
), NULL
FROM potions p, coll;

-- Upgrades collection
WITH coll AS (
    INSERT INTO custom_collections (tenant_id, name, slug, description, schema, icon)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Upgrades',
        'upgrades',
        'Banner upgrades with priority rankings',
        '{
            "fields": [
                {"name": "name", "type": "text", "required": true},
                {"name": "category", "type": "select", "options": ["offensive", "defensive", "utility"]},
                {"name": "effect", "type": "text"},
                {"name": "max_ranks", "type": "number"},
                {"name": "tier", "type": "select", "options": ["s_plus", "s", "a", "b", "c", "d"]},
                {"name": "priority_order", "type": "number"},
                {"name": "is_must_pick", "type": "boolean"}
            ]
        }'::jsonb,
        'trending-up'
    )
    RETURNING id
)
INSERT INTO collection_items (collection_id, data, created_by)
SELECT coll.id, jsonb_build_object(
    'name', u.name,
    'category', u.category,
    'description', u.description,
    'effect', u.effect,
    'per_rank_effect', u.per_rank_effect,
    'max_ranks', u.max_ranks,
    'damage_per_spirit', u.damage_per_spirit,
    'speed_per_spirit', u.speed_per_spirit,
    'tier', u.tier,
    'priority_order', u.priority_order,
    'is_must_pick', u.is_must_pick,
    'notes', u.notes,
    'important_notes', u.important_notes
), NULL
FROM upgrades u, coll;

-- Worlds collection
WITH coll AS (
    INSERT INTO custom_collections (tenant_id, name, slug, description, schema, icon)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Worlds',
        'worlds',
        'Game worlds, environments, and configurations',
        '{
            "fields": [
                {"name": "world_name", "type": "text", "required": true},
                {"name": "world_number", "type": "number"},
                {"name": "world_type", "type": "text"},
                {"name": "level_range", "type": "text"},
                {"name": "status", "type": "text"},
                {"name": "chapters", "type": "number"},
                {"name": "is_coming_soon", "type": "boolean"}
            ]
        }'::jsonb,
        'globe'
    )
    RETURNING id
)
INSERT INTO collection_items (collection_id, data, created_by)
SELECT coll.id, jsonb_build_object(
    'world_name', w.world_name,
    'world_number', w.world_number,
    'world_type', w.world_type,
    'level_range', w.level_range,
    'status', w.status,
    'description', w.description,
    'environment', w.environment,
    'chapters', w.chapters,
    'levels_per_chapter', w.levels_per_chapter,
    'difficulties', w.difficulties,
    'is_coming_soon', w.is_coming_soon
), NULL
FROM worlds w, coll;

-- Enemies collection
WITH coll AS (
    INSERT INTO custom_collections (tenant_id, name, slug, description, schema, icon)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Enemies',
        'enemies',
        'Enemy types with stats and weaknesses',
        '{
            "fields": [
                {"name": "name", "type": "text", "required": true},
                {"name": "world_name", "type": "text"},
                {"name": "enemy_type", "type": "text"},
                {"name": "difficulty", "type": "text"},
                {"name": "health_level", "type": "text"},
                {"name": "weakness", "type": "json"}
            ]
        }'::jsonb,
        'skull'
    )
    RETURNING id
)
INSERT INTO collection_items (collection_id, data, created_by)
SELECT coll.id, jsonb_build_object(
    'name', e.name,
    'world_name', e.world_name,
    'chapters', e.chapters,
    'enemy_type', e.enemy_type,
    'description', e.description,
    'health_level', e.health_level,
    'speed_level', e.speed_level,
    'strength_level', e.strength_level,
    'difficulty', e.difficulty,
    'attacks', e.attacks,
    'effects', e.effects,
    'xp_drop', e.xp_drop,
    'coin_drop', e.coin_drop,
    'items_dropped', e.items_dropped,
    'weakness', e.weakness
), NULL
FROM enemies e, coll;

-- Bosses collection
WITH coll AS (
    INSERT INTO custom_collections (tenant_id, name, slug, description, schema, icon)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Bosses',
        'bosses',
        'Boss enemies with mechanics and strategies',
        '{
            "fields": [
                {"name": "name", "type": "text", "required": true},
                {"name": "world_name", "type": "text"},
                {"name": "chapter", "type": "number"},
                {"name": "boss_type", "type": "text"},
                {"name": "difficulty", "type": "text"},
                {"name": "strategy", "type": "text"}
            ]
        }'::jsonb,
        'dragon'
    )
    RETURNING id
)
INSERT INTO collection_items (collection_id, data, created_by)
SELECT coll.id, jsonb_build_object(
    'name', b.name,
    'world_name', b.world_name,
    'chapter', b.chapter,
    'boss_type', b.boss_type,
    'description', b.description,
    'hp_level', b.hp_level,
    'difficulty', b.difficulty,
    'attacks', b.attacks,
    'phase_mechanics', b.phase_mechanics,
    'weakness', b.weakness,
    'strategy', b.strategy,
    'tips', b.tips,
    'xp_drop', b.xp_drop,
    'items_dropped', b.items_dropped,
    'notable_loot', b.notable_loot
), NULL
FROM bosses b, coll;

-- Codes collection
WITH coll AS (
    INSERT INTO custom_collections (tenant_id, name, slug, description, schema, icon)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Codes',
        'codes',
        'Redeemable promo codes (active and expired)',
        '{
            "fields": [
                {"name": "code", "type": "text", "required": true},
                {"name": "rewards", "type": "json"},
                {"name": "is_active", "type": "boolean"},
                {"name": "code_type", "type": "text"},
                {"name": "is_expired", "type": "boolean"}
            ]
        }'::jsonb,
        'ticket'
    )
    RETURNING id
)
INSERT INTO collection_items (collection_id, data, created_by)
SELECT coll.id, jsonb_build_object(
    'code', c.code,
    'rewards', c.rewards,
    'reward_type', c.reward_type,
    'code_type', c.code_type,
    'is_active', c.is_active,
    'verified_date', c.verified_date,
    'verified_by', c.verified_by,
    'is_expired', c.is_expired,
    'expired_date', c.expired_date
), NULL
FROM codes c, coll;

-- Crafting Recipes collection
WITH coll AS (
    INSERT INTO custom_collections (tenant_id, name, slug, description, schema, icon)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Crafting Recipes',
        'crafting-recipes',
        'Blacksmith crafting recipes for weapons, armor, and rings',
        '{
            "fields": [
                {"name": "item_name", "type": "text", "required": true},
                {"name": "item_type", "type": "text"},
                {"name": "rarity", "type": "select", "options": ["common", "rare", "epic", "legendary", "vaulted"]},
                {"name": "gold_cost", "type": "number"},
                {"name": "materials", "type": "json"},
                {"name": "is_worth_crafting", "type": "boolean"}
            ]
        }'::jsonb,
        'hammer'
    )
    RETURNING id
)
INSERT INTO collection_items (collection_id, data, created_by)
SELECT coll.id, jsonb_build_object(
    'item_name', cr.item_name,
    'item_type', cr.item_type,
    'rarity', cr.rarity,
    'gold_cost', cr.gold_cost,
    'materials', cr.materials,
    'is_worth_crafting', cr.is_worth_crafting,
    'worth_notes', cr.worth_notes
), NULL
FROM crafting_recipes cr, coll;

-- =====================================================
-- UPDATE COLLECTION ITEM COUNTS
-- =====================================================

UPDATE custom_collections
SET item_count = (SELECT COUNT(*) FROM collection_items WHERE collection_id = custom_collections.id)
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- =====================================================
-- VERIFY
-- =====================================================

-- SELECT name, slug, item_count FROM custom_collections WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
-- SELECT COUNT(*) FROM collection_items ci JOIN custom_collections cc ON ci.collection_id = cc.id WHERE cc.tenant_id = '00000000-0000-0000-0000-000000000001';
