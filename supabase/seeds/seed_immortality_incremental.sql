-- ============================================================
-- Seed: Immortality Incremental Wiki
-- Game: Immortality Incremental (Roblox Incremental/Idle)
-- Slug: immortality-incremental
-- Owner: aymatsu00@gmail.com
-- ============================================================
-- Este script é idempotente — pode ser executado múltiplas vezes.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Resolver user UUID
-- ============================================================
DO $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'aymatsu00@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE WARNING 'Usuário aymatsu00@gmail.com não encontrado em auth.users. Seed parcial.';
    v_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
  END IF;

  -- ============================================================
  -- 2. Criar Tenant
  -- ============================================================
  INSERT INTO tenants (
    name, slug, description, is_public, ai_enabled,
    theme,
    created_at, updated_at
  ) VALUES (
    'Immortality Incremental',
    'immortality-incremental',
    'Wiki colaborativa sobre Immortality Incremental — um jogo incremental de grind e progressão no Roblox. Domine as Marcas da Percepção, Essência, Soulfire, Karma, Estrelas, Nebulosas e Quasar através de dois mundos.',
    true, true,
    '{
      "primary": "270 80% 55%",
      "background": "260 30% 8%",
      "foreground": "260 10% 92%",
      "muted": "260 20% 15%",
      "card": "260 25% 12%",
      "border": "270 40% 25%"
    }'::jsonb,
    now(), now()
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description
  RETURNING id INTO v_tenant_id;

  -- ============================================================
  -- 3. Criar Tenant Member (owner)
  -- ============================================================
  IF v_user_id != '00000000-0000-0000-0000-000000000000'::UUID THEN
    INSERT INTO tenant_members (tenant_id, user_id, role)
    VALUES (v_tenant_id, v_user_id, 'owner')
    ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = 'owner';
  END IF;

  -- ============================================================
  -- 4. Criar Tabela de Jogo: marks
  -- ============================================================
  CREATE TABLE IF NOT EXISTS marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT,
    slug TEXT,
    description TEXT,
    image_url TEXT,
    mark_type TEXT NOT NULL,
    world INTEGER NOT NULL DEFAULT 1,
    tier INTEGER NOT NULL DEFAULT 1,
    qi_mult NUMERIC DEFAULT 0,
    luck_mult NUMERIC DEFAULT 0,
    insight_mult NUMERIC DEFAULT 0,
    essence_mult NUMERIC DEFAULT 0,
    soulfire_mult NUMERIC DEFAULT 0,
    remnants_mult NUMERIC DEFAULT 0,
    stars_mult NUMERIC DEFAULT 0,
    nebula_mult NUMERIC DEFAULT 0,
    karma_mult NUMERIC DEFAULT 0,
    quasar_mult NUMERIC DEFAULT 0,
    mark_bulk NUMERIC DEFAULT 0,
    mark_speed NUMERIC DEFAULT 0,
    mark_luck NUMERIC DEFAULT 0,
    beast_core_chance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_marks_tenant ON marks(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_marks_type ON marks(mark_type);
  CREATE INDEX IF NOT EXISTS idx_marks_world ON marks(world);

  ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

  -- RLS policies (same pattern as other game tables)
  DROP POLICY IF EXISTS "marks_readable" ON marks;
  CREATE POLICY "marks_readable" ON marks FOR SELECT USING (
    (tenant_id IS NULL) OR
    (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = marks.tenant_id AND (tenants.is_public = true OR is_tenant_member(tenants.id))))
  );
  DROP POLICY IF EXISTS "marks_insert" ON marks;
  CREATE POLICY "marks_insert" ON marks FOR INSERT WITH CHECK (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "marks_update" ON marks;
  CREATE POLICY "marks_update" ON marks FOR UPDATE USING (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "marks_delete" ON marks;
  CREATE POLICY "marks_delete" ON marks FOR DELETE USING (is_tenant_member_with_role(tenant_id, 'admin'));

  -- ============================================================
  -- 5. Catalog entry for marks table
  -- ============================================================
  INSERT INTO tenant_game_tables (tenant_id, table_name, display_label)
  VALUES (v_tenant_id, 'marks', 'Marcas')
  ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = 'Marcas';

  -- ============================================================
  -- 6. Inserir dados das Marcas
  -- ============================================================

  -- ========== WORLD 1: Mark of Insight ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance)
  VALUES
    (v_tenant_id, 'Dim', 'insight-dim', 'O primeiro vislumbre — um lampejo inicial de percepção.', 'insight', 1, 1,
     0, 14.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Aware', 'insight-aware', 'Consciência desperta — Qi flui e a percepção se expande.', 'insight', 1, 2,
     23.5, 1.75, 2.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Keen', 'insight-keen', 'Sentidos aguçados — sorte e intuição se intensificam.', 'insight', 1, 3,
     0, 7, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Clear', 'insight-clear', 'Clareza cristalina — Qi, sorte e essência se alinham.', 'insight', 1, 4,
     59.5, 10, 4, 1.75, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Piercing', 'insight-piercing', 'Visão perfurante — atravessa as camadas da realidade.', 'insight', 1, 5,
     112, 11.5, 0, 3.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Deepseeing', 'insight-deepseeing', 'O olho interior se abre — Soulfire começa a arder.', 'insight', 1, 6,
     224.5, 0, 5.5, 0, 3.25, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Farsight', 'insight-farsight', 'Visão distante — enxerga além do horizonte.', 'insight', 1, 7,
     374.5, 20.5, 0, 5.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Truesight', 'insight-truesight', 'A verdade nua — estrelas e bulk se revelam.', 'insight', 1, 8,
     0, 29.5, 8.5, 0, 7, 0, 2.5, 0, 0, 0, 3.25, 2.88, 0, 0),
    (v_tenant_id, 'Omniscience', 'insight-omniscience', 'Onisciência — o ápice da percepção total.', 'insight', 1, 9,
     749.5, 44.5, 14.5, 14.5, 11.5, 7, 0, 0, 0, 0, 4, 4, 2.5, 0);

  -- ========== WORLD 1: Mark of Essence ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance)
  VALUES
    (v_tenant_id, 'Fragment', 'essence-fragment', 'Um fragmento bruto de essência pura.', 'essence', 1, 1,
     44.5, 82, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Shard', 'essence-shard', 'Estilhaço cristalino — Qi e essência se fundem.', 'essence', 1, 2,
     82, 44.5, 0, 172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Node', 'essence-node', 'Nódulo de energia — insight brota do vazio.', 'essence', 1, 3,
     0, 37, 172, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Crest', 'essence-crest', 'Crista reluzente — Qi e sorte canalizam essência.', 'essence', 1, 4,
     17.5, 86.5, 0, 32.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Ruby', 'essence-ruby', 'Rubi flamejante — sorte e essência em harmonia.', 'essence', 1, 5,
     0, 59.5, 0, 62.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Nucleus', 'essence-nucleus', 'Núcleo pulsante — a alma começa a queimar.', 'essence', 1, 6,
     0, 52, 0, 89.5, 3.25, 0, 0, 0, 0, 0, 0, 2.12, 0, 0),
    (v_tenant_id, 'Prism', 'essence-prism', 'Prisma refrator — essência pura canaliza remanescentes.', 'essence', 1, 7,
     119.5, 0, 14.5, 239.5, 0, 3.25, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Eternal', 'essence-eternal', 'Eterno — a essência transcende o tempo.', 'essence', 1, 8,
     224.5, 37, 0, 449.5, 8.5, 0, 2.5, 0, 0, 0, 2.5, 2.5, 0, 0);

  -- ========== WORLD 1: Mark of Soulfire ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance)
  VALUES
    (v_tenant_id, 'Mote', 'soulfire-mote', 'Uma centelha de alma — o primeiro fogo interior.', 'soulfire', 1, 1,
     14.5, 0, 0, 11.5, 2.5, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Kindling', 'soulfire-kindling', 'Fagulha acende — insight alimenta a chama.', 'soulfire', 1, 2,
     0, 16, 26.5, 0, 5.5, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Wraith', 'soulfire-wraith', 'Espectro de fogo — o karma começa a girar.', 'soulfire', 1, 3,
     11.5, 0, 0, 0, 0, 0, 0, 0, 2.5, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Pyre', 'soulfire-pyre', 'Pira ardente — velocidade e remanescentes emergem.', 'soulfire', 1, 4,
     0, 26.5, 0, 0, 14.5, 5.5, 0, 0, 0, 0, 0, 1.75, 0, 0),
    (v_tenant_id, 'Brand', 'soulfire-brand', 'Marca gravada — Qi e karma selados pelo fogo.', 'soulfire', 1, 5,
     52, 29.5, 0, 0, 0, 0, 0, 0, 5.5, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Inferno', 'soulfire-inferno', 'Inferno desatado — bulk e caos flamejante.', 'soulfire', 1, 6,
     0, 0, 0, 37, 29.5, 13, 0, 0, 0, 0, 2.12, 0, 0, 0),
    (v_tenant_id, 'Everflame', 'soulfire-everflame', 'Chama eterna — o fogo que nunca se apaga.', 'soulfire', 1, 7,
     121, 44.5, 0, 59.5, 44.5, 0, 0, 0, 0, 0, 2.5, 0, 0, 1.38),
    (v_tenant_id, 'Soulnova', 'soulfire-soulnova', 'Supernova da alma — o clímax do fogo interior.', 'soulfire', 1, 8,
     271, 0, 0, 0, 91, 2.5, 0, 0, 0, 0, 4, 3.25, 2.5, 0);

  -- ========== WORLD 1: Mark of Karma ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance)
  VALUES
    (v_tenant_id, 'Trace', 'karma-trace', 'Um traço de karma — o ciclo começa.', 'karma', 1, 1,
     7, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Ledger', 'karma-ledger', 'Livro do karma — dívidas e créditos da alma.', 'karma', 1, 2,
     7, 0, 0, 0, 5.5, 0, 0, 0, 5.5, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Burden', 'karma-burden', 'Fardo carregado — o peso das escolhas.', 'karma', 1, 3,
     5.5, 10, 0, 0, 0, 0, 0, 0, 5.5, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Mercy', 'karma-mercy', 'Misericórdia — o karma encontra compaixão.', 'karma', 1, 4,
     29.5, 14.5, 0, 0, 0, 2.5, 0, 0, 8.5, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Balance', 'karma-balance', 'Equilíbrio — todas as forças em harmonia.', 'karma', 1, 5,
     29.5, 22, 0, 0, 7, 0, 0, 0, 2.5, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Reckoning', 'karma-reckoning', 'Acerto de contas — o karma cobra seu preço.', 'karma', 1, 6,
     56.5, 19, 0, 23.5, 0, 0, 0, 0, 2.5, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Samsara', 'karma-samsara', 'Samsara — o ciclo infinito de renascimento.', 'karma', 1, 7,
     18750, 187, 0, 0, 0, 0, 0, 0, 4, 0, 4, 2.5, 0, 0),
    (v_tenant_id, 'Nirvana', 'karma-nirvana', 'Nirvana — a libertação final do ciclo.', 'karma', 1, 8,
     18750, 562, 0, 0, 0, 0, 4, 0, 19, 0, 2.5, 0, 0, 0);

  -- ========== WORLD 2: Mark of Stars ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance)
  VALUES
    (v_tenant_id, 'Spark', 'stars-spark', 'A primeira fagulha estelar no cosmos.', 'stars', 2, 1,
     0, 600, 0, 0, 0, 0, 7.5, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Stardust', 'stars-stardust', 'Poeira de estrelas — Qi e luz se encontram.', 'stars', 2, 2,
     600, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Astral', 'stars-astral', 'Corpo astral — Qi e sorte em massa crítica.', 'stars', 2, 3,
     1500, 1500, 0, 0, 0, 0, 24, 0, 0, 0, 3, 0, 0, 0),
    (v_tenant_id, 'Comet', 'stars-comet', 'Cometa veloz — bulk máximo em movimento.', 'stars', 2, 4,
     2400, 3000, 0, 0, 0, 0, 30, 0, 0, 0, 10.5, 0, 0, 0),
    (v_tenant_id, 'Radiant', 'stars-radiant', 'Radiação pura — nebulosas começam a brilhar.', 'stars', 2, 5,
     3600, 3000, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Celestial', 'stars-celestial', 'Corpo celeste — a dança das nebulosas.', 'stars', 2, 6,
     1200, 1200, 0, 0, 0, 0, 0, 2.25, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Supernova', 'stars-supernova', 'Supernova — a explosão final de luz.', 'stars', 2, 7,
     900, 1500, 0, 7.5, 0, 0, 0, 22.5, 0, 0, 0, 9, 0, 0),
    (v_tenant_id, 'Genesis', 'stars-genesis', 'Gênesis — o nascimento de um novo cosmos.', 'stars', 2, 8,
     3000, 3000, 0, 0, 0, 0, 0, 9, 0, 0, 3, 0, 0, 0);

  -- ========== WORLD 2: Mark of Nebulae ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance)
  VALUES
    (v_tenant_id, 'Mistglow', 'nebulae-mistglow', 'Brilho nevoento — karma e névoa cósmica.', 'nebulae', 2, 1,
     0, 3000, 0, 0, 0, 0, 0, 6.9, 4500, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Gasveil', 'nebulae-gasveil', 'Véu gasoso — velocidade entre as estrelas.', 'nebulae', 2, 2,
     4500, 6000, 0, 0, 0, 0, 0, 8.1, 0, 0, 0, 7.5, 0, 0),
    (v_tenant_id, 'Starseed', 'nebulae-starseed', 'Semente estelar — o bulk das nebulosas.', 'nebulae', 2, 3,
     3750, 7200, 0, 0, 0, 0, 18, 9, 0, 0, 3, 0, 0, 0),
    (v_tenant_id, 'Moonwake', 'nebulae-moonwake', 'Despertar lunar — karma e estrelas em dança.', 'nebulae', 2, 4,
     2400, 2400, 0, 0, 0, 0, 60, 30, 2.25, 0, 0, 9, 0, 0),
    (v_tenant_id, 'Cometheart', 'nebulae-cometheart', 'Coração de cometa — bulk nebuloso extremo.', 'nebulae', 2, 5,
     3600, 3000, 0, 0, 0, 0, 0, 60, 0, 0, 12, 0, 0, 0),
    (v_tenant_id, 'Voidpetal', 'nebulae-voidpetal', 'Pétala do vazio — estrelas e névoa eterna.', 'nebulae', 2, 6,
     1500, 1500, 0, 0, 0, 0, 30, 30, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Novashard', 'nebulae-novashard', 'Estilhaço de nova — essência e velocidade.', 'nebulae', 2, 7,
     450, 750, 0, 15, 0, 0, 0, 7.5, 150, 0, 0, 6, 0, 0),
    (v_tenant_id, 'Astral Crown', 'nebulae-astral-crown', 'Coroa Astral — a majestade das nebulosas.', 'nebulae', 2, 8,
     3000, 1500, 0, 0, 0, 0, 0, 30, 450, 0, 4.5, 0, 0, 0);

  -- ========== WORLD 2: Mark of Quasar ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance)
  VALUES
    (v_tenant_id, 'Flare', 'quasar-flare', 'Erupção de quasar — a primeira chama cósmica.', 'quasar', 2, 1,
     12000, 0, 0, 0, 0, 0, 0, 0, 0, 450, 0, 0, 0, 0),
    (v_tenant_id, 'Vanta', 'quasar-vanta', 'Vanta — escuridão que consome a luz.', 'quasar', 2, 2,
     0, 12000, 0, 0, 0, 0, 0, 24, 6000, 198, 0, 0, 0, 0),
    (v_tenant_id, 'Sear', 'quasar-sear', 'Chama abrasadora — bulk e estrelas queimam.', 'quasar', 2, 3,
     18000, 0, 0, 0, 0, 0, 72, 0, 4500, 168, 4.5, 0, 0, 0),
    (v_tenant_id, 'Halo', 'quasar-halo', 'Auréola de quasar — sorte e karma celestiais.', 'quasar', 2, 4,
     4500, 0, 0, 0, 0, 0, 0, 0, 9000, 198, 0, 0, 2.25, 0),
    (v_tenant_id, 'Lumen', 'quasar-lumen', 'Lumen — bulk máximo de luz e sorte.', 'quasar', 2, 5,
     9000, 4500, 0, 0, 0, 0, 0, 0, 0, 222, 18, 0, 0, 0),
    (v_tenant_id, 'Surge', 'quasar-surge', 'Onda de choque — remanescentes e poder bruto.', 'quasar', 2, 6,
     4800, 0, 0, 0, 0, 4.5, 0, 0, 0, 390, 0, 0, 0, 0),
    (v_tenant_id, 'Corona', 'quasar-corona', 'Coroa solar — o esplendor final do quasar.', 'quasar', 2, 7,
     4500, 4500, 0, 0, 0, 0, 0, 0, 3000, 180, 0, 0, 0, 0),
    (v_tenant_id, 'Zenith', 'quasar-zenith', 'Zênite — o ponto mais alto do cosmos.', 'quasar', 2, 8,
     12000, 0, 0, 0, 0, 0, 0, 0, 0, 360, 4.5, 0, 6, 0);

  -- ============================================================
  -- 7. Config do Jogo (game_config)
  -- ============================================================
  IF NOT EXISTS (SELECT 1 FROM game_config WHERE tenant_id = v_tenant_id AND config_key = 'gameDataVersion') THEN
    INSERT INTO game_config (tenant_id, config_key, config_value)
    VALUES (v_tenant_id, 'gameDataVersion', '"1.0.0"'::jsonb);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM game_config WHERE tenant_id = v_tenant_id AND config_key = 'allGameData') THEN
    INSERT INTO game_config (tenant_id, config_key, config_value)
    VALUES (v_tenant_id, 'allGameData', '{}'::jsonb);
  END IF;

  -- ============================================================
  -- 8. Artigos da Wiki
  -- ============================================================

  -- Helper table to insert articles
  CREATE TEMP TABLE IF NOT EXISTS temp_articles (
    idx SERIAL PRIMARY KEY,
    title TEXT,
    summary TEXT,
    content TEXT,
    tags TEXT[]
  );

  INSERT INTO temp_articles (title, summary, content, tags) VALUES

  -- Article 1: Visão Geral
  ('Immortality Incremental — Visão Geral',
   'Bem-vindo ao mundo de Immortality Incremental, um jogo de grind e progressão no Roblox onde você coleta e evolui Marcas ancestrais para alcançar a imortalidade.',
   'Immortality Incremental é um jogo incremental/idle no Roblox focado em grind, progressão e crafting de Marcas místicas.

O jogo é dividido em dois mundos principais, cada um com seus próprios sistemas de Marcas:

## Mundo 1
O primeiro mundo apresenta 4 tipos de Marcas:
- **Mark of Insight**: Foca em Qi, Luck e Insight. 9 tiers de progressão.
- **Mark of Essence**: Essência pura com altos multiplicadores. 8 tiers.
- **Mark of Soulfire**: Fogo da alma com bônus de bulk e velocidade. 8 tiers.
- **Mark of Karma**: O ciclo do karma com custos massivos de Qi. 8 tiers.

## Mundo 2
O segundo mundo desbloqueia Marcas cósmicas:
- **Mark of Stars**: Poder estelar com multiplicadores na casa dos milhares.
- **Mark of Nebulae**: Névoa cósmica combinando estrelas e karma.
- **Mark of Quasar**: O ápice do poder, com requisitos de Qi na casa dos 18K.

## Progressão
A progressão segue um ciclo de grind: colete recursos (Qi, Luck, Essência, etc.), combine em Marcas mais poderosas e avance para o próximo tier. Cada Mark oferece multiplicadores que aceleram sua coleta de recursos — quanto mais você sobe, mais rápido fica.

Domine todas as 57 Marcas para alcançar a imortalidade verdadeira.',
   ARRAY['visão-geral', 'introdução', 'guia']
  ),

  -- Article 2: Mark of Insight
  ('Marcas da Percepção (Mark of Insight)',
   'Guia completo das Marcas da Percepção — do estágio Dim à Onisciência.',
   'As Marcas da Percepção (Mark of Insight) são a primeira família de Marcas encontrada no Mundo 1. Elas focam em multiplicar Qi, Luck e Insight.

## Tiers

| Tier | Nome | Qi | Luck | Insight | Essência | Soulfire | Remnants | Stars | Mark Bulk | Mark Speed | Mark Luck |
|------|------|----|------|---------|----------|----------|----------|-------|-----------|------------|-----------|
| 1 | Dim | — | x14.5 | — | — | — | — | — | — | — | — |
| 2 | Aware | x23.5 | x1.75 | x2.5 | — | — | — | — | — | — | — |
| 3 | Keen | — | x7 | x4 | — | — | — | — | — | — | — |
| 4 | Clear | x59.5 | x10 | x4 | x1.75 | — | — | — | — | — | — |
| 5 | Piercing | x112 | x11.5 | — | x3.5 | — | — | — | — | — | — |
| 6 | Deepseeing | x224.5 | — | x5.5 | — | x3.25 | — | — | — | — | — |
| 7 | Farsight | x374.5 | x20.5 | — | x5.5 | — | — | — | — | — | — |
| 8 | Truesight | — | x29.5 | x8.5 | — | x7 | — | x2.5 | x3.25 | x2.88 | — |
| 9 | Omniscience | x749.5 | x44.5 | x14.5 | x14.5 | x11.5 | x7 | — | x4 | x4 | x2.5 |

## Dicas
- **Dim** é sua primeira Mark — farme Luck para evoluir.
- **Truesight** é um marco importante: desbloqueia Stars, Mark Bulk e Mark Speed.
- **Omniscience** é o ápice do Mundo 1 para Insight — os multiplicadores disparam.

A progressão ideal é: Dim → Aware → Keen → Clear → Piercing → Deepseeing → Farsight → Truesight → Omniscience.',
   ARRAY['insight', 'percepção', 'guia', 'mundo-1']
  ),

  -- Article 3: Mark of Essence
  ('Marcas da Essência (Mark of Essence)',
   'Guia completo das Marcas da Essência — de Fragment a Eternal.',
   'As Marcas da Essência (Mark of Essence) são a segunda família do Mundo 1. Elas oferecem altos multiplicadores de Essência combinados com Qi e Luck.

## Tiers

| Tier | Nome | Qi | Luck | Insight | Essência | Soulfire | Remnants | Stars | Mark Bulk | Mark Speed |
|------|------|----|------|---------|----------|----------|----------|-------|-----------|------------|
| 1 | Fragment | x44.5 | x82 | — | — | — | — | — | — | — |
| 2 | Shard | x82 | x44.5 | — | x172 | — | — | — | — | — |
| 3 | Node | — | x37 | x172 | — | — | — | — | — | — |
| 4 | Crest | x17.5 | x86.5 | — | x32.5 | — | — | — | — | — |
| 5 | Ruby | — | x59.5 | — | x62.5 | — | — | — | — | — |
| 6 | Nucleus | — | x52 | — | x89.5 | x3.25 | — | — | — | x2.12 |
| 7 | Prism | x119.5 | — | x14.5 | x239.5 | — | x3.25 | — | — | — |
| 8 | Eternal | x224.5 | x37 | — | x449.5 | x8.5 | — | x2.5 | x2.5 | x2.5 |

## Dicas
- Essência escala muito rápido — Shard já dá x172 Essência.
- **Nucleus** introduz Soulfire e Mark Speed.
- **Eternal** é o topo: x449.5 Essência + bônus de Stars, Soulfire e bulk.',
   ARRAY['essência', 'essence', 'guia', 'mundo-1']
  ),

  -- Article 4: Mark of Soulfire
  ('Marcas da Alma de Fogo (Mark of Soulfire)',
   'Guia completo das Marcas da Alma de Fogo — de Mote a Soulnova.',
   'As Marcas da Alma de Fogo (Mark of Soulfire) são a terceira família do Mundo 1. Elas combinam Soulfire com Remnants, Karma e bônus de bulk/velocidade.

## Tiers

| Tier | Nome | Qi | Luck | Insight | Essência | Soulfire | Remnants | Karma | Mark Bulk | Mark Speed | Mark Luck | Beast Core |
|------|------|----|------|---------|----------|----------|----------|-------|-----------|------------|-----------|------------|
| 1 | Mote | x14.5 | — | — | x11.5 | x2.5 | — | — | — | — | — | — |
| 2 | Kindling | — | x16 | x26.5 | — | x5.5 | — | — | — | — | — | — |
| 3 | Wraith | x11.5 | — | — | — | — | — | x2.5 | — | — | — | — |
| 4 | Pyre | — | x26.5 | — | — | x14.5 | x5.5 | — | — | x1.75 | — | — |
| 5 | Brand | x52 | x29.5 | — | — | — | — | x5.5 | — | — | — | — |
| 6 | Inferno | — | — | — | x37 | x29.5 | x13 | — | x2.12 | — | — | — |
| 7 | Everflame | x121 | x44.5 | — | x59.5 | x44.5 | — | — | x2.5 | — | — | x1.38 |
| 8 | Soulnova | x271 | — | — | — | x91 | x2.5 | — | x4 | x3.25 | x2.5 | — |

## Dicas
- **Pyre** é seu primeiro contato com Mark Speed.
- **Everflame** introduz Beast Core Chance — essencial para endgame.
- **Soulnova** é o ápice: x91 Soulfire com bônus massivos de bulk e speed.',
   ARRAY['soulfire', 'alma', 'fogo', 'guia', 'mundo-1']
  ),

  -- Article 5: Mark of Karma
  ('Marcas do Karma (Mark of Karma)',
   'Guia completo das Marcas do Karma — de Trace a Nirvana.',
   'As Marcas do Karma (Mark of Karma) são a quarta e última família do Mundo 1. Elas são únicas por terem custos massivos de Qi nos tiers mais altos (18.75K).

## Tiers

| Tier | Nome | Qi | Luck | Essência | Soulfire | Remnants | Stars | Karma | Mark Bulk | Mark Speed |
|------|------|----|------|----------|----------|----------|-------|-------|-----------|------------|
| 1 | Trace | x7 | — | — | — | — | — | x7 | — | — |
| 2 | Ledger | x7 | — | — | x5.5 | — | — | x5.5 | — | — |
| 3 | Burden | x5.5 | x10 | — | — | — | — | x5.5 | — | — |
| 4 | Mercy | x29.5 | x14.5 | — | — | x2.5 | — | x8.5 | — | — |
| 5 | Balance | x29.5 | x22 | — | x7 | — | — | x2.5 | — | — |
| 6 | Reckoning | x56.5 | x19 | x23.5 | — | — | — | x2.5 | — | — |
| 7 | Samsara | x18.75K | x187 | — | — | — | — | x4 | x4 | x2.5 |
| 8 | Nirvana | x18.75K | x562 | — | — | — | x4 | x19 | x2.5 | — |

## Dicas
- Karma é a última família do Mundo 1 — você precisará das outras Marcas primeiro.
- **Samsara** e **Nirvana** exigem 18.750 de Qi — um salto gigante dos tiers anteriores.
- **Nirvana** desbloqueia Stars (x4) e Karma x19 — essencial para transição ao Mundo 2.',
   ARRAY['karma', 'guia', 'mundo-1']
  ),

  -- Article 6: Mark of Stars
  ('Marcas das Estrelas (Mark of Stars)',
   'Guia completo das Marcas das Estrelas — de Spark a Genesis.',
   'As Marcas das Estrelas (Mark of Stars) são a primeira família do Mundo 2. Os multiplicadores saltam para a casa dos milhares.

## Tiers

| Tier | Nome | Qi | Luck | Essência | Stars | Nebulae | Mark Bulk | Mark Speed |
|------|------|----|------|----------|-------|---------|-----------|------------|
| 1 | Spark | — | x600 | — | x7.5 | — | — | — |
| 2 | Stardust | x600 | — | — | x18 | — | — | — |
| 3 | Astral | x1.5K | x1.5K | — | x24 | — | x3 | — |
| 4 | Comet | x2.4K | x3K | — | x30 | — | x10.5 | — |
| 5 | Radiant | x3.6K | x3K | — | — | x3 | — | — |
| 6 | Celestial | x1.2K | x1.2K | — | — | x2.25 | — | — |
| 7 | Supernova | x900 | x1.5K | x7.5 | — | x22.5 | — | x9 |
| 8 | Genesis | x3K | x3K | — | — | x9 | x3 | — |

## Dicas
- Os valores de Qi e Luck agora estão na casa dos milhares — prepare-se para grind pesado.
- **Radiant** e **Celestial** introduzem Nebulae.
- **Supernova** oferece x22.5 Nebulae + Mark Speed x9 — um dos melhores tiers para speed.',
   ARRAY['stars', 'estrelas', 'guia', 'mundo-2']
  ),

  -- Article 7: Mark of Nebulae
  ('Marcas das Nebulosas (Mark of Nebulae)',
   'Guia completo das Marcas das Nebulosas — de Mistglow a Astral Crown.',
   'As Marcas das Nebulosas (Mark of Nebulae) são a segunda família do Mundo 2. Combinam Karma massivo com multiplicadores de Nebulae e Stars.

## Tiers

| Tier | Nome | Qi | Luck | Essência | Stars | Nebulae | Karma | Mark Bulk | Mark Speed |
|------|------|----|------|----------|-------|---------|-------|-----------|------------|
| 1 | Mistglow | — | x3K | — | — | x6.9 | x4.5K | — | — |
| 2 | Gasveil | x4.5K | x6K | — | — | x8.1 | — | — | x7.5 |
| 3 | Starseed | x3.75K | x7.2K | — | x18 | x9 | — | x3 | — |
| 4 | Moonwake | x2.4K | x2.4K | — | x60 | x30 | x2.25 | — | x9 |
| 5 | Cometheart | x3.6K | x3K | — | — | x60 | — | x12 | — |
| 6 | Voidpetal | x1.5K | x1.5K | — | x30 | x30 | — | — | — |
| 7 | Novashard | x450 | x750 | x15 | — | x7.5 | x150 | — | x6 |
| 8 | Astral Crown | x3K | x1.5K | — | — | x30 | x450 | x4.5 | — |

## Dicas
- **Mistglow** exige x4.5K Karma — um investimento pesado.
- **Moonwake** é um dos tiers mais balanceados: x60 Stars + x30 Nebulae + x9 Speed.
- **Cometheart** tem o maior Mark Bulk (x12) de todas as Marcas de Nebulae.',
   ARRAY['nebulae', 'nebulosas', 'guia', 'mundo-2']
  ),

  -- Article 8: Mark of Quasar
  ('Marcas do Quasar (Mark of Quasar)',
   'Guia completo das Marcas do Quasar — de Flare a Zenith.',
   'As Marcas do Quasar (Mark of Quasar) são a terceira e última família do Mundo 2 — o ápice da progressão em Immortality Incremental.

## Tiers

| Tier | Nome | Qi | Luck | Stars | Nebulae | Karma | Remnants | Quasar | Mark Bulk | Mark Luck |
|------|------|----|------|-------|---------|-------|----------|--------|-----------|-----------|
| 1 | Flare | x12K | — | — | — | — | — | x450 | — | — |
| 2 | Vanta | — | x12K | — | x24 | x6K | — | x198 | — | — |
| 3 | Sear | x18K | — | x72 | — | x4.5K | — | x168 | x4.5 | — |
| 4 | Halo | x4.5K | — | — | — | x9K | — | x198 | — | x2.25 |
| 5 | Lumen | x9K | x4.5K | — | — | — | — | x222 | x18 | — |
| 6 | Surge | x4.8K | — | — | — | — | x4.5 | x390 | — | — |
| 7 | Corona | x4.5K | x4.5K | — | — | x3K | — | x180 | — | — |
| 8 | Zenith | x12K | — | — | — | — | — | x360 | x4.5 | x6 |

## Dicas
- Quasar é o endgame — os requisitos de Qi chegam a x18K.
- **Sear** exige mais Qi que qualquer outra Mark (x18K).
- **Surge** tem o maior multiplicador de Quasar puro (x390).
- **Zenith** é a Mark final: combine Mark Bulk x4.5 com Mark Luck x6.',
   ARRAY['quasar', 'guia', 'mundo-2']
  ),

  -- Article 9: Guia de Progressão Mundo 1
  ('Guia de Progressão — Mundo 1',
   'Rota ideal para progredir no Mundo 1: da primeira Mark até o desbloqueio do Mundo 2.',
   '# Guia de Progressão — Mundo 1

## Fase 1: Início (Insight 1-3)
Comece com as Marcas de Insight mais básicas:
1. **Dim** — farme Luck básico
2. **Aware** — desbloqueia Qi e Insight
3. **Keen** — dobra sua sorte e percepção

## Fase 2: Expansão (Insight 4-6 + Essence)
4. **Clear** — primeiro contato com Essência
5. **Fragment/Shard** — Essência dispara
6. **Piercing/Deepseeing** — Soulfire entra em cena

## Fase 3: Meio de jogo (Soulfire + Karma)
7. **Mote/Pyre** — Soulfire acelera seu progresso
8. **Trace/Ledger** — Karma começa a girar
9. **Farsight/Truesight** — preparação para o endgame do Mundo 1

## Fase 4: Endgame do Mundo 1
10. **Samsara/Nirvana** — grind pesado de Qi (18.75K)
11. **Omniscience/Eternal/Soulnova** — ápice do Mundo 1

## Checklist para transição ao Mundo 2
- [ ] Omniscience (Mark of Insight)
- [ ] Eternal (Mark of Essence)
- [ ] Soulnova (Mark of Soulfire)
- [ ] Nirvana (Mark of Karma)
- [ ] Mark Bulk e Mark Speed razoáveis',
   ARRAY['progressão', 'guia', 'mundo-1', 'iniciante']
  ),

  -- Article 10: Guia de Progressão Mundo 2
  ('Guia de Progressão — Mundo 2',
   'Rota ideal para progredir no Mundo 2: das Estrelas ao Zênite.',
   '# Guia de Progressão — Mundo 2

## Fase 1: Chegada ao Mundo 2
1. **Spark** — primeira Mark de Stars (x600 Luck)
2. **Stardust** — x600 Qi + x18 Stars
3. **Astral/Comet** — multiplicadores disparam para milhares

## Fase 2: Nebulosas
4. **Mistglow** — prepare-se para grind de Karma (x4.5K)
5. **Gasveil/Starseed** — balance entre Stars e Nebulae
6. **Moonwake** — ponto de virada: x60 Stars + x30 Nebulae

## Fase 3: Quasar — Endgame
7. **Flare** — primeira Mark de Quasar (x450)
8. **Vanta/Sear** — requisitos sobem para 12-18K Qi
9. **Surge** — maior Quasar puro (x390)
10. **Zenith** — a Mark final

## Dicas para Endgame
- Foque em Mark Speed para加速 o grind.
- Mark Bulk aumenta a eficiência de todas as outras Marcas.
- Mark Luck é raro mas poderoso — aparece apenas em Omniscience, Soulnova, Halo e Zenith.',
   ARRAY['progressão', 'guia', 'mundo-2', 'endgame']
  ),

  -- Article 11: Tier List
  ('Tier List — Melhores Marcas',
   'Ranking das Marcas mais poderosas e eficientes de Immortality Incremental.',
   '# Tier List — Melhores Marcas

## S-Tier (Absurdamente Poderosas)
| Mark | Motivo |
|------|--------|
| **Omniscience** (Insight) | Multiplicadores em tudo: Qi, Luck, Insight, Essência, Soulfire, Remnants, bulk, speed |
| **Eternal** (Essence) | x449.5 Essência + Stars, Soulfire, bulk e speed |
| **Soulnova** (Soulfire) | x91 Soulfire + bulk, speed e Mark Luck |
| **Nirvana** (Karma) | Karma x19 + Stars x4 — porta para o Mundo 2 |
| **Zenith** (Quasar) | Mark Bulk x4.5 + Mark Luck x6 — o ápice |

## A-Tier (Excelentes)
| Mark | Motivo |
|------|--------|
| **Truesight** (Insight) | Primeira Mark com Stars, bulk e speed combinados |
| **Prism** (Essence) | x239.5 Essência + Remnants |
| **Everflame** (Soulfire) | único com Beast Core Chance |
| **Samsara** (Karma) | x18.75K Qi + bulk e speed |
| **Supernova** (Stars) | x22.5 Nebulae + Mark Speed x9 |
| **Surge** (Quasar) | Maior Quasar puro: x390 |

## B-Tier (Boas)
| Mark | Motivo |
|------|--------|
| **Farsight** (Insight) | Altos multiplicadores de Qi e Luck |
| **Nucleus** (Essence) | Essência + Soulfire + Mark Speed |
| **Inferno** (Soulfire) | Soulfire + Remnants + bulk |
| **Moonwake** (Nebulae) | Bom equilíbrio entre Stars, Nebulae e Speed |

## C-Tier (Situacionais)
| Mark | Motivo |
|------|--------|
| **Piercing** (Insight) | Decente mas superado rápido |
| **Ruby** (Essence) | Essência OK sem bônus extras |
| **Comet** (Stars) | Mark Bulk alto mas sem outros bônus |

## D-Tier (Iniciais)
| Mark | Motivo |
|------|--------|
| **Dim** (Insight) | Apenas Luck — serve como porta de entrada |
| **Trace** (Karma) | Multiplicadores muito baixos |
| **Spark** (Stars) | Apenas Luck e Stars — início do Mundo 2 |',
   ARRAY['tier-list', 'ranking', 'melhores']
  ),

  -- Article 12: Sistema de Crafting e Evolução
  ('Sistema de Crafting e Evolução',
   'Entenda como funciona o sistema de criação e evolução de Marcas em Immortality Incremental.',
   '# Sistema de Crafting e Evolução

## Como Funciona
Cada Mark é criada a partir de recursos brutos (Qi, Luck, Essência, etc.). Ao craftar uma Mark, você ganha multiplicadores permanentes que aumentam sua coleta de recursos.

## Mecânica Básica
1. **Colete recursos** — Qi, Luck, Insight, Essência, Soulfire, Karma
2. **Crafte a Mark** — consuma os recursos para criar o tier
3. **Ganhe bônus** — a Mark concede multiplicadores passivos
4. **Repita** — use os bônus para coletar mais recursos e craftar o próximo tier

## Tipos de Multiplicadores

### Recursos Primários
- **Qi** — recurso base, presente em quase todas as Marcas
- **Luck** — aumenta sorte de drops e eventos
- **Insight** — desbloqueia percepção e novas receitas
- **Essência** — recurso de crafting avançado
- **Soulfire** — fogo da alma, necessário para tiers superiores
- **Karma** — recurso do ciclo cármico

### Recursos Especiais
- **Stars** — recurso do Mundo 2
- **Nebulae** — névoa cósmica do Mundo 2
- **Quasar** — recurso final do jogo
- **Remnants** — fragmentos de Marcas anteriores

### Bônus de Atributo
- **Mark Bulk** — aumenta a eficiência geral
- **Mark Speed** — acelera a coleta e progressão
- **Mark Luck** — aumenta sorte específica de Marcas
- **Beast Core Chance** — chance de obter Beast Cores

## Estratégias Avançadas
1. **Foque em uma família por vez** — complete Insight antes de ir para Essence
2. **Balanceie Mark Bulk e Speed** — bulk aumenta produção, speed acelera cycles
3. **Guarde Remnants** — eles são necessários para os tiers mais altos
4. **Transição para Mundo 2** — só faça quando tiver todas as Marcas do Mundo 1 no mínimo tier 6',
   ARRAY['crafting', 'evolução', 'mecânicas', 'guia']
  );

  -- Insert articles into wiki_articles (skip if any already exist)
  IF NOT EXISTS (SELECT 1 FROM wiki_articles WHERE tenant_id = v_tenant_id LIMIT 1) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    SELECT
      v_tenant_id,
      v_user_id,
      ta.title,
      ta.summary,
      ta.content,
      ta.tags,
      'published',
      lower(regexp_replace(regexp_replace(ta.title, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', 'g'))
    FROM temp_articles ta;
  END IF;

  DROP TABLE IF EXISTS temp_articles;

  -- ============================================================
  -- 9. Landing Page (tenant_pages)
  -- ============================================================
  -- Insert or update landing page
  IF NOT EXISTS (SELECT 1 FROM tenant_pages WHERE tenant_id = v_tenant_id AND page_type = 'landing') THEN
    INSERT INTO tenant_pages (tenant_id, page_type, layout)
    VALUES (
      v_tenant_id,
      'landing',
      '{
        "blocks": [
          {
            "id": "hero-1",
            "type": "hero",
            "config": {
              "title": "Immortality Incremental",
              "subtitle": "Domine as Marcas. Alcance a Imortalidade.",
              "ctaText": "Explorar Marcas",
              "ctaUrl": "/w/immortality-incremental/immortality-incremental-—-visão-geral",
              "backgroundColor": "270 40% 15%"
            }
          },
          {
            "id": "featured-list-1",
            "type": "featured_list",
            "config": {
              "title": "Marcas do Mundo 1",
              "items": [
                {"label": "Mark of Insight", "description": "9 tiers de percepção — de Dim a Omniscience"},
                {"label": "Mark of Essence", "description": "8 tiers de essência pura — de Fragment a Eternal"},
                {"label": "Mark of Soulfire", "description": "8 tiers de fogo da alma — de Mote a Soulnova"},
                {"label": "Mark of Karma", "description": "8 tiers cármicos — de Trace a Nirvana"}
              ]
            }
          },
          {
            "id": "featured-list-2",
            "type": "featured_list",
            "config": {
              "title": "Marcas do Mundo 2",
              "items": [
                {"label": "Mark of Stars", "description": "8 tiers estelares — de Spark a Genesis"},
                {"label": "Mark of Nebulae", "description": "8 tiers cósmicos — de Mistglow a Astral Crown"},
                {"label": "Mark of Quasar", "description": "8 tiers de quasar — de Flare a Zenith"}
              ]
            }
          },
          {
            "id": "rich-text-1",
            "type": "rich_text",
            "config": {
              "title": "Sobre o Jogo",
              "html": "<p>Immortality Incremental é um jogo incremental no Roblox onde você coleta e evolui Marcas místicas para alcançar a imortalidade. Com dois mundos, 7 famílias de Marcas e 57 tiers para dominar, o grind nunca acaba.</p><p>Cada Mark oferece multiplicadores que aceleram sua coleta — quanto mais você sobe, mais rápido fica.</p>"
            }
          }
        ]
      }'::jsonb
    );
  ELSE
    UPDATE tenant_pages SET layout = '{
      "blocks": [
        {
          "id": "hero-1",
          "type": "hero",
          "config": {
            "title": "Immortality Incremental",
            "subtitle": "Domine as Marcas. Alcance a Imortalidade.",
            "ctaText": "Explorar Marcas",
            "ctaUrl": "/w/immortality-incremental/immortality-incremental-—-visão-geral",
            "backgroundColor": "270 40% 15%"
          }
        },
        {
          "id": "featured-list-1",
          "type": "featured_list",
          "config": {
            "title": "Marcas do Mundo 1",
            "items": [
              {"label": "Mark of Insight", "description": "9 tiers de percepção — de Dim a Omniscience"},
              {"label": "Mark of Essence", "description": "8 tiers de essência pura — de Fragment a Eternal"},
              {"label": "Mark of Soulfire", "description": "8 tiers de fogo da alma — de Mote a Soulnova"},
              {"label": "Mark of Karma", "description": "8 tiers cármicos — de Trace a Nirvana"}
            ]
          }
        },
        {
          "id": "featured-list-2",
          "type": "featured_list",
          "config": {
            "title": "Marcas do Mundo 2",
            "items": [
              {"label": "Mark of Stars", "description": "8 tiers estelares — de Spark a Genesis"},
              {"label": "Mark of Nebulae", "description": "8 tiers cósmicos — de Mistglow a Astral Crown"},
              {"label": "Mark of Quasar", "description": "8 tiers de quasar — de Flare a Zenith"}
            ]
          }
        },
        {
          "id": "rich-text-1",
          "type": "rich_text",
          "config": {
            "title": "Sobre o Jogo",
            "html": "<p>Immortality Incremental é um jogo incremental no Roblox onde você coleta e evolui Marcas místicas para alcançar a imortalidade. Com dois mundos, 7 famílias de Marcas e 57 tiers para dominar, o grind nunca acaba.</p><p>Cada Mark oferece multiplicadores que aceleram sua coleta — quanto mais você sobe, mais rápido fica.</p>"
          }
        }
      ]
    }'::jsonb
    WHERE tenant_id = v_tenant_id AND page_type = 'landing';
  END IF;

  RAISE NOTICE 'Seed Immortality Incremental concluído com sucesso! Tenant ID: %', v_tenant_id;

END;
$$;

COMMIT;
