-- ============================================================
-- Seed V9: Immortality Incremental — Progression Guide
-- Run AFTER seed_immortality_incremental_v8.sql
-- Adiciona guia de progressão W1→W3 e atualiza o artigo
-- de Body Tempering com novos níveis.
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
  -- Part 1: Update Body Tempering article with new levels
  -- ============================================================
  UPDATE wiki_articles SET
    content = '# Guia de Body Tempering

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
    updated_at = now()
  WHERE tenant_id = v_tenant_id AND slug = 'body-tempering-guide';

  -- ============================================================
  -- Part 2: Progression Guide article
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1 FROM wiki_articles
    WHERE tenant_id = v_tenant_id AND slug = 'progression-guide'
  ) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    VALUES (
      v_tenant_id,
      v_user_id,
      'Guia de Progressão',
      'Guia passo a passo de progressão do World 1 ao World 3 — Insight, Essência, Soulfire, Karma, Stars, Nebulae, Quasar e preparação para o Underworld.',
      '# Guia de Progressão

**Nota:** W1 e W2 já concluídos e lançados. W3 ainda em desenvolvimento.

---

## Insight

Após finalizar o tutorial, o objetivo é alcançar **Realm #30** para conseguir o primeiro Body Tempering, que desbloqueia uma nova moeda e concede:
- **x2 Luck, x3 Qi, x5 Insight**

Continue progredindo com upgrades de **Insight**. À direita da board de Body Tempering você encontrará a nova moeda **Essence**. É recomendado começar a upgrade da board de Essence assim que desbloqueada, para acessar a board "Extra upgrades" que concede multiplicadores de Qi, Luck e Insight.

As marks são essenciais para o endgame. **100k–200k de Insight** é um bom amount para começar a abrir a "Mark of Insight" pela primeira vez. No início você não conseguirá obter as marks mais raras por causa dos stats baixos.

Após farmar Insight e a Mark of Insight, você vai sentir que está travado. A solução é focar mais nos upgrades de **Essence**. Com isso, você maxeia todos os upgrades de Insight e pode migrar para a próxima moeda.

As marks da "Mark of Insight" que podem ser maxadas neste ponto são as primeiras 6 do índice. A 7ª será obtível mas precisará de tempo AFK para maxar.

---

## Essência & Soulfire

Agora o foco é farmar upgrades de **Essence** até alcançar **Realm #85** para o próximo Body Tempering, que desbloqueia **Soulfire** e **Beast Hunt**.

Neste ponto a progressão fica mais difícil. Após o Body Tempering, continue farmando Essence até conseguir **1 Trilhão de Essence** sem problemas e comece a abrir a "Mark of Essence" para um bom boost.

Feito isso, o objetivo é **Realm #100** para o Body Tempering que concede **x5 Soulfire** e outros multiplicadores úteis.

Farme Soulfire e compre o upgrade "Soul Automations". Abra algumas "Mark of Soulfire" maxando pelo menos as primeiras 3 do índice. Continue farmando Soulfire até **Realm #110** para o próximo Body Tempering, que desbloqueia **Karma**.

Diferente das outras moedas do W1, Karma não tem uma upgrade board — tem um sistema de **milestones**.

---

## Karma

Karma fica à direita do Beast Hunt, perto do portal para o World 2.

1. Fique no botão até alcançar o **milestone de 10K Karma**
2. Volte para Soulfire, abra algumas "Mark of Soulfire" para comprar o upgrade "Soulfire boost Karma"
3. Junte mais Soulfire até alcançar o **milestone de 1M Karma**
4. Agora você tem stats suficientes para abrir a primeira "Mark of Karma"
5. Alcance **50M de Karma** e continue abrindo "Mark of Karma"
6. Alcance o **milestone de 50B Karma**
7. Volte para upgrades de Soulfire e tente maxar as primeiras 6 marks da "Mark of Soulfire"
8. Maxe as primeiras 5 marks da "Mark of Karma"
9. Farme mais Soulfire para aumentar o multiplicador de Karma

Com tudo isso feito, você pode ir para o **milestone de 10T Karma** ou entrar no W2 ao atingir **Realm #135**.

---

## Pré-World 2

Antes de progredir no W2, você **deve** alcançar **Beast Stage 50** para ganhar o multiplicador **x6 Stars** do Beast Milestone. Com os Lesser Cores obtidos, role Bloodlines e equipe a que boostar seus stats para as moedas que você está farmando no momento.

---

## Stars

Ao entrar no W2, à direita do spawn você encontra a board de upgrades de **Star** e a "Mark of Star".

Tendo alcançado Beast Stage 50 antes de entrar no W2, Star será fácil de aumentar no começo. Foque em upgrades de Star (em vez de Qi e Luck). Com **15M de Star**, abra a "Mark of Star" para um boost.

Você vai travar em Star sem o **Solar Body Tempering** no **Realm #170** (que concede **x10 Star**). Para conseguir, volte ao W1:

1. Maxe as primeiras 7 marks da "Mark of Essence" (se ainda não tiver)
2. Obtenha a melhor ou segunda melhor Bloodline: **Dragon** ou **Qilin** — maxe a que conseguir primeiro
3. Farme no Beast Stage mais alto que você conseguir oneshot com **Luck Focus** (na área de Soulfire)
4. Enquanto farma Lesser Cores, upgrade a board de Beast Hunt até **Beast Stage 61** para aumento de drop chance
5. Com Dragon ou Qilin maxada, alcance **Beast Stage 75** para o segundo Beast Milestone (x6 Nebula)

Agora volte para upgrades de Star. Quando chegar na casa dos **Trilhões de Star**:

1. Vá ao W1 e maxe a "Mark of Karma" para **x3 Star**
2. Maxe a mark **Everflame** na "Mark of Soulfire"
3. Use uma de cada poção (exceto a roxa de Breakthrough Luck) para maxar a 8ª mark da "Mark of Insight" (**x2 Star**, max 20 units)
4. **Pause as poções** clicando no ícone de poções no canto inferior esquerdo
5. Vá para "Mark of Essence", **despause as poções** e maxe (mais **x2 Star**, max 20 units)
6. **Pause as poções novamente**

Retorne ao W2, pegue 10 orbs e abra "Mark of Star". Continue farmando Star. Quando tiver Qi de Star, AFK a "Mark of Star" até maxar a primeira mark do índice. Farme mais Star para upgrade de Qi e Luck. Ao atingir **Realm #170**, faça o Body Tempering para **x10 Star**.

Maxe Soulfire e retorne ao W2 para desbloquear **Nebulae**.

---

## Nebulae

Junte Star e reset. No começo, foque em upgrades de **Nebulae** e **Star multiplier**. O resto vai para "Marks Boost" e "Mark of Nebulae".

Quando alcançar **Dc de Star**, compre **Auto Soulfire** e **Auto Soulfire Upgrades** na board de Star, para não precisar voltar ao W1 após body temper.

Com Nebulae e Star multiplier maxados, você deve ter cerca de **Sx de Nebulae**. Abra "Mark of Nebulae" até seu MPS chegar em **Qa** e então troque para "Mark of Star". Ao atingir **Qi de MPS**, reset, upgrade "Mark Boost" na board de Nebulae e com o restante abra "Mark of Nebulae" até **Sx de MPS**. Neste ponto você provavelmente terá maxado a 1ª e 4ª marks da "Mark of Nebulae".

Vá ao W1 e alcance o **milestone de 1No de Karma** para **x1k Nebulae**. Volte ao W2, abra "Mark of Star" até maxar todas as marks do índice. Reset novamente e upgrade toda a board de Nebulae. **Quasar** está desbloqueado.

---

## Quasar

Assim que desbloquear Quasar:

1. Comece a meditar para aumentar proficiência
2. Leve o multiplicador de **Quasar para 19**
3. Depois, leve o multiplicador de **Karma para 15**
4. Vá ao W1 para o **milestone de 500Dd Karma** (dá **x4 Quasar**)
5. Continue focando no multiplicador de Quasar até ter **Trilhões de Quasar**
6. Abra "Mark of Quasar": **170B da 1ª mark (Flare)** para **x4 Quasar**, e **7B da 2ª mark (Vanta)** para **x2 Quasar**

Você vai instantaneamente atingir **Qi de Quasar**. Abra "Mark of Quasar" novamente e maxe as primeiras 5 marks do índice. Upgrade toda a board de Quasar. Vá ao W1 para o **milestone de 1Spd de Karma**.

Retorne ao W2 e maxe a 5ª e 6ª marks da "Mark of Nebulae". Depois maxe a 6ª mark da "Mark of Quasar". Vá ao W1, **despause as poções** (aquelas que usamos no início) para maxar a última mark da "Mark of Soulfire" e **pause as poções**.

Volte ao W2, **despause as poções** e maxe as últimas duas marks da "Mark of Nebulae". Agora só falta abrir "Mark of Quasar" até atingir **Realm #240** para acessar o **World 3 (Underworld)**.',
      ARRAY['progression', 'guide', 'world-1', 'world-2', 'world-3']::TEXT[],
      'published',
      'progression-guide'
    );
  END IF;

  RAISE NOTICE 'Seed V9 concluído: body tempering atualizado e guia de progressão adicionado.';

END $$;

COMMIT;
