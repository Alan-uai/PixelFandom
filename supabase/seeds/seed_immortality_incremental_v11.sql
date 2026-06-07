-- ============================================================
-- Seed V11: Immortality Incremental — Code Rewards Update & Latest Update Article
-- Run AFTER seed_immortality_incremental_v10.sql
-- Update code rewards based on actual values from update_logs announcements,
-- create a "Latest Update" article, and refresh the codes list article.
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
  -- Part 1: Update code rewards from update_logs announcements
  -- Each codes'' reward was changed in a subsequent patch update.
  -- Source: update_logs content field (RELEASE → Mini Update → ...)
  -- ============================================================

  UPDATE codes SET rewards = '["x1 each potion"]'::jsonb, updated_at = now()
  WHERE tenant_id = v_tenant_id AND code = 'HOTFIX';

  UPDATE codes SET rewards = '["x10 Tickets", "x2 of each potion"]'::jsonb, updated_at = now()
  WHERE tenant_id = v_tenant_id AND code = 'PART2';

  UPDATE codes SET rewards = '["5 Tickets", "5 of each potion"]'::jsonb, updated_at = now()
  WHERE tenant_id = v_tenant_id AND code = 'PART1';

  UPDATE codes SET rewards = '["10 of each potion"]'::jsonb, updated_at = now()
  WHERE tenant_id = v_tenant_id AND code = '50KGROUP';

  UPDATE codes SET rewards = '["10 Jade", "5 of each potion"]'::jsonb, updated_at = now()
  WHERE tenant_id = v_tenant_id AND code = 'EXTRACODE';

  UPDATE codes SET rewards = '["x10 each potion", "x5 jade"]'::jsonb, updated_at = now()
  WHERE tenant_id = v_tenant_id AND code = '1MVISITS';

  UPDATE codes SET rewards = '["x5 each potion", "x10 tickets"]'::jsonb, updated_at = now()
  WHERE tenant_id = v_tenant_id AND code = '5KCCU';

  UPDATE codes SET rewards = '["x3 each potion"]'::jsonb, updated_at = now()
  WHERE tenant_id = v_tenant_id AND code = 'ASH';

  UPDATE codes SET rewards = '["x5 tickets"]'::jsonb, updated_at = now()
  WHERE tenant_id = v_tenant_id AND code = 'HYPE';

  UPDATE codes SET rewards = '["x10 Tickets", "x3 of each potion"]'::jsonb, updated_at = now()
  WHERE tenant_id = v_tenant_id AND code = 'HOTFIXING';

  UPDATE codes SET rewards = '["10 of each potion", "5 tickets"]'::jsonb, updated_at = now()
  WHERE tenant_id = v_tenant_id AND code = '100KFAV';

  UPDATE codes SET rewards = '["3 of each potion", "5 Jade"]'::jsonb, updated_at = now()
  WHERE tenant_id = v_tenant_id AND code = 'MINI';

  UPDATE codes SET rewards = '["10 of each potion"]'::jsonb, updated_at = now()
  WHERE tenant_id = v_tenant_id AND code = '100KGROUP';

  UPDATE codes SET rewards = '["5 jade"]'::jsonb, updated_at = now()
  WHERE tenant_id = v_tenant_id AND code = 'NERF';

  -- DELAY was announced as "TBD when I get back home" and never materialized
  UPDATE codes SET is_active = false, is_expired = true, updated_at = now()
  WHERE tenant_id = v_tenant_id AND code = 'DELAY';

  -- ============================================================
  -- Part 2: Create "Latest Update" article
  -- Shows the most recent update_log and links to the full history table
  -- ============================================================

  INSERT INTO wiki_articles (tenant_id, created_by, title, slug, summary, content, tags, status)
  VALUES (
    v_tenant_id,
    v_user_id,
    'Última Atualização',
    'latest-update',
    'Registro da atualização mais recente de Immortality Incremental. Consulte a tabela de registros para o histórico completo.',
    '# Última Atualização

## Weekly Update

### Conteúdo

#### Ash Upgrade Tree
- **Árvore de upgrades Ash** com **10+ upgrades**
  - Quando desbloqueada, **3 botões de upgrade ocultos** estarão espalhados pelos 3 mundos

#### Challenges System
- Sistema de **Desafios** introduzido, com o primeiro sendo **Markless** (desbloqueado através da upgrade tree)
  - No desafio Markless, você pode desbloquear **2 novos karma milestones**

#### Outras Adições
- **Laws reset layer** adicionada (atualmente apenas uma upgrade board)
- **1 novo beast milestone**
- **1 novo body tempering**
- Efeito de **miasma boost** adicionado ao **Zenith** da Quasar Mark
- **Modo noturno** (alternável) — experimente, ficou muito bom
- **Títulos de leaderboard para F2P**
- Vários outros tweaks menores

### Bug Fixes

- Corrigido ganho de beast core que às vezes mostrava +2 mesmo com o milestone do stage 175 (bug visual de arredondamento)
- Corrigido avatar não aparecendo na cutscene de loading
- Agora você não pode mais usar warp durante quasar practice
- Corrigidos glitches de scrolling no console (agora tem cursor)

### Códigos

| Código | Recompensa |
|--------|------------|
| 10KSERVER | x10 de cada poção, x5 tickets |
| YAAY | x10 jade |
| LAWS | x5 de cada poção |

### Hotfix

- Nomes de realm atualizados até realm 800
- Possível correção para comprar upgrades na upgrade tree no console
- Corrigido beast kill anormalmente rápido após challenges

---

> Veja o **[histórico completo de atualizações](/w/immortality-incremental/update_logs)** para todas as versões anteriores (World 4 Update, Mini Update 2, World 3 parte 1 e 2, etc.).',
    ARRAY['update', 'atualizacao', 'changelog', 'registro', 'ultima-atualizacao']::TEXT[],
    'published'
  );

  -- ============================================================
  -- Part 3: Update "Códigos Ativos" article with current rewards
  -- ============================================================

  UPDATE wiki_articles SET
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
| 1MVISITS | x10 cada poção, x5 jade |
| 5KCCU | x5 cada poção, x10 tickets |
| ASH | x3 cada poção |
| HYPE | x5 tickets |
| HOTFIXING | x10 Tickets, x3 de cada poção |
| EXTRACODE | 10 Jade, 5 de cada poção |
| 50KGROUP | 10 de cada poção |
| PART1 | 5 Tickets, 5 de cada poção |
| PART2 | x10 Tickets, x2 de cada poção |
| HOTFIX | x1 cada poção |
| NERF | 5 jade |
| 100KFAV | 10 de cada poção, 5 tickets |
| MINI | 3 de cada poção, 5 Jade |
| 100KGROUP | 10 de cada poção |
| 1KGOATS | Qi +1K, Luck +1K |
| DurpJade | Qi +10M, Luck +10M |
| MEMBERS | Qi +2M, Luck +2M |
| UPDATE2 | Qi +5M, Luck +5M |
| RELEASE | Qi +5M, Luck +5M |

## Códigos Expirados

| Código | Recompensa |
|--------|------------|
| SORRYFORMISTAKE | Qi +1M, Luck +1M |
| DELAY | TBD (nunca definido) |

## Dicas

- Códigos são case-sensitive.
- Use os códigos maiores (DurpJade, WORLD4, 5MVISITS) primeiro para maximizar o ganho inicial.',
    updated_at = now()
  WHERE tenant_id = v_tenant_id AND title = 'Códigos Ativos';

  RAISE NOTICE 'Seed V11 concluído: códigos atualizados, latest-update criado, códigos ativos atualizado.';
END $$;

COMMIT;
