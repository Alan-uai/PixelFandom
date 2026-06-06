-- ============================================================
-- Seed V8: Immortality Incremental — Body Tempering Guide
-- Run AFTER seed_immortality_incremental_v7.sql
-- Adiciona artigo wiki sobre o sistema de Body Tempering.
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
    WHERE tenant_id = v_tenant_id AND slug = 'body-tempering-guide'
  ) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    VALUES (
      v_tenant_id,
      v_user_id,
      'Guia de Body Tempering',
      'Visão geral do sistema de Body Tempering — lista completa dos níveis conhecidos, requisitos de realm e dicas de progressão.',
      '# Guia de Body Tempering

## Visão Geral

Body Tempering é um sistema de progressão que concede **boosts permanentes** ao atingir determinados marcos de realm. Cada nível de Body Tempering desbloqueia um novo conjunto de bônus e, a partir do World 3 Part 2, cada nível também concede uma **aura visual** ao redor do personagem.

---

## Níveis Conhecidos

| Body Tempering | Realm Requerido | Bônus |
|----------------|-----------------|-------|
| *(primeiro)* | 30 | x2 Luck, x3 Qi, x5 Insight |
| *(sem nome)* | 85 | Desbloqueia Soulfire + Beast Hunt |
| *(sem nome)* | 100 | x5 Soulfire |
| *(sem nome)* | 110 | Desbloqueia Karma |
| Solar | 170 | x10 Star |
| Spectral | 250 | *Em breve* |
| Dreadflame | 275 | *Em breve* |
| Imperial | *Em breve* | *Em breve* |

## Observações

- **#30** — primeiro Body Tempering, desbloqueia Insight e Essência. Concede x2 Luck, x3 Qi, x5 Insight.
- **#85** — desbloqueia Soulfire e Beast Hunt.
- **#100** — concede x5 Soulfire e outros multiplicadores úteis.
- **#110** — desbloqueia Karma.
- **Solar (170)** — introduzido no World 2 Part 2. Concede x10 Star. Desenhado para auxiliar novos jogadores no World 2.
- **Spectral (250)** — introduzido no World 3 Part 1.
- **Dreadflame (275)** — introduzido no World 3 Part 2.
- **Imperial** — introduzido no World 4 Update.
- Três níveis adicionais foram mencionados em updates (Weekly, Mini, W4) mas requisitos ainda não confirmados.
- Cada nível de Body Tempering concede uma aura visual ao redor do personagem (adicionado no World 3 Part 2).

## Progressão Recomendada

1. **#30** — primeiro marco, foco em Insight e Essência.
2. **#85** — desbloqueie Soulfire e Beast Hunt para acelerar.
3. **#100** — Soulfire boost para preparar o Karma.
4. **#110** — Karma desbloqueado, mude o foco.
5. **Solar (170)** — necessário para avançar no World 2.
6. **Spectral (250)** — necessário para o Underworld (World 3).
7. **Dreadflame (275)** — prepara para o endgame do World 3.
8. Continue avançando nos realms até desbloquear os próximos níveis.',
      ARRAY['body-tempering', 'progression', 'guide', 'world-3']::TEXT[],
      'published',
      'body-tempering-guide'
    );
  END IF;

  RAISE NOTICE 'Seed V8 concluído: artigo Body Tempering Guide adicionado.';

END $$;

COMMIT;
