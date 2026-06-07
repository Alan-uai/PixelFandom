-- ============================================================
-- Seed V10: Immortality Incremental — Merge Mark Families
-- Run AFTER seed_immortality_incremental_v9.sql
-- Remove 7 individual mark articles and merge data into
-- a single comprehensive "Famílias de Marcas" article (slug: mark-families).
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
  -- Part 1: Delete individual mark family articles
  -- ============================================================
  DELETE FROM wiki_articles
  WHERE tenant_id = v_tenant_id AND title IN (
    'Marcas da Percepção (Mark of Insight)',
    'Marcas da Essência (Mark of Essence)',
    'Marcas da Alma de Fogo (Mark of Soulfire)',
    'Marcas do Karma (Mark of Karma)',
    'Marcas das Estrelas (Mark of Stars)',
    'Marcas das Nebulosas (Mark of Nebulae)',
    'Marcas do Quasar (Mark of Quasar)'
  );

  -- ============================================================
  -- Part 2: Rename & update Famílias de Marcas → mark-families
  -- ============================================================
  UPDATE wiki_articles SET
    slug = 'mark-families',
    title = 'Famílias de Marcas',
    summary = 'Guia completo de todas as famílias de marcas de Immortality Incremental — tiers, bônus e dicas de progressão dos 2 mundos e Underworld.',
    content = '# Famílias de Marcas

## Visão Geral

Immortality Incremental possui **11 famílias de marcas** distribuídas em 2 mundos e no Underworld (W3). Cada família tem seu próprio estilo e bônus — dominar todas as 57 marcas é o caminho para a imortalidade.

---

## Mundo 1 — Marcas da Percepção à Alma

### Mark of Insight (9 tiers)

As Marcas da Percepção são a primeira família encontrada no Mundo 1. Focam em multiplicar Qi, Luck e Insight.

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

**Dicas:**
- **Dim** é sua primeira Mark — farme Luck para evoluir.
- **Truesight** é um marco importante: desbloqueia Stars, Mark Bulk e Mark Speed.
- **Omniscience** é o ápice do Mundo 1 para Insight — os multiplicadores disparam.
- Progressão: Dim → Aware → Keen → Clear → Piercing → Deepseeing → Farsight → Truesight → Omniscience.

---

### Mark of Essence (8 tiers)

As Marcas da Essência são a segunda família do Mundo 1. Oferecem altos multiplicadores de Essência combinados com Qi e Luck.

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

**Dicas:**
- Essência escala muito rápido — Shard já dá x172 Essência.
- **Nucleus** introduz Soulfire e Mark Speed.
- **Eternal** é o topo: x449.5 Essência + bônus de Stars, Soulfire e bulk.

---

### Mark of Soulfire (8 tiers)

As Marcas da Alma de Fogo são a terceira família do Mundo 1. Combinam Soulfire com Remnants, Karma e bônus de bulk/velocidade.

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

**Dicas:**
- **Pyre** é seu primeiro contato com Mark Speed.
- **Everflame** introduz Beast Core Chance — essencial para endgame.
- **Soulnova** é o ápice: x91 Soulfire com bônus massivos de bulk e speed.

---

### Mark of Karma (8 tiers)

As Marcas do Karma são a quarta e última família do Mundo 1. Únicas por terem custos massivos de Qi nos tiers mais altos (18.75K).

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

**Dicas:**
- Karma é a última família do Mundo 1 — você precisará das outras Marcas primeiro.
- **Samsara** e **Nirvana** exigem 18.750 de Qi — um salto gigante dos tiers anteriores.
- **Nirvana** desbloqueia Stars (x4) e Karma x19 — essencial para transição ao Mundo 2.

---

## Mundo 2 — Marcas Cósmicas

### Mark of Stars (8 tiers)

As Marcas das Estrelas são a primeira família do Mundo 2. Os multiplicadores saltam para a casa dos milhares.

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

**Dicas:**
- Os valores de Qi e Luck agora estão na casa dos milhares — prepare-se para grind pesado.
- **Radiant** e **Celestial** introduzem Nebulae.
- **Supernova** oferece x22.5 Nebulae + Mark Speed x9 — um dos melhores tiers para speed.

---

### Mark of Nebulae (8 tiers)

As Marcas das Nebulosas são a segunda família do Mundo 2. Combinam Karma massivo com multiplicadores de Nebulae e Stars.

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

**Dicas:**
- **Mistglow** exige x4.5K Karma — um investimento pesado.
- **Moonwake** é um dos tiers mais balanceados: x60 Stars + x30 Nebulae + x9 Speed.
- **Cometheart** tem o maior Mark Bulk (x12) de todas as Marcas de Nebulae.

---

### Mark of Quasar (8 tiers)

As Marcas do Quasar são a terceira e última família do Mundo 2 — o ápice da progressão base.

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

**Dicas:**
- Quasar é o endgame — os requisitos de Qi chegam a x18K.
- **Sear** exige mais Qi que qualquer outra Mark (x18K).
- **Surge** tem o maior multiplicador de Quasar puro (x390).
- **Zenith** é a Mark final: combine Mark Bulk x4.5 com Mark Luck x6.

---

## Underworld (W3)

### Mark of Miasma (8 tiers)

A primeira camada do Underworld. Marca focada em Breakthrough Luck e dano.

> Veja o **[Guia de Miasma](/w/immortality-incremental/miasma-guide)** para a tabela completa de tiers, manuais e estratégias de progressão.

### Mark of Ash (8 tiers)

A segunda camada do Underworld. Focada em poder bruto e upgrades de dano.

> Veja a **[Árvore de Upgrades Ash](/w/immortality-incremental/ash-upgrade-tree)** para detalhes completos dos tiers e custos.

### Mark of Laws (8 tiers)

*Em breve* — informações serão adicionadas quando disponíveis.

### Mark of Reputation (5 tiers)

*Em breve* — informações serão adicionadas quando disponíveis.

---

**Total: 7 famílias principais + 4 do Underworld = 57 tiers de marcas para dominar!**',
    tags = ARRAY['marcas', 'familias', 'guia']::TEXT[],
    updated_at = now()
  WHERE tenant_id = v_tenant_id AND slug = 'fam-lias-de-marcas';

  -- ============================================================
  -- Part 3: Update landing page CTA to point to mark-families
  -- ============================================================
  UPDATE tenant_pages SET
    layout = jsonb_set(
      layout,
      '{blocks,0,config,ctaUrl}',
      '"/w/immortality-incremental/mark-families"'
    )
  WHERE tenant_id = v_tenant_id AND page_type = 'landing';

  RAISE NOTICE 'Seed V10 concluído: artigos individuais deletados, mark-families populado, landing page atualizada.';

END $$;

COMMIT;
