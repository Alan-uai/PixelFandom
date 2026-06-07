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

1. **Dim** — Luck x14.5
2. **Aware** — Qi x23.5, Luck x1.75, Insight x2.5
3. **Keen** — Luck x7, Insight x4
4. **Clear** — Qi x59.5, Luck x10, Insight x4, Essência x1.75
5. **Piercing** — Qi x112, Luck x11.5, Essência x3.5
6. **Deepseeing** — Qi x224.5, Insight x5.5, Soulfire x3.25
7. **Farsight** — Qi x374.5, Luck x20.5, Essência x5.5
8. **Truesight** — Luck x29.5, Insight x8.5, Soulfire x7, Stars x2.5, Mark Bulk +3.25, Mark Speed +2.88
9. **Omniscience** — Qi x749.5, Luck x44.5, Insight x14.5, Essência x14.5, Soulfire x11.5, Remnants x7, Mark Bulk +4, Mark Speed +4, Mark Luck +2.5

**Dicas:**
- **Dim** é sua primeira Mark — farme Luck para evoluir.
- **Truesight** é um marco importante: desbloqueia Stars, Mark Bulk e Mark Speed.
- **Omniscience** é o ápice do Mundo 1 para Insight — os multiplicadores disparam.
- Progressão: Dim → Aware → Keen → Clear → Piercing → Deepseeing → Farsight → Truesight → Omniscience.

---

### Mark of Essence (8 tiers)

As Marcas da Essência são a segunda família do Mundo 1. Oferecem altos multiplicadores de Essência combinados com Qi e Luck.

1. **Fragment** — Qi x44.5, Luck x82
2. **Shard** — Qi x82, Luck x44.5, Essência x172
3. **Node** — Luck x37, Insight x172
4. **Crest** — Qi x17.5, Luck x86.5, Essência x32.5
5. **Ruby** — Luck x59.5, Essência x62.5
6. **Nucleus** — Luck x52, Essência x89.5, Soulfire x3.25, Mark Speed +2.12
7. **Prism** — Qi x119.5, Insight x14.5, Essência x239.5, Remnants x3.25
8. **Eternal** — Qi x224.5, Luck x37, Essência x449.5, Soulfire x8.5, Stars x2.5, Mark Bulk +2.5, Mark Speed +2.5

**Dicas:**
- Essência escala muito rápido — Shard já dá x172 Essência.
- **Nucleus** introduz Soulfire e Mark Speed.
- **Eternal** é o topo: x449.5 Essência + bônus de Stars, Soulfire e bulk.

---

### Mark of Soulfire (8 tiers)

As Marcas da Alma de Fogo são a terceira família do Mundo 1. Combinam Soulfire com Remnants, Karma e bônus de bulk/velocidade.

1. **Mote** — Qi x14.5, Essência x11.5, Soulfire x2.5
2. **Kindling** — Luck x16, Insight x26.5, Soulfire x5.5
3. **Wraith** — Qi x11.5, Karma x2.5
4. **Pyre** — Luck x26.5, Soulfire x14.5, Remnants x5.5, Mark Speed +1.75
5. **Brand** — Qi x52, Luck x29.5, Karma x5.5
6. **Inferno** — Essência x37, Soulfire x29.5, Remnants x13, Mark Bulk +2.12
7. **Everflame** — Qi x121, Luck x44.5, Essência x59.5, Soulfire x44.5, Mark Bulk +2.5, Beast Core +1.38
8. **Soulnova** — Qi x271, Soulfire x91, Remnants x2.5, Mark Bulk +4, Mark Speed +3.25, Mark Luck +2.5

**Dicas:**
- **Pyre** é seu primeiro contato com Mark Speed.
- **Everflame** introduz Beast Core Chance — essencial para endgame.
- **Soulnova** é o ápice: x91 Soulfire com bônus massivos de bulk e speed.

---

### Mark of Karma (8 tiers)

As Marcas do Karma são a quarta e última família do Mundo 1. Únicas por terem custos massivos de Qi nos tiers mais altos (18.75K).

1. **Trace** — Qi x7, Karma x7
2. **Ledger** — Qi x7, Soulfire x5.5, Karma x5.5
3. **Burden** — Qi x5.5, Luck x10, Karma x5.5
4. **Mercy** — Qi x29.5, Luck x14.5, Remnants x2.5, Karma x8.5
5. **Balance** — Qi x29.5, Luck x22, Soulfire x7, Karma x2.5
6. **Reckoning** — Qi x56.5, Luck x19, Insight x23.5, Karma x2.5
7. **Samsara** — Qi x18.75K, Luck x187, Karma x4, Mark Bulk +4, Mark Speed +2.5
8. **Nirvana** — Qi x18.75K, Luck x562, Stars x4, Karma x19, Mark Bulk +2.5

**Dicas:**
- Karma é a última família do Mundo 1 — você precisará das outras Marcas primeiro.
- **Samsara** e **Nirvana** exigem 18.750 de Qi — um salto gigante dos tiers anteriores.
- **Nirvana** desbloqueia Stars (x4) e Karma x19 — essencial para transição ao Mundo 2.

---

## Mundo 2 — Marcas Cósmicas

### Mark of Stars (8 tiers)

As Marcas das Estrelas são a primeira família do Mundo 2. Os multiplicadores saltam para a casa dos milhares.

1. **Spark** — Luck x600, Stars x7.5
2. **Stardust** — Qi x600, Stars x18
3. **Astral** — Qi x1.5K, Luck x1.5K, Stars x24, Mark Bulk +3
4. **Comet** — Qi x2.4K, Luck x3K, Stars x30, Mark Bulk +10.5
5. **Radiant** — Qi x3.6K, Luck x3K, Nebulae x3
6. **Celestial** — Qi x1.2K, Luck x1.2K, Nebulae x2.25
7. **Supernova** — Qi x900, Luck x1.5K, Essência x7.5, Nebulae x22.5, Mark Speed +9
8. **Genesis** — Qi x3K, Luck x3K, Nebulae x9, Mark Bulk +3

**Dicas:**
- Os valores de Qi e Luck agora estão na casa dos milhares — prepare-se para grind pesado.
- **Radiant** e **Celestial** introduzem Nebulae.
- **Supernova** oferece x22.5 Nebulae + Mark Speed x9 — um dos melhores tiers para speed.

---

### Mark of Nebulae (8 tiers)

As Marcas das Nebulosas são a segunda família do Mundo 2. Combinam Karma massivo com multiplicadores de Nebulae e Stars.

1. **Mistglow** — Luck x3K, Nebulae x6.9, Karma x4.5K
2. **Gasveil** — Qi x4.5K, Luck x6K, Nebulae x8.1, Mark Speed +7.5
3. **Starseed** — Qi x3.75K, Luck x7.2K, Stars x18, Nebulae x9, Mark Bulk +3
4. **Moonwake** — Qi x2.4K, Luck x2.4K, Stars x60, Nebulae x30, Karma x2.25, Mark Speed +9
5. **Cometheart** — Qi x3.6K, Luck x3K, Nebulae x60, Mark Bulk +12
6. **Voidpetal** — Qi x1.5K, Luck x1.5K, Stars x30, Nebulae x30
7. **Novashard** — Qi x450, Luck x750, Essência x15, Nebulae x7.5, Karma x150, Mark Speed +6
8. **Astral Crown** — Qi x3K, Luck x1.5K, Nebulae x30, Karma x450, Mark Bulk +4.5

**Dicas:**
- **Mistglow** exige x4.5K Karma — um investimento pesado.
- **Moonwake** é um dos tiers mais balanceados: x60 Stars + x30 Nebulae + x9 Speed.
- **Cometheart** tem o maior Mark Bulk (x12) de todas as Marcas de Nebulae.

---

### Mark of Quasar (8 tiers)

As Marcas do Quasar são a terceira e última família do Mundo 2 — o ápice da progressão base.

1. **Flare** — Qi x12K, Quasar x450
2. **Vanta** — Luck x12K, Nebulae x24, Karma x6K, Quasar x198
3. **Sear** — Qi x18K, Stars x72, Karma x4.5K, Quasar x168, Mark Bulk +4.5
4. **Halo** — Qi x4.5K, Karma x9K, Quasar x198, Mark Luck +2.25
5. **Lumen** — Qi x9K, Luck x4.5K, Quasar x222, Mark Bulk +18
6. **Surge** — Qi x4.8K, Remnants x4.5, Quasar x390
7. **Corona** — Qi x4.5K, Luck x4.5K, Karma x3K, Quasar x180
8. **Zenith** — Qi x12K, Quasar x360, Mark Bulk +4.5, Mark Luck +6

**Dicas:**
- Quasar é o endgame — os requisitos de Qi chegam a x18K.
- **Sear** exige mais Qi que qualquer outra Mark (x18K).
- **Surge** tem o maior multiplicador de Quasar puro (x390).
- **Zenith** é a Mark final: combine Mark Bulk x4.5 com Mark Luck x6.

---

## Underworld (W3)

### Mark of Miasma (8 tiers)

A primeira camada do Underworld. Marca focada em Breakthrough Luck, Miasma e dano.

1. **Spore** — Miasma x32, Quasar +56, Mark Speed +18
2. **Seed** — Miasma x48, Mark Bulk +8, Breakthrough Luck +8K
3. **Rotbrand** — Miasma x86, Qi +128K, Stars +512
4. **Vein** — Miasma x144, Breakthrough Luck +256K, Damage +2
5. **Bloom** — Miasma x56, Qi +336K, Stars +128, Mark Luck +2, Beast Remnants +12
6. **Wormmoon** — Miasma x72, Qi +4.8M, Breakthrough Luck +4.8M
7. **Tombmire** — Miasma x20, Qi +1.2M, Mark Bulk +2, Mark Speed +3, Breakthrough Luck +1.6M
8. **Abyssplague** — Miasma x32, Qi +12M, Breakthrough Luck +12M, Manual Luck +2

> Veja o **[Guia de Miasma](/w/immortality-incremental/miasma-guide)** para manuais, upgrade board e estratégias de progressão.

### Mark of Ash (8 tiers)

A segunda camada do Underworld. Focada em poder bruto e upgrades de dano.

> Veja a **[Árvore de Upgrades Ash](/w/immortality-incremental/ash-upgrade-tree)** para detalhes completos dos tiers e custos.

### Mark of Laws (8 tiers)

A família mais poderosa do jogo. Marcas que manipulam as leis da realidade com multiplicadores astronômicos.

1. **Edict** — Laws x7.5, Mark Bulk +2
2. **Clause** — Laws x11.5, Mark Bulk +4.5
3. **Verdict** — Qi x512M, Insight x1B, Essence x1B, Laws x11.5
4. **Tribunal** — Laws x7.5, Mark Speed +2.75, Mark Luck +2.5, Damage +2
5. **Mandate** — Laws x17.5, Soulfire x1B, Karma x1B
6. **Decree** — Laws x7.5, Stars x1B, Nebulae x1B, Mark Bulk +4, Mark Speed +32.5
7. **Statute** — Laws x22.5, Qi x5B, Luck x4M
8. **Absolute** — Laws x37.5, Quasar x1B, Mark Bulk +7.5, Mark Speed +7.5, Mark Luck +2

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
