-- Migration 019: GIN trgm indexes + remove collection_items from search_all

-- =====================================================
-- Install pg_trgm (safe if already installed)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- =====================================================
-- GIN trigram indexes for ILIKE performance
-- =====================================================

-- weapons
CREATE INDEX IF NOT EXISTS idx_weapons_name_trgm ON weapons USING GIN (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_weapons_obtain_method_trgm ON weapons USING GIN (obtain_method extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_weapons_notes_trgm ON weapons USING GIN (notes extensions.gin_trgm_ops);

-- armors
CREATE INDEX IF NOT EXISTS idx_armors_name_trgm ON armors USING GIN (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_armors_obtain_method_trgm ON armors USING GIN (obtain_method extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_armors_notes_trgm ON armors USING GIN (notes extensions.gin_trgm_ops);

-- enemies
CREATE INDEX IF NOT EXISTS idx_enemies_name_trgm ON enemies USING GIN (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_enemies_description_trgm ON enemies USING GIN (description extensions.gin_trgm_ops);

-- bosses
CREATE INDEX IF NOT EXISTS idx_bosses_name_trgm ON bosses USING GIN (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_bosses_description_trgm ON bosses USING GIN (description extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_bosses_strategy_trgm ON bosses USING GIN (strategy extensions.gin_trgm_ops);

-- rings
CREATE INDEX IF NOT EXISTS idx_rings_name_trgm ON rings USING GIN (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_rings_description_trgm ON rings USING GIN (description extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_rings_obtain_method_trgm ON rings USING GIN (obtain_method extensions.gin_trgm_ops);

-- potions
CREATE INDEX IF NOT EXISTS idx_potions_name_trgm ON potions USING GIN (name extensions.gin_trgm_ops);

-- upgrades
CREATE INDEX IF NOT EXISTS idx_upgrades_name_trgm ON upgrades USING GIN (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_upgrades_description_trgm ON upgrades USING GIN (description extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_upgrades_effect_trgm ON upgrades USING GIN (effect extensions.gin_trgm_ops);

-- =====================================================
-- Recreate search_all without collection_items
-- =====================================================

CREATE OR REPLACE FUNCTION search_all(
  p_tenant_slug TEXT,
  p_query TEXT,
  p_limit INT DEFAULT 10,
  p_embedding TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_tenant_id UUID;
  v_results JSONB;
  v_clean TEXT;
  v_embedding_vec vector(1536);
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

  IF p_embedding IS NOT NULL THEN
    BEGIN
      v_embedding_vec := p_embedding::vector(1536);
    EXCEPTION WHEN OTHERS THEN
      v_embedding_vec := NULL;
    END;
  END IF;

  WITH search_wiki AS (
    SELECT 'wiki_article' AS source_type, id, title AS name,
      COALESCE(summary, '') AS description, slug, tags,
      NULL::text AS collection_name, NULL::text AS collection_slug,
      NULL::jsonb AS raw_data,
      (CASE WHEN title ILIKE '%' || v_clean || '%' THEN 12 ELSE 0 END
       + CASE WHEN COALESCE(summary, '') ILIKE '%' || v_clean || '%' THEN 6 ELSE 0 END
       + CASE WHEN content ILIKE '%' || v_clean || '%' THEN 4 ELSE 0 END
       + CASE WHEN tags::text ILIKE '%' || v_clean || '%' THEN 3 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(title, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM wiki_articles
    WHERE tenant_id = v_tenant_id AND (
      title ILIKE '%' || v_clean || '%'
      OR COALESCE(summary, '') ILIKE '%' || v_clean || '%'
      OR content ILIKE '%' || v_clean || '%'
      OR tags::text ILIKE '%' || v_clean || '%'
      OR extensions.word_similarity(v_clean, COALESCE(title, '')) > 0.2
    )
  ),
  search_weapons AS (
    SELECT 'weapon' AS source_type, id, name,
      COALESCE(notes, '') AS description, slugify(name) AS slug,
      NULL::text[] AS tags, 'Weapons' AS collection_name, 'weapons' AS collection_slug,
      row_to_json(weapons.*)::jsonb AS raw_data,
      (CASE WHEN name ILIKE '%' || v_clean || '%' THEN 10 ELSE 0 END
       + CASE WHEN COALESCE(obtain_method, '') ILIKE '%' || v_clean || '%' THEN 6 ELSE 0 END
       + CASE WHEN COALESCE(weapon_type, '') ILIKE '%' || v_clean || '%' THEN 3 ELSE 0 END
       + CASE WHEN element::text ILIKE '%' || v_clean || '%' THEN 3 ELSE 0 END
       + CASE WHEN COALESCE(notes, '') ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(name, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM weapons
    WHERE tenant_id = v_tenant_id AND (
      name ILIKE '%' || v_clean || '%'
      OR COALESCE(obtain_method, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(weapon_type, '') ILIKE '%' || v_clean || '%'
      OR element::text ILIKE '%' || v_clean || '%'
      OR COALESCE(notes, '') ILIKE '%' || v_clean || '%'
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
       + CASE WHEN COALESCE(notes, '') ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(name, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM armors
    WHERE tenant_id = v_tenant_id AND (
      name ILIKE '%' || v_clean || '%'
      OR COALESCE(obtain_method, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(world_name, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(notes, '') ILIKE '%' || v_clean || '%'
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
       + CASE WHEN weakness::text ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(name, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM enemies
    WHERE tenant_id = v_tenant_id AND (
      name ILIKE '%' || v_clean || '%'
      OR COALESCE(world_name, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(enemy_type, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(description, '') ILIKE '%' || v_clean || '%'
      OR weakness::text ILIKE '%' || v_clean || '%'
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
       + CASE WHEN weakness::text ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(name, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM bosses
    WHERE tenant_id = v_tenant_id AND (
      name ILIKE '%' || v_clean || '%'
      OR COALESCE(world_name, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(description, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(strategy, '') ILIKE '%' || v_clean || '%'
      OR weakness::text ILIKE '%' || v_clean || '%'
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
       + CASE WHEN COALESCE(obtain_method, '') ILIKE '%' || v_clean || '%' THEN 6 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(name, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM rings
    WHERE tenant_id = v_tenant_id AND (
      name ILIKE '%' || v_clean || '%'
      OR COALESCE(description, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(obtain_method, '') ILIKE '%' || v_clean || '%'
      OR extensions.word_similarity(v_clean, COALESCE(name, '')) > 0.2
    )
  ),
  search_potions AS (
    SELECT 'potion' AS source_type, id, name, '' AS description,
      slugify(name) AS slug, NULL::text[] AS tags,
      'Potions' AS collection_name, 'potions' AS collection_slug,
      row_to_json(potions.*)::jsonb AS raw_data,
      (CASE WHEN name ILIKE '%' || v_clean || '%' THEN 10 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(name, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM potions
    WHERE tenant_id = v_tenant_id AND (
      name ILIKE '%' || v_clean || '%'
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
       + CASE WHEN COALESCE(category, '') ILIKE '%' || v_clean || '%' THEN 2 ELSE 0 END)
      + COALESCE((extensions.word_similarity(v_clean, COALESCE(name, '')) * 8)::int, 0)
      AS rank, 'fulltext' AS match_type, updated_at
    FROM upgrades
    WHERE tenant_id = v_tenant_id AND (
      name ILIKE '%' || v_clean || '%'
      OR COALESCE(description, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(effect, '') ILIKE '%' || v_clean || '%'
      OR COALESCE(category, '') ILIKE '%' || v_clean || '%'
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
