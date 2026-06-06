-- ============================================================
-- Seed V2: Immortality Incremental — Correções + Novos Conteúdos
-- Run AFTER seed_immortality_incremental.sql
-- - Adiciona colunas: miasma_mult, ash_mult, laws_mult, etc.
-- - Corrige valores de TODAS as marcas conforme Trello
-- - Adiciona 4 novas famílias: Miasma, Ash, Laws, Reputation
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'immortality-incremental';
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'aymatsu00@gmail.com';

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant immortality-incremental não encontrado. Execute o seed base primeiro.';
  END IF;

  -- ============================================================
  -- 1. Adicionar novas colunas à tabela marks
  -- ============================================================
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS miasma_mult NUMERIC DEFAULT 0;
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS ash_mult NUMERIC DEFAULT 0;
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS laws_mult NUMERIC DEFAULT 0;
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS breakthrough_luck NUMERIC DEFAULT 0;
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS beast_remnants_mult NUMERIC DEFAULT 0;
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS manual_luck NUMERIC DEFAULT 0;
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS damage_mult NUMERIC DEFAULT 0;
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS mark_clone NUMERIC DEFAULT 0;

  -- ============================================================
  -- 2. Limpar marcas antigas (valores corrigidos abaixo)
  -- ============================================================
  DELETE FROM marks WHERE tenant_id = v_tenant_id;

  -- ============================================================
  -- 3. Re-inserir TODAS as marcas com valores corrigidos (Trello)
  -- ============================================================

  -- ========== WORLD 1: Mark of Insight ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance,
    miasma_mult, ash_mult, laws_mult, breakthrough_luck, beast_remnants_mult, manual_luck, damage_mult, mark_clone)
  VALUES
    (v_tenant_id, 'Dim', 'insight-dim', 'O primeiro vislumbre — um lampejo inicial de percepção.', 'insight', 1, 1,
     0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Aware', 'insight-aware', 'Consciência desperta — Qi flui e a percepção se expande.', 'insight', 1, 2,
     16, 1.5, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Keen', 'insight-keen', 'Sentidos aguçados — sorte e intuição se intensificam.', 'insight', 1, 3,
     0, 5, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Clear', 'insight-clear', 'Clareza cristalina — Qi, sorte e essência se alinham.', 'insight', 1, 4,
     40, 7, 3, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Piercing', 'insight-piercing', 'Visão perfurante — atravessa as camadas da realidade.', 'insight', 1, 5,
     75, 8, 0, 2.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Deepseeing', 'insight-deepseeing', 'O olho interior se abre — Soulfire começa a arder.', 'insight', 1, 6,
     150, 0, 4, 0, 2.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Farsight', 'insight-farsight', 'Visão distante — enxerga além do horizonte.', 'insight', 1, 7,
     250, 14, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Truesight', 'insight-truesight', 'A verdade nua — estrelas e bulk se revelam.', 'insight', 1, 8,
     0, 20, 6, 0, 5, 0, 2, 0, 0, 0, 2.5, 2.25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Omniscience', 'insight-omniscience', 'Onisciência — o ápice da percepção total.', 'insight', 1, 9,
     500, 30, 10, 10, 8, 5, 0, 0, 0, 0, 3, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0);

  -- ========== WORLD 1: Mark of Essence ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance,
    miasma_mult, ash_mult, laws_mult, breakthrough_luck, beast_remnants_mult, manual_luck, damage_mult, mark_clone)
  VALUES
    (v_tenant_id, 'Fragment', 'essence-fragment', 'Um fragmento bruto de essência pura.', 'essence', 1, 1,
     10, 55, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Shard', 'essence-shard', 'Estilhaço cristalino — Qi e essência se fundem.', 'essence', 1, 2,
     55, 30, 0, 115, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Node', 'essence-node', 'Nódulo de energia — insight brota do vazio.', 'essence', 1, 3,
     0, 25, 115, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Crest', 'essence-crest', 'Crista reluzente — Qi e sorte canalizam essência.', 'essence', 1, 4,
     12, 58, 0, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Ruby', 'essence-ruby', 'Rubi flamejante — sorte e essência em harmonia.', 'essence', 1, 5,
     0, 40, 0, 42, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Nucleus', 'essence-nucleus', 'Núcleo pulsante — a alma começa a queimar.', 'essence', 1, 6,
     0, 35, 0, 60, 2.5, 0, 0, 0, 0, 0, 0, 1.75, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Prism', 'essence-prism', 'Prisma refrator — essência pura canaliza remanescentes.', 'essence', 1, 7,
     80, 0, 10, 160, 0, 2.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Eternal', 'essence-eternal', 'Eterno — a essência transcende o tempo.', 'essence', 1, 8,
     150, 25, 0, 300, 6, 0, 2, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

  -- ========== WORLD 1: Mark of Soulfire ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance,
    miasma_mult, ash_mult, laws_mult, breakthrough_luck, beast_remnants_mult, manual_luck, damage_mult, mark_clone)
  VALUES
    (v_tenant_id, 'Mote', 'soulfire-mote', 'Uma centelha de alma — o primeiro fogo interior.', 'soulfire', 1, 1,
     10, 0, 0, 8, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Kindling', 'soulfire-kindling', 'Fagulha acende — insight alimenta a chama.', 'soulfire', 1, 2,
     0, 11, 18, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Wraith', 'soulfire-wraith', 'Espectro de fogo — o karma começa a girar.', 'soulfire', 1, 3,
     8, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Pyre', 'soulfire-pyre', 'Pira ardente — velocidade e remanescentes emergem.', 'soulfire', 1, 4,
     0, 18, 0, 0, 10, 4, 0, 0, 0, 0, 0, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Brand', 'soulfire-brand', 'Marca gravada — Qi e karma selados pelo fogo.', 'soulfire', 1, 5,
     35, 20, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Inferno', 'soulfire-inferno', 'Inferno desatado — bulk e caos flamejante.', 'soulfire', 1, 6,
     0, 0, 0, 25, 20, 9, 0, 0, 0, 0, 1.75, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Everflame', 'soulfire-everflame', 'Chama eterna — o fogo que nunca se apaga.', 'soulfire', 1, 7,
     81, 30, 0, 40, 30, 0, 0, 0, 0, 0, 2, 0, 0, 1.25, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Soulnova', 'soulfire-soulnova', 'Supernova da alma — o clímax do fogo interior.', 'soulfire', 1, 8,
     181, 0, 0, 0, 61, 2, 0, 0, 0, 0, 3, 2.5, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0);

  -- ========== WORLD 1: Mark of Karma ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance,
    miasma_mult, ash_mult, laws_mult, breakthrough_luck, beast_remnants_mult, manual_luck, damage_mult, mark_clone)
  VALUES
    (v_tenant_id, 'Trace', 'karma-trace', 'Um traço de karma — o ciclo começa.', 'karma', 1, 1,
     5, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Ledger', 'karma-ledger', 'Livro do karma — dívidas e créditos da alma.', 'karma', 1, 2,
     5, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Burden', 'karma-burden', 'Fardo carregado — o peso das escolhas.', 'karma', 1, 3,
     4, 7, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Mercy', 'karma-mercy', 'Misericórdia — o karma encontra compaixão.', 'karma', 1, 4,
     20, 10, 0, 0, 0, 2, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Balance', 'karma-balance', 'Equilíbrio — todas as forças em harmonia.', 'karma', 1, 5,
     20, 15, 0, 0, 5, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Reckoning', 'karma-reckoning', 'Acerto de contas — o karma cobra seu preço.', 'karma', 1, 6,
     38, 13, 0, 16, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Samsara', 'karma-samsara', 'Samsara — o ciclo infinito de renascimento.', 'karma', 1, 7,
     12500, 125, 0, 0, 0, 0, 0, 0, 3, 0, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Nirvana', 'karma-nirvana', 'Nirvana — a libertação final do ciclo.', 'karma', 1, 8,
     12500, 375, 0, 0, 0, 0, 3, 0, 13, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

  -- ========== WORLD 2: Mark of Stars ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance,
    miasma_mult, ash_mult, laws_mult, breakthrough_luck, beast_remnants_mult, manual_luck, damage_mult, mark_clone)
  VALUES
    (v_tenant_id, 'Spark', 'stars-spark', 'A primeira fagulha estelar no cosmos.', 'stars', 2, 1,
     0, 400, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Stardust', 'stars-stardust', 'Poeira de estrelas — Qi e luz se encontram.', 'stars', 2, 2,
     400, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Astral', 'stars-astral', 'Corpo astral — Qi e sorte em massa crítica.', 'stars', 2, 3,
     1000, 1000, 0, 0, 0, 0, 16, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Comet', 'stars-comet', 'Cometa veloz — bulk máximo em movimento.', 'stars', 2, 4,
     1600, 2000, 0, 0, 0, 0, 20, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Radiant', 'stars-radiant', 'Radiação pura — nebulosas começam a brilhar.', 'stars', 2, 5,
     2400, 2000, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Celestial', 'stars-celestial', 'Corpo celeste — a dança das nebulosas.', 'stars', 2, 6,
     800, 800, 0, 0, 0, 0, 0, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Supernova', 'stars-supernova', 'Supernova — a explosão final de luz.', 'stars', 2, 7,
     600, 1000, 0, 5, 0, 0, 0, 15, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Genesis', 'stars-genesis', 'Gênesis — o nascimento de um novo cosmos.', 'stars', 2, 8,
     2000, 2000, 0, 0, 0, 0, 0, 6, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

  -- ========== WORLD 2: Mark of Nebulae ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance,
    miasma_mult, ash_mult, laws_mult, breakthrough_luck, beast_remnants_mult, manual_luck, damage_mult, mark_clone)
  VALUES
    (v_tenant_id, 'Mistglow', 'nebulae-mistglow', 'Brilho nevoento — karma e névoa cósmica.', 'nebulae', 2, 1,
     0, 2000, 0, 0, 0, 0, 0, 4.6, 3000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Gasveil', 'nebulae-gasveil', 'Véu gasoso — velocidade entre as estrelas.', 'nebulae', 2, 2,
     3000, 4000, 0, 0, 0, 0, 0, 5.4, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Starseed', 'nebulae-starseed', 'Semente estelar — o bulk das nebulosas.', 'nebulae', 2, 3,
     2500, 4800, 0, 0, 0, 0, 12, 6, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Moonwake', 'nebulae-moonwake', 'Despertar lunar — karma e estrelas em dança.', 'nebulae', 2, 4,
     1600, 1600, 0, 0, 0, 0, 40, 20, 1500, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Cometheart', 'nebulae-cometheart', 'Coração de cometa — bulk nebuloso extremo.', 'nebulae', 2, 5,
     2400, 2000, 0, 0, 0, 0, 0, 40, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Voidpetal', 'nebulae-voidpetal', 'Pétala do vazio — estrelas e névoa eterna.', 'nebulae', 2, 6,
     1000, 1000, 0, 0, 0, 0, 20, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Novashard', 'nebulae-novashard', 'Estilhaço de nova — essência e velocidade.', 'nebulae', 2, 7,
     300, 500, 0, 10, 0, 0, 0, 5, 100, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Astral Crown', 'nebulae-astral-crown', 'Coroa Astral — a majestade das nebulosas.', 'nebulae', 2, 8,
     2000, 1000, 0, 0, 0, 0, 0, 20, 300, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

  -- ========== WORLD 2: Mark of Quasar ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance,
    miasma_mult, ash_mult, laws_mult, breakthrough_luck, beast_remnants_mult, manual_luck, damage_mult, mark_clone)
  VALUES
    (v_tenant_id, 'Flare', 'quasar-flare', 'Erupção de quasar — a primeira chama cósmica.', 'quasar', 2, 1,
     8000, 0, 0, 0, 0, 0, 0, 0, 0, 300, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Vanta', 'quasar-vanta', 'Vanta — escuridão que consome a luz.', 'quasar', 2, 2,
     0, 8000, 0, 0, 0, 0, 0, 16, 4000, 132, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Sear', 'quasar-sear', 'Chama abrasadora — bulk e estrelas queimam.', 'quasar', 2, 3,
     12000, 0, 0, 0, 0, 0, 48, 0, 3000, 112, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Halo', 'quasar-halo', 'Auréola de quasar — sorte e karma celestiais.', 'quasar', 2, 4,
     3000, 0, 0, 0, 0, 0, 0, 0, 6000, 132, 0, 0, 1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Lumen', 'quasar-lumen', 'Lumen — bulk máximo de luz e sorte.', 'quasar', 2, 5,
     6000, 3000, 0, 0, 0, 0, 0, 0, 0, 148, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Surge', 'quasar-surge', 'Onda de choque — remanescentes e poder bruto.', 'quasar', 2, 6,
     3200, 0, 0, 0, 0, 3, 0, 0, 0, 260, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Corona', 'quasar-corona', 'Coroa solar — o esplendor final do quasar.', 'quasar', 2, 7,
     3000, 3000, 0, 0, 0, 0, 0, 0, 2000, 120, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Zenith', 'quasar-zenith', 'Zênite — o ponto mais alto do cosmos.', 'quasar', 2, 8,
     8000, 0, 0, 0, 0, 0, 0, 0, 0, 240, 3, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0);

  -- ========== WORLD 2: Mark of Miasma (NOVA) ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance,
    miasma_mult, ash_mult, laws_mult, breakthrough_luck, beast_remnants_mult, manual_luck, damage_mult, mark_clone)
  VALUES
    (v_tenant_id, 'Spore', 'miasma-spore', 'Primeiros esporos — miasma primordial emerge das profundezas.', 'miasma', 2, 1,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 56, 0, 18, 0, 0, 32, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Seed', 'miasma-seed', 'Semente de miasma — sorte breakthrough brota do caos.', 'miasma', 2, 2,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 48, 0, 0, 8000, 0, 0, 0, 0),
    (v_tenant_id, 'Rotbrand', 'miasma-rotbrand', 'Marca podre — Qi e estrelas corrompidas pelo miasma.', 'miasma', 2, 3,
     128000, 0, 0, 0, 0, 0, 512, 0, 0, 0, 0, 0, 0, 0, 86, 0, 0, 0, 0, 2, 0, 0),
    (v_tenant_id, 'Vein', 'miasma-vein', 'Veias de miasma — dano e breakthrough em fluxo sombrio.', 'miasma', 2, 4,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 144, 0, 0, 256000, 0, 0, 2, 0),
    (v_tenant_id, 'Bloom', 'miasma-bloom', 'Florescimento macabro — remanescentes bestiais e Qi convergem.', 'miasma', 2, 5,
     336000, 0, 0, 0, 0, 0, 128, 0, 0, 0, 0, 0, 2, 0, 56, 0, 0, 0, 12, 0, 0, 0),
    (v_tenant_id, 'Wormmoon', 'miasma-wormmoon', 'Lua vermicular — Qi e breakthrough em escala maciça.', 'miasma', 2, 6,
     4800000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 72, 0, 0, 4800000, 0, 0, 0, 0),
    (v_tenant_id, 'Tombmire', 'miasma-tombmire', 'Pântano tumular — velocidade e bulk em terreno corrompido.', 'miasma', 2, 7,
     1200000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 0, 0, 20, 0, 0, 1600000, 0, 0, 0, 0),
    (v_tenant_id, 'Abyssplague', 'miasma-abyssplague', 'Praga abissal — o auge da corrupção miasmática.', 'miasma', 2, 8,
     12000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 12000000, 0, 2, 0, 0);

  -- ========== WORLD 2: Mark of Ash (NOVA) ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance,
    miasma_mult, ash_mult, laws_mult, breakthrough_luck, beast_remnants_mult, manual_luck, damage_mult, mark_clone)
  VALUES
    (v_tenant_id, 'Cinder', 'ash-cinder', 'Brasa inicial — cinzas da criação começam a brilhar.', 'ash', 2, 1,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Smolder', 'ash-smolder', 'Fumaceira — miasma e cinzas em combustão lenta.', 'ash', 2, 2,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 1000, 0, 0, 0, 0, 16, 16, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Soot', 'ash-soot', 'Fuligem — dano físico emerge das cinzas.', 'ash', 2, 3,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 0, 0, 0, 0, 2, 0),
    (v_tenant_id, 'Ember', 'ash-ember', 'Brasa viva — remanescentes bestiais e bulk em harmonia.', 'ash', 2, 4,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0),
    (v_tenant_id, 'Pyre', 'ash-pyre', 'Pira de cinzas — breakthrough e Qi alimentam o fogo.', 'ash', 2, 5,
     9600000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 0, 9600000, 0, 0, 0, 0),
    (v_tenant_id, 'Ashveil', 'ash-ashveil', 'Véu de cinzas — miasma e quasar velados pelas cinzas.', 'ash', 2, 6,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 256, 0, 0, 0, 0, 256, 96, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Charfall', 'ash-charfall', 'Chuva de carvão — dano bruto e núcleos bestiais.', 'ash', 2, 7,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 12, 0, 7, 0),
    (v_tenant_id, 'Hollowflame', 'ash-hollowflame', 'Chama oca — o ápice do poder das cinzas.', 'ash', 2, 8,
     128000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 256, 0, 128000000, 0, 0, 0, 0);

  -- ========== WORLD 2: Mark of Laws (NOVA) ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance,
    miasma_mult, ash_mult, laws_mult, breakthrough_luck, beast_remnants_mult, manual_luck, damage_mult, mark_clone)
  VALUES
    (v_tenant_id, 'Edict', 'laws-edict', 'Edito primordial — as primeiras leis do cosmos.', 'laws', 2, 1,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 7.5, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Clause', 'laws-clause', 'Cláusula universal — bulk amplificado pelos decretos.', 'laws', 2, 2,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4.5, 0, 0, 0, 0, 0, 11.5, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Verdict', 'laws-verdict', 'Veredito cósmico — Qi, essência e insight julgados.', 'laws', 2, 3,
     512000000, 0, 1000000000, 1000000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11.5, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Tribunal', 'laws-tribunal', 'Tribunal eterno — sorte e velocidade sob julgamento.', 'laws', 2, 4,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2.75, 2.5, 0, 0, 0, 7.5, 0, 0, 2, 0, 0),
    (v_tenant_id, 'Mandate', 'laws-mandate', 'Mandato divino — soulfire e karma como leis absolutas.', 'laws', 2, 5,
     0, 0, 0, 0, 1000000000, 0, 0, 0, 1000000000, 0, 0, 0, 0, 0, 0, 0, 17.5, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Decree', 'laws-decree', 'Decreto estelar — nebulosas e estrelas obedecem.', 'laws', 2, 6,
     0, 0, 0, 0, 0, 0, 1000000000, 1000000000, 0, 0, 4, 32.5, 0, 0, 0, 0, 7.5, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Statute', 'laws-statute', 'Estatuto infinito — Qi e luck em proporções legais.', 'laws', 2, 7,
     5000000000, 4000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22.5, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Absolute', 'laws-absolute', 'Absoluto — a lei final do cosmos, bulk e velocidade supremos.', 'laws', 2, 8,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 1000000000, 7.5, 7.5, 2, 0, 0, 0, 37.5, 0, 0, 0, 0, 0);

  -- ========== WORLD 1: Mark of Reputation (NOVA) ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, stars_mult,
    nebula_mult, karma_mult, quasar_mult, mark_bulk, mark_speed, mark_luck, beast_core_chance,
    miasma_mult, ash_mult, laws_mult, breakthrough_luck, beast_remnants_mult, manual_luck, damage_mult, mark_clone)
  VALUES
    (v_tenant_id, 'Stranger', 'reputation-stranger', 'Desconhecido — os primeiros passos na jornada.', 'reputation', 1, 1,
     100, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Acquaintance', 'reputation-acquaintance', 'Conhecido — insight e essência se entrelaçam.', 'reputation', 1, 2,
     20, 0, 50, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Friend', 'reputation-friend', 'Amigo — soulfire e essência fortalecem laços.', 'reputation', 1, 3,
     0, 0, 0, 100, 150, 0, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Champion', 'reputation-champion', 'Campeão — o ápice da reputação mundana.', 'reputation', 1, 4,
     200, 0, 0, 0, 0, 0, 0, 0, 200, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0),
    (v_tenant_id, 'Legend', 'reputation-legend', 'Lenda — a fama transcende o tempo e o espaço.', 'reputation', 1, 5,
     500, 500, 0, 0, 0, 10, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3);

  RAISE NOTICE 'Seed V2 concluído: marcas corrigidas e expandidas.';
END $$;

COMMIT;
