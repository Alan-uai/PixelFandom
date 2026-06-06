-- ============================================================
-- Seed V3: Immortality Incremental — Bloodlines, Manuals,
--          Milestones, Secrets, Challenges, Codes, Currencies
-- Run AFTER seed_immortality_incremental.sql and
--       seed_immortality_incremental_v2.sql
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_article_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'immortality-incremental';
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'aymatsu00@gmail.com';

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant immortality-incremental não encontrado. Execute o seed base primeiro.';
  END IF;

  -- ============================================================
  -- Section 1: bloodlines table
  -- ============================================================
  CREATE TABLE IF NOT EXISTS bloodlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT,
    world INTEGER NOT NULL DEFAULT 1,
    tier TEXT NOT NULL DEFAULT 'lesser',
    bonuses TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
  );

  CREATE INDEX IF NOT EXISTS idx_bloodlines_tenant ON bloodlines(tenant_id);

  -- Fix pre-existing table that may lack the unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bloodlines_tenant_id_name_key'
  ) THEN
    ALTER TABLE bloodlines ADD UNIQUE(tenant_id, name);
  END IF;

  ALTER TABLE bloodlines ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "bloodlines_readable" ON bloodlines;
  CREATE POLICY "bloodlines_readable" ON bloodlines FOR SELECT USING (
    (tenant_id IS NULL) OR
    (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = bloodlines.tenant_id AND (tenants.is_public = true OR is_tenant_member(tenants.id))))
  );
  DROP POLICY IF EXISTS "bloodlines_insert" ON bloodlines;
  CREATE POLICY "bloodlines_insert" ON bloodlines FOR INSERT WITH CHECK (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "bloodlines_update" ON bloodlines;
  CREATE POLICY "bloodlines_update" ON bloodlines FOR UPDATE USING (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "bloodlines_delete" ON bloodlines;
  CREATE POLICY "bloodlines_delete" ON bloodlines FOR DELETE USING (is_tenant_member_with_role(tenant_id, 'admin'));

  INSERT INTO tenant_game_tables (tenant_id, table_name, display_label)
  VALUES (v_tenant_id, 'bloodlines', 'Linhagens')
  ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = 'Linhagens';

  INSERT INTO bloodlines (tenant_id, name, world, tier, bonuses, description) VALUES
    -- World 1: Lesser Core Bloodlines (8)
    (v_tenant_id, 'Linhagem do Qi Infinito', 1, 'lesser', 'Qi +50%', 'Uma linhagem focada no fluxo infinito de Qi, permitindo progressão acelerada nas primeiras marcas.'),
    (v_tenant_id, 'Linhagem da Sorte Prospera', 1, 'lesser', 'Luck +50%', 'Aqueles com esta linhagem são abençoados pela sorte, encontrando melhores drops e eventos mais favoráveis.'),
    (v_tenant_id, 'Linhagem da Essência Pura', 1, 'lesser', 'Essence +50%', 'A essência flui mais livremente nesta linhagem, permitindo crafting mais eficiente de marcas de essência.'),
    (v_tenant_id, 'Linhagem da Alma Flamejante', 1, 'lesser', 'Soulfire +50%', 'O fogo da alma queima mais intensamente, acelerando a progressão das marcas de soulfire.'),
    (v_tenant_id, 'Linhagem do Karma Equilibrado', 1, 'lesser', 'Karma +50%', 'O ciclo cármico gira favoravelmente para esta linhagem, acumulando karma com mais facilidade.'),
    (v_tenant_id, 'Linhagem das Estrelas Cadentes', 1, 'lesser', 'Stars +50%', 'As estrelas alinham-se para esta linhagem, facilitando a transição para o segundo mundo.'),
    (v_tenant_id, 'Linhagem da Névoa Eterna', 1, 'lesser', 'Nebulae +50%', 'A névoa cósmica acompanha esta linhagem, revelando os segredos das nebulosas.'),
    (v_tenant_id, 'Linhagem do Quasar Nascente', 1, 'lesser', 'Quasar +50%', 'O poder dos quasares desperta cedo nesta linhagem, preparando o caminho para o poder cósmico.'),
    -- World 3: Greater Core Bloodlines (6)
    (v_tenant_id, 'Linhagem do Miasma Primordial', 3, 'greater', 'Miasma +50%, Dano +25%', 'A corrupção primordial flui nas veias desta linhagem, concedendo poder miasmático e dano aumentado.'),
    (v_tenant_id, 'Linhagem das Cinzas Eternas', 3, 'greater', 'Ash +50%, Bulk +25%', 'Das cinzas surge esta linhagem, oferecendo poder das cinzas e robustez incomparável.'),
    (v_tenant_id, 'Linhagem das Leis Absolutas', 3, 'greater', 'Laws +50%, Speed +25%', 'Esta linhagem manipula as leis da realidade, concedendo velocidade e poder legal.'),
    (v_tenant_id, 'Linhagem do Breakthrough Ilimitado', 3, 'greater', 'Breakthrough Luck +100%', 'Aqueles com esta linhagem rompem barreiras com facilidade, alcançando novos patamares de poder.'),
    (v_tenant_id, 'Linhagem da Besta Interior', 3, 'greater', 'Beast Remnants +100%, Beast Core +50%', 'A besta interior desperta, multiplicando remanescentes bestiais e núcleos.'),
    (v_tenant_id, 'Linhagem do Conhecimento Oculto', 3, 'greater', 'Manual Luck +100%, Clone +25%', 'O conhecimento proibido revela-se a esta linhagem, facilitando a descoberta de manuais e clonagem.')
  ON CONFLICT (tenant_id, name) DO NOTHING;

  -- ============================================================
  -- Section 2: manuals table
  -- ============================================================
  CREATE TABLE IF NOT EXISTS manuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT,
    base_chance TEXT,
    tier INTEGER NOT NULL DEFAULT 1,
    bonuses TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
  );

  -- Fix pre-existing table that may lack the unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'manuals_tenant_id_name_key'
  ) THEN
    ALTER TABLE manuals ADD UNIQUE(tenant_id, name);
  END IF;

  CREATE INDEX IF NOT EXISTS idx_manuals_tenant ON manuals(tenant_id);

  ALTER TABLE manuals ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "manuals_readable" ON manuals;
  CREATE POLICY "manuals_readable" ON manuals FOR SELECT USING (
    (tenant_id IS NULL) OR
    (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = manuals.tenant_id AND (tenants.is_public = true OR is_tenant_member(tenants.id))))
  );
  DROP POLICY IF EXISTS "manuals_insert" ON manuals;
  CREATE POLICY "manuals_insert" ON manuals FOR INSERT WITH CHECK (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "manuals_update" ON manuals;
  CREATE POLICY "manuals_update" ON manuals FOR UPDATE USING (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "manuals_delete" ON manuals;
  CREATE POLICY "manuals_delete" ON manuals FOR DELETE USING (is_tenant_member_with_role(tenant_id, 'admin'));

  INSERT INTO tenant_game_tables (tenant_id, table_name, display_label)
  VALUES (v_tenant_id, 'manuals', 'Manuais')
  ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = 'Manuais';

  INSERT INTO manuals (tenant_id, name, base_chance, tier, bonuses, description) VALUES
    (v_tenant_id, 'Anotações Esfarrapadas de Miasma', '1/1', 1, 'Miasma +2x, Qi +10%', 'Anotações rasgadas e manchadas de miasma. Mesmo ilegíveis, concedem um lampejo de poder miasmático.'),
    (v_tenant_id, 'Manual Desbotado de Miasma', '1/50', 2, 'Miasma +5x, Qi +25%', 'Um manual antigo cujas páginas estão desbotadas pelo tempo. Ensina os fundamentos do miasma.'),
    (v_tenant_id, 'Sutra da Praga Verdejante', '1/250', 3, 'Miasma +10x, Essence +15%', 'Escrito em folhas de árvore corrompidas, este sutra revela o poder da praga verdejante.'),
    (v_tenant_id, 'Codex do Veneno Oco', '1/1.25K', 4, 'Miasma +20x, Dano +10%', 'Um codex que pulsa com veneno oco. Seu toque queima as mãos mas fortalece a alma.'),
    (v_tenant_id, 'Manual Vinculado a Remanescentes', '1/7.5K', 5, 'Miasma +35x, Remnants +15%', 'Suas páginas são feitas de remanescentes de marcas antigas. Um manual para os corajosos.'),
    (v_tenant_id, 'Escritura do Lótus Grave', '1/50K', 6, 'Miasma +50x, Soulfire +20%', 'Dizem que quem ler esta escritura ouvirá os sussurros dos mortos. Grande poder exige grande sacrifício.'),
    (v_tenant_id, 'Grimório do Meridiano do Vazio', '1/350K', 7, 'Miasma +75x, Breakthrough +5%', 'Um grimório que canaliza energia do vazio diretamente para o meridiano espiritual do leitor.'),
    (v_tenant_id, 'Cânone da Estrela Pestilenta', '1/2.5M', 8, 'Miasma +100x, Stars +20%', 'Escrito sob a luz de uma estrela moribunda, este cânone ensina a podridão celestial.'),
    (v_tenant_id, 'Escritura da Praga Eclipse', '1/25M', 9, 'Miasma +150x, Quasar +15%', 'Uma escritura que aparece apenas durante eclipses. Seu poder é tão destrutivo quanto iluminador.'),
    (v_tenant_id, 'Sutra Primordial de Miasma', '1/250M', 10, 'Miasma +250x, Laws +10%', 'O sutra original do miasma primordial. Dizem que foi escrito pela própria entidade da corrupção.'),
    (v_tenant_id, 'Cânone do Imperador do Vazio Cinzento', '1/2.5B', 11, 'Miasma +500x, All Stats +25%', 'O manual supremo. Apenas os mais dedicados conseguem decifrar seus segredos. Dizem que quem o leia torna-se um deus.')
  ON CONFLICT (tenant_id, name) DO NOTHING;

  -- ============================================================
  -- Section 3: milestones table
  -- ============================================================
  CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    name TEXT,
    requirement TEXT,
    reward TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
  );

  CREATE INDEX IF NOT EXISTS idx_milestones_tenant ON milestones(tenant_id);

  ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "milestones_readable" ON milestones;
  CREATE POLICY "milestones_readable" ON milestones FOR SELECT USING (
    (tenant_id IS NULL) OR
    (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = milestones.tenant_id AND (tenants.is_public = true OR is_tenant_member(tenants.id))))
  );
  DROP POLICY IF EXISTS "milestones_insert" ON milestones;
  CREATE POLICY "milestones_insert" ON milestones FOR INSERT WITH CHECK (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "milestones_update" ON milestones;
  CREATE POLICY "milestones_update" ON milestones FOR UPDATE USING (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "milestones_delete" ON milestones;
  CREATE POLICY "milestones_delete" ON milestones FOR DELETE USING (is_tenant_member_with_role(tenant_id, 'admin'));

  INSERT INTO tenant_game_tables (tenant_id, table_name, display_label)
  VALUES (v_tenant_id, 'milestones', 'Marcos')
  ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = 'Marcos';

  INSERT INTO milestones (tenant_id, category, name, requirement, reward) VALUES
    (v_tenant_id, 'karma', 'Karma Inicial', 'Acumule 100 Karma', 'Multiplicador de Karma +2x por 1 minuto'),
    (v_tenant_id, 'karma', 'Karma Intermediário', 'Acumule 10.000 Karma', 'Multiplicador de Karma +5x por 5 minutos'),
    (v_tenant_id, 'karma', 'Karma Avançado', 'Acumule 1.000.000 Karma', 'Multiplicador de Karma +10x por 15 minutos'),
    (v_tenant_id, 'beast', 'Besta Iniciante', 'Derrote 10 Bestas', 'Beast Remnants +2x'),
    (v_tenant_id, 'beast', 'Caçador de Bestas', 'Derrote 1.000 Bestas', 'Beast Core Chance +5%'),
    (v_tenant_id, 'mark_opened', 'Primeira Marca', 'Abra 1 Marca', 'Qi +50% permanente'),
    (v_tenant_id, 'mark_opened', 'Colecionador de Marcas', 'Abra 50 Marcas', 'Mark Speed +2x permanente'),
    (v_tenant_id, 'time_played', 'Jogador Dedicado', 'Jogue por 1 hora', 'Qi +25% permanente'),
    (v_tenant_id, 'time_played', 'Veterano', 'Jogue por 24 horas', 'Multiplicador Global +2x permanente'),
    (v_tenant_id, 'time_played', 'Imortal em Ascensão', 'Jogue por 168 horas (7 dias)', 'Multiplicador Global +5x permanente')
  ON CONFLICT (tenant_id, name) DO NOTHING;

  -- ============================================================
  -- Section 4: secrets table
  -- ============================================================
  CREATE TABLE IF NOT EXISTS secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT,
    requirement TEXT,
    reward TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
  );

  CREATE INDEX IF NOT EXISTS idx_secrets_tenant ON secrets(tenant_id);

  ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "secrets_readable" ON secrets;
  CREATE POLICY "secrets_readable" ON secrets FOR SELECT USING (
    (tenant_id IS NULL) OR
    (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = secrets.tenant_id AND (tenants.is_public = true OR is_tenant_member(tenants.id))))
  );
  DROP POLICY IF EXISTS "secrets_insert" ON secrets;
  CREATE POLICY "secrets_insert" ON secrets FOR INSERT WITH CHECK (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "secrets_update" ON secrets;
  CREATE POLICY "secrets_update" ON secrets FOR UPDATE USING (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "secrets_delete" ON secrets;
  CREATE POLICY "secrets_delete" ON secrets FOR DELETE USING (is_tenant_member_with_role(tenant_id, 'admin'));

  INSERT INTO tenant_game_tables (tenant_id, table_name, display_label)
  VALUES (v_tenant_id, 'secrets', 'Segredos')
  ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = 'Segredos';

  INSERT INTO secrets (tenant_id, name, requirement, reward, description) VALUES
    (v_tenant_id, 'Segredo das Origens', '1 to Max', 'Revela a verdade sobre a origem das Marcas', 'Um segredo antigo enterrado nas profundezas do código do jogo. Descubra a verdadeira natureza das Marcas e sua origem no cosmos. Dizem que quem desvendar este segredo ganha uma compreensão profunda do universo.'),
    (v_tenant_id, 'Segredo do Vazio', '5K to Max', 'Acesso ao poder do Vazio puro', 'O vazio chama por aqueles que se atrevem a ouvir. Este segredo revela como canalizar o poder do nada absoluto, transformando o vazio em uma fonte de poder inimaginável. Apenas os mais dedicados conseguem desvendar seus mistérios.')
  ON CONFLICT (tenant_id, name) DO NOTHING;

  -- ============================================================
  -- Section 5: challenges table
  -- ============================================================
  CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT,
    description TEXT,
    duration TEXT,
    reward TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
  );

  CREATE INDEX IF NOT EXISTS idx_challenges_tenant ON challenges(tenant_id);

  ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "challenges_readable" ON challenges;
  CREATE POLICY "challenges_readable" ON challenges FOR SELECT USING (
    (tenant_id IS NULL) OR
    (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = challenges.tenant_id AND (tenants.is_public = true OR is_tenant_member(tenants.id))))
  );
  DROP POLICY IF EXISTS "challenges_insert" ON challenges;
  CREATE POLICY "challenges_insert" ON challenges FOR INSERT WITH CHECK (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "challenges_update" ON challenges;
  CREATE POLICY "challenges_update" ON challenges FOR UPDATE USING (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "challenges_delete" ON challenges;
  CREATE POLICY "challenges_delete" ON challenges FOR DELETE USING (is_tenant_member_with_role(tenant_id, 'admin'));

  INSERT INTO tenant_game_tables (tenant_id, table_name, display_label)
  VALUES (v_tenant_id, 'challenges', 'Desafios')
  ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = 'Desafios';

  INSERT INTO challenges (tenant_id, name, description, duration, reward) VALUES
    (v_tenant_id, 'Desafio da Progressão Acelerada', 'Um desafio que testa sua capacidade de progredir rapidamente através das marcas. Complete o máximo de tiers possível em tempo limitado para ganhar recompensas exclusivas.', 'Aproximadamente 1 hora', 'Multiplicador Global +3x permanente, Título exclusivo "Acelerado"')
  ON CONFLICT (tenant_id, name) DO NOTHING;

  -- ============================================================
  -- Section 6: codes table
  -- ============================================================
  CREATE TABLE IF NOT EXISTS codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    reward TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, code)
  );

  -- codes table pre-exists from app (created by ensure_game_table);
  -- its columns are: id, tenant_id, name, slug, description, image_url
  -- We need to add code, reward, is_active if missing
  ALTER TABLE codes ADD COLUMN IF NOT EXISTS code TEXT;
  ALTER TABLE codes ADD COLUMN IF NOT EXISTS reward TEXT;
  ALTER TABLE codes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

  -- Fix pre-existing table that may lack the unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'codes_tenant_id_code_key'
  ) THEN
    ALTER TABLE codes ADD UNIQUE(tenant_id, code);
  END IF;

  CREATE INDEX IF NOT EXISTS idx_codes_tenant ON codes(tenant_id);

  ALTER TABLE codes ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "codes_readable" ON codes;
  CREATE POLICY "codes_readable" ON codes FOR SELECT USING (
    (tenant_id IS NULL) OR
    (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = codes.tenant_id AND (tenants.is_public = true OR is_tenant_member(tenants.id))))
  );
  DROP POLICY IF EXISTS "codes_insert" ON codes;
  CREATE POLICY "codes_insert" ON codes FOR INSERT WITH CHECK (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "codes_update" ON codes;
  CREATE POLICY "codes_update" ON codes FOR UPDATE USING (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "codes_delete" ON codes;
  CREATE POLICY "codes_delete" ON codes FOR DELETE USING (is_tenant_member_with_role(tenant_id, 'admin'));

  INSERT INTO tenant_game_tables (tenant_id, table_name, display_label)
  VALUES (v_tenant_id, 'codes', 'Códigos')
  ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = 'Códigos';

  INSERT INTO codes (tenant_id, code, reward, is_active) VALUES
    -- Active codes
    (v_tenant_id, '5MVISITS', 'Qi +5M, Luck +5M', true),
    (v_tenant_id, 'MINI2', 'Recompensa Mini 2', true),
    (v_tenant_id, 'COOLBEANS', 'Qi +1M, Luck +1M', true),
    (v_tenant_id, 'NERF', 'Qi +2M, Luck +2M', true),
    (v_tenant_id, '100KGROUP', 'Qi +100K, Luck +100K', true),
    (v_tenant_id, 'MINI', 'Qi +500K, Luck +500K', true),
    (v_tenant_id, '100KFAV', 'Qi +100K, Luck +100K', true),
    (v_tenant_id, 'HYPE', 'Qi +1M, Luck +1M', true),
    (v_tenant_id, 'ASH', 'Qi +2M, Luck +2M', true),
    (v_tenant_id, '5KCCU', 'Qi +5K, Luck +5K', true),
    (v_tenant_id, '1MVISITS', 'Qi +1M, Luck +1M', true),
    (v_tenant_id, 'HOTFIXING', 'Qi +500K, Luck +500K', true),
    (v_tenant_id, 'EXTRACODE', 'Qi +3M, Luck +3M', true),
    (v_tenant_id, '50KGROUP', 'Qi +50K, Luck +50K', true),
    (v_tenant_id, 'PART1', 'Qi +1M, Luck +1M', true),
    (v_tenant_id, '1KGOATS', 'Qi +1K, Luck +1K', true),
    (v_tenant_id, 'DELAY', 'Qi +500K, Luck +500K', true),
    (v_tenant_id, 'PART2', 'Qi +1M, Luck +1M', true),
    (v_tenant_id, 'DurpJade', 'Qi +10M, Luck +10M', true),
    (v_tenant_id, 'MEMBERS', 'Qi +2M, Luck +2M', true),
    (v_tenant_id, 'UPDATE2', 'Qi +5M, Luck +5M', true),
    (v_tenant_id, 'HOTFIX', 'Qi +250K, Luck +250K', true),
    (v_tenant_id, 'RELEASE', 'Qi +5M, Luck +5M', true),
    -- Inactive codes
    (v_tenant_id, 'SORRYFORMISTAKE', 'Qi +1M, Luck +1M', false)
  ON CONFLICT (tenant_id, code) DO NOTHING;

  -- ============================================================
  -- Section 7: currencies table
  -- ============================================================
  CREATE TABLE IF NOT EXISTS currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT,
    type TEXT NOT NULL DEFAULT 'primary',
    description TEXT,
    drop_source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
  );

  CREATE INDEX IF NOT EXISTS idx_currencies_tenant ON currencies(tenant_id);

  ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "currencies_readable" ON currencies;
  CREATE POLICY "currencies_readable" ON currencies FOR SELECT USING (
    (tenant_id IS NULL) OR
    (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = currencies.tenant_id AND (tenants.is_public = true OR is_tenant_member(tenants.id))))
  );
  DROP POLICY IF EXISTS "currencies_insert" ON currencies;
  CREATE POLICY "currencies_insert" ON currencies FOR INSERT WITH CHECK (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "currencies_update" ON currencies;
  CREATE POLICY "currencies_update" ON currencies FOR UPDATE USING (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "currencies_delete" ON currencies;
  CREATE POLICY "currencies_delete" ON currencies FOR DELETE USING (is_tenant_member_with_role(tenant_id, 'admin'));

  INSERT INTO tenant_game_tables (tenant_id, table_name, display_label)
  VALUES (v_tenant_id, 'currencies', 'Moedas')
  ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = 'Moedas';

  INSERT INTO currencies (tenant_id, name, type, description, drop_source) VALUES
    (v_tenant_id, 'Qi', 'primary', 'A energia primordial que alimenta todas as marcas. Usado principalmente no Mundo 1 para craftar marcas de Insight, Essência, Soulfire e Karma.', 'Coletado passivamente com o tempo. Multiplicadores de Qi aumentam a taxa de coleta.'),
    (v_tenant_id, 'Insight', 'primary', 'A percepção necessária para desbloquear marcas mais avançadas. Essencial para progressão nas marcas de Insight.', 'Obtido ao craftar marcas de Insight e através de multiplicadores específicos.'),
    (v_tenant_id, 'Essence', 'primary', 'A essência pura usada para criar marcas de Essência e tiers superiores de outras famílias.', 'Craftado principalmente através de marcas de Essência. Essence mult aumenta a taxa.'),
    (v_tenant_id, 'Soulfire', 'primary', 'O fogo da alma, necessário para marcas de Soulfire e para avançar nos tiers mais altos do Mundo 1.', 'Gerado por marcas de Soulfire. Também encontrado como drop raro em bestas.'),
    (v_tenant_id, 'Karma', 'primary', 'A energia cármica que impulsiona as marcas de Karma. Necessário em grandes quantidades para os tiers superiores.', 'Acumulado ao craftar marcas de Karma. Karma mult acelera a coleta.'),
    (v_tenant_id, 'Star', 'special', 'A energia das estrelas, primeira moeda do Mundo 2. Usada para craftar marcas de Stars e Nebulae.', 'Obtido principalmente através de marcas de Stars e Nebulae no Mundo 2.'),
    (v_tenant_id, 'Nebula', 'special', 'A névoa cósmica, moeda intermediária do Mundo 2. Necessária para marcas de Nebulae e alguns tiers de Quasar.', 'Craftado por marcas de Nebulae. Também dropado por bestas do Mundo 2.'),
    (v_tenant_id, 'Quasar', 'special', 'O poder dos quasares, a moeda final do Mundo 2. Usado para as marcas mais poderosas do jogo.', 'Obtido exclusivamente através de marcas de Quasar. Requer investimento massivo de Qi.'),
    (v_tenant_id, 'Miasma', 'special', 'A corrupção primordial, moeda do endgame do Mundo 2. Usada para marcas de Miasma e progressão no World 3.', 'Dropado por bestas corrompidas e obtido através de manuais de Miasma.'),
    (v_tenant_id, 'Ash', 'special', 'As cinzas da criação, moeda rara do endgame. Usada para marcas de Ash e para resetar certos atributos.', 'Encontrado nas profundezas do World 3. Dropado por chefes de fogo e cinzas.'),
    (v_tenant_id, 'Laws', 'special', 'As leis absolutas do cosmos, a moeda mais rara do jogo. Usada para marcas de Laws e para desbloquear o verdadeiro final.', 'Apenas obtido através de marcas de Laws no ápice do endgame. Requer bilhões de Qi.')
  ON CONFLICT (tenant_id, name) DO NOTHING;

  -- ============================================================
  -- Section 8: Wiki Articles
  -- ============================================================
  CREATE TEMP TABLE IF NOT EXISTS temp_articles (
    idx SERIAL PRIMARY KEY,
    title TEXT,
    summary TEXT,
    content TEXT,
    tags TEXT[]
  );

  INSERT INTO temp_articles (title, summary, content, tags) VALUES

  -- Article 1: Guia de Bloodlines
  ('Guia de Bloodlines',
   'Guia completo das 14 bloodlines de Immortality Incremental — as 8 Lesser Core do Mundo 1 e as 6 Greater Core do Mundo 3.',
   '# Guia de Bloodlines

As Bloodlines (Linhagens) são bônus permanentes que você pode escolher para especializar seu personagem. Cada linhagem concede multiplicadores específicos que aceleram sua progressão.

## Mundo 1: Lesser Core Bloodlines (8)

Estas linhagens estão disponíveis no início do jogo e focam nas moedas primárias:

| Linhagem | Bônus | Uso |
|----------|-------|-----|
| **Qi Infinito** | Qi +50% | Progressão geral |
| **Sorte Prospera** | Luck +50% | Drops e eventos |
| **Essência Pura** | Essence +50% | Crafting de essência |
| **Alma Flamejante** | Soulfire +50% | Marcas de soulfire |
| **Karma Equilibrado** | Karma +50% | Ciclo cármico |
| **Estrelas Cadentes** | Stars +50% | Transição W1 → W2 |
| **Névoa Eterna** | Nebulae +50% | Marcas de nebulosas |
| **Quasar Nascente** | Quasar +50% | Poder cósmico |

## Mundo 3: Greater Core Bloodlines (6)

Estas linhagens são desbloqueadas no endgame e oferecem bônus mais poderosos:

| Linhagem | Bônus | Uso |
|----------|-------|-----|
| **Miasma Primordial** | Miasma +50%, Dano +25% | Poder miasmático |
| **Cinzas Eternas** | Ash +50%, Bulk +25% | Poder das cinzas |
| **Leis Absolutas** | Laws +50%, Speed +25% | Leis da realidade |
| **Breakthrough Ilimitado** | Breakthrough Luck +100% | Romper barreiras |
| **Besta Interior** | Beast Remnants +100%, Beast Core +50% | Bestas |
| **Conhecimento Oculto** | Manual Luck +100%, Clone +25% | Manuais e clonagem |

## Recomendações

- **Iniciantes**: Qi Infinito ou Sorte Prospera para acelerar o início.
- **Meio de jogo**: Essência Pura ou Estrelas Cadentes.
- **Endgame**: Miasma Primordial ou Leis Absolutas.',
   ARRAY['bloodlines', 'linhagens', 'guia', 'mundo-1', 'mundo-3']
  ),

  -- Article 2: Guia de Manuais
  ('Guia de Manuais',
   'Guia completo dos 11 Manuais de Miasma, suas chances de drop, tier list e melhores estratégias de farm.',
   '# Guia de Manuais

Os Manuais de Miasma são itens especiais que aumentam seu poder miasmático permanentemente. Cada manual tem uma chance de drop específica e concede bônus cumulativos.

## Lista Completa

| # | Manual | Chance Base | Bônus Principal |
|---|--------|-------------|-----------------|
| 1 | Anotações Esfarrapadas de Miasma | 1/1 | Miasma +2x |
| 2 | Manual Desbotado de Miasma | 1/50 | Miasma +5x |
| 3 | Sutra da Praga Verdejante | 1/250 | Miasma +10x |
| 4 | Codex do Veneno Oco | 1/1.25K | Miasma +20x |
| 5 | Manual Vinculado a Remanescentes | 1/7.5K | Miasma +35x |
| 6 | Escritura do Lótus Grave | 1/50K | Miasma +50x |
| 7 | Grimório do Meridiano do Vazio | 1/350K | Miasma +75x |
| 8 | Cânone da Estrela Pestilenta | 1/2.5M | Miasma +100x |
| 9 | Escritura da Praga Eclipse | 1/25M | Miasma +150x |
| 10 | Sutra Primordial de Miasma | 1/250M | Miasma +250x |
| 11 | Cânone do Imperador do Vazio Cinzento | 1/2.5B | Miasma +500x |

## Dicas de Farm

- Os primeiros 5 manuais são relativamente fáceis de obter — foque neles primeiro.
- A partir do Escritura do Lótus Grave (1/50K), o grind começa de verdade.
- Use bônus de Manual Luck e Luck para aumentar suas chances.
- O Cânone do Imperador do Vazio Cinzento é o item mais raro do jogo — 1 em 2.5 bilhões.',
   ARRAY['manuais', 'miasma', 'guia', 'farm']
  ),

  -- Article 3: Guia de Marcos
  ('Guia de Marcos (Milestones)',
   'Guia completo dos 4 tipos de marcos (milestones) em Immortality Incremental: Karma, Beast, Mark Opened e Time Played.',
   '# Guia de Marcos (Milestones)

Os Marcos são objetivos de longo prazo que concedem recompensas permanentes ao serem alcançados. Existem 4 categorias:

## 1. Karma (Cármicos)

| Marco | Requisito | Recompensa |
|-------|-----------|------------|
| Karma Inicial | 100 Karma | Karma +2x (1 min) |
| Karma Intermediário | 10K Karma | Karma +5x (5 min) |
| Karma Avançado | 1M Karma | Karma +10x (15 min) |

## 2. Beast (Bestas)

| Marco | Requisito | Recompensa |
|-------|-----------|------------|
| Besta Iniciante | 10 Bestas | Beast Remnants +2x |
| Caçador de Bestas | 1K Bestas | Beast Core +5% |

## 3. Mark Opened (Marcas Abertas)

| Marco | Requisito | Recompensa |
|-------|-----------|------------|
| Primeira Marca | 1 Marca | Qi +50% permanente |
| Colecionador | 50 Marcas | Mark Speed +2x permanente |

## 4. Time Played (Tempo de Jogo)

| Marco | Requisito | Recompensa |
|-------|-----------|------------|
| Jogador Dedicado | 1 hora | Qi +25% permanente |
| Veterano | 24 horas | Global +2x permanente |
| Imortal em Ascensão | 168 horas (7 dias) | Global +5x permanente',
   ARRAY['milestones', 'marcos', 'guia', 'progressão']
  ),

  -- Article 4: Guia de Segredos
  ('Guia de Segredos',
   'Guia dos segredos ocultos de Immortality Incremental — como desbloquear o Segredo das Origens e o Segredo do Vazio.',
   '# Guia de Segredos

Immortality Incremental esconde dois segredos poderosos que podem transformar sua experiência de jogo.

## Segredo das Origens

**Requisito:** 1 to Max

Este segredo revela a verdade sobre a origem das Marcas e sua conexão com o cosmos. Ao desbloqueá-lo, você ganha uma compreensão profunda do universo do jogo.

**Recompensa:** Revela a verdade sobre a origem das Marcas.

## Segredo do Vazio

**Requisito:** 5K to Max

O vazio chama por aqueles que se atrevem a ouvir. Este segredo ensina como canalizar o poder do nada absoluto.

**Recompensa:** Acesso ao poder do Vazio puro.

## Dicas

- Os segredos são desbloqueados progressivamente — comece com o Segredo das Origens.
- O Segredo do Vazio exige mais investimento mas oferece recompensas mais poderosas.
- Ambos os segredos são permanentes e não resetam com breakthroughs.',
   ARRAY['segredos', 'segredos', 'guia', 'endgame']
  ),

  -- Article 5: Guia de Moedas
  ('Guia de Moedas',
   'Guia completo de todas as 11 moedas de Immortality Incremental: Qi, Insight, Essence, Soulfire, Karma, Star, Nebula, Quasar, Miasma, Ash e Laws.',
   '# Guia de Moedas

Immortality Incremental possui 11 moedas divididas em duas categorias: primárias e especiais.

## Moedas Primárias (5)

Estas moedas são a base da progressão no Mundo 1:

| Moeda | Função | Como Obter |
|-------|--------|------------|
| **Qi** | Energia primordial para craftar marcas | Coleta passiva, multiplicadores |
| **Insight** | Percepção para desbloquear marcas | Marcas de Insight |
| **Essence** | Essência para crafting avançado | Marcas de Essência |
| **Soulfire** | Fogo da alma para tiers superiores | Marcas de Soulfire, drops de bestas |
| **Karma** | Energia cármica | Marcas de Karma |

## Moedas Especiais (6)

Estas moedas são desbloqueadas no Mundo 2 e no endgame:

| Moeda | Função | Como Obter |
|-------|--------|------------|
| **Star** | Energia estelar do Mundo 2 | Marcas de Stars e Nebulae |
| **Nebula** | Névoa cósmica | Marcas de Nebulae |
| **Quasar** | Poder de quasar | Marcas de Quasar |
| **Miasma** | Corrupção primordial | Bestas corrompidas, manuais |
| **Ash** | Cinzas da criação | Chefes do World 3 |
| **Laws** | Leis absolutas | Marcas de Laws (endgame final) |

## Estratégias de Farm

- **Qi** é a base de tudo — foque em multiplicadores de Qi primeiro.
- **Karma** escala lentamente — use bônus de Karma mult.
- **Miasma, Ash e Laws** são moedas de endgame — só se preocupem com elas depois de dominar o Mundo 2.',
   ARRAY['moedas', 'currencies', 'guia', 'economia']
  ),

  -- Article 6: Guia de Miasma
  ('Guia de Miasma',
   'Guia completo da família de Marcas de Miasma — de Spore a Abyssplague. Conteúdo de endgame do Mundo 2.',
   '# Guia de Miasma

A família Miasma é uma das 4 novas famílias adicionadas no endgame do Mundo 2. São marcas de corrupção que oferecem Miasma mult e Breakthrough Luck.

## Tiers

| Tier | Nome | Destaques |
|------|------|-----------|
| 1 | Spore | Miasma +32x, Quasar +56, Mark Speed +18 |
| 2 | Seed | Miasma +48x, Mark Bulk +8, Breakthrough Luck +8K |
| 3 | Rotbrand | Miasma +86x, Qi +128K, Stars +512 |
| 4 | Vein | Miasma +144x, Breakthrough Luck +256K, Dano +2 |
| 5 | Bloom | Miasma +56x, Beast Remnants +12, Mark Luck +2 |
| 6 | Wormmoon | Miasma +72x, Qi +4.8M, Breakthrough Luck +4.8M |
| 7 | Tombmire | Miasma +20x, Mark Bulk +2, Mark Speed +3 |
| 8 | Abyssplague | Miasma +32x, Qi +12M, Breakthrough Luck +12M |

## Progressão Recomendada

1. Comece com **Spore** para Miasma básico e Mark Speed.
2. **Seed** é essencial para Breakthrough Luck.
3. **Vein** combina Miasma alto com Breakthrough Luck massivo.
4. **Abyssplague** é o ápice — exige 12M de Qi.',
   ARRAY['miasma', 'marcas', 'guia', 'mundo-2', 'endgame']
  ),

  -- Article 7: Guia de Ash
  ('Guia de Ash',
   'Guia completo da família de Marcas de Ash — de Cinder a Hollowflame. Poder das cinzas para o endgame.',
   '# Guia de Ash

A família Ash representa o poder das cinzas da criação. São marcas que combinam Ash mult com dano e poder bruto.

## Tiers

| Tier | Nome | Destaques |
|------|------|-----------|
| 1 | Cinder | Ash +12x |
| 2 | Smolder | Ash +16x, Miasma +16, Quasar +1K |
| 3 | Soot | Ash +48x, Dano +2 |
| 4 | Ember | Mark Bulk +3, Mark Speed +3, Beast Remnants +24 |
| 5 | Pyre | Ash +128x, Qi +9.6M, Breakthrough Luck +9.6M |
| 6 | Ashveil | Ash +96x, Miasma +256, Quasar +256 |
| 7 | Charfall | Beast Core +2, Beast Remnants +12, Dano +7 |
| 8 | Hollowflame | Ash +256x, Miasma +96, Qi +128M, Breakthrough Luck +128M |

## Dicas

- Ash é uma família de transição entre Miasma e Laws.
- **Hollowflame** exige 128M de Qi — o maior requisito de Qi do jogo.
- Combine Ash com Miasma para maximizar o dano no endgame.',
   ARRAY['ash', 'cinzas', 'marcas', 'guia', 'endgame']
  ),

  -- Article 8: Guia de Leis (Laws)
  ('Guia de Leis (Laws)',
   'Guia completo da família de Marcas de Laws — de Edict a Absolute. O ápice do poder em Immortality Incremental.',
   '# Guia de Leis (Laws)

A família Laws é a mais poderosa do jogo. Estas marcas manipulam as leis da realidade e exigem investimentos astronômicos.

## Tiers

| Tier | Nome | Destaques |
|------|------|-----------|
| 1 | Edict | Laws +7.5x, Mark Bulk +2 |
| 2 | Clause | Laws +11.5x, Mark Bulk +4.5 |
| 3 | Verdict | Laws +11.5x, Qi +512M, Insight +1B, Essence +1B |
| 4 | Tribunal | Laws +7.5x, Mark Speed +2.75, Mark Luck +2.5 |
| 5 | Mandate | Laws +17.5x, Soulfire +1B, Karma +1B |
| 6 | Decree | Laws +7.5x, Stars +1B, Nebulae +1B, Mark Bulk +4, Mark Speed +32.5 |
| 7 | Statute | Laws +22.5x, Qi +5B, Luck +4M |
| 8 | Absolute | Laws +37.5x, Quasar +1B, Mark Bulk +7.5, Mark Speed +7.5, Mark Luck +2 |

## Progressão

- **Edict** e **Clause** são acessíveis — focam em Laws e Bulk.
- **Verdict** é um salto gigante: exige 512M de Qi.
- **Statute** exige 5B de Qi.
- **Absolute** é a marca mais poderosa do jogo: Laws +37.5x, Quasar +1B, Bulk e Speed +7.5.',
   ARRAY['laws', 'leis', 'marcas', 'guia', 'endgame']
  ),

  -- Article 9: Guia de Reputação
  ('Guia de Reputação',
   'Guia completo da família de Marcas de Reputação — de Stranger a Legend. Como progredir a fama do seu personagem.',
   '# Guia de Reputação

A família Reputation (Reputação) é única por estar no Mundo 1 mas oferecer bônus que escalam para o endgame.

## Tiers

| Tier | Nome | Destaques |
|------|------|-----------|
| 1 | Stranger | Qi +100, Luck +100 |
| 2 | Acquaintance | Insight +50, Essence +30, Qi +20 |
| 3 | Friend | Essence +100, Soulfire +150, Mark Bulk +5, Mark Luck +3 |
| 4 | Champion | Qi +200, Karma +200, Mark Luck +1, Beast Core +2 |
| 5 | Legend | Qi +500, Luck +500, Remnants +10, Mark Bulk +3, Mark Speed +3, Mark Clone +3 |

## Dicas

- Reputation é a única família do Mundo 1 que oferece Mark Clone.
- **Legend** é extremamente versátil: Qi, Luck, Remnants, Bulk, Speed e Clone.
- Complete esta família antes de migrar para Miasma/Ash.',
   ARRAY['reputação', 'reputation', 'marcas', 'guia', 'mundo-1']
  ),

  -- Article 10: Guia de Breakthrough e Reset
  ('Guia de Breakthrough e Reset',
   'Guia completo do sistema de Breakthrough e Reset em Immortality Incremental — quando resetar e como maximizar seus ganhos.',
   '# Guia de Breakthrough e Reset

O sistema de Breakthrough (Rompimento) permite resetar seu progresso em troca de bônus permanentes poderosos.

## Como Funciona

1. Acumule Breakthrough Luck através de marcas de Miasma e outros bônus.
2. Quando tiver Breakthrough Luck suficiente, execute um Breakthrough.
3. Seu progresso é resetado mas você ganha multiplicadores permanentes.

## Quando Resetar

- **Primeiro Breakthrough**: Assim que possível (poucos minutos de jogo).
- **Breakthroughs intermediários**: Quando o progresso desacelerar significativamente.
- **Breakthroughs avançados**: Quando você tiver marcas de Miasma tier 4+.

## Dicas Importantes

- Breakthrough Luck é acumulativo — quanto mais você tem, mais rápido fica.
- Marcas de Miasma (especialmente Seed, Vein e Abyssplague) oferecem Breakthrough Luck massivo.
- Não resete antes de craftar todas as marcas disponíveis — cada marca dá bônus permanentes.
- O sistema de Breakthrough é essencial para alcançar o World 3.',
   ARRAY['breakthrough', 'reset', 'guia', 'mecânicas']
  ),

  -- Article 11: Tier List Completa
  ('Tier List Completa',
   'Ranking atualizado de todas as 11 famílias de marcas e melhores marcas individuais de Immortality Incremental.',
   '# Tier List Completa

## Melhores Famílias

### S-Tier
| Família | Motivo |
|---------|--------|
| **Laws** | Bônus mais poderosos do jogo. Absolute é a melhor marca. |
| **Miasma** | Breakthrough Luck essencial para endgame. |

### A-Tier
| Família | Motivo |
|---------|--------|
| **Ash** | Alto dano e bônus de endgame. |
| **Quasar** | Poder cósmico com altos multiplicadores. |
| **Karma** | Samsara e Nirvana são essenciais para transição W1→W2. |

### B-Tier
| Família | Motivo |
|---------|--------|
| **Insight** | Boa para início de jogo. Omniscience é excelente. |
| **Essence** | Essential para crafting. Eternal é muito boa. |
| **Soulfire** | Soulnova oferece bônus equilibrados. |

### C-Tier
| Família | Motivo |
|---------|--------|
| **Stars** | Necessária para W2 mas superada por Nebulae depois. |
| **Nebulae** | Bônus decentes mas ofuscada por Quasar. |
| **Reputation** | Útil no início, superada no endgame. |

## Melhores Marcas Individuais

1. **Absolute** (Laws) — A marca mais poderosa do jogo.
2. **Abyssplague** (Miasma) — Breakthrough Luck +12M.
3. **Hollowflame** (Ash) — Ash +256x, Qi +128M.
4. **Statute** (Laws) — Qi +5B, Laws +22.5x.
5. **Nirvana** (Karma) — Essencial para progressão W1→W2.',
   ARRAY['tier-list', 'ranking', 'melhores', 'marcas']
  ),

  -- Article 12: Códigos Ativos
  ('Códigos Ativos',
   'Lista atualizada de todos os códigos ativos e inativos de Immortality Incremental com suas recompensas.',
   '# Códigos Ativos

## Códigos Funcionando

| Código | Recompensa |
|--------|------------|
| 5MVISITS | Qi +5M, Luck +5M |
| MINI2 | Recompensa Mini 2 |
| COOLBEANS | Qi +1M, Luck +1M |
| NERF | Qi +2M, Luck +2M |
| 100KGROUP | Qi +100K, Luck +100K |
| MINI | Qi +500K, Luck +500K |
| 100KFAV | Qi +100K, Luck +100K |
| HYPE | Qi +1M, Luck +1M |
| ASH | Qi +2M, Luck +2M |
| 5KCCU | Qi +5K, Luck +5K |
| 1MVISITS | Qi +1M, Luck +1M |
| HOTFIXING | Qi +500K, Luck +500K |
| EXTRACODE | Qi +3M, Luck +3M |
| 50KGROUP | Qi +50K, Luck +50K |
| PART1 | Qi +1M, Luck +1M |
| 1KGOATS | Qi +1K, Luck +1K |
| DELAY | Qi +500K, Luck +500K |
| PART2 | Qi +1M, Luck +1M |
| DurpJade | Qi +10M, Luck +10M |
| MEMBERS | Qi +2M, Luck +2M |
| UPDATE2 | Qi +5M, Luck +5M |
| HOTFIX | Qi +250K, Luck +250K |
| RELEASE | Qi +5M, Luck +5M |

## Códigos Expirados

| Código | Recompensa |
|--------|------------|
| SORRYFORMISTAKE | Qi +1M, Luck +1M |

## Dicas

- Códigos são case-sensitive.
- Use os códigos maiores (DurpJade, 5MVISITS, UPDATE2) primeiro para maximizar o ganho inicial.',
   ARRAY['códigos', 'codes', 'guias', 'recompensas']
  ),

  -- Article 13: Guia de Desafios
  ('Guia de Desafios',
   'Guia do sistema de Desafios de Immortality Incremental — como funciona e quais recompensas esperar.',
   '# Guia de Desafios

Os Desafios são missões especiais com tempo limitado que testam sua capacidade de progressão rápida.

## Desafio Disponível

### Desafio da Progressão Acelerada

**Duração:** Aproximadamente 1 hora

**Objetivo:** Complete o máximo de tiers de marcas possível dentro do tempo limite.

**Recompensas:**
- Multiplicador Global +3x permanente
- Título exclusivo "Acelerado"

## Estratégias

- Prepare-se antes de iniciar o desafio — tenha recursos acumulados.
- Foque em famílias de marcas que você já conhece bem.
- Mark Speed é essencial — quanto mais rápido, mais tiers você completa.
- Não perca tempo com marcas de baixo tier — vá direto para o que você pode craftar.

## Dicas para Iniciantes

- Complete pelo menos um ciclo de marcas do Mundo 1 antes de tentar.
- Tenha Mark Speed mínimo de 5x antes de começar.
- Use códigos ativos para começar com recursos extras.',
   ARRAY['desafios', 'challenges', 'guia', 'eventos']
  ),

  -- Article 14: Famílias de Marcas
  ('Famílias de Marcas',
   'Visão geral de todas as 11 famílias de marcas de Immortality Incremental — dos 2 mundos e 3 estágios de progressão.',
   '# Famílias de Marcas

Immortality Incremental possui 11 famílias de marcas distribuídas em 2 mundos. Cada família tem seu próprio estilo e bônus.

## Mundo 1 (4 famílias)

1. **Mark of Insight** (9 tiers) — Foco em Qi, Luck e Insight. A família inicial.
2. **Mark of Essence** (8 tiers) — Essência pura e crafting.
3. **Mark of Soulfire** (8 tiers) — Fogo da alma, bulk e velocidade.
4. **Mark of Karma** (8 tiers) — O ciclo cármico. Essencial para transição ao W2.

## Mundo 2 — Estágio 1 (3 famílias)

5. **Mark of Stars** (8 tiers) — Poder estelar. Primeira família do W2.
6. **Mark of Nebulae** (8 tiers) — Névoa cósmica. Combina estrelas e karma.
7. **Mark of Quasar** (8 tiers) — Quasares. O ápice do W2 básico.

## Mundo 2 — Estágio 2 / Endgame (3 famílias)

8. **Mark of Miasma** (8 tiers) — Corrupção primordial. Breakthrough Luck.
9. **Mark of Ash** (8 tiers) — Cinzas da criação. Dano e poder bruto.
10. **Mark of Laws** (8 tiers) — Leis absolutas. O ápice do poder.

## Mundo 1 — Retorno (1 família)

11. **Mark of Reputation** (5 tiers) — Reputação. Disponível no W1 mas escala para endgame.

Total: 57 tiers de marcas para dominar!',
   ARRAY['famílias', 'marcas', 'visão-geral', 'guia']
  );

  -- Insert articles into wiki_articles, checking each one individually
  -- We skip articles that already exist by title for this tenant
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
  FROM temp_articles ta
  WHERE NOT EXISTS (
    SELECT 1 FROM wiki_articles wa
    WHERE wa.tenant_id = v_tenant_id AND wa.title = ta.title
  );

  DROP TABLE IF EXISTS temp_articles;

  RAISE NOTICE 'Seed V3 concluído: bloodlines, manuals, milestones, secrets, challenges, codes, currencies, e novos artigos.';

END $$;

COMMIT;
