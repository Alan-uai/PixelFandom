-- Migration 029: Fix get_wiki_data overload + search_all with all columns
--
-- Problems solved:
-- 1. get_wiki_data had two overloaded versions (one with VECTOR, one with TEXT)
--    causing "ambiguous function" errors. Dropping both and recreating with TEXT only.
-- 2. search_all CTEs were missing many text columns (slug, image_url, rarity,
--    tier, etc.) — now ALL text-searchable columns are included in every CTE.
-- 3. search_wiki now prioritizes slug as the primary search field (rank 20)
--    over title (rank 12).

-- =====================================================
-- 1. Drop ALL overloads of get_wiki_data
-- =====================================================
DROP FUNCTION IF EXISTS get_wiki_data(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_wiki_data(TEXT, TEXT, EXTENSIONS.VECTOR);

-- =====================================================
-- 2. Recreate get_wiki_data (single TEXT-based overload)
-- =====================================================
CREATE OR REPLACE FUNCTION get_wiki_data(
    p_slug TEXT,
    p_search TEXT DEFAULT NULL,
    p_embedding TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE
    v_tenant_id UUID;
    v_tenant JSONB;
    v_articles JSONB;
    v_search_results JSONB;
    v_embedding_vector extensions.VECTOR(1536);
BEGIN
    -- 1. Get tenant
    SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'slug', slug,
        'logo_url', logo_url,
        'description', description,
        'custom_domain', custom_domain,
        'theme', theme,
        'ai_enabled', ai_enabled,
        'ai_config', ai_config,
        'discord_config', discord_config,
        'is_public', is_public,
        'cover_image', cover_image,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO v_tenant
    FROM tenants
    WHERE slug = p_slug;

    IF v_tenant IS NULL THEN
        RETURN jsonb_build_object(
            'tenant', NULL::JSONB,
            'articles', '[]'::JSONB,
            'search_results', '[]'::JSONB
        );
    END IF;

    v_tenant_id := (v_tenant->>'id')::UUID;

    -- 2. Get all articles for tenant
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'slug', slug,
            'summary', summary,
            'content', content,
            'tags', tags,
            'image_url', image_url,
            'created_at', created_at,
            'updated_at', updated_at
        ) ORDER BY updated_at DESC NULLS LAST
    ), '[]'::JSONB) INTO v_articles
    FROM wiki_articles
    WHERE tenant_id = v_tenant_id;

    -- 3. Search
    v_search_results := '[]'::JSONB;

    IF p_embedding IS NOT NULL AND p_embedding <> '' THEN
        -- Semantic search with embedding
        BEGIN
            v_embedding_vector := p_embedding::VECTOR(1536);

            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'title', title,
                    'slug', slug,
                    'summary', summary,
                    'content', content,
                    'tags', tags,
                    'image_url', image_url,
                    'score', 1 - (embedding <=> v_embedding_vector),
                    'match_type', 'semantic'
                ) ORDER BY (embedding <=> v_embedding_vector)
            ), '[]'::JSONB) INTO v_search_results
            FROM wiki_articles
            WHERE tenant_id = v_tenant_id
              AND embedding IS NOT NULL
            LIMIT 10;
        EXCEPTION WHEN OTHERS THEN
            v_search_results := '[]'::JSONB;
        END;
    ELSIF p_search IS NOT NULL AND p_search <> '' THEN
        -- Full-text search
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'title', title,
                'slug', slug,
                'summary', summary,
                'content', content,
                'tags', tags,
                'image_url', image_url,
                'score', ts_rank(
                    to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')),
                    plainto_tsquery('portuguese', p_search)
                ),
                'match_type', 'fulltext'
            ) ORDER BY ts_rank(
                to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')),
                plainto_tsquery('portuguese', p_search)
            ) DESC
        ), '[]'::JSONB) INTO v_search_results
        FROM wiki_articles
        WHERE tenant_id = v_tenant_id
          AND to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')) @@ plainto_tsquery('portuguese', p_search)
        LIMIT 20;
    END IF;

    RETURN jsonb_build_object(
        'tenant', v_tenant,
        'articles', v_articles,
        'search_results', v_search_results
    );
END;
$$;

-- =====================================================
-- 3. Recreate search_all with ALL text columns in every CTE
-- =====================================================

DROP FUNCTION IF EXISTS search_all;

CREATE OR REPLACE FUNCTION search_all(
  p_tenant_slug TEXT,
  p_query TEXT,
  p_limit INTEGER DEFAULT 10,
  p_embedding TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant_id UUID;
  v_results JSONB;
  v_clean TEXT;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = p_tenant_slug;
  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('results', '[]'::jsonb);
  END IF;

  v_clean := regexp_replace(p_query,
    '(como|obter|qual|onde|quais|tem|para|uma|um|dos|das|com|que|são|sao|este|esta|isso|isto|essa|esse|para|mais|muito|bem|vai|pode|fazer|acha|era|foi|seus|suas|seu|sua|pelo|pela|entre|num|numa|na|no|da|do|em|de|e|a|o|as|os|ao|aos|às|dum|duma|duns|dumas|daquele|daquela|naquele|naquela|naquilo|àquele|àquela|àquilo|neste|nesta|nisso|nesse|nessa|naquilo|ou|se|me|te|lhe|nos|vos|lhes|ele|ela|eles|elas|nós|vós|eu|tu|voce|você|nos|minha|meu|tua|teu|sua|seu|nossa|nosso|dela|dele|deles|delas|aqui|ali|lá|cá|sim|não|nao|ja|já|só|so|ainda|sempre|nunca|tambem|também|apenas|agora|depois|antes|hoje|ontem|amanhã|amanha|enquanto|durante|ate|até|sem|sob|sobre|trás|tras|detras|detrás|frente|atras|atrás|apos|após|contra|perante|segundo|conforme|consoante|mediante|salvo|exceto|menos|fora|afora|dentro|cerca|acerca|acima|abaixo|adiante|além|alem|ao_lado|em_volta|em_torno|através|atraves|apesar|conquanto|embora|posto|porquanto|pois|porque|por_que|porquê|ja_que|já_que|uma_vez|visto|dado|devido|graças|obrigado)\s+',
    '', 'gi');
  v_clean := trim(v_clean);
  IF v_clean = '' THEN v_clean := trim(p_query); END IF;
  IF v_clean = '' THEN v_clean := ' '; END IF;

  WITH search_wiki AS (
    SELECT 'wiki_article' AS source_type, id, title AS name,
      COALESCE(summary, '') AS description, slug, tags,
      NULL::text AS collection_name, NULL::text AS collection_slug,
      CASE
        WHEN content IS NOT NULL AND content <> ''
        THEN content::jsonb
        ELSE NULL::jsonb
      END AS raw_data,
      (CASE WHEN slug ILIKE '%' || v_clean || '%' THEN 20 ELSE 0 END
       + CASE WHEN title ILIKE '%' || v_clean || '%' THEN 12 ELSE 0 END
       + CASE WHEN COALESCE(summary, '') ILIKE '%' || v_clean || '%' THEN 6 ELSE 0 END
       + CASE WHEN content ILIKE '%' || v_clean || '%' THEN 4 ELSE 0 END
       + CASE WHEN tags::text ILIKE '%' || v_clean || '%' THEN 3 ELSE 0 END
       + CASE WHEN COALESCE(image_url, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(slug, '')) * 12)::int, 0)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(title, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM wiki_articles
    WHERE tenant_id = v_tenant_id AND (
      slug ILIKE '%' || v_clean || '%'
      OR title ILIKE '%' || v_clean || '%'
      OR COALESCE(summary, '') ILIKE '%' || v_clean || '%'
      OR content ILIKE '%' || v_clean || '%'
      OR tags::text ILIKE '%' || v_clean || '%'
      OR extensions.word_similarity(v_clean, COALESCE(slug, '')) > 0.2
      OR extensions.word_similarity(v_clean, COALESCE(title, '')) > 0.2
    )
  ),
  search_weapons AS (
    SELECT 'weapon' AS source_type, id, name,
      COALESCE(notes, '') AS description, slugify(name) AS slug,
      NULL::text[] AS tags, 'Weapons' AS collection_name, 'weapons' AS collection_slug,
      row_to_json(weapons.*)::jsonb AS raw_data,
      (CASE WHEN name ILIKE '%' || v_clean || '%' THEN 10 ELSE 0 END
       + CASE WHEN COALESCE(weapon_type, '') ILIKE '%' || v_clean || '%' THEN 3 ELSE 0 END
       + CASE WHEN element::text ILIKE '%' || v_clean || '%' THEN 3 ELSE 0 END
       + CASE WHEN COALESCE(obtain_method, '') ILIKE '%' || v_clean || '%' THEN 6 ELSE 0 END
       + CASE WHEN COALESCE(notes, '') ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END
       + CASE WHEN COALESCE(ability_name, '') ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END
       + CASE WHEN COALESCE(ability_description, '') ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END
       + CASE WHEN COALESCE(ability_effect, '') ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END
       + CASE WHEN COALESCE(rarity::text, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(tier::text, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(attack_speed::text, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN craft_materials::text ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(image_url, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(name, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM weapons
    WHERE tenant_id = v_tenant_id AND (
      name ILIKE '%' || v_clean || '%'
      OR COALESCE(weapon_type, '') ILIKE '%' || v_clean || '%'
      OR element::text ILIKE '%' || v_clean || '%'
      OR COALESCE(obtain_method, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(notes, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(ability_name, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(ability_description, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(ability_effect, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(rarity::text, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(tier::text, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(attack_speed::text, '') ILIKE '%' || v_clean || '%'
      OR craft_materials::text ILIKE '%' || v_clean || '%'
      OR extensions.word_similarity(v_clean, COALESCE(name, '')) > 0.2
    )
  ),
  search_armors AS (
    SELECT 'armor' AS source_type, id, name,
      COALESCE(notes, '') AS description, slugify(name) AS slug,
      NULL::text[] AS tags, 'Armors' AS collection_name, 'armors' AS collection_slug,
      row_to_json(armors.*)::jsonb AS raw_data,
      (CASE WHEN name ILIKE '%' || v_clean || '%' THEN 10 ELSE 0 END
       + CASE WHEN COALESCE(obtain_method, '') ILIKE '%' || v_clean || '%' THEN 6 ELSE 0 END
       + CASE WHEN COALESCE(world_name, '') ILIKE '%' || v_clean || '%' THEN 3 ELSE 0 END
       + CASE WHEN COALESCE(notes, '') ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END
       + CASE WHEN COALESCE(passive_ability, '') ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END
       + CASE WHEN COALESCE(rarity::text, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(tier::text, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN craft_materials::text ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN set_bonus::text ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(image_url, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(name, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM armors
    WHERE tenant_id = v_tenant_id AND (
      name ILIKE '%' || v_clean || '%'
      OR COALESCE(obtain_method, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(world_name, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(notes, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(passive_ability, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(rarity::text, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(tier::text, '') ILIKE '%' || v_clean || '%'
      OR craft_materials::text ILIKE '%' || v_clean || '%'
      OR set_bonus::text ILIKE '%' || v_clean || '%'
      OR extensions.word_similarity(v_clean, COALESCE(name, '')) > 0.2
    )
  ),
  search_enemies AS (
    SELECT 'enemy' AS source_type, id, name,
      COALESCE(description, '') AS description, slugify(name) AS slug,
      NULL::text[] AS tags, 'Enemies' AS collection_name, 'enemies' AS collection_slug,
      row_to_json(enemies.*)::jsonb AS raw_data,
      (CASE WHEN name ILIKE '%' || v_clean || '%' THEN 10 ELSE 0 END
       + CASE WHEN COALESCE(world_name, '') ILIKE '%' || v_clean || '%' THEN 3 ELSE 0 END
       + CASE WHEN COALESCE(enemy_type, '') ILIKE '%' || v_clean || '%' THEN 3 ELSE 0 END
       + CASE WHEN COALESCE(description, '') ILIKE '%' || v_clean || '%' THEN 3 ELSE 0 END
       + CASE WHEN weakness::text ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END
       + CASE WHEN COALESCE(health_level, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(speed_level, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(strength_level, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(difficulty, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(xp_drop, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(coin_drop, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN attacks::text ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN effects::text ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN items_dropped::text ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(image_url, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(name, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM enemies
    WHERE tenant_id = v_tenant_id AND (
      name ILIKE '%' || v_clean || '%'
      OR COALESCE(world_name, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(enemy_type, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(description, '') ILIKE '%' || v_clean || '%'
      OR weakness::text ILIKE '%' || v_clean || '%'
      OR COALESCE(health_level, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(speed_level, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(strength_level, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(difficulty, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(xp_drop, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(coin_drop, '') ILIKE '%' || v_clean || '%'
      OR attacks::text ILIKE '%' || v_clean || '%'
      OR effects::text ILIKE '%' || v_clean || '%'
      OR items_dropped::text ILIKE '%' || v_clean || '%'
      OR extensions.word_similarity(v_clean, COALESCE(name, '')) > 0.2
    )
  ),
  search_bosses AS (
    SELECT 'boss' AS source_type, id, name,
      COALESCE(description, '') AS description, slugify(name) AS slug,
      NULL::text[] AS tags, 'Bosses' AS collection_name, 'bosses' AS collection_slug,
      row_to_json(bosses.*)::jsonb AS raw_data,
      (CASE WHEN name ILIKE '%' || v_clean || '%' THEN 10 ELSE 0 END
       + CASE WHEN COALESCE(world_name, '') ILIKE '%' || v_clean || '%' THEN 3 ELSE 0 END
       + CASE WHEN COALESCE(description, '') ILIKE '%' || v_clean || '%' THEN 3 ELSE 0 END
       + CASE WHEN COALESCE(strategy, '') ILIKE '%' || v_clean || '%' THEN 3 ELSE 0 END
       + CASE WHEN weakness::text ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END
       + CASE WHEN COALESCE(boss_type, '') ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END
       + CASE WHEN COALESCE(hp_level, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(difficulty, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(phase_mechanics, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN tips::text ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN attacks::text ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN items_dropped::text ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN notable_loot::text ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(image_url, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(name, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM bosses
    WHERE tenant_id = v_tenant_id AND (
      name ILIKE '%' || v_clean || '%'
      OR COALESCE(world_name, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(description, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(strategy, '') ILIKE '%' || v_clean || '%'
      OR weakness::text ILIKE '%' || v_clean || '%'
      OR COALESCE(boss_type, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(hp_level, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(difficulty, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(phase_mechanics, '') ILIKE '%' || v_clean || '%'
      OR tips::text ILIKE '%' || v_clean || '%'
      OR attacks::text ILIKE '%' || v_clean || '%'
      OR items_dropped::text ILIKE '%' || v_clean || '%'
      OR notable_loot::text ILIKE '%' || v_clean || '%'
      OR extensions.word_similarity(v_clean, COALESCE(name, '')) > 0.2
    )
  ),
  search_rings AS (
    SELECT 'ring' AS source_type, id, name,
      COALESCE(description, '') AS description, slugify(name) AS slug,
      NULL::text[] AS tags, 'Rings' AS collection_name, 'rings' AS collection_slug,
      row_to_json(rings.*)::jsonb AS raw_data,
      (CASE WHEN name ILIKE '%' || v_clean || '%' THEN 10 ELSE 0 END
       + CASE WHEN COALESCE(description, '') ILIKE '%' || v_clean || '%' THEN 3 ELSE 0 END
       + CASE WHEN COALESCE(obtain_method, '') ILIKE '%' || v_clean || '%' THEN 6 ELSE 0 END
       + CASE WHEN COALESCE(synergy, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(starting_banner, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(rarity::text, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(tier::text, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN key_buffs::text ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN possible_stats::text ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN craft_materials::text ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(image_url, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(name, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM rings
    WHERE tenant_id = v_tenant_id AND (
      name ILIKE '%' || v_clean || '%'
      OR COALESCE(description, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(obtain_method, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(synergy, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(starting_banner, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(rarity::text, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(tier::text, '') ILIKE '%' || v_clean || '%'
      OR key_buffs::text ILIKE '%' || v_clean || '%'
      OR possible_stats::text ILIKE '%' || v_clean || '%'
      OR craft_materials::text ILIKE '%' || v_clean || '%'
      OR extensions.word_similarity(v_clean, COALESCE(name, '')) > 0.2
    )
  ),
  search_potions AS (
    SELECT 'potion' AS source_type, id, name, '' AS description,
      slugify(name) AS slug, NULL::text[] AS tags,
      'Potions' AS collection_name, 'potions' AS collection_slug,
      row_to_json(potions.*)::jsonb AS raw_data,
      (CASE WHEN name ILIKE '%' || v_clean || '%' THEN 10 ELSE 0 END
       + CASE WHEN effects::text ILIKE '%' || v_clean || '%' THEN 4 ELSE 0 END
       + CASE WHEN crafting_materials::text ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(image_url, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(name, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM potions
    WHERE tenant_id = v_tenant_id AND (
      name ILIKE '%' || v_clean || '%'
      OR effects::text ILIKE '%' || v_clean || '%'
      OR crafting_materials::text ILIKE '%' || v_clean || '%'
      OR extensions.word_similarity(v_clean, COALESCE(name, '')) > 0.2
    )
  ),
  search_upgrades AS (
    SELECT 'upgrade' AS source_type, id, name,
      COALESCE(description, '') AS description, slugify(name) AS slug,
      NULL::text[] AS tags, 'Upgrades' AS collection_name, 'upgrades' AS collection_slug,
      row_to_json(upgrades.*)::jsonb AS raw_data,
      (CASE WHEN name ILIKE '%' || v_clean || '%' THEN 10 ELSE 0 END
       + CASE WHEN COALESCE(description, '') ILIKE '%' || v_clean || '%' THEN 4 ELSE 0 END
       + CASE WHEN COALESCE(effect, '') ILIKE '%' || v_clean || '%' THEN 3 ELSE 0 END
       + CASE WHEN COALESCE(category, '') ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END
       + CASE WHEN COALESCE(per_rank_effect, '') ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END
       + CASE WHEN COALESCE(notes, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(tier::text, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN important_notes::text ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END
       + CASE WHEN COALESCE(image_url, '') ILIKE '%' || v_clean || '%' THEN 1 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(name, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM upgrades
    WHERE tenant_id = v_tenant_id AND (
      name ILIKE '%' || v_clean || '%'
      OR COALESCE(description, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(effect, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(category, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(per_rank_effect, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(notes, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(tier::text, '') ILIKE '%' || v_clean || '%'
      OR important_notes::text ILIKE '%' || v_clean || '%'
      OR extensions.word_similarity(v_clean, COALESCE(name, '')) > 0.2
    )
  ),
  combined AS (
    SELECT * FROM search_wiki
    UNION ALL SELECT * FROM search_weapons
    UNION ALL SELECT * FROM search_armors
    UNION ALL SELECT * FROM search_enemies
    UNION ALL SELECT * FROM search_bosses
    UNION ALL SELECT * FROM search_rings
    UNION ALL SELECT * FROM search_potions
    UNION ALL SELECT * FROM search_upgrades
  ),
  deduped AS (
    SELECT DISTINCT ON (source_type, id) *
    FROM combined WHERE rank > 0
    ORDER BY source_type, id, rank DESC
  )
  SELECT jsonb_build_object(
    'results', COALESCE(
      (SELECT jsonb_agg(sub.item) FROM (
        SELECT jsonb_build_object(
          'source_type', d.source_type,
          'id', d.id,
          'name', d.name,
          'description', d.description,
          'slug', d.slug,
          'tags', d.tags,
          'collection_name', d.collection_name,
          'collection_slug', d.collection_slug,
          'raw_data', d.raw_data,
          'rank', d.rank,
          'match_type', d.match_type
        ) AS item
        FROM deduped d
        ORDER BY d.rank DESC
        LIMIT p_limit
      ) sub),
      '[]'::jsonb
    )
  ) INTO v_results;

  RETURN v_results;
END;
$$;
