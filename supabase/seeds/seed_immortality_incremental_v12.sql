-- ============================================================
-- Seed V12: Immortality Incremental — Marcas Refatoradas (NULL + W4/W5)
-- Run AFTER seed_immortality_incremental_v11.sql
-- - Adiciona novas colunas: citizens_mult, faith_mult, divinity_mult,
--   vitality_mult, anima_mult, flora_mult, beast_core_drops, material_drops
-- - Remove colunas com DEFAULT 0 — usa NULL para bônus inexistentes
-- - Re-insere TODAS as marcas com valores atualizados
-- - Adiciona World 4 (Faith, Divinity), World 5 (Vitality, Anima)
-- - Adiciona Secret e Universal marks como registros na tabela
-- - Move Miasma/Ash/Laws de W2 para W3
-- - Adiciona novos tiers: Sanguine (Essence), Covenant (Ash)
-- - Remove Reputation (W1), substitui por Unity (Universal)
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
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS citizens_mult NUMERIC;
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS faith_mult NUMERIC;
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS divinity_mult NUMERIC;
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS vitality_mult NUMERIC;
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS anima_mult NUMERIC;
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS flora_mult NUMERIC;
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS beast_core_drops NUMERIC;
  ALTER TABLE marks ADD COLUMN IF NOT EXISTS material_drops NUMERIC;

  -- ============================================================
  -- 2. Limpar marcas antigas
  -- ============================================================
  DELETE FROM marks WHERE tenant_id = v_tenant_id;

  -- ============================================================
  -- 3. Inserir TODAS as marcas com NULL em vez de 0
  --    Cada INSERT lista APENAS as colunas que têm bônus
  -- ============================================================

  -- ========== WORLD 1: Mark of Insight ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    luck_mult)
  VALUES
    (v_tenant_id, 'Dim', 'insight-dim', 'O primeiro vislumbre — um lampejo inicial de percepção.', 'insight', 1, 1,
     21.25);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult)
  VALUES
    (v_tenant_id, 'Aware', 'insight-aware', 'Consciência desperta — Qi flui e a percepção se expande.', 'insight', 1, 2,
     34.75, 2.12, 3.25);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    luck_mult, insight_mult)
  VALUES
    (v_tenant_id, 'Keen', 'insight-keen', 'Sentidos aguçados — sorte e intuição se intensificam.', 'insight', 1, 3,
     10, 5.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult)
  VALUES
    (v_tenant_id, 'Clear', 'insight-clear', 'Clareza cristalina — Qi, sorte e essência se alinham.', 'insight', 1, 4,
     88.75, 14.5, 5.5, 2.12);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, essence_mult)
  VALUES
    (v_tenant_id, 'Piercing', 'insight-piercing', 'Visão perfurante — atravessa as camadas da realidade.', 'insight', 1, 5,
     167.5, 16.75, 4.38);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, insight_mult, soulfire_mult)
  VALUES
    (v_tenant_id, 'Deepseeing', 'insight-deepseeing', 'O olho interior se abre — Soulfire começa a arder.', 'insight', 1, 6,
     336.25, 7.75, 4.38);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, essence_mult)
  VALUES
    (v_tenant_id, 'Farsight', 'insight-farsight', 'Visão distante — enxerga além do horizonte.', 'insight', 1, 7,
     561.25, 30.25, 7.75);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    luck_mult, insight_mult, soulfire_mult, stars_mult, mark_bulk, mark_speed)
  VALUES
    (v_tenant_id, 'Truesight', 'insight-truesight', 'A verdade nua — estrelas e bulk se revelam.', 'insight', 1, 8,
     43.75, 12.25, 10, 3.5, 4.38, 3.81);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, insight_mult, essence_mult, soulfire_mult, remnants_mult, mark_bulk, mark_luck, mark_speed)
  VALUES
    (v_tenant_id, 'Omniscience', 'insight-omniscience', 'Onisciência — o ápice da percepção total.', 'insight', 1, 9,
     1.12e3::numeric, 66.25, 21.25, 21.25, 16.75, 10, 5.5, 3.25, 5.5);

  -- ========== WORLD 1: Mark of Essence ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult)
  VALUES
    (v_tenant_id, 'Fragment', 'essence-fragment', 'Um fragmento bruto de essência pura.', 'essence', 1, 1,
     44.5, 82);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, essence_mult)
  VALUES
    (v_tenant_id, 'Shard', 'essence-shard', 'Estilhaço cristalino — Qi e essência se fundem.', 'essence', 1, 2,
     82, 44.5, 172);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    luck_mult, insight_mult)
  VALUES
    (v_tenant_id, 'Node', 'essence-node', 'Nódulo de energia — insight brota do vazio.', 'essence', 1, 3,
     37, 172);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, essence_mult)
  VALUES
    (v_tenant_id, 'Crest', 'essence-crest', 'Crista reluzente — Qi e sorte canalizam essência.', 'essence', 1, 4,
     17.5, 86.5, 32.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    luck_mult, essence_mult)
  VALUES
    (v_tenant_id, 'Ruby', 'essence-ruby', 'Rubi flamejante — sorte e essência em harmonia.', 'essence', 1, 5,
     59.5, 62.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    luck_mult, essence_mult, soulfire_mult, mark_speed)
  VALUES
    (v_tenant_id, 'Nucleus', 'essence-nucleus', 'Núcleo pulsante — a alma começa a queimar.', 'essence', 1, 6,
     52, 89.5, 3.25, 2.12);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, insight_mult, essence_mult, remnants_mult)
  VALUES
    (v_tenant_id, 'Prism', 'essence-prism', 'Prisma refrator — essência pura canaliza remanescentes.', 'essence', 1, 7,
     119.5, 14.5, 239.5, 3.25);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, essence_mult, soulfire_mult, stars_mult, mark_bulk, mark_speed)
  VALUES
    (v_tenant_id, 'Eternal', 'essence-eternal', 'Eterno — a essência transcende o tempo.', 'essence', 1, 8,
     224.5, 37, 449.5, 8.5, 2.5, 2.5, 2.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, breakthrough_luck, citizens_mult, divinity_mult, karma_mult)
  VALUES
    (v_tenant_id, 'Sanguine', 'essence-sanguine', 'Sangue vital — a essência se torna vida e divindade.', 'essence', 1, 9,
     2.25e84::numeric, 43.75, 336.25, 55, 1.24e6::numeric);

  -- ========== WORLD 1: Mark of Soulfire ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, essence_mult, soulfire_mult)
  VALUES
    (v_tenant_id, 'Mote', 'soulfire-mote', 'Uma centelha de alma — o primeiro fogo interior.', 'soulfire', 1, 1,
     14.5, 11.5, 2.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    luck_mult, insight_mult, soulfire_mult)
  VALUES
    (v_tenant_id, 'Kindling', 'soulfire-kindling', 'Fagulha acende — insight alimenta a chama.', 'soulfire', 1, 2,
     16, 26.5, 5.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, karma_mult)
  VALUES
    (v_tenant_id, 'Wraith', 'soulfire-wraith', 'Espectro de fogo — o karma começa a girar.', 'soulfire', 1, 3,
     11.5, 2.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    luck_mult, soulfire_mult, remnants_mult, mark_speed)
  VALUES
    (v_tenant_id, 'Pyre', 'soulfire-pyre', 'Pira ardente — velocidade e remanescentes emergem.', 'soulfire', 1, 4,
     26.5, 14.5, 5.5, 1.75);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, karma_mult)
  VALUES
    (v_tenant_id, 'Brand', 'soulfire-brand', 'Marca gravada — Qi e karma selados pelo fogo.', 'soulfire', 1, 5,
     52, 29.5, 5.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    essence_mult, soulfire_mult, remnants_mult, mark_bulk)
  VALUES
    (v_tenant_id, 'Inferno', 'soulfire-inferno', 'Inferno desatado — bulk e caos flamejante.', 'soulfire', 1, 6,
     37, 29.5, 13, 2.12);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, essence_mult, soulfire_mult, beast_core_chance, mark_bulk)
  VALUES
    (v_tenant_id, 'Everflame', 'soulfire-everflame', 'Chama eterna — o fogo que nunca se apaga.', 'soulfire', 1, 7,
     121, 44.5, 59.5, 44.5, 1.38, 2.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, soulfire_mult, remnants_mult, mark_bulk, mark_luck, mark_speed)
  VALUES
    (v_tenant_id, 'Soulnova', 'soulfire-soulnova', 'Supernova da alma — o clímax do fogo interior.', 'soulfire', 1, 8,
     271, 91, 2.5, 4, 2.5, 3.25);

  -- ========== WORLD 1: Mark of Karma ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, karma_mult)
  VALUES
    (v_tenant_id, 'Trace', 'karma-trace', 'Um traço de karma — o ciclo começa.', 'karma', 1, 1,
     7, 7);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, soulfire_mult, karma_mult)
  VALUES
    (v_tenant_id, 'Ledger', 'karma-ledger', 'Livro do karma — dívidas e créditos da alma.', 'karma', 1, 2,
     7, 5.5, 5.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, karma_mult)
  VALUES
    (v_tenant_id, 'Burden', 'karma-burden', 'Fardo carregado — o peso das escolhas.', 'karma', 1, 3,
     5.5, 10, 5.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, karma_mult, remnants_mult)
  VALUES
    (v_tenant_id, 'Mercy', 'karma-mercy', 'Misericórdia — o karma encontra compaixão.', 'karma', 1, 4,
     29.5, 14.5, 8.5, 2.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, soulfire_mult, karma_mult)
  VALUES
    (v_tenant_id, 'Balance', 'karma-balance', 'Equilíbrio — todas as forças em harmonia.', 'karma', 1, 5,
     29.5, 22, 7, 2.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, essence_mult, karma_mult)
  VALUES
    (v_tenant_id, 'Reckoning', 'karma-reckoning', 'Acerto de contas — o karma cobra seu preço.', 'karma', 1, 6,
     56.5, 19, 23.5, 2.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, karma_mult, mark_bulk, mark_speed)
  VALUES
    (v_tenant_id, 'Samsara', 'karma-samsara', 'Samsara — o ciclo infinito de renascimento.', 'karma', 1, 7,
     1.875e4::numeric, 187, 4, 4, 2.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, karma_mult, stars_mult, mark_bulk)
  VALUES
    (v_tenant_id, 'Nirvana', 'karma-nirvana', 'Nirvana — a libertação final do ciclo.', 'karma', 1, 8,
     1.875e4::numeric, 562, 19, 4, 2.5);

  -- ========== WORLD 2: Mark of Stars ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    luck_mult, stars_mult)
  VALUES
    (v_tenant_id, 'Spark', 'stars-spark', 'A primeira fagulha estelar no cosmos.', 'stars', 2, 1,
     600, 7.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, stars_mult)
  VALUES
    (v_tenant_id, 'Stardust', 'stars-stardust', 'Poeira de estrelas — Qi e luz se encontram.', 'stars', 2, 2,
     600, 18);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, stars_mult, mark_bulk)
  VALUES
    (v_tenant_id, 'Astral', 'stars-astral', 'Corpo astral — Qi e sorte em massa crítica.', 'stars', 2, 3,
     1500, 1500, 24, 3);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, stars_mult, mark_bulk)
  VALUES
    (v_tenant_id, 'Comet', 'stars-comet', 'Cometa veloz — bulk máximo em movimento.', 'stars', 2, 4,
     2400, 3000, 30, 10.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, nebula_mult)
  VALUES
    (v_tenant_id, 'Radiant', 'stars-radiant', 'Radiação pura — nebulosas começam a brilhar.', 'stars', 2, 5,
     3600, 3000, 3);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, nebula_mult)
  VALUES
    (v_tenant_id, 'Celestial', 'stars-celestial', 'Corpo celeste — a dança das nebulosas.', 'stars', 2, 6,
     1200, 1200, 2.25);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, essence_mult, nebula_mult, mark_speed)
  VALUES
    (v_tenant_id, 'Supernova', 'stars-supernova', 'Supernova — a explosão final de luz.', 'stars', 2, 7,
     900, 1500, 7.5, 22.5, 9);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, nebula_mult, mark_bulk)
  VALUES
    (v_tenant_id, 'Genesis', 'stars-genesis', 'Gênesis — o nascimento de um novo cosmos.', 'stars', 2, 8,
     3000, 3000, 9, 3);

  -- ========== WORLD 2: Mark of Nebulae ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    luck_mult, karma_mult, nebula_mult)
  VALUES
    (v_tenant_id, 'Mistglow', 'nebulae-mistglow', 'Brilho nevoento — karma e névoa cósmica.', 'nebulae', 2, 1,
     3000, 4500, 6.9);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, nebula_mult, mark_speed)
  VALUES
    (v_tenant_id, 'Gasveil', 'nebulae-gasveil', 'Véu gasoso — velocidade entre as estrelas.', 'nebulae', 2, 2,
     4500, 6000, 8.1, 7.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, stars_mult, nebula_mult, mark_bulk)
  VALUES
    (v_tenant_id, 'Starseed', 'nebulae-starseed', 'Semente estelar — o bulk das nebulosas.', 'nebulae', 2, 3,
     3750, 7200, 18, 9, 3);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, karma_mult, stars_mult, nebula_mult, mark_speed)
  VALUES
    (v_tenant_id, 'Moonwake', 'nebulae-moonwake', 'Despertar lunar — karma e estrelas em dança.', 'nebulae', 2, 4,
     2400, 2400, 2.25, 60, 30, 9);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, nebula_mult, mark_bulk)
  VALUES
    (v_tenant_id, 'Cometheart', 'nebulae-cometheart', 'Coração de cometa — bulk nebuloso extremo.', 'nebulae', 2, 5,
     3600, 3000, 60, 12);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, stars_mult, nebula_mult)
  VALUES
    (v_tenant_id, 'Voidpetal', 'nebulae-voidpetal', 'Pétala do vazio — estrelas e névoa eterna.', 'nebulae', 2, 6,
     1500, 1500, 30, 30);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, essence_mult, karma_mult, nebula_mult, mark_speed)
  VALUES
    (v_tenant_id, 'Novashard', 'nebulae-novashard', 'Estilhaço de nova — essência e velocidade.', 'nebulae', 2, 7,
     450, 750, 15, 150, 7.5, 6);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, karma_mult, nebula_mult, mark_bulk)
  VALUES
    (v_tenant_id, 'Astral Crown', 'nebulae-astral-crown', 'Coroa Astral — a majestade das nebulosas.', 'nebulae', 2, 8,
     3000, 1500, 450, 30, 4.5);

  -- ========== WORLD 2: Mark of Quasar ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, quasar_mult)
  VALUES
    (v_tenant_id, 'Flare', 'quasar-flare', 'Erupção de quasar — a primeira chama cósmica.', 'quasar', 2, 1,
     1.2e4::numeric, 450);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    luck_mult, karma_mult, nebula_mult, quasar_mult)
  VALUES
    (v_tenant_id, 'Vanta', 'quasar-vanta', 'Vanta — escuridão que consome a luz.', 'quasar', 2, 2,
     1.2e4::numeric, 6000, 24, 198);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, karma_mult, stars_mult, quasar_mult, mark_bulk)
  VALUES
    (v_tenant_id, 'Sear', 'quasar-sear', 'Chama abrasadora — bulk e estrelas queimam.', 'quasar', 2, 3,
     1.8e4::numeric, 4500, 72, 168, 4.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, karma_mult, quasar_mult, mark_luck)
  VALUES
    (v_tenant_id, 'Halo', 'quasar-halo', 'Auréola de quasar — sorte e karma celestiais.', 'quasar', 2, 4,
     4500, 9000, 198, 2.25);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, quasar_mult, mark_bulk)
  VALUES
    (v_tenant_id, 'Lumen', 'quasar-lumen', 'Lumen — bulk máximo de luz e sorte.', 'quasar', 2, 5,
     9000, 4500, 222, 18);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, remnants_mult, quasar_mult)
  VALUES
    (v_tenant_id, 'Surge', 'quasar-surge', 'Onda de choque — remanescentes e poder bruto.', 'quasar', 2, 6,
     4800, 4.5, 390);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, karma_mult, quasar_mult)
  VALUES
    (v_tenant_id, 'Corona', 'quasar-corona', 'Coroa solar — o esplendor final do quasar.', 'quasar', 2, 7,
     4500, 4500, 3000, 180);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, quasar_mult, mark_bulk, mark_luck)
  VALUES
    (v_tenant_id, 'Zenith', 'quasar-zenith', 'Zênite — o ponto mais alto do cosmos.', 'quasar', 2, 8,
     1.2e4::numeric, 360, 4.5, 6);

  -- ========== WORLD 3: Mark of Miasma ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    quasar_mult, miasma_mult, mark_speed)
  VALUES
    (v_tenant_id, 'Spore', 'miasma-spore', 'Primeiros esporos — miasma primordial emerge das profundezas.', 'miasma', 3, 1,
     83.5, 47.5, 26.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    luck_mult, miasma_mult, mark_bulk)
  VALUES
    (v_tenant_id, 'Seed', 'miasma-seed', 'Semente de miasma — sorte breakthrough brota do caos.', 'miasma', 3, 2,
     1.2e4::numeric, 71.5, 11.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, stars_mult, miasma_mult, manual_luck)
  VALUES
    (v_tenant_id, 'Rotbrand', 'miasma-rotbrand', 'Marca podre — Qi e estrelas corrompidas pelo miasma.', 'miasma', 3, 3,
     1.92e5::numeric, 768, 129, 3);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    luck_mult, miasma_mult, damage_mult)
  VALUES
    (v_tenant_id, 'Vein', 'miasma-vein', 'Veias de miasma — dano e breakthrough em fluxo sombrio.', 'miasma', 3, 4,
     3.84e5::numeric, 216, 3);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, remnants_mult, stars_mult, miasma_mult, ash_mult, mark_luck)
  VALUES
    (v_tenant_id, 'Bloom', 'miasma-bloom', 'Florescimento macabro — remanescentes bestiais e Qi convergem.', 'miasma', 3, 5,
     5.04e5::numeric, 18, 192, 84, 3.38, 4.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, miasma_mult)
  VALUES
    (v_tenant_id, 'Wormmoon', 'miasma-wormmoon', 'Lua vermicular — Qi e breakthrough em escala maciça.', 'miasma', 3, 6,
     7.2e6::numeric, 7.2e6::numeric, 108);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, miasma_mult, ash_mult, mark_bulk, mark_speed)
  VALUES
    (v_tenant_id, 'Tombmire', 'miasma-tombmire', 'Pântano tumular — velocidade e bulk em terreno corrompido.', 'miasma', 3, 7,
     1.8e6::numeric, 2.4e6::numeric, 30, 6.75, 4.5, 6.75);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, miasma_mult, manual_luck)
  VALUES
    (v_tenant_id, 'Abyssplague', 'miasma-abyssplague', 'Praga abissal — o auge da corrupção miasmática.', 'miasma', 3, 8,
     1.8e7::numeric, 1.8e7::numeric, 48, 4.5);

  -- ========== WORLD 3: Mark of Ash ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    ash_mult)
  VALUES
    (v_tenant_id, 'Cinder', 'ash-cinder', 'Brasa inicial — cinzas da criação começam a brilhar.', 'ash', 3, 1,
     17.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    quasar_mult, miasma_mult, ash_mult)
  VALUES
    (v_tenant_id, 'Smolder', 'ash-smolder', 'Fumaceira — miasma e cinzas em combustão lenta.', 'ash', 3, 2,
     1500, 23.5, 23.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    ash_mult, damage_mult)
  VALUES
    (v_tenant_id, 'Soot', 'ash-soot', 'Fuligem — dano físico emerge das cinzas.', 'ash', 3, 3,
     72, 3);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    remnants_mult, mark_bulk, mark_speed)
  VALUES
    (v_tenant_id, 'Ember', 'ash-ember', 'Brasa viva — remanescentes bestiais e bulk em harmonia.', 'ash', 3, 4,
     36, 4.5, 4.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, ash_mult)
  VALUES
    (v_tenant_id, 'Pyre', 'ash-pyre', 'Pira de cinzas — breakthrough e Qi alimentam o fogo.', 'ash', 3, 5,
     1.44e7::numeric, 1.44e7::numeric, 192);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    quasar_mult, miasma_mult, ash_mult)
  VALUES
    (v_tenant_id, 'Ashveil', 'ash-ashveil', 'Véu de cinzas — miasma e quasar velados pelas cinzas.', 'ash', 3, 6,
     384, 384, 144);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    remnants_mult, beast_core_chance, damage_mult)
  VALUES
    (v_tenant_id, 'Charfall', 'ash-charfall', 'Chuva de carvão — dano bruto e núcleos bestiais.', 'ash', 3, 7,
     18, 3, 10.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, miasma_mult, ash_mult)
  VALUES
    (v_tenant_id, 'Hallowflame', 'ash-hallowflame', 'Chama oca — o ápice do poder das cinzas.', 'ash', 3, 8,
     1.92e8::numeric, 1.92e8::numeric, 144, 384);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, breakthrough_luck, citizens_mult, faith_mult, laws_mult, mark_luck)
  VALUES
    (v_tenant_id, 'Covenant', 'ash-covenant', 'Pacto eterno — aliança entre cinzas e divindade.', 'ash', 3, 9,
     1.125e80::numeric, 9, 11.25, 27, 18, 4.5);

  -- ========== WORLD 3: Mark of Laws ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    laws_mult, mark_speed)
  VALUES
    (v_tenant_id, 'Edict', 'laws-edict', 'Edito primordial — as primeiras leis do cosmos.', 'laws', 3, 1,
     11.5, 2.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    laws_mult, mark_speed)
  VALUES
    (v_tenant_id, 'Clause', 'laws-clause', 'Cláusula universal — bulk amplificado pelos decretos.', 'laws', 3, 2,
     17.5, 7);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, insight_mult, essence_mult, laws_mult)
  VALUES
    (v_tenant_id, 'Verdict', 'laws-verdict', 'Veredito cósmico — Qi, essência e insight julgados.', 'laws', 3, 3,
     768, 1.5e9::numeric, 1.5e9::numeric, 17.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    laws_mult, manual_luck, mark_luck, mark_speed)
  VALUES
    (v_tenant_id, 'Tribunal', 'laws-tribunal', 'Tribunal eterno — sorte e velocidade sob julgamento.', 'laws', 3, 4,
     11.5, 2.5, 3.25, 4);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    soulfire_mult, karma_mult, laws_mult)
  VALUES
    (v_tenant_id, 'Mandate', 'laws-mandate', 'Mandato divino — soulfire e karma como leis absolutas.', 'laws', 3, 5,
     1.5e9::numeric, 1.5e9::numeric, 23.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    stars_mult, nebula_mult, laws_mult, mark_bulk, mark_speed)
  VALUES
    (v_tenant_id, 'Decree', 'laws-decree', 'Decreto estelar — nebulosas e estrelas obedecem.', 'laws', 3, 6,
     1.5e9::numeric, 1.5e9::numeric, 11.5, 5.5, 47.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, laws_mult)
  VALUES
    (v_tenant_id, 'Statute', 'laws-statute', 'Estatuto infinito — Qi e luck em proporções legais.', 'laws', 3, 7,
     7.5e9::numeric, 6e6::numeric, 35.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    quasar_mult, laws_mult, mark_bulk, mark_luck, mark_speed)
  VALUES
    (v_tenant_id, 'Absolute', 'laws-absolute', 'Absoluto — a lei final do cosmos, bulk e velocidade supremos.', 'laws', 3, 8,
     1.5e9::numeric, 53.5, 11.5, 2.5, 11.5);

  -- ========== WORLD 4: Mark of Faith ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    citizens_mult, faith_mult)
  VALUES
    (v_tenant_id, 'Prayer', 'faith-prayer', 'Súplica inicial — a fé começa com uma oração.', 'faith', 4, 1,
     9, 13.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, faith_mult)
  VALUES
    (v_tenant_id, 'Vow', 'faith-vow', 'Voto sagrado — promessa de fé inabalável.', 'faith', 4, 2,
     1.125e68::numeric, 27);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    breakthrough_luck, citizens_mult, faith_mult)
  VALUES
    (v_tenant_id, 'Hymn', 'faith-hymn', 'Hino celestial — cântico que fortalece a alma.', 'faith', 4, 3,
     4.5, 40.5, 54);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, citizens_mult, faith_mult)
  VALUES
    (v_tenant_id, 'Shrine', 'faith-shrine', 'Santuário — morada da fé e da devoção.', 'faith', 4, 4,
     4.5e70::numeric, 90, 123.75);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    breakthrough_luck, faith_mult, mark_speed)
  VALUES
    (v_tenant_id, 'Zeal', 'faith-zeal', 'Zelo ardente — a fé acelera o coração dos devotos.', 'faith', 4, 5,
     13.5, 202.5, 6.75);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    citizens_mult, faith_mult, laws_mult)
  VALUES
    (v_tenant_id, 'Miracle', 'faith-miracle', 'Milagre — a fé manifesta o impossível.', 'faith', 4, 6,
     360, 495, 27);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, breakthrough_luck, faith_mult)
  VALUES
    (v_tenant_id, 'Saint', 'faith-saint', 'Santo — a fé transcende a mortalidade.', 'faith', 4, 7,
     1.8e77::numeric, 54, 1.12e3::numeric);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, breakthrough_luck, citizens_mult, faith_mult, divinity_mult)
  VALUES
    (v_tenant_id, 'Providence', 'faith-providence', 'Providência — a fé suprema que governa o destino.', 'faith', 4, 8,
     1.125e80::numeric, 180, 2700, 5.62e3::numeric, 4.5);

  -- ========== WORLD 4: Mark of Divinity ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    citizens_mult, divinity_mult)
  VALUES
    (v_tenant_id, 'Sanctum', 'divinity-sanctum', 'Lugar sagrado — a divindade começa no interior.', 'divinity', 4, 1,
     9, 13.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, divinity_mult)
  VALUES
    (v_tenant_id, 'Seraph', 'divinity-seraph', 'Serafim — mensageiro da luz divina.', 'divinity', 4, 2,
     1.125e68::numeric, 27);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    breakthrough_luck, citizens_mult, divinity_mult)
  VALUES
    (v_tenant_id, 'Numen', 'divinity-numen', 'Numem — presença divina que abençoa os fiéis.', 'divinity', 4, 3,
     4.5, 40.5, 54);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, citizens_mult, divinity_mult)
  VALUES
    (v_tenant_id, 'Aureole', 'divinity-aureole', 'Auréola — halo de luz divina.', 'divinity', 4, 4,
     4.5e70::numeric, 90, 123.75);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    breakthrough_luck, divinity_mult, mark_speed)
  VALUES
    (v_tenant_id, 'Elysium', 'divinity-elysium', 'Elísio — o paraíso dos eleitos.', 'divinity', 4, 5,
     13.5, 202.5, 6.75);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    citizens_mult, divinity_mult, laws_mult)
  VALUES
    (v_tenant_id, 'Empyrean', 'divinity-empyrean', 'Empíreo — a mais alta esfera divina.', 'divinity', 4, 6,
     360, 495, 27);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, breakthrough_luck, divinity_mult)
  VALUES
    (v_tenant_id, 'Theurgy', 'divinity-theurgy', 'Teurgia — poder divino canalizado pelos mortais.', 'divinity', 4, 7,
     1.8e77::numeric, 54, 1.12e3::numeric);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, breakthrough_luck, citizens_mult, divinity_mult)
  VALUES
    (v_tenant_id, 'Benediction', 'divinity-benediction', 'Bênção — a graça divina em sua forma mais pura.', 'divinity', 4, 8,
     1.125e80::numeric, 180, 2700, 5.62e3::numeric);

  -- ========== WORLD 5: Mark of Vitality ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, vitality_mult)
  VALUES
    (v_tenant_id, 'Lifespark', 'vitality-lifespark', 'Centelha de vida — o primeiro sopro de vitalidade.', 'vitality', 5, 1,
     4.5e18::numeric, 13.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    vitality_mult, anima_mult)
  VALUES
    (v_tenant_id, 'Heartroot', 'vitality-heartroot', 'Raiz do coração — vitalidade que gera anima.', 'vitality', 5, 2,
     27, 4.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, breakthrough_luck)
  VALUES
    (v_tenant_id, 'Marrowleaf', 'vitality-marrowleaf', 'Folha medular — essência da vida concentrada.', 'vitality', 5, 3,
     2.25e36::numeric, 6.75);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    vitality_mult, mark_speed)
  VALUES
    (v_tenant_id, 'Pulsebloom', 'vitality-pulsebloom', 'Floração pulsante — vitalidade em movimento.', 'vitality', 5, 4,
     72, 4.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    vitality_mult, anima_mult)
  VALUES
    (v_tenant_id, 'Animabark', 'vitality-animabark', 'Casca de anima — vitalidade que protege a alma.', 'vitality', 5, 5,
     108, 11.25);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, breakthrough_luck, mark_bulk)
  VALUES
    (v_tenant_id, 'Spiritvein', 'vitality-spiritvein', 'Veia espiritual — a conexão entre vida e espírito.', 'vitality', 5, 6,
     2.25e72::numeric, 27, 4.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    vitality_mult, anima_mult, mark_luck)
  VALUES
    (v_tenant_id, 'Verdantheart', 'vitality-verdantheart', 'Coração verdejante — vitalidade abençoada pela sorte.', 'vitality', 5, 7,
     216, 13.5, 4.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, breakthrough_luck, vitality_mult, anima_mult)
  VALUES
    (v_tenant_id, 'Worldseed', 'vitality-worldseed', 'Semente do mundo — a vitalidade que cria mundos.', 'vitality', 5, 8,
     2.25e95::numeric, 72, 576, 18);

  -- ========== WORLD 5: Mark of Anima ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, vitality_mult)
  VALUES
    (v_tenant_id, 'Breathwisp', 'anima-breathwisp', 'Sopro de alma — o primeiro fôlego de anima.', 'anima', 5, 1,
     2.25e30::numeric, 18);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    vitality_mult, anima_mult)
  VALUES
    (v_tenant_id, 'Soulthread', 'anima-soulthread', 'Fio da alma — conexão entre vitalidade e anima.', 'anima', 5, 2,
     36, 4.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, anima_mult, karma_mult)
  VALUES
    (v_tenant_id, 'Karmic Trace', 'anima-karmic-trace', 'Traço kármico — a marca da alma no universo.', 'anima', 5, 3,
     2.25e60::numeric, 6.75, 6.75e6::numeric);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    citizens_mult, vitality_mult, anima_mult)
  VALUES
    (v_tenant_id, 'Auralumen', 'anima-auralumen', 'Luz da aura — anima que ilumina os cidadãos.', 'anima', 5, 4,
     6.75, 72, 9);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, anima_mult, karma_mult)
  VALUES
    (v_tenant_id, 'Animaflow', 'anima-animaflow', 'Fluxo de anima — a corrente da alma em movimento.', 'anima', 5, 5,
     2.25e90::numeric, 13.5, 1.8e7::numeric);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    vitality_mult, anima_mult)
  VALUES
    (v_tenant_id, 'Spiritcore', 'anima-spiritcore', 'Núcleo espiritual — o centro da alma.', 'anima', 5, 6,
     144, 18);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    citizens_mult, divinity_mult, anima_mult, flora_mult, karma_mult)
  VALUES
    (v_tenant_id, 'Florasoul', 'anima-florasoul', 'Alma floral — anima que floresce em divindade.', 'anima', 5, 7,
     13.5, 6.75, 27, 4.5, 5.4e7::numeric);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, vitality_mult, anima_mult, flora_mult, karma_mult)
  VALUES
    (v_tenant_id, 'Worldbreath', 'anima-worldbreath', 'Sopro do mundo — a respiração do cosmos.', 'anima', 5, 8,
     2.25e120::numeric, 288, 36, 9, 1.44e8::numeric);

  -- ========== SECRET MARKS ==========
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, breakthrough_luck, anima_mult, flora_mult)
  VALUES
    (v_tenant_id, 'Insight — Key', 'secret-insight-key', 'Chave do conhecimento — desbloqueia a árvore de upgrades Flora.', 'secret', 0, 1,
     5.12e122::numeric, 512, 1e12::numeric, 15);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, citizens_mult, faith_mult, karma_mult, laws_mult, damage_mult)
  VALUES
    (v_tenant_id, 'Soulfire — Deity', 'secret-soulfire-deity', 'Divindade — o poder supremo da alma de fogo.', 'secret', 0, 2,
     5e27::numeric, 5, 3, 4.5e4::numeric, 30, 3);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    remnants_mult, damage_mult, mark_clone)
  VALUES
    (v_tenant_id, 'Karma — Revenge', 'secret-karma-revenge', 'Vingança — o karma cobra seu preço final.', 'secret', 0, 3,
     2, 1.5, 2);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, miasma_mult, ash_mult, manual_luck, mark_bulk)
  VALUES
    (v_tenant_id, 'Quasar — Apotheosis', 'secret-quasar-apotheosis', 'Apoteose — a ascensão final do quasar.', 'secret', 0, 4,
     1.8e6::numeric, 1.8e6::numeric, 20, 30, 2, 6);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, vitality_mult, anima_mult, beast_core_drops, material_drops)
  VALUES
    (v_tenant_id, 'Ash — Voidcinder', 'secret-ash-voidcinder', 'Cinza do vazio — destruição que gera criação.', 'secret', 0, 5,
     5.12e122::numeric, 256, 8, 2, 2);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, breakthrough_luck)
  VALUES
    (v_tenant_id, 'Laws — Judge', 'secret-laws-judge', 'Juiz — a lei que julga todas as coisas.', 'secret', 0, 6,
     5e67::numeric, 5);

  -- ========== UNIVERSAL MARKS ==========
  -- Mark of Unity
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult)
  VALUES
    (v_tenant_id, 'Stranger', 'unity-stranger', 'Desconhecido — os primeiros passos na união.', 'unity', 0, 1,
     100, 100);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, insight_mult, essence_mult)
  VALUES
    (v_tenant_id, 'Acquaintance', 'unity-acquaintance', 'Conhecido — laços começam a se formar.', 'unity', 0, 2,
     20, 50, 30);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    essence_mult, soulfire_mult, mark_bulk, mark_luck)
  VALUES
    (v_tenant_id, 'Friend', 'unity-friend', 'Amigo — a união fortalece a alma.', 'unity', 0, 3,
     100, 150, 5, 3);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, karma_mult, beast_core_chance, mark_luck)
  VALUES
    (v_tenant_id, 'Champion', 'unity-champion', 'Campeão — o orgulho da comunidade.', 'unity', 0, 4,
     200, 200, 2, 5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    qi_mult, luck_mult, remnants_mult, mark_bulk, mark_speed, mark_clone)
  VALUES
    (v_tenant_id, 'Legend', 'unity-legend', 'Lenda — o nome que ecoa pela eternidade.', 'unity', 0, 5,
     500, 500, 10, 3, 3, 3);

  -- Mark of Confluence
  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    stars_mult, nebula_mult, mark_speed)
  VALUES
    (v_tenant_id, 'Starfarer', 'confluence-starfarer', 'Navegante estelar — explorador dos cosmos.', 'confluence', 0, 1,
     8, 4, 1.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    quasar_mult, miasma_mult, mark_bulk)
  VALUES
    (v_tenant_id, 'Voidcaller', 'confluence-voidcaller', 'Chamado do vazio — poder das profundezas.', 'confluence', 0, 2,
     6, 4, 1.5);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    remnants_mult, ash_mult, damage_mult)
  VALUES
    (v_tenant_id, 'Apostle', 'confluence-apostle', 'Apóstolo — mensageiro da destruição.', 'confluence', 0, 3,
     NULL, NULL, NULL);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    faith_mult, laws_mult, mark_luck)
  VALUES
    (v_tenant_id, 'Lawbinder', 'confluence-lawbinder', 'Ligador de leis — aquele que une as regras do cosmos.', 'confluence', 0, 4,
     NULL, NULL, NULL);

  INSERT INTO marks (tenant_id, name, slug, description, mark_type, world, tier,
    breakthrough_luck, citizens_mult, faith_mult, laws_mult, mark_bulk, mark_speed, mark_clone)
  VALUES
    (v_tenant_id, 'Worldheart', 'confluence-worldheart', 'Coração do mundo — o ápice da confluência universal.', 'confluence', 0, 5,
     5, 5, 5, 8, 2, 2, 3);

  RAISE NOTICE 'Seed V12 concluído: % marcas inseridas com NULL em vez de 0.', (SELECT count(*) FROM marks WHERE tenant_id = v_tenant_id);

  -- ============================================================
  -- 4. Atualizar artigo wiki Famílias de Marcas
  -- ============================================================
  UPDATE wiki_articles SET
    summary = 'Guia completo de todas as famílias de marcas de Immortality Incremental — tiers, bônus e dicas de progressão dos 5 mundos, Secret e Universal.',
    content = '# Famílias de Marcas

## Visão Geral

Immortality Incremental possui **15 famílias de marcas** distribuídas em 5 mundos, além das Secret e Universal marks. Cada família tem seu próprio estilo e bônus — dominar todas é o caminho para a imortalidade.

---

## Mundo 1 — Marcas da Percepção à Alma

### Mark of Insight (9 tiers)

As Marcas da Percepção são a primeira família encontrada no Mundo 1. Focam em multiplicar Qi, Luck e Insight.

1. **Dim** — Luck x21.25
2. **Aware** — Qi x34.75, Luck x2.12, Insight x3.25
3. **Keen** — Luck x10, Insight x5.5
4. **Clear** — Qi x88.75, Luck x14.5, Insight x5.5, Essence x2.12
5. **Piercing** — Qi x167.5, Luck x16.75, Essence x4.38
6. **Deepseeing** — Qi x336.25, Insight x7.75, Soulfire x4.38
7. **Farsight** — Qi x561.25, Luck x30.25, Essence x7.75
8. **Truesight** — Luck x43.75, Insight x12.25, Soulfire x10, Stars x3.5, Mark Bulk x4.38, Mark Speed x3.81
9. **Omniscience** — Qi x1.12K, Luck x66.25, Insight x21.25, Essence x21.25, Soulfire x16.75, Remnants x10, Mark Bulk x5.5, Mark Luck x3.25, Mark Speed x5.5

**Dicas:**
- **Dim** é sua primeira Mark — farme Luck para evoluir.
- **Truesight** é um marco importante: desbloqueia Stars, Mark Bulk e Mark Speed.
- **Omniscience** é o ápice do Mundo 1 para Insight.

---

### Mark of Essence (9 tiers)

As Marcas da Essência são a segunda família do Mundo 1. Oferecem altos multiplicadores de Essência combinados com Qi e Luck.

1. **Fragment** — Qi x44.5, Luck x82
2. **Shard** — Qi x82, Luck x44.5, Essence x172
3. **Node** — Luck x37, Insight x172
4. **Crest** — Qi x17.5, Luck x86.5, Essence x32.5
5. **Ruby** — Luck x59.5, Essence x62.5
6. **Nucleus** — Luck x52, Essence x89.5, Soulfire x3.25, Mark Speed x2.12
7. **Prism** — Qi x119.5, Insight x14.5, Essence x239.5, Remnants x3.25
8. **Eternal** — Qi x224.5, Luck x37, Essence x449.5, Soulfire x8.5, Stars x2.5, Mark Bulk x2.5, Mark Speed x2.5
9. **Sanguine** — Qi x2.25Spvg, Breakthrough Luck x43.75, Citizens x336.25, Divinity x55, Karma x1.24M

---

### Mark of Soulfire (8 tiers)

As Marcas da Alma de Fogo são a terceira família do Mundo 1. Combinam Soulfire com Remnants, Karma e bônus de bulk/velocidade.

1. **Mote** — Qi x14.5, Essence x11.5, Soulfire x2.5
2. **Kindling** — Luck x16, Insight x26.5, Soulfire x5.5
3. **Wraith** — Qi x11.5, Karma x2.5
4. **Pyre** — Luck x26.5, Soulfire x14.5, Remnants x5.5, Mark Speed x1.75
5. **Brand** — Qi x52, Luck x29.5, Karma x5.5
6. **Inferno** — Essence x37, Soulfire x29.5, Remnants x13, Mark Bulk x2.12
7. **Everflame** — Qi x121, Luck x44.5, Essence x59.5, Soulfire x44.5, Beast Core Chance x1.38, Mark Bulk x2.5
8. **Soulnova** — Qi x271, Soulfire x91, Remnants x2.5, Mark Bulk x4, Mark Luck x2.5, Mark Speed x3.25

---

### Mark of Karma (8 tiers)

As Marcas do Karma são a quarta família do Mundo 1. Únicas por terem custos massivos de Qi nos tiers mais altos.

1. **Trace** — Qi x7, Karma x7
2. **Ledger** — Qi x7, Soulfire x5.5, Karma x5.5
3. **Burden** — Qi x5.5, Luck x10, Karma x5.5
4. **Mercy** — Qi x29.5, Luck x14.5, Karma x8.5, Remnants x2.5
5. **Balance** — Qi x29.5, Luck x22, Soulfire x7, Karma x2.5
6. **Reckoning** — Qi x56.5, Luck x19, Essence x23.5, Karma x2.5
7. **Samsara** — Qi x18.75K, Luck x187, Karma x4, Mark Bulk x4, Mark Speed x2.5
8. **Nirvana** — Qi x18.75K, Luck x562, Karma x19, Stars x4, Mark Bulk x2.5

---

## Mundo 2 — Marcas Cósmicas

### Mark of Stars (8 tiers)

As Marcas das Estrelas são a primeira família do Mundo 2. Os multiplicadores saltam para a casa dos milhares.

1. **Spark** — Luck x600, Stars x7.5
2. **Stardust** — Qi x600, Stars x18
3. **Astral** — Qi x1.5K, Luck x1.5K, Stars x24, Mark Bulk x3
4. **Comet** — Qi x2.4K, Luck x3K, Stars x30, Mark Bulk x10.5
5. **Radiant** — Qi x3.6K, Luck x3K, Nebulae x3
6. **Celestial** — Qi x1.2K, Luck x1.2K, Nebulae x2.25
7. **Supernova** — Qi x900, Luck x1.5K, Essence x7.5, Nebulae x22.5, Mark Speed x9
8. **Genesis** — Qi x3K, Luck x3K, Nebulae x9, Mark Bulk x3

---

### Mark of Nebulae (8 tiers)

As Marcas das Nebulosas são a segunda família do Mundo 2. Combinam Karma massivo com Nebulae e Stars.

1. **Mistglow** — Luck x3K, Karma x4.5K, Nebulae x6.9
2. **Gasveil** — Qi x4.5K, Luck x6K, Nebulae x8.1, Mark Speed x7.5
3. **Starseed** — Qi x3.75K, Luck x7.2K, Stars x18, Nebulae x9, Mark Bulk x3
4. **Moonwake** — Qi x2.4K, Luck x2.4K, Karma x2.25, Stars x60, Nebulae x30, Mark Speed x9
5. **Cometheart** — Qi x3.6K, Luck x3K, Nebulae x60, Mark Bulk x12
6. **Voidpetal** — Qi x1.5K, Luck x1.5K, Stars x30, Nebulae x30
7. **Novashard** — Qi x450, Luck x750, Essence x15, Karma x150, Nebulae x7.5, Mark Speed x6
8. **Astral Crown** — Qi x3K, Luck x1.5K, Karma x450, Nebulae x30, Mark Bulk x4.5

---

### Mark of Quasar (8 tiers)

As Marcas do Quasar são a terceira e última família do Mundo 2 — o ápice da progressão base.

1. **Flare** — Qi x12K, Quasar x450
2. **Vanta** — Luck x12K, Karma x6K, Nebulae x24, Quasar x198
3. **Sear** — Qi x18K, Karma x4.5K, Stars x72, Quasar x168, Mark Bulk x4.5
4. **Halo** — Qi x4.5K, Karma x9K, Quasar x198, Mark Luck x2.25
5. **Lumen** — Qi x9K, Luck x4.5K, Quasar x222, Mark Bulk x18
6. **Surge** — Qi x4.8K, Remnants x4.5, Quasar x390
7. **Corona** — Qi x4.5K, Luck x4.5K, Karma x3K, Quasar x180
8. **Zenith** — Qi x12K, Quasar x360, Mark Bulk x4.5, Mark Luck x6

---

## Mundo 3 — Underworld

### Mark of Miasma (8 tiers)

A primeira camada do Underworld. Marca focada em Breakthrough Luck, Miasma e dano.

1. **Spore** — Quasar x83.5, Miasma x47.5, Mark Speed x26.5
2. **Seed** — Luck x12K, Miasma x71.5, Mark Bulk x11.5
3. **Rotbrand** — Qi x192K, Stars x768, Miasma x129, Manual Luck x3
4. **Vein** — Luck x384K, Miasma x216, Damage x3
5. **Bloom** — Qi x504K, Remnants x18, Stars x192, Miasma x84, Ash x3.38, Mark Luck x4.5
6. **Wormmoon** — Qi x7.2M, Luck x7.2M, Miasma x108
7. **Tombmire** — Qi x1.8M, Luck x2.4M, Miasma x30, Ash x6.75, Mark Bulk x4.5, Mark Speed x6.75
8. **Abyssplague** — Qi x18M, Luck x18M, Miasma x48, Manual Luck x4.5

---

### Mark of Ash (9 tiers)

A segunda camada do Underworld. Focada em poder bruto e upgrades de dano.

1. **Cinder** — Ash x17.5
2. **Smolder** — Quasar x1.5K, Miasma x23.5, Ash x23.5
3. **Soot** — Ash x72, Damage x3
4. **Ember** — Remnants x36, Mark Bulk x4.5, Mark Speed x4.5
5. **Pyre** — Qi x14.4M, Luck x14.4M, Ash x192
6. **Ashveil** — Quasar x384, Miasma x384, Ash x144
7. **Charfall** — Remnants x18, Beast Core Chance x3, Damage x10.5
8. **Hallowflame** — Qi x192M, Luck x192M, Miasma x144, Ash x384
9. **Covenant** — Qi x112.5Qivg, Breakthrough Luck x9, Citizens x11.25, Faith x27, Laws x18, Mark Luck x4.5

---

### Mark of Laws (8 tiers)

A família mais poderosa do Underworld. Marcas que manipulam as leis da realidade com multiplicadores astronômicos.

1. **Edict** — Laws x11.5, Mark Speed x2.5
2. **Clause** — Laws x17.5, Mark Speed x7
3. **Verdict** — Qi x768, Insight x1.5B, Essence x1.5B, Laws x17.5
4. **Tribunal** — Laws x11.5, Manual Luck x2.5, Mark Luck x3.25, Mark Speed x4
5. **Mandate** — Soulfire x1.5B, Karma x1.5B, Laws x23.5
6. **Decree** — Stars x1.5B, Nebulae x1.5B, Laws x11.5, Mark Bulk x5.5, Mark Speed x47.5
7. **Statute** — Qi x7.5B, Luck x6M, Laws x35.5
8. **Absolute** — Quasar x1.5B, Laws x53.5, Mark Bulk x11.5, Mark Luck x2.5, Mark Speed x11.5

---

## Mundo 4 — Marcas Divinas

### Mark of Faith (8 tiers)

O poder da crença — a fé move montanhas e multiplica recursos divinos.

1. **Prayer** — Citizens x9, Faith x13.5
2. **Vow** — Qi x112.5Uvg, Faith x27
3. **Hymn** — Breakthrough Luck x4.5, Citizens x40.5, Faith x54
4. **Shrine** — Qi x45Dvg, Citizens x90, Faith x123.75
5. **Zeal** — Breakthrough Luck x13.5, Faith x202.5, Mark Speed x6.75
6. **Miracle** — Citizens x360, Faith x495, Laws x27
7. **Saint** — Qi x180Qavg, Breakthrough Luck x54, Faith x1.12K
8. **Providence** — Qi x112.5Qivg, Breakthrough Luck x180, Citizens x2.7K, Faith x5.62K, Divinity x4.5

---

### Mark of Divinity (8 tiers)

A essência divina — poder celestial que transcende a própria fé.

1. **Sanctum** — Citizens x9, Divinity x13.5
2. **Seraph** — Qi x112.5Uvg, Divinity x27
3. **Numen** — Breakthrough Luck x4.5, Citizens x40.5, Divinity x54
4. **Aureole** — Qi x45Dvg, Citizens x90, Divinity x123.75
5. **Elysium** — Breakthrough Luck x13.5, Divinity x202.5, Mark Speed x6.75
6. **Empyrean** — Citizens x360, Divinity x495, Laws x27
7. **Theurgy** — Qi x180Qavg, Breakthrough Luck x54, Divinity x1.12K
8. **Benediction** — Qi x112.5Qivg, Breakthrough Luck x180, Citizens x2.7K, Divinity x5.62K

---

## Mundo 5 — Marcas da Alma

### Mark of Vitality (8 tiers)

A força vital — vitalidade que sustenta a essência da existência.

1. **Lifespark** — Qi x4.5Qi, Vitality x13.5
2. **Heartroot** — Vitality x27, Anima x4.5
3. **Marrowleaf** — Qi x2.25UdQi, Breakthrough Luck x6.75
4. **Pulsebloom** — Vitality x72, Mark Speed x4.5
5. **Animabark** — Vitality x108, Anima x11.25
6. **Spiritvein** — Qi x2.25Tvg, Breakthrough Luck x27, Mark Bulk x4.5
7. **Verdantheart** — Vitality x216, Anima x13.5, Mark Luck x4.5
8. **Worldseed** — Qi x225Tg, Breakthrough Luck x72, Vitality x576, Anima x18

---

### Mark of Anima (8 tiers)

A alma do mundo — anima que conecta todas as formas de vida.

1. **Breathwisp** — Qi x2.25No, Vitality x18
2. **Soulthread** — Vitality x36, Anima x4.5
3. **Karmic Trace** — Qi x2.25Nod, Anima x6.75, Karma x6.75M
4. **Auralumen** — Citizens x6.75, Vitality x72, Anima x9
5. **Animaflow** — Qi x2.25Novg, Anima x13.5, Karma x18M
6. **Spiritcore** — Vitality x144, Anima x18
7. **Florasoul** — Citizens x13.5, Divinity x6.75, Anima x27, Flora x4.5, Karma x54M
8. **Worldbreath** — Qi x2.25Notg, Vitality x288, Anima x36, Flora x9, Karma x144M

---

## Marcas Secretas

Marcas Secretas são rollables especiais escondidos dentro de marcas regulares. Cada uma concede um bônus único e permanente.

| Marca | Nome | Bônus |
|-------|------|-------|
| **Insight** | Key | x512Notg Qi, Breakthrough Luck x512, Anima x1T, Flora x15, Unlock Flora Upgrade Tree |
| **Soulfire** | Deity | Qi x5Oc, Citizens x5, Faith x3, Karma x45K, Laws x30, Damage x3 |
| **Karma** | Revenge | Remnants x2, Damage x1.5, Mark Clones +2 |
| **Quasar** | Apotheosis | Qi x1.8M, Luck x1.8M, Miasma x20, Ash x30, Manual Luck x2, Mark Bulk x6 |
| **Ash** | Voidcinder | Qi x512Notg, Vitality x256, Anima x8, Beast Core Drops x2, Material Drops x2 |
| **Laws** | Judge | Qi x50Uvg, Breakthrough Luck x5 |

---

## Marcas Universais

Marcas Universais funcionam de forma comunitária: quando qualquer jogador compra uma, **todos os jogadores online** recebem seus bônus.

### Mark of Unity (5 tiers)

| Tier | Nome | Bônus |
|------|------|-------|
| 1 | Stranger | Qi x100, Luck x100 |
| 2 | Acquaintance | Qi x20, Insight x50, Essence x30 |
| 3 | Friend | Essence x100, Soulfire x150, Mark Bulk x5, Mark Luck x3 |
| 4 | Champion | Qi x200, Karma x200, Beast Core Chance x2, Mark Luck x5 |
| 5 | Legend | Qi x500, Luck x500, Remnants x10, Mark Bulk x3, Mark Speed x3, Mark Clone +3 |

### Mark of Confluence (5 tiers)

| Tier | Nome | Bônus |
|------|------|-------|
| 1 | Starfarer | Stars x8, Nebulae x4, Mark Speed x1.5 |
| 2 | Voidcaller | Quasar x6, Miasma x4, Mark Bulk x1.5 |
| 3 | Apostle | *Em breve* |
| 4 | Lawbinder | *Em breve* |
| 5 | Worldheart | Breakthrough Luck x5, Citizens x5, Faith x5, Laws x8, Mark Bulk x2, Mark Speed x2, Mark Clone +3 |

> *Todas as Marks são boostadas pelo Nebulae Upgrade.*
> *Marcas até World 5 concluídas. Valores de W5 são pré-mark boost (serão atualizados).*',
    tags = ARRAY['marcas', 'familias', 'guia', 'world-4', 'world-5']::TEXT[],
    updated_at = now()
  WHERE tenant_id = v_tenant_id AND slug = 'mark-families';

  RAISE NOTICE 'Seed V12 concluído: marcas refatoradas com NULL, artigo mark-families atualizado com W4/W5.';

END $$;

COMMIT;
