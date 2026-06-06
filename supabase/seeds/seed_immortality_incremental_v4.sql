-- ============================================================
-- Seed V4: Immortality Incremental — Update Logs + New Codes
-- Run AFTER seed_immortality_incremental_v3.sql
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
  -- Section 1: update_logs table
  -- ============================================================
  CREATE TABLE IF NOT EXISTS update_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    is_hotfix BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, title)
  );

  CREATE INDEX IF NOT EXISTS idx_update_logs_tenant ON update_logs(tenant_id);

  -- Fix pre-existing table that may lack the unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'update_logs_tenant_id_title_key'
  ) THEN
    ALTER TABLE update_logs ADD UNIQUE(tenant_id, title);
  END IF;

  ALTER TABLE update_logs ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "update_logs_readable" ON update_logs;
  CREATE POLICY "update_logs_readable" ON update_logs FOR SELECT USING (
    (tenant_id IS NULL) OR
    (EXISTS (SELECT 1 FROM tenants WHERE tenants.id = update_logs.tenant_id AND (tenants.is_public = true OR is_tenant_member(tenants.id))))
  );
  DROP POLICY IF EXISTS "update_logs_insert" ON update_logs;
  CREATE POLICY "update_logs_insert" ON update_logs FOR INSERT WITH CHECK (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "update_logs_update" ON update_logs;
  CREATE POLICY "update_logs_update" ON update_logs FOR UPDATE USING (is_tenant_member_with_role(tenant_id, 'editor'));
  DROP POLICY IF EXISTS "update_logs_delete" ON update_logs;
  CREATE POLICY "update_logs_delete" ON update_logs FOR DELETE USING (is_tenant_member_with_role(tenant_id, 'admin'));

  INSERT INTO tenant_game_tables (tenant_id, table_name, display_label)
  VALUES (v_tenant_id, 'update_logs', 'Registros de Atualizações')
  ON CONFLICT (tenant_id, table_name) DO UPDATE SET display_label = 'Registros de Atualizações';

  -- ============================================================
  -- Section 2: Update Logs data
  -- ============================================================
  INSERT INTO update_logs (tenant_id, title, content, is_hotfix) VALUES

  -- Update 1: World 4 Update
  (v_tenant_id, 'World 4 Update',
   '# World 4 Update

## Content

- **World 4** está disponível, com 2 novos recursos para grindar: **Citizens** e **Faith**
- **1 nova camada de Body Tempering**: Imperial Body Tempering
- **2 novos beast stage milestones**: stage 225 e stage 250
- **1 novo karma milestone**: desbloqueado através da faith upgrade board
- **1 novo cultivation manual**
- **2 novos secret mark rollables** (dica: world 1 e world 3)
- **Sistema Disciple Training**: desbloqueado pela faith upgrade board
  - Disciple breakthrough luck escala baseado no seu próprio realm
- **1 hidden upgrade** em algum lugar do world 4

## Codes

| Código | Recompensa |
|--------|------------|
| WORLD4 | 4 tickets, 4 Jade, 4 de cada poção |
| 15KSERVER | 15 de cada poção |
| ANTI | 20 Jade |
| SECTSDELAY | x10 de cada poção, x15 Jade |

## Hotfix

- Requerimento de realm do W4 alterado de **565 → 560**',
   false),

  -- Update 2: Mini Update 2
  (v_tenant_id, 'Mini Update 2',
   '# Mini Update 2

## Content

### Laws Expansion
- **Nova Mark of Laws**: fornece boosts para vários stats (para uso futuro), e um dos rollables dá manual luck boost
- **Nova law upgrade board II**: uma contraparte de escalonamento mais lento da primeira board

### Jade Refunding
- Por **50 robux** ou **50 jade**, você pode resetar seus jade upgrades, recuperando seus jade para alocar livremente

### Mudanças
- Stars capacity max upgrades alterado para **45**, para que a automação do W2 não gaste stars desnecessariamente
- No menu de marks, cada rollable agora tem um indicador mostrando quantas cópias são necessárias para maxiá-lo
- Jade upgrade para **Laws** está disponível agora

## Bug Fixes / QOL

- Um botão de **jump** para jogadores de console alcançarem a hidden upgrade no W3
- Se jogando no console e usando kbm, o menu de navegação não aparece mais em GUIs como o mark gui
- Outras pequenas correções

## Codes

| Código | Recompensa |
|--------|------------|
| 5MVISITS *(atualizado)* | 10 tickets, 20 de cada poção |
| MINI2 *(atualizado)* | 10 jade, 5 de cada poção |
| COOLBEANS *(atualizado)* | 5 de cada poção |',
   false),

  -- Update 3: Weekly Update + hotfix
  (v_tenant_id, 'Weekly Update',
   '# Weekly Update

## Content

### Ash Upgrade Tree
- **Árvore de upgrades Ash** com **10+ upgrades**
  - Quando desbloqueada, **3 botões de upgrade ocultos** estarão espalhados pelos 3 mundos

### Challenges System
- Sistema de **Desafios** introduzido, com o primeiro sendo **Markless** (desbloqueado através da upgrade tree)
  - No desafio Markless, você pode desbloquear **2 novos karma milestones**

### Outras Adições
- **Laws reset layer** adicionada (atualmente apenas uma upgrade board)
- **1 novo beast milestone**
- **1 novo body tempering**
- Efeito de **miasma boost** adicionado ao **Zenith** da Quasar Mark
- **Modo noturno** (alternável) — experimente, ficou muito bom
- **Títulos de leaderboard para F2P**
- Vários outros tweaks menores

## Bug Fixes

- Corrigido ganho de beast core que às vezes mostrava +2 mesmo com o milestone do stage 175 (bug visual de arredondamento)
- Corrigido avatar não aparecendo na cutscene de loading
- Agora você não pode mais usar warp durante quasar practice
- Corrigidos glitches de scrolling no console (agora tem cursor)

## Codes

| Código | Recompensa |
|--------|------------|
| 10KSERVER | x10 de cada poção, x5 tickets |
| YAAY | x10 jade |
| LAWS | x5 de cada poção |

## Hotfix

- Nomes de realm atualizados até realm 800
- Possível correção para comprar upgrades na upgrade tree no console
- Corrigido beast kill anormalmente rápido após challenges',
   false)

  ON CONFLICT (tenant_id, title) DO UPDATE SET
    content = EXCLUDED.content,
    is_hotfix = EXCLUDED.is_hotfix,
    updated_at = now();

  -- ============================================================
  -- Section 3: New codes
  -- ============================================================
  INSERT INTO codes (tenant_id, code, rewards, is_active) VALUES
    -- World 4 Update codes
    (v_tenant_id, 'WORLD4', '["4 tickets", "4 Jade", "4 of each potion"]'::jsonb, true),
    (v_tenant_id, '15KSERVER', '["15 of each potion"]'::jsonb, true),
    (v_tenant_id, 'ANTI', '["20 Jade"]'::jsonb, true),
    (v_tenant_id, 'SECTSDELAY', '["x10 of each potion", "x15 Jade"]'::jsonb, true),
    -- Weekly Update codes
    (v_tenant_id, '10KSERVER', '["x10 of each potion", "x5 tickets"]'::jsonb, true),
    (v_tenant_id, 'YAAY', '["x10 jade"]'::jsonb, true),
    (v_tenant_id, 'LAWS', '["x5 of each potion"]'::jsonb, true)
  ON CONFLICT (tenant_id, code) DO NOTHING;

  -- ============================================================
  -- Section 4: Update changed codes (Mini Update 2)
  -- ============================================================
  UPDATE codes SET rewards = '["10 tickets", "20 of each potion"]'::jsonb
  WHERE tenant_id = v_tenant_id AND code = '5MVISITS';

  UPDATE codes SET rewards = '["10 jade", "5 of each potion"]'::jsonb
  WHERE tenant_id = v_tenant_id AND code = 'MINI2';

  UPDATE codes SET rewards = '["5 of each potion"]'::jsonb
  WHERE tenant_id = v_tenant_id AND code = 'COOLBEANS';

  -- ============================================================
  -- Section 5: Remove redundant individual mark family articles
  -- Keep only the complete 11-families overview
  -- ============================================================
  DELETE FROM wiki_articles
  WHERE tenant_id = v_tenant_id AND title IN (
    'Guia de Miasma',
    'Guia de Ash',
    'Guia de Leis (Laws)',
    'Guia de Reputação'
  );

  -- ============================================================
  -- Section 6: Update "Códigos Ativos" article with new codes
  -- ============================================================
  UPDATE wiki_articles SET
    summary = 'Lista atualizada de todos os códigos ativos e inativos de Immortality Incremental com suas recompensas.',
    content = '# Códigos Ativos

## Códigos Funcionando

| Código | Recompensa |
|--------|------------|
| WORLD4 | 4 tickets, 4 Jade, 4 de cada poção |
| 15KSERVER | 15 de cada poção |
| ANTI | 20 Jade |
| SECTSDELAY | x10 de cada poção, x15 Jade |
| 10KSERVER | x10 de cada poção, x5 tickets |
| YAAY | x10 jade |
| LAWS | x5 de cada poção |
| 5MVISITS | 10 tickets, 20 de cada poção |
| MINI2 | 10 jade, 5 de cada poção |
| COOLBEANS | 5 de cada poção |
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
- Use os códigos maiores (DurpJade, WORLD4, 5MVISITS) primeiro para maximizar o ganho inicial.',
    updated_at = now()
  WHERE tenant_id = v_tenant_id AND title = 'Códigos Ativos';

  RAISE NOTICE 'Seed V4 concluído: update_logs, novos códigos, rewards atualizados, artigos limpos.';

END $$;

COMMIT;
