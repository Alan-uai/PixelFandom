-- ============================================================
-- Seed V7: Immortality Incremental — Ash Tree + Miasma Guide
-- Run AFTER seed_immortality_incremental_v6.sql
-- Adiciona artigos wiki sobre a Árvore de Upgrades Ash e
-- o Guia de Miasma.
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
  -- Article 1: Ash Upgrade Tree
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1 FROM wiki_articles
    WHERE tenant_id = v_tenant_id AND slug = 'ash-upgrade-tree'
  ) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    VALUES (
      v_tenant_id,
      v_user_id,
      'Árvore de Upgrades Ash',
      'Guia completo da árvore de upgrades da moeda Ash — todas as categorias, tiers, custos e requisitos de desbloqueio.',
      '# Árvore de Upgrades Ash

A árvore de upgrades Ash foi introduzida no Weekly Update. Quando desbloqueada, **3 botões de upgrade ocultos** estão espalhados pelos 3 mundos.

Cada categoria de upgrade pode ser evoluída múltiplas vezes, com custos crescentes em notação científica (Sx, Sp, Oc, No, Dc, Ud).

---

## More Ash (15 Upgrades)

| Tier | Custo |
|------|-------|
| 1 | 10 Sx |
| 2 | 28 Sx |
| 3 | 78 Sx |
| 4 | 219.52 Sx |
| 5 | 614.66 Sx |
| 6 | 1.72 Sp |
| 7 | 4.82 Sp |
| 8 | 13.49 Sp |
| 9 | 37.78 Sp |
| 10 | 105.78 Sp |
| 11 | 296.20 Sp |
| 12 | 829.35 Sp |
| 13 | 2.32 Oc |
| 14 | 6.50 Oc |
| 15 | 18.21 Oc |

## More Miasma (10 Upgrades)

| Tier | Custo |
|------|-------|
| 1 | 50 Sx |
| 2 | 165 Sx |
| 3 | 544.4 Sx |
| 4 | 1.8 Sp |
| 5 | 5.93 Sp |
| 6 | 19.57 Sp |
| 7 | 64.57 Sp |
| 8 | 213.09 Sp |
| 9 | 703.2 Sp |
| 10 | 2.32 Oc |

## More Manual Luck (5 Upgrades)

| Tier | Custo |
|------|-------|
| 1 | 1 Sp |
| 2 | 10 Sp |
| 3 | 100 Sp |
| 4 | 1 Oc |
| 5 | 10 Oc |

## More Damage (1 Upgrade)

| Tier | Custo |
|------|-------|
| 1 | 5 Sp |

## More Mark Bulk (8 Upgrades)

| Tier | Custo |
|------|-------|
| 1 | 80 Sp |
| 2 | 336 Sp |
| 3 | 1.41 Oc |
| 4 | 5.93 Oc |
| 5 | 24.89 Oc |
| 6 | 104.55 Oc |
| 7 | 439.12 Oc |
| 8 | 1.84 No |

## More Beast Core (5 Upgrades)

| Tier | Custo |
|------|-------|
| 1 | 50 Sp |
| 2 | 250 Sp |
| 3 | 1.25 Oc |
| 4 | 6.25 Oc |
| 5 | 31.25 Oc |

## Challenges

| Desbloqueio | Custo |
|-------------|-------|
| Unlock | 1 No |

## More Ash II (10 Upgrades)

| Tier | Custo |
|------|-------|
| 1 | 5 No |
| 2 | 22.5 No |
| 3 | 101.25 No |
| 4 | 455.63 No |
| 5 | 2.05 Dc |
| 6 | 9.23 Dc |
| 7 | 41.52 Dc |
| 8 | 186.83 Dc |
| 9 | 840.76 Dc |
| 10 | 3.78 Ud |

## More Manual Luck II (5 Upgrades)

| Tier | Custo |
|------|-------|
| 1 | 10 No |
| 2 | 100 No |
| 3 | 1 Dc |
| 4 | 10 Dc |
| 5 | 100 Dc |

## More Karma (2 Upgrades)

| Tier | Custo |
|------|-------|
| 1 | 20 Dc |
| 2 | 500 Dc |

## Laws

| Desbloqueio | Custo |
|-------------|-------|
| Unlock | 15 Ud |',
      ARRAY['ash', 'upgrades', 'upgrade-tree', 'gui']::TEXT[],
      'published',
      'ash-upgrade-tree'
    );
  END IF;

  -- ============================================================
  -- Article 2: Miasma Guide
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1 FROM wiki_articles
    WHERE tenant_id = v_tenant_id AND slug = 'miasma-guide'
  ) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    VALUES (
      v_tenant_id,
      v_user_id,
      'Guia de Miasma',
      'Guia completo da camada de Miasma do Underworld — mecânicas, marcas, manuais, upgrade board e estratégias de progressão.',
      '# Guia de Miasma

## Visão Geral

Miasma é a **primeira camada do Underworld (World 3)**, introduzida na parte 1. É uma camada ativa onde pontos são ganhos através de um botão de clique. Acompanha uma upgrade board (5+ upgrades) e a Mark of Miasma.

---

## Mark of Miasma

| Tier | Nome | Destaques |
|------|------|-----------|
| 1 | Spore | Miasma +32x, Quasar +56, Mark Speed +18 |
| 2 | Seed | Miasma +48x, Mark Bulk +8, Breakthrough Luck +8K |
| 3 | Rotbrand | Miasma +86x, Qi +128K, Stars +512 |
| 4 | Vein | Miasma +144x, Breakthrough Luck +256K, Damage +2 |
| 5 | Bloom | Miasma +56x, Qi +336K, Stars +128, Mark Luck +2, Beast Remnants +12 |
| 6 | Wormmoon | Miasma +72x, Qi +4.8M, Breakthrough Luck +4.8M |
| 7 | Tombmire | Miasma +20x, Qi +1.2M, Mark Bulk +2, Mark Speed +3, Breakthrough Luck +1.6M |
| 8 | Abyssplague | Miasma +32x, Qi +12M, Breakthrough Luck +12M, Manual Luck +2 |

## Manuais de Miasma

Manuais são itens permanentes que multiplicam seu ganho de Miasma. Eles são obtidos como drop ao interagir com o sistema de manuais no Underworld.

| # | Nome | Chance Base | Bônus |
|---|------|-------------|-------|
| 1 | Anotações Esfarrapadas de Miasma | 1/1 | Miasma +2x, Qi +10% |
| 2 | Manual Desbotado de Miasma | 1/50 | Miasma +5x, Qi +25% |
| 3 | Sutra da Praga Verdejante | 1/250 | Miasma +10x, Essence +15% |
| 4 | Codex do Veneno Oco | 1/1.25K | Miasma +20x, Damage +10% |
| 5 | Manual Vinculado a Remanescentes | 1/7.5K | Miasma +35x, Remnants +15% |
| 6 | Escritura do Lótus Grave | 1/50K | Miasma +50x, Soulfire +20% |
| 7 | Grimório do Meridiano do Vazio | 1/350K | Miasma +75x, Breakthrough +5% |
| 8 | Cânone da Estrela Pestilenta | 1/2.5M | Miasma +100x, Stars +20% |
| 9 | Escritura da Praga Eclipse | 1/25M | Miasma +150x, Quasar +15% |
| 10 | Sutra Primordial de Miasma | 1/250M | Miasma +250x, Laws +10% |
| 11 | Cânone do Imperador do Vazio Cinzento | 1/2.5B | Miasma +500x, All Stats +25% |

## Upgrade Board

A upgrade board de Miasma contém upgrades que aumentam seu ganho de miasma, dano e outros stats. Os upgrades disponíveis incluem:

- **More Miasma** — aumenta diretamente o multiplicador de miasma
- **More Manual Luck** — aumenta a sorte para drops de manuais
- **More Damage** — aumenta o dano no Underworld
- **More Mark Bulk** — aumenta o bulk das marcas

*Nota: Consulte o artigo "Ash Upgrade Tree" para os custos detalhados de cada upgrade.*

## Miasma Helper

### Configuração Inicial

Upgrade manuals and click on the miasma button and upgrade the more miasma multi until you can buy the Quasar boosts Miasma. This helps quite a bit with miasma gain.

### Manual Luck

Upgrade your manual luck upgrades as manuals are a great way to boost your miasma gain by a significant amount.

### Standing on Marks

Make sure you''re regularly standing on the mark until they start becoming slow to increase buffs. The first mark for example gives 47.5x miasma and is pretty quick to max out.

## Dicas de Progressão

1. **Comece com Spore** — ative o Miasma básico e ganhe Mark Speed.
2. **Seed é essencial** — fornece Breakthrough Luck que acelera todo o resto.
3. **Upgrade More Miasma** na upgrade board sempre que possível.
4. **Farm manuais** — cada manual é um multiplicador permanente e significativo.
5. **Vein** é um dos melhores tiers para farming de Breakthrough Luck.
6. **Combine com a Mark of Ash** quando desbloquear a segunda camada do Underworld.
7. **Abyssplague** é o ápice — exige 12M de Qi mas compensa com Breakthrough Luck massivo.',
      ARRAY['miasma', 'marks', 'guide', 'world-3']::TEXT[],
      'published',
      'miasma-guide'
    );
  END IF;

  RAISE NOTICE 'Seed V7 concluído: artigos Ash Upgrade Tree e Miasma Guide adicionados.';

END $$;

COMMIT;
