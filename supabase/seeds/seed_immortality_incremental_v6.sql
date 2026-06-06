-- ============================================================
-- Seed V6: Immortality Incremental — Secret & Universal Marks
-- Run AFTER seed_immortality_incremental_v5.sql
-- Adiciona artigo wiki sobre Marcas Secretas e Universais.
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

  IF NOT EXISTS (
    SELECT 1 FROM wiki_articles
    WHERE tenant_id = v_tenant_id AND slug = 'marcas-secretas-e-universais'
  ) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    VALUES (
      v_tenant_id,
      v_user_id,
      'Marcas Secretas e Universais',
      'Guia das Marcas Secretas (rollables ocultos nas marcas regulares) e das Marcas Universais (compartilhadas globalmente).',
      '# Marcas Secretas e Universais

## Marcas Secretas

Marcas Secretas são rollables especiais escondidos dentro de marcas regulares. Cada uma concede um bônus único e permanente.

| Marca | Nome | Bônus |
|-------|------|-------|
| **Soulfire** | — | *Em breve* |
| **Karma** | Revenge | x2 Remnants, x1.5 Damage, +2 Mark Clones |
| **Quasar** | Apotheosis | x1.8M Qi, x1.8M Luck, x20 Miasma, x30 Ash, x2 Manual Luck, x6 Mark Bulk |
| **Laws** | — | *Em breve* |

### Dicas

- Os rollables secretos têm uma chance de drop reduzida em comparação com rollables normais.
- O drop rate do secret mark mais recente foi reduzido em 5x em novos servidores.
- Fique atento a dicas espalhadas nas descrições das marcas e update logs.

## Marcas Universais

Marcas Universais são uma categoria especial de marcas que funcionam de forma comunitária: quando qualquer jogador compra uma marca universal, **todos os jogadores online no momento da compra** recebem seus bônus.

### Mark of Unity

A Mark of Unity é a primeira marca universal disponível. Possui 5 tiers, cada um concedendo bônus cumulativos.

| Tier | Nome | Bônus |
|------|------|-------|
| 1 | Stranger | x100 Qi, x100 Luck |
| 2 | Acquaintance | x20 Qi, x50 Insight, x30 Essence |
| 3 | Friend | x100 Essence, x150 Soulfire, x5 Mark Bulk, x3 Mark Luck |
| 4 | Champion | x200 Qi, x200 Karma, x2 Beast Core Chance, x5 Mark Luck |
| 5 | Legend | x500 Qi, x500 Luck, x10 Remnants, x3 Mark Bulk, x3 Mark Speed, +3 Mark Clone |

### Estratégia

- Coordene com outros jogadores para maximizar o momento da compra — quanto mais gente online, maior o impacto coletivo.
- Os bônus são cumulativos entre tiers: um jogador que presenciou todas as 5 compras recebe o total acumulado de todos os tiers.',
      ARRAY['marcas', 'secret-mark', 'universal-mark', 'guia']::TEXT[],
      'published',
      'marcas-secretas-e-universais'
    );
  END IF;

  RAISE NOTICE 'Seed V6 concluído: artigo Marcas Secretas e Universais adicionado/atualizado.';

END $$;

COMMIT;
