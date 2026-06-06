# Seed Data — Immortality Incremental Wiki

> **Wiki:** Immortality Incremental
> **Slug:** `immortality-incremental`
> **Owner:** `aymatsu00@gmail.com`
> **Data de criação:** Junho 2026

---

## Sumário

- [1. Tenant](#1-tenant)
- [2. Tabela `marks`](#2-tabela-marks)
  - [Mundo 1 — Mark of Insight](#mundo-1--mark-of-insight)
  - [Mundo 1 — Mark of Essence](#mundo-1--mark-of-essence)
  - [Mundo 1 — Mark of Soulfire](#mundo-1--mark-of-soulfire)
  - [Mundo 1 — Mark of Karma](#mundo-1--mark-of-karma)
  - [Mundo 2 — Mark of Stars](#mundo-2--mark-of-stars)
  - [Mundo 2 — Mark of Nebulae](#mundo-2--mark-of-nebulae)
  - [Mundo 2 — Mark of Quasar](#mundo-2--mark-of-quasar)
- [3. Artigos](#3-artigos)
- [4. Config do Jogo](#4-config-do-jogo)
- [5. Landing Page](#5-landing-page)

---

## 1. Tenant

```sql
name:        Immortality Incremental
slug:        immortality-incremental
description: Wiki colaborativa sobre Immortality Incremental — um jogo incremental
             de grind e progressão no Roblox. Domine as Marcas da Percepção,
             Essência, Soulfire, Karma, Estrelas, Nebulosas e Quasar através de
             dois mundos.
is_public:   true
ai_enabled:  true
theme:       primary=270° 80% 55% (púrpura), bg=260° 30% 8% (preto cósmico)
```

## 2. Tabela `marks`

Tabela única unificada com **57 registros** (7 famílias × 8 tiers, exceto Insight com 9).

**Colunas da tabela:**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `name` | TEXT | Nome do tier |
| `slug` | TEXT | Identificador único |
| `description` | TEXT | Descrição do tier |
| `mark_type` | TEXT | Tipo: insight, essence, soulfire, karma, stars, nebulae, quasar |
| `world` | INTEGER | Mundo: 1 ou 2 |
| `tier` | INTEGER | Ordem de progressão (1-9) |
| `qi_mult` | NUMERIC | Multiplicador de Qi |
| `luck_mult` | NUMERIC | Multiplicador de Luck |
| `insight_mult` | NUMERIC | Multiplicador de Insight |
| `essence_mult` | NUMERIC | Multiplicador de Essence |
| `soulfire_mult` | NUMERIC | Multiplicador de Soulfire |
| `remnants_mult` | NUMERIC | Multiplicador de Remnants |
| `stars_mult` | NUMERIC | Multiplicador de Stars |
| `nebula_mult` | NUMERIC | Multiplicador de Nebulae |
| `karma_mult` | NUMERIC | Multiplicador de Karma |
| `quasar_mult` | NUMERIC | Multiplicador de Quasar |
| `mark_bulk` | NUMERIC | Bônus de Mark Bulk |
| `mark_speed` | NUMERIC | Bônus de Mark Speed |
| `mark_luck` | NUMERIC | Bônus de Mark Luck |
| `beast_core_chance` | NUMERIC | Chance de Beast Core |

---

### Mundo 1 — Mark of Insight

| # | Tier | Qi | Luck | Insight | Essence | Soulfire | Remnants | Stars | Mark Bulk | Mark Speed | Mark Luck |
|---|------|----|------|---------|---------|----------|----------|-------|-----------|------------|-----------|
| 1 | Dim | — | x14.5 | — | — | — | — | — | — | — | — |
| 2 | Aware | x23.5 | x1.75 | x2.5 | — | — | — | — | — | — | — |
| 3 | Keen | — | x7 | x4 | — | — | — | — | — | — | — |
| 4 | Clear | x59.5 | x10 | x4 | x1.75 | — | — | — | — | — | — |
| 5 | Piercing | x112 | x11.5 | — | x3.5 | — | — | — | — | — | — |
| 6 | Deepseeing | x224.5 | — | x5.5 | — | x3.25 | — | — | — | — | — |
| 7 | Farsight | x374.5 | x20.5 | — | x5.5 | — | — | — | — | — | — |
| 8 | Truesight | — | x29.5 | x8.5 | — | x7 | — | x2.5 | x3.25 | x2.88 | — |
| 9 | Omniscience | x749.5 | x44.5 | x14.5 | x14.5 | x11.5 | x7 | — | x4 | x4 | x2.5 |

### Mundo 1 — Mark of Essence

| # | Tier | Qi | Luck | Insight | Essence | Soulfire | Remnants | Stars | Mark Bulk | Mark Speed |
|---|------|----|------|---------|---------|----------|----------|-------|-----------|------------|
| 1 | Fragment | x44.5 | x82 | — | — | — | — | — | — | — |
| 2 | Shard | x82 | x44.5 | — | x172 | — | — | — | — | — |
| 3 | Node | — | x37 | x172 | — | — | — | — | — | — |
| 4 | Crest | x17.5 | x86.5 | — | x32.5 | — | — | — | — | — |
| 5 | Ruby | — | x59.5 | — | x62.5 | — | — | — | — | — |
| 6 | Nucleus | — | x52 | — | x89.5 | x3.25 | — | — | — | x2.12 |
| 7 | Prism | x119.5 | — | x14.5 | x239.5 | — | x3.25 | — | — | — |
| 8 | Eternal | x224.5 | x37 | — | x449.5 | x8.5 | — | x2.5 | x2.5 | x2.5 |

### Mundo 1 — Mark of Soulfire

| # | Tier | Qi | Luck | Insight | Essence | Soulfire | Remnants | Karma | Mark Bulk | Mark Speed | Mark Luck | Beast Core |
|---|------|----|------|---------|---------|----------|----------|-------|-----------|------------|-----------|------------|
| 1 | Mote | x14.5 | — | — | x11.5 | x2.5 | — | — | — | — | — | — |
| 2 | Kindling | — | x16 | x26.5 | — | x5.5 | — | — | — | — | — | — |
| 3 | Wraith | x11.5 | — | — | — | — | — | x2.5 | — | — | — | — |
| 4 | Pyre | — | x26.5 | — | — | x14.5 | x5.5 | — | — | x1.75 | — | — |
| 5 | Brand | x52 | x29.5 | — | — | — | — | x5.5 | — | — | — | — |
| 6 | Inferno | — | — | — | x37 | x29.5 | x13 | — | x2.12 | — | — | — |
| 7 | Everflame | x121 | x44.5 | — | x59.5 | x44.5 | — | — | x2.5 | — | — | x1.38 |
| 8 | Soulnova | x271 | — | — | — | x91 | x2.5 | — | x4 | x3.25 | x2.5 | — |

### Mundo 1 — Mark of Karma

| # | Tier | Qi | Luck | Essence | Soulfire | Remnants | Stars | Karma | Mark Bulk | Mark Speed |
|---|------|----|------|---------|----------|----------|-------|-------|-----------|------------|
| 1 | Trace | x7 | — | — | — | — | — | x7 | — | — |
| 2 | Ledger | x7 | — | — | x5.5 | — | — | x5.5 | — | — |
| 3 | Burden | x5.5 | x10 | — | — | — | — | x5.5 | — | — |
| 4 | Mercy | x29.5 | x14.5 | — | — | x2.5 | — | x8.5 | — | — |
| 5 | Balance | x29.5 | x22 | — | x7 | — | — | x2.5 | — | — |
| 6 | Reckoning | x56.5 | x19 | x23.5 | — | — | — | x2.5 | — | — |
| 7 | Samsara | x18.75K | x187 | — | — | — | — | x4 | x4 | x2.5 |
| 8 | Nirvana | x18.75K | x562 | — | — | — | x4 | x19 | x2.5 | — |

> **Nota:** Samsara e Nirvana custam 18.750 Qi (18.75K).

### Mundo 2 — Mark of Stars

| # | Tier | Qi | Luck | Essence | Stars | Nebulae | Mark Bulk | Mark Speed |
|---|------|----|------|---------|-------|---------|-----------|------------|
| 1 | Spark | — | x600 | — | x7.5 | — | — | — |
| 2 | Stardust | x600 | — | — | x18 | — | — | — |
| 3 | Astral | x1.5K | x1.5K | — | x24 | — | x3 | — |
| 4 | Comet | x2.4K | x3K | — | x30 | — | x10.5 | — |
| 5 | Radiant | x3.6K | x3K | — | — | x3 | — | — |
| 6 | Celestial | x1.2K | x1.2K | — | — | x2.25 | — | — |
| 7 | Supernova | x900 | x1.5K | x7.5 | — | x22.5 | — | x9 |
| 8 | Genesis | x3K | x3K | — | — | x9 | x3 | — |

### Mundo 2 — Mark of Nebulae

| # | Tier | Qi | Luck | Essence | Stars | Nebulae | Karma | Mark Bulk | Mark Speed |
|---|------|----|------|---------|-------|---------|-------|-----------|------------|
| 1 | Mistglow | — | x3K | — | — | x6.9 | x4.5K | — | — |
| 2 | Gasveil | x4.5K | x6K | — | — | x8.1 | — | — | x7.5 |
| 3 | Starseed | x3.75K | x7.2K | — | x18 | x9 | — | x3 | — |
| 4 | Moonwake | x2.4K | x2.4K | — | x60 | x30 | x2.25 | — | x9 |
| 5 | Cometheart | x3.6K | x3K | — | — | x60 | — | x12 | — |
| 6 | Voidpetal | x1.5K | x1.5K | — | x30 | x30 | — | — | — |
| 7 | Novashard | x450 | x750 | x15 | — | x7.5 | x150 | — | x6 |
| 8 | Astral Crown | x3K | x1.5K | — | — | x30 | x450 | x4.5 | — |

### Mundo 2 — Mark of Quasar

| # | Tier | Qi | Luck | Stars | Nebulae | Karma | Remnants | Quasar | Mark Bulk | Mark Luck |
|---|------|----|------|-------|---------|-------|----------|--------|-----------|-----------|
| 1 | Flare | x12K | — | — | — | — | — | x450 | — | — |
| 2 | Vanta | — | x12K | — | x24 | x6K | — | x198 | — | — |
| 3 | Sear | x18K | — | x72 | — | x4.5K | — | x168 | x4.5 | — |
| 4 | Halo | x4.5K | — | — | — | x9K | — | x198 | — | x2.25 |
| 5 | Lumen | x9K | x4.5K | — | — | — | — | x222 | x18 | — |
| 6 | Surge | x4.8K | — | — | — | — | x4.5 | x390 | — | — |
| 7 | Corona | x4.5K | x4.5K | — | — | x3K | — | x180 | — | — |
| 8 | Zenith | x12K | — | — | — | — | — | x360 | x4.5 | x6 |

---

## 3. Artigos

12 artigos criados na tabela `wiki_articles`:

| # | Título | Tags | Ícone |
|---|--------|------|-------|
| 1 | Immortality Incremental — Visão Geral | visão-geral, introdução, guia | 📖 |
| 2 | Marcas da Percepção (Mark of Insight) | insight, percepção, guia, mundo-1 | 👁️ |
| 3 | Marcas da Essência (Mark of Essence) | essência, essence, guia, mundo-1 | 💎 |
| 4 | Marcas da Alma de Fogo (Mark of Soulfire) | soulfire, alma, fogo, guia, mundo-1 | 🔥 |
| 5 | Marcas do Karma (Mark of Karma) | karma, guia, mundo-1 | ☯️ |
| 6 | Marcas das Estrelas (Mark of Stars) | stars, estrelas, guia, mundo-2 | ⭐ |
| 7 | Marcas das Nebulosas (Mark of Nebulae) | nebulae, nebulosas, guia, mundo-2 | 🌌 |
| 8 | Marcas do Quasar (Mark of Quasar) | quasar, guia, mundo-2 | 💫 |
| 9 | Guia de Progressão — Mundo 1 | progressão, guia, mundo-1, iniciante | 🗺️ |
| 10 | Guia de Progressão — Mundo 2 | progressão, guia, mundo-2, endgame | 🚀 |
| 11 | Tier List — Melhores Marcas | tier-list, ranking, melhores | 🏆 |
| 12 | Sistema de Crafting e Evolução | crafting, evolução, mecânicas, guia | ⚒️ |

## 4. Config do Jogo

Duas entradas em `game_config` (chave-valor):

| Chave | Valor |
|-------|-------|
| `gameDataVersion` | `"1.0.0"` |
| `allGameData` | `{}` |

## 5. Landing Page

Layout no `tenant_pages` com:

1. **Hero block** — Título + subtítulo + CTA
2. **Featured List** — Marcas do Mundo 1 (4 itens)
3. **Featured List** — Marcas do Mundo 2 (3 itens)
4. **Rich Text** — Descrição do jogo

---

## Arquivo SQL

O script de seed está em `supabase/seeds/seed_immortality_incremental.sql`.

Para executar:

1. Acesse o SQL Editor do Supabase (Dashboard → SQL Editor)
2. Cole o conteúdo do arquivo
3. Execute

O script é **idempotente** — pode ser executado múltiplas vezes sem duplicar dados.
