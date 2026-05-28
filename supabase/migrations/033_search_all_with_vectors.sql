-- Migration 033: Add vector semantic search back to search_all
-- The embedding column exists on all game tables (added in 029)
-- but migration 030 removed the p_embedding parameter and semantic CTEs.

SET search_path TO public, extensions;

DROP FUNCTION IF EXISTS search_all;

CREATE OR REPLACE FUNCTION search_all(
    p_tenant_slug TEXT,
    p_query TEXT,
    p_limit INT DEFAULT 10,
    p_embedding TEXT DEFAULT NULL
)
RETURNS TABLE(
    source_type TEXT,
    id UUID,
    title TEXT,
    slug TEXT,
    summary TEXT,
    content JSONB,
    raw_data JSONB,
    rank INT,
    image_url TEXT,
    tags TEXT[],
    item_stats JSONB,
    match_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, extensions'
AS $BODY$
DECLARE
    v_query TEXT;
    v_embedding_vector VECTOR(1536);
BEGIN
    v_query := p_query;

    IF p_embedding IS NOT NULL AND p_embedding <> '' THEN
        BEGIN
            v_embedding_vector := p_embedding::VECTOR(1536);
        EXCEPTION WHEN OTHERS THEN
            v_embedding_vector := NULL;
        END;
    END IF;

    RETURN QUERY
    SELECT sub.source_type, sub.id, sub.title, sub.slug, sub.summary, sub.content,
           sub.raw_data, sub.rank, sub.image_url, sub.tags, sub.item_stats, sub.match_type
    FROM (
    WITH
    search_wiki_ft AS (
        SELECT 'wiki_article'::TEXT AS source_type,
            a.id,
            a.title,
            a.slug,
            a.summary,
            to_jsonb(a.content) AS content,
            a.content::jsonb AS raw_data,
            CASE
                WHEN a.slug ILIKE v_query THEN 20
                WHEN a.title ILIKE v_query THEN 12
                WHEN a.title ILIKE '%' || v_query || '%' THEN 10
                WHEN a.slug ILIKE '%' || v_query || '%' THEN 8
                WHEN a.summary ILIKE '%' || v_query || '%' THEN 6
                WHEN a.content ILIKE '%' || v_query || '%' THEN 4
                WHEN EXISTS (SELECT 1 FROM unnest(a.tags) tag WHERE tag ILIKE '%' || v_query || '%') THEN 3
                ELSE 0
            END AS rank,
            a.image_url,
            a.tags,
            NULL::JSONB AS item_stats,
            'fulltext'::TEXT AS match_type
        FROM wiki_articles a
        JOIN tenants t ON t.id = a.tenant_id
        WHERE t.slug = p_tenant_slug
          AND (
                a.slug ILIKE '%' || v_query || '%'
             OR a.title ILIKE '%' || v_query || '%'
             OR a.summary ILIKE '%' || v_query || '%'
             OR a.content ILIKE '%' || v_query || '%'
             OR EXISTS (SELECT 1 FROM unnest(a.tags) tag WHERE tag ILIKE '%' || v_query || '%')
          )
    ),
    search_wiki_sem AS (
        SELECT 'wiki_article'::TEXT AS source_type,
            a.id,
            a.title,
            a.slug,
            a.summary,
            to_jsonb(a.content) AS content,
            a.content::jsonb AS raw_data,
            COALESCE((1 - (a.embedding <=> v_embedding_vector)) * 20, 0)::INT AS rank,
            a.image_url,
            a.tags,
            NULL::JSONB AS item_stats,
            'semantic'::TEXT AS match_type
        FROM wiki_articles a
        JOIN tenants t ON t.id = a.tenant_id
        WHERE t.slug = p_tenant_slug
          AND a.embedding IS NOT NULL
          AND v_embedding_vector IS NOT NULL
        ORDER BY a.embedding <=> v_embedding_vector
        LIMIT 20
    ),
    search_weapons_ft AS (
        SELECT 'game_item'::TEXT AS source_type,
            w.id,
            w.name AS title,
            w.slug,
            w.notes AS summary,
            NULL::JSONB AS content,
            jsonb_build_object(
                'table', 'weapons',
                'name', w.name, 'slug', w.slug, 'weapon_type', w.weapon_type,
                'rarity', w.rarity, 'damage_min', w.damage_min, 'damage_max', w.damage_max,
                'crit_chance_min', w.crit_chance_min, 'crit_chance_max', w.crit_chance_max,
                'attack_speed', w.attack_speed, 'knockback', w.knockback, 'element', w.element,
                'ability_name', w.ability_name, 'ability_description', w.ability_description,
                'ability_energy_cost', w.ability_energy_cost, 'ability_cooldown', w.ability_cooldown,
                'ability_effect', w.ability_effect, 'obtain_method', w.obtain_method,
                'craft_cost', w.craft_cost, 'craft_materials', w.craft_materials,
                'is_worth_crafting', w.is_worth_crafting, 'drop_rate_multiplier', w.drop_rate_multiplier,
                'drop_rate_percentage', w.drop_rate_percentage, 'tier', w.tier, 'notes', w.notes,
                'image_url', w.image_url
            ) AS raw_data,
            CASE
                WHEN w.slug ILIKE v_query THEN 20
                WHEN w.name ILIKE v_query THEN 12
                WHEN w.name ILIKE '%' || v_query || '%' THEN 10
                WHEN w.slug ILIKE '%' || v_query || '%' THEN 8
                WHEN w.notes ILIKE '%' || v_query || '%' THEN 6
                WHEN w.ability_name ILIKE '%' || v_query || '%' THEN 5
                WHEN w.ability_description ILIKE '%' || v_query || '%' THEN 5
                WHEN w.obtain_method ILIKE '%' || v_query || '%' THEN 4
                WHEN w.weapon_type::text ILIKE '%' || v_query || '%' THEN 4
                WHEN w.rarity::text ILIKE '%' || v_query || '%' THEN 4
                WHEN w.element::text ILIKE '%' || v_query || '%' THEN 4
                WHEN w.tier::text ILIKE '%' || v_query || '%' THEN 4
                ELSE 0
            END AS rank,
            w.image_url,
            NULL::TEXT[] AS tags,
            jsonb_build_object(
                'damage_min', w.damage_min, 'damage_max', w.damage_max,
                'crit_chance_min', w.crit_chance_min, 'crit_chance_max', w.crit_chance_max,
                'attack_speed', w.attack_speed, 'knockback', w.knockback,
                'element', w.element, 'rarity', w.rarity, 'tier', w.tier,
                'weapon_type', w.weapon_type, 'ability_name', w.ability_name,
                'ability_energy_cost', w.ability_energy_cost, 'ability_cooldown', w.ability_cooldown
            ) AS item_stats,
            'fulltext'::TEXT AS match_type
        FROM weapons w
        JOIN tenants t ON t.id = w.tenant_id
        WHERE t.slug = p_tenant_slug
          AND (
                w.slug ILIKE '%' || v_query || '%'
             OR w.name ILIKE '%' || v_query || '%'
             OR w.notes ILIKE '%' || v_query || '%'
             OR w.weapon_type::text ILIKE '%' || v_query || '%'
             OR w.rarity::text ILIKE '%' || v_query || '%'
             OR w.element::text ILIKE '%' || v_query || '%'
             OR w.tier::text ILIKE '%' || v_query || '%'
             OR w.ability_name ILIKE '%' || v_query || '%'
             OR w.ability_description ILIKE '%' || v_query || '%'
             OR w.obtain_method ILIKE '%' || v_query || '%'
          )
    ),
    search_weapons_sem AS (
        SELECT 'game_item'::TEXT AS source_type,
            w.id,
            w.name AS title,
            w.slug,
            w.notes AS summary,
            NULL::JSONB AS content,
            jsonb_build_object(
                'table', 'weapons',
                'name', w.name, 'slug', w.slug, 'weapon_type', w.weapon_type,
                'rarity', w.rarity, 'damage_min', w.damage_min, 'damage_max', w.damage_max,
                'crit_chance_min', w.crit_chance_min, 'crit_chance_max', w.crit_chance_max,
                'attack_speed', w.attack_speed, 'knockback', w.knockback, 'element', w.element,
                'ability_name', w.ability_name, 'ability_description', w.ability_description,
                'ability_energy_cost', w.ability_energy_cost, 'ability_cooldown', w.ability_cooldown,
                'ability_effect', w.ability_effect, 'obtain_method', w.obtain_method,
                'craft_cost', w.craft_cost, 'craft_materials', w.craft_materials,
                'is_worth_crafting', w.is_worth_crafting, 'drop_rate_multiplier', w.drop_rate_multiplier,
                'drop_rate_percentage', w.drop_rate_percentage, 'tier', w.tier, 'notes', w.notes,
                'image_url', w.image_url
            ) AS raw_data,
            COALESCE((1 - (w.embedding <=> v_embedding_vector)) * 20, 0)::INT AS rank,
            w.image_url,
            NULL::TEXT[] AS tags,
            jsonb_build_object(
                'damage_min', w.damage_min, 'damage_max', w.damage_max,
                'crit_chance_min', w.crit_chance_min, 'crit_chance_max', w.crit_chance_max,
                'attack_speed', w.attack_speed, 'knockback', w.knockback,
                'element', w.element, 'rarity', w.rarity, 'tier', w.tier,
                'weapon_type', w.weapon_type, 'ability_name', w.ability_name,
                'ability_energy_cost', w.ability_energy_cost, 'ability_cooldown', w.ability_cooldown
            ) AS item_stats,
            'semantic'::TEXT AS match_type
        FROM weapons w
        JOIN tenants t ON t.id = w.tenant_id
        WHERE t.slug = p_tenant_slug
          AND w.embedding IS NOT NULL
          AND v_embedding_vector IS NOT NULL
        ORDER BY w.embedding <=> v_embedding_vector
        LIMIT 20
    ),
    search_armors_ft AS (
        SELECT 'game_item'::TEXT AS source_type,
            a.id,
            a.name AS title,
            a.slug,
            a.notes AS summary,
            NULL::JSONB AS content,
            jsonb_build_object(
                'table', 'armors',
                'name', a.name, 'slug', a.slug, 'rarity', a.rarity,
                'world_name', a.world_name, 'health_bonus', a.health_bonus,
                'speed_bonus', a.speed_bonus, 'energy_bonus', a.energy_bonus,
                'passive_ability', a.passive_ability, 'passive_ability_level', a.passive_ability_level,
                'obtain_method', a.obtain_method, 'craft_cost', a.craft_cost,
                'craft_materials', a.craft_materials, 'set_bonus', a.set_bonus,
                'is_worth_crafting', a.is_worth_crafting, 'tier', a.tier, 'notes', a.notes,
                'image_url', a.image_url
            ) AS raw_data,
            CASE
                WHEN a.slug ILIKE v_query THEN 20
                WHEN a.name ILIKE v_query THEN 12
                WHEN a.name ILIKE '%' || v_query || '%' THEN 10
                WHEN a.slug ILIKE '%' || v_query || '%' THEN 8
                WHEN a.notes ILIKE '%' || v_query || '%' THEN 6
                WHEN a.passive_ability ILIKE '%' || v_query || '%' THEN 5
                WHEN a.obtain_method ILIKE '%' || v_query || '%' THEN 4
                WHEN a.world_name ILIKE '%' || v_query || '%' THEN 4
                WHEN a.rarity::text ILIKE '%' || v_query || '%' THEN 4
                WHEN a.tier::text ILIKE '%' || v_query || '%' THEN 4
                ELSE 0
            END AS rank,
            a.image_url,
            NULL::TEXT[] AS tags,
            jsonb_build_object(
                'health_bonus', a.health_bonus, 'speed_bonus', a.speed_bonus,
                'energy_bonus', a.energy_bonus, 'rarity', a.rarity, 'tier', a.tier,
                'world_name', a.world_name, 'passive_ability', a.passive_ability,
                'passive_ability_level', a.passive_ability_level
            ) AS item_stats,
            'fulltext'::TEXT AS match_type
        FROM armors a
        JOIN tenants t ON t.id = a.tenant_id
        WHERE t.slug = p_tenant_slug
          AND (
                a.slug ILIKE '%' || v_query || '%'
             OR a.name ILIKE '%' || v_query || '%'
             OR a.notes ILIKE '%' || v_query || '%'
             OR a.passive_ability ILIKE '%' || v_query || '%'
             OR a.obtain_method ILIKE '%' || v_query || '%'
             OR a.world_name ILIKE '%' || v_query || '%'
             OR a.rarity::text ILIKE '%' || v_query || '%'
             OR a.tier::text ILIKE '%' || v_query || '%'
          )
    ),
    search_armors_sem AS (
        SELECT 'game_item'::TEXT AS source_type,
            a.id,
            a.name AS title,
            a.slug,
            a.notes AS summary,
            NULL::JSONB AS content,
            jsonb_build_object(
                'table', 'armors',
                'name', a.name, 'slug', a.slug, 'rarity', a.rarity,
                'world_name', a.world_name, 'health_bonus', a.health_bonus,
                'speed_bonus', a.speed_bonus, 'energy_bonus', a.energy_bonus,
                'passive_ability', a.passive_ability, 'passive_ability_level', a.passive_ability_level,
                'obtain_method', a.obtain_method, 'craft_cost', a.craft_cost,
                'craft_materials', a.craft_materials, 'set_bonus', a.set_bonus,
                'is_worth_crafting', a.is_worth_crafting, 'tier', a.tier, 'notes', a.notes,
                'image_url', a.image_url
            ) AS raw_data,
            COALESCE((1 - (a.embedding <=> v_embedding_vector)) * 20, 0)::INT AS rank,
            a.image_url,
            NULL::TEXT[] AS tags,
            jsonb_build_object(
                'health_bonus', a.health_bonus, 'speed_bonus', a.speed_bonus,
                'energy_bonus', a.energy_bonus, 'rarity', a.rarity, 'tier', a.tier,
                'world_name', a.world_name, 'passive_ability', a.passive_ability,
                'passive_ability_level', a.passive_ability_level
            ) AS item_stats,
            'semantic'::TEXT AS match_type
        FROM armors a
        JOIN tenants t ON t.id = a.tenant_id
        WHERE t.slug = p_tenant_slug
          AND a.embedding IS NOT NULL
          AND v_embedding_vector IS NOT NULL
        ORDER BY a.embedding <=> v_embedding_vector
        LIMIT 20
    ),
    search_enemies_ft AS (
        SELECT 'game_item'::TEXT AS source_type,
            e.id,
            e.name AS title,
            e.slug,
            e.description AS summary,
            NULL::JSONB AS content,
            jsonb_build_object(
                'table', 'enemies',
                'name', e.name, 'slug', e.slug, 'world_name', e.world_name,
                'chapters', e.chapters, 'enemy_type', e.enemy_type, 'description', e.description,
                'health_level', e.health_level, 'speed_level', e.speed_level,
                'strength_level', e.strength_level, 'difficulty', e.difficulty,
                'attacks', e.attacks, 'effects', e.effects,
                'xp_drop', e.xp_drop, 'coin_drop', e.coin_drop,
                'items_dropped', e.items_dropped, 'weakness', e.weakness,
                'image_url', e.image_url
            ) AS raw_data,
            CASE
                WHEN e.slug ILIKE v_query THEN 20
                WHEN e.name ILIKE v_query THEN 12
                WHEN e.name ILIKE '%' || v_query || '%' THEN 10
                WHEN e.slug ILIKE '%' || v_query || '%' THEN 8
                WHEN e.description ILIKE '%' || v_query || '%' THEN 6
                WHEN e.enemy_type ILIKE '%' || v_query || '%' THEN 5
                WHEN e.difficulty ILIKE '%' || v_query || '%' THEN 5
                WHEN e.health_level ILIKE '%' || v_query || '%' THEN 4
                WHEN e.speed_level ILIKE '%' || v_query || '%' THEN 4
                WHEN e.strength_level ILIKE '%' || v_query || '%' THEN 4
                WHEN e.world_name ILIKE '%' || v_query || '%' THEN 4
                ELSE 0
            END AS rank,
            e.image_url,
            NULL::TEXT[] AS tags,
            jsonb_build_object(
                'enemy_type', e.enemy_type, 'health_level', e.health_level,
                'speed_level', e.speed_level, 'strength_level', e.strength_level,
                'difficulty', e.difficulty, 'xp_drop', e.xp_drop, 'coin_drop', e.coin_drop
            ) AS item_stats,
            'fulltext'::TEXT AS match_type
        FROM enemies e
        JOIN tenants t ON t.id = e.tenant_id
        WHERE t.slug = p_tenant_slug
          AND (
                e.slug ILIKE '%' || v_query || '%'
             OR e.name ILIKE '%' || v_query || '%'
             OR e.description ILIKE '%' || v_query || '%'
             OR e.enemy_type ILIKE '%' || v_query || '%'
             OR e.difficulty ILIKE '%' || v_query || '%'
             OR e.health_level ILIKE '%' || v_query || '%'
             OR e.speed_level ILIKE '%' || v_query || '%'
             OR e.strength_level ILIKE '%' || v_query || '%'
             OR e.world_name ILIKE '%' || v_query || '%'
          )
    ),
    search_enemies_sem AS (
        SELECT 'game_item'::TEXT AS source_type,
            e.id,
            e.name AS title,
            e.slug,
            e.description AS summary,
            NULL::JSONB AS content,
            jsonb_build_object(
                'table', 'enemies',
                'name', e.name, 'slug', e.slug, 'world_name', e.world_name,
                'chapters', e.chapters, 'enemy_type', e.enemy_type, 'description', e.description,
                'health_level', e.health_level, 'speed_level', e.speed_level,
                'strength_level', e.strength_level, 'difficulty', e.difficulty,
                'attacks', e.attacks, 'effects', e.effects,
                'xp_drop', e.xp_drop, 'coin_drop', e.coin_drop,
                'items_dropped', e.items_dropped, 'weakness', e.weakness,
                'image_url', e.image_url
            ) AS raw_data,
            COALESCE((1 - (e.embedding <=> v_embedding_vector)) * 20, 0)::INT AS rank,
            e.image_url,
            NULL::TEXT[] AS tags,
            jsonb_build_object(
                'enemy_type', e.enemy_type, 'health_level', e.health_level,
                'speed_level', e.speed_level, 'strength_level', e.strength_level,
                'difficulty', e.difficulty, 'xp_drop', e.xp_drop, 'coin_drop', e.coin_drop
            ) AS item_stats,
            'semantic'::TEXT AS match_type
        FROM enemies e
        JOIN tenants t ON t.id = e.tenant_id
        WHERE t.slug = p_tenant_slug
          AND e.embedding IS NOT NULL
          AND v_embedding_vector IS NOT NULL
        ORDER BY e.embedding <=> v_embedding_vector
        LIMIT 20
    ),
    search_bosses_ft AS (
        SELECT 'game_item'::TEXT AS source_type,
            b.id,
            b.name AS title,
            b.slug,
            b.description AS summary,
            NULL::JSONB AS content,
            jsonb_build_object(
                'table', 'bosses',
                'name', b.name, 'slug', b.slug, 'world_name', b.world_name,
                'chapter', b.chapter, 'boss_type', b.boss_type, 'description', b.description,
                'hp_level', b.hp_level, 'difficulty', b.difficulty,
                'attacks', b.attacks, 'phase_mechanics', b.phase_mechanics,
                'weakness', b.weakness, 'strategy', b.strategy, 'tips', b.tips,
                'xp_drop', b.xp_drop, 'items_dropped', b.items_dropped, 'notable_loot', b.notable_loot,
                'image_url', b.image_url
            ) AS raw_data,
            CASE
                WHEN b.slug ILIKE v_query THEN 20
                WHEN b.name ILIKE v_query THEN 12
                WHEN b.name ILIKE '%' || v_query || '%' THEN 10
                WHEN b.slug ILIKE '%' || v_query || '%' THEN 8
                WHEN b.description ILIKE '%' || v_query || '%' THEN 6
                WHEN b.boss_type ILIKE '%' || v_query || '%' THEN 5
                WHEN b.difficulty ILIKE '%' || v_query || '%' THEN 5
                WHEN b.hp_level ILIKE '%' || v_query || '%' THEN 4
                WHEN b.world_name ILIKE '%' || v_query || '%' THEN 4
                WHEN b.phase_mechanics ILIKE '%' || v_query || '%' THEN 4
                WHEN b.strategy ILIKE '%' || v_query || '%' THEN 4
                ELSE 0
            END AS rank,
            b.image_url,
            NULL::TEXT[] AS tags,
            jsonb_build_object(
                'boss_type', b.boss_type, 'hp_level', b.hp_level,
                'difficulty', b.difficulty, 'chapter', b.chapter,
                'xp_drop', b.xp_drop, 'world_name', b.world_name
            ) AS item_stats,
            'fulltext'::TEXT AS match_type
        FROM bosses b
        JOIN tenants t ON t.id = b.tenant_id
        WHERE t.slug = p_tenant_slug
          AND (
                b.slug ILIKE '%' || v_query || '%'
             OR b.name ILIKE '%' || v_query || '%'
             OR b.description ILIKE '%' || v_query || '%'
             OR b.boss_type ILIKE '%' || v_query || '%'
             OR b.difficulty ILIKE '%' || v_query || '%'
             OR b.hp_level ILIKE '%' || v_query || '%'
             OR b.world_name ILIKE '%' || v_query || '%'
             OR b.phase_mechanics ILIKE '%' || v_query || '%'
             OR b.strategy ILIKE '%' || v_query || '%'
          )
    ),
    search_bosses_sem AS (
        SELECT 'game_item'::TEXT AS source_type,
            b.id,
            b.name AS title,
            b.slug,
            b.description AS summary,
            NULL::JSONB AS content,
            jsonb_build_object(
                'table', 'bosses',
                'name', b.name, 'slug', b.slug, 'world_name', b.world_name,
                'chapter', b.chapter, 'boss_type', b.boss_type, 'description', b.description,
                'hp_level', b.hp_level, 'difficulty', b.difficulty,
                'attacks', b.attacks, 'phase_mechanics', b.phase_mechanics,
                'weakness', b.weakness, 'strategy', b.strategy, 'tips', b.tips,
                'xp_drop', b.xp_drop, 'items_dropped', b.items_dropped, 'notable_loot', b.notable_loot,
                'image_url', b.image_url
            ) AS raw_data,
            COALESCE((1 - (b.embedding <=> v_embedding_vector)) * 20, 0)::INT AS rank,
            b.image_url,
            NULL::TEXT[] AS tags,
            jsonb_build_object(
                'boss_type', b.boss_type, 'hp_level', b.hp_level,
                'difficulty', b.difficulty, 'chapter', b.chapter,
                'xp_drop', b.xp_drop, 'world_name', b.world_name
            ) AS item_stats,
            'semantic'::TEXT AS match_type
        FROM bosses b
        JOIN tenants t ON t.id = b.tenant_id
        WHERE t.slug = p_tenant_slug
          AND b.embedding IS NOT NULL
          AND v_embedding_vector IS NOT NULL
        ORDER BY b.embedding <=> v_embedding_vector
        LIMIT 20
    ),
    search_rings_ft AS (
        SELECT 'game_item'::TEXT AS source_type,
            r.id,
            r.name AS title,
            r.slug,
            r.description AS summary,
            NULL::JSONB AS content,
            jsonb_build_object(
                'table', 'rings',
                'name', r.name, 'slug', r.slug, 'tier', r.tier, 'rarity', r.rarity,
                'description', r.description, 'starting_banner', r.starting_banner,
                'key_buffs', r.key_buffs, 'possible_stats', r.possible_stats,
                'synergy', r.synergy, 'is_craftable', r.is_craftable,
                'craft_cost', r.craft_cost, 'craft_materials', r.craft_materials,
                'is_worth_crafting', r.is_worth_crafting, 'obtain_method', r.obtain_method,
                'drop_wave_requirement', r.drop_wave_requirement, 'image_url', r.image_url
            ) AS raw_data,
            CASE
                WHEN r.slug ILIKE v_query THEN 20
                WHEN r.name ILIKE v_query THEN 12
                WHEN r.name ILIKE '%' || v_query || '%' THEN 10
                WHEN r.slug ILIKE '%' || v_query || '%' THEN 8
                WHEN r.description ILIKE '%' || v_query || '%' THEN 6
                WHEN r.synergy ILIKE '%' || v_query || '%' THEN 5
                WHEN r.obtain_method ILIKE '%' || v_query || '%' THEN 4
                WHEN r.rarity::text ILIKE '%' || v_query || '%' THEN 4
                WHEN r.tier::text ILIKE '%' || v_query || '%' THEN 4
                WHEN r.starting_banner ILIKE '%' || v_query || '%' THEN 4
                ELSE 0
            END AS rank,
            r.image_url,
            NULL::TEXT[] AS tags,
            jsonb_build_object(
                'tier', r.tier, 'rarity', r.rarity, 'is_craftable', r.is_craftable,
                'craft_cost', r.craft_cost, 'drop_wave_requirement', r.drop_wave_requirement,
                'starting_banner', r.starting_banner, 'obtain_method', r.obtain_method
            ) AS item_stats,
            'fulltext'::TEXT AS match_type
        FROM rings r
        JOIN tenants t ON t.id = r.tenant_id
        WHERE t.slug = p_tenant_slug
          AND (
                r.slug ILIKE '%' || v_query || '%'
             OR r.name ILIKE '%' || v_query || '%'
             OR r.description ILIKE '%' || v_query || '%'
             OR r.synergy ILIKE '%' || v_query || '%'
             OR r.obtain_method ILIKE '%' || v_query || '%'
             OR r.rarity::text ILIKE '%' || v_query || '%'
             OR r.tier::text ILIKE '%' || v_query || '%'
             OR r.starting_banner ILIKE '%' || v_query || '%'
          )
    ),
    search_rings_sem AS (
        SELECT 'game_item'::TEXT AS source_type,
            r.id,
            r.name AS title,
            r.slug,
            r.description AS summary,
            NULL::JSONB AS content,
            jsonb_build_object(
                'table', 'rings',
                'name', r.name, 'slug', r.slug, 'tier', r.tier, 'rarity', r.rarity,
                'description', r.description, 'starting_banner', r.starting_banner,
                'key_buffs', r.key_buffs, 'possible_stats', r.possible_stats,
                'synergy', r.synergy, 'is_craftable', r.is_craftable,
                'craft_cost', r.craft_cost, 'craft_materials', r.craft_materials,
                'is_worth_crafting', r.is_worth_crafting, 'obtain_method', r.obtain_method,
                'drop_wave_requirement', r.drop_wave_requirement, 'image_url', r.image_url
            ) AS raw_data,
            COALESCE((1 - (r.embedding <=> v_embedding_vector)) * 20, 0)::INT AS rank,
            r.image_url,
            NULL::TEXT[] AS tags,
            jsonb_build_object(
                'tier', r.tier, 'rarity', r.rarity, 'is_craftable', r.is_craftable,
                'craft_cost', r.craft_cost, 'drop_wave_requirement', r.drop_wave_requirement,
                'starting_banner', r.starting_banner, 'obtain_method', r.obtain_method
            ) AS item_stats,
            'semantic'::TEXT AS match_type
        FROM rings r
        JOIN tenants t ON t.id = r.tenant_id
        WHERE t.slug = p_tenant_slug
          AND r.embedding IS NOT NULL
          AND v_embedding_vector IS NOT NULL
        ORDER BY r.embedding <=> v_embedding_vector
        LIMIT 20
    ),
    search_potions_ft AS (
        SELECT 'game_item'::TEXT AS source_type,
            p.id,
            p.name AS title,
            p.slug,
            NULL::TEXT AS summary,
            NULL::JSONB AS content,
            jsonb_build_object(
                'table', 'potions',
                'name', p.name, 'slug', p.slug, 'effects', p.effects,
                'shop_price', p.shop_price, 'crafting_cost', p.crafting_cost,
                'crafting_materials', p.crafting_materials, 'savings_percentage', p.savings_percentage,
                'unlock_level', p.unlock_level, 'second_slot_unlock_level', p.second_slot_unlock_level,
                'max_uses_per_run', p.max_uses_per_run, 'image_url', p.image_url
            ) AS raw_data,
            CASE
                WHEN p.slug ILIKE v_query THEN 20
                WHEN p.name ILIKE v_query THEN 12
                WHEN p.name ILIKE '%' || v_query || '%' THEN 10
                WHEN p.slug ILIKE '%' || v_query || '%' THEN 8
                ELSE 0
            END AS rank,
            p.image_url,
            NULL::TEXT[] AS tags,
            jsonb_build_object(
                'effects', p.effects, 'shop_price', p.shop_price,
                'crafting_cost', p.crafting_cost, 'unlock_level', p.unlock_level,
                'max_uses_per_run', p.max_uses_per_run
            ) AS item_stats,
            'fulltext'::TEXT AS match_type
        FROM potions p
        JOIN tenants t ON t.id = p.tenant_id
        WHERE t.slug = p_tenant_slug
          AND (
                p.slug ILIKE '%' || v_query || '%'
             OR p.name ILIKE '%' || v_query || '%'
          )
    ),
    search_potions_sem AS (
        SELECT 'game_item'::TEXT AS source_type,
            p.id,
            p.name AS title,
            p.slug,
            NULL::TEXT AS summary,
            NULL::JSONB AS content,
            jsonb_build_object(
                'table', 'potions',
                'name', p.name, 'slug', p.slug, 'effects', p.effects,
                'shop_price', p.shop_price, 'crafting_cost', p.crafting_cost,
                'crafting_materials', p.crafting_materials, 'savings_percentage', p.savings_percentage,
                'unlock_level', p.unlock_level, 'second_slot_unlock_level', p.second_slot_unlock_level,
                'max_uses_per_run', p.max_uses_per_run, 'image_url', p.image_url
            ) AS raw_data,
            COALESCE((1 - (p.embedding <=> v_embedding_vector)) * 20, 0)::INT AS rank,
            p.image_url,
            NULL::TEXT[] AS tags,
            jsonb_build_object(
                'effects', p.effects, 'shop_price', p.shop_price,
                'crafting_cost', p.crafting_cost, 'unlock_level', p.unlock_level,
                'max_uses_per_run', p.max_uses_per_run
            ) AS item_stats,
            'semantic'::TEXT AS match_type
        FROM potions p
        JOIN tenants t ON t.id = p.tenant_id
        WHERE t.slug = p_tenant_slug
          AND p.embedding IS NOT NULL
          AND v_embedding_vector IS NOT NULL
        ORDER BY p.embedding <=> v_embedding_vector
        LIMIT 20
    ),
    search_upgrades_ft AS (
        SELECT 'game_item'::TEXT AS source_type,
            u.id,
            u.name AS title,
            u.slug,
            u.description AS summary,
            NULL::JSONB AS content,
            jsonb_build_object(
                'table', 'upgrades',
                'name', u.name, 'slug', u.slug, 'category', u.category,
                'description', u.description, 'effect', u.effect,
                'per_rank_effect', u.per_rank_effect, 'max_ranks', u.max_ranks,
                'damage_per_spirit', u.damage_per_spirit, 'speed_per_spirit', u.speed_per_spirit,
                'tier', u.tier, 'priority_order', u.priority_order,
                'is_must_pick', u.is_must_pick, 'notes', u.notes,
                'important_notes', u.important_notes, 'image_url', u.image_url
            ) AS raw_data,
            CASE
                WHEN u.slug ILIKE v_query THEN 20
                WHEN u.name ILIKE v_query THEN 12
                WHEN u.name ILIKE '%' || v_query || '%' THEN 10
                WHEN u.slug ILIKE '%' || v_query || '%' THEN 8
                WHEN u.description ILIKE '%' || v_query || '%' THEN 6
                WHEN u.effect ILIKE '%' || v_query || '%' THEN 5
                WHEN u.category ILIKE '%' || v_query || '%' THEN 4
                WHEN u.notes ILIKE '%' || v_query || '%' THEN 4
                WHEN u.tier::text ILIKE '%' || v_query || '%' THEN 4
                ELSE 0
            END AS rank,
            u.image_url,
            NULL::TEXT[] AS tags,
            jsonb_build_object(
                'category', u.category, 'effect', u.effect,
                'per_rank_effect', u.per_rank_effect, 'max_ranks', u.max_ranks,
                'tier', u.tier, 'damage_per_spirit', u.damage_per_spirit,
                'speed_per_spirit', u.speed_per_spirit, 'is_must_pick', u.is_must_pick
            ) AS item_stats,
            'fulltext'::TEXT AS match_type
        FROM upgrades u
        JOIN tenants t ON t.id = u.tenant_id
        WHERE t.slug = p_tenant_slug
          AND (
                u.slug ILIKE '%' || v_query || '%'
             OR u.name ILIKE '%' || v_query || '%'
             OR u.description ILIKE '%' || v_query || '%'
             OR u.effect ILIKE '%' || v_query || '%'
             OR u.category ILIKE '%' || v_query || '%'
             OR u.notes ILIKE '%' || v_query || '%'
             OR u.tier::text ILIKE '%' || v_query || '%'
          )
    ),
    search_upgrades_sem AS (
        SELECT 'game_item'::TEXT AS source_type,
            u.id,
            u.name AS title,
            u.slug,
            u.description AS summary,
            NULL::JSONB AS content,
            jsonb_build_object(
                'table', 'upgrades',
                'name', u.name, 'slug', u.slug, 'category', u.category,
                'description', u.description, 'effect', u.effect,
                'per_rank_effect', u.per_rank_effect, 'max_ranks', u.max_ranks,
                'damage_per_spirit', u.damage_per_spirit, 'speed_per_spirit', u.speed_per_spirit,
                'tier', u.tier, 'priority_order', u.priority_order,
                'is_must_pick', u.is_must_pick, 'notes', u.notes,
                'important_notes', u.important_notes, 'image_url', u.image_url
            ) AS raw_data,
            COALESCE((1 - (u.embedding <=> v_embedding_vector)) * 20, 0)::INT AS rank,
            u.image_url,
            NULL::TEXT[] AS tags,
            jsonb_build_object(
                'category', u.category, 'effect', u.effect,
                'per_rank_effect', u.per_rank_effect, 'max_ranks', u.max_ranks,
                'tier', u.tier, 'damage_per_spirit', u.damage_per_spirit,
                'speed_per_spirit', u.speed_per_spirit, 'is_must_pick', u.is_must_pick
            ) AS item_stats,
            'semantic'::TEXT AS match_type
        FROM upgrades u
        JOIN tenants t ON t.id = u.tenant_id
        WHERE t.slug = p_tenant_slug
          AND u.embedding IS NOT NULL
          AND v_embedding_vector IS NOT NULL
        ORDER BY u.embedding <=> v_embedding_vector
        LIMIT 20
    ),
    search_worlds AS (
        SELECT 'game_item'::TEXT AS source_type,
            w.id,
            w.world_name AS title,
            w.world_name AS slug,
            w.description AS summary,
            NULL::JSONB AS content,
            jsonb_build_object(
                'table', 'worlds',
                'world_name', w.world_name, 'world_number', w.world_number,
                'world_type', w.world_type, 'level_range', w.level_range,
                'status', w.status, 'description', w.description,
                'environment', w.environment, 'chapters', w.chapters,
                'levels_per_chapter', w.levels_per_chapter, 'difficulties', w.difficulties,
                'is_coming_soon', w.is_coming_soon
            ) AS raw_data,
            CASE
                WHEN w.world_name ILIKE v_query THEN 12
                WHEN w.world_name ILIKE '%' || v_query || '%' THEN 10
                WHEN w.description ILIKE '%' || v_query || '%' THEN 6
                WHEN w.environment ILIKE '%' || v_query || '%' THEN 5
                WHEN w.world_type ILIKE '%' || v_query || '%' THEN 4
                WHEN w.status ILIKE '%' || v_query || '%' THEN 4
                WHEN w.level_range ILIKE '%' || v_query || '%' THEN 4
                ELSE 0
            END AS rank,
            NULL::TEXT AS image_url,
            NULL::TEXT[] AS tags,
            jsonb_build_object(
                'world_number', w.world_number, 'world_type', w.world_type,
                'level_range', w.level_range, 'status', w.status,
                'chapters', w.chapters, 'environment', w.environment,
                'is_coming_soon', w.is_coming_soon
            ) AS item_stats,
            'fulltext'::TEXT AS match_type
        FROM worlds w
        JOIN tenants t ON t.id = w.tenant_id
        WHERE t.slug = p_tenant_slug
          AND (
                w.world_name ILIKE '%' || v_query || '%'
             OR w.description ILIKE '%' || v_query || '%'
             OR w.environment ILIKE '%' || v_query || '%'
             OR w.world_type ILIKE '%' || v_query || '%'
             OR w.status ILIKE '%' || v_query || '%'
             OR w.level_range ILIKE '%' || v_query || '%'
          )
    ),
    combined AS (
        SELECT * FROM search_wiki_ft
        UNION ALL
        SELECT * FROM search_wiki_sem
        UNION ALL SELECT * FROM search_weapons_ft
        UNION ALL SELECT * FROM search_weapons_sem
        UNION ALL SELECT * FROM search_armors_ft
        UNION ALL SELECT * FROM search_armors_sem
        UNION ALL SELECT * FROM search_enemies_ft
        UNION ALL SELECT * FROM search_enemies_sem
        UNION ALL SELECT * FROM search_bosses_ft
        UNION ALL SELECT * FROM search_bosses_sem
        UNION ALL SELECT * FROM search_rings_ft
        UNION ALL SELECT * FROM search_rings_sem
        UNION ALL SELECT * FROM search_potions_ft
        UNION ALL SELECT * FROM search_potions_sem
        UNION ALL SELECT * FROM search_upgrades_ft
        UNION ALL SELECT * FROM search_upgrades_sem
        UNION ALL SELECT * FROM search_worlds
    ),
    deduped AS (
        SELECT DISTINCT ON (source_type, id) *
        FROM combined WHERE rank > 0
        ORDER BY source_type, id, rank DESC
    )
    SELECT * FROM deduped
    ORDER BY rank DESC, source_type
    LIMIT p_limit
    ) sub;
END;
$BODY$;
