-- ============================================================
-- Seed V1: Pixel Blade — Wiki Articles Seed
-- 10 artigos: guias, tier lists, tutoriais e estratégias
-- Slugs em inglês; títulos, resumos e conteúdo em português
-- Idempotente: cada artigo usa IF NOT EXISTS
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'pixel-blade';
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'aymatsu00@gmail.com' LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant pixel-blade não encontrado. Execute o seed base primeiro.';
  END IF;

  -- ================================================================
  -- 1. Guia para Iniciantes
  -- ================================================================
  IF NOT EXISTS (
    SELECT 1 FROM wiki_articles WHERE tenant_id = v_tenant_id AND slug = 'beginners-guide'
  ) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    VALUES (
      v_tenant_id,
      v_user_id,
      'Guia para Iniciantes',
      'Tudo que você precisa saber para começar em Pixel Blade — controles, mecânicas básicas, primeiro mundo e dicas essenciais.',
      '# Guia para Iniciantes

## Bem-vindo a Pixel Blade

Pixel Blade é um RPG/Roguelike no Roblox onde você enfrenta hordas de inimigos, coleta equipamentos e derrota chefões em mundos cada vez mais desafiadores.

## Controles Básicos

| Tecla | Ação |
|-------|------|
| WASD | Movimentar |
| Mouse | Mirar e atacar |
| M1 (Clique Esquerdo) | Ataque básico |
| E | Usar habilidade da arma |
| R | Consumir poção |
| Q | Dash (esquiva) |
| F / Clique Direito | Bloquear |
| Espaço | Dash (requer stamina) |

### Parry
Bloqueie **no momento certo** antes do ataque inimigo acertar para atordoá-lo. O próximo golpe causa dano aumentado.

## Primeiros Passos

1. **Complete o Tutorial** — área segura sem dano, pratique os comandos
2. **Saia do Training Camp** — vá para Grasslands (World 1)
3. **Equipe a melhor arma** que você tiver
4. **Sempre pegue Spirit Capacity e Rage Spirits** nas upgrades de dungeon
5. **Abra todo baú** que encontrar
6. **Minere todos os minérios** — são essenciais para crafting

## Atributos

| Atributo | Descrição |
|----------|-----------|
| Health | HP base — determina sua sobrevivência |
| Speed | Velocidade de movimento |
| Energy | Necessária para usar habilidades |
| Stamina | Necessária para dashes |
| Strength | Multiplicador de dano |
| Crit Chance | Chance de dano extra |
| Knockback | Deslocamento de inimigos |

## Dicas de Ouro

- Use a arma com maior dano que você possui
- Priorize Spirit Capacity nas upgrades de dungeon
- Sempre escolha Rage Spirits quando aparecer
- Junte-se ao grupo Frost Blade Games no Roblox para o baú diário
- Resgate códigos para recompensas grátis
- Não gaste todo ouro em poções — guarde para upgrades de armas',
      ARRAY['guia', 'iniciante', 'comecando', 'tutorial']::TEXT[],
      'published',
      'beginners-guide'
    );
  END IF;

  -- ================================================================
  -- 2. Tier List de Armas
  -- ================================================================
  IF NOT EXISTS (
    SELECT 1 FROM wiki_articles WHERE tenant_id = v_tenant_id AND slug = 'weapon-tier-list'
  ) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    VALUES (
      v_tenant_id,
      v_user_id,
      'Tier List de Armas',
      'Ranking completo das 33 armas de Pixel Blade — das lendárias S-Tier até as comuns, com análise de dano, habilidades e dicas de obtenção.',
      '# Tier List de Armas

Pixel Blade possui **33 armas** distribuídas em 5 raridades. Aqui está o ranking completo.

## Tier List Geral

### S-Tier (Melhores do Jogo)

| Arma | Raridade | Dano | Tipo | Habilidade |
|------|----------|------|------|------------|
| Imperialist | Legendary | 52-300 | Greatsword | Lightning (9 alvos, stun + speed) |
| Solar Scythe | Legendary | 60-267 | Scythe | Solar Beam (DPS infinito) |
| Stellar | Legendary | — | — | Constellation (dash entre 4 alvos) |
| Golden Hand | Legendary | 48-280 | Greatsword | — |

### A-Tier (Excelentes)

| Arma | Raridade | Dano | Notas |
|------|----------|------|-------|
| Royalist | Legendary | 45-260 | Invisibilidade + i-frames + speed |
| Nekros'' Blade | Legendary | 80 | Elemento Dark |
| Kori''s Fang | Legendary | 100 | Melhor dano base do jogo |
| Void Slayer | Legendary | 95 | Elemento Void |

### B-Tier (Boas)

| Arma | Raridade |
|------|----------|
| Ghost Katana | Epic |
| Ice Spear | Epic |
| Sandstorm | Epic |
| Necromancer Blade | Epic |
| Forged Steel | Epic |

### C-Tier (Situacionais)

| Arma | Raridade |
|------|----------|
| Blood Sickle | Rare |
| Moon Sickle | Rare |
| Frost Blade | Rare |
| Buster Blade | Epic |
| Nightmare Blade | Epic |

### D-Tier (Iniciante / Substituir Logo)

| Arma | Raridade |
|------|----------|
| Ninja Blade | Rare |
| Crusher | Common |
| Wooden Scythe | Common |
| Steel Sword | Common |
| Tomb Hammer | Rare |
| Wing Blade | Rare |

## Habilidades por Arma

| Habilidade | Arma | Efeito |
|------------|------|--------|
| Tornado | Wooden Sword, Steel Sword | AOE giratório por 2.5s |
| Lightning | Imperialist | Raio em cadeia (9 inimigos) + stun |
| Solar | Solar Scythe | Raio contínuo de fogo |
| Berserk | Tomb Hammer, Blood Sickle | Boost temporário de speed e dano |
| Titan | Forged Steel | Onda de choque + stun + HP |

## Melhores Armas para Craft

| Arma | Custo | Materiais | Vale a Pena? |
|------|-------|-----------|--------------|
| Solar Scythe | 10.000 Gold | 15 Diamond, 25 Gold Ore, 30 Fire Essence | ABSOLUTAMENTE — #1 DPS |
| Imperialist | 15.000 Gold | 20 Spirit Essence, 30 Diamond, 40 Frost Essence | SIM — #1 do ranking |
| Blood Sickle | 1.000 Gold | 10 Slime Goo, 30 Iron Ore | Talvez — melhor farmar como drop |
| Forged Steel | 3.500 Gold | 10 Coal, 20 Gold Ore, 40 Iron Ore | SIM — melhor Epic para tanks |',
      ARRAY['tier-list', 'armas', 'meta', 'ranking']::TEXT[],
      'published',
      'weapon-tier-list'
    );
  END IF;

  -- ================================================================
  -- 3. Tier List de Armaduras
  -- ================================================================
  IF NOT EXISTS (
    SELECT 1 FROM wiki_articles WHERE tenant_id = v_tenant_id AND slug = 'armor-tier-list'
  ) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    VALUES (
      v_tenant_id,
      v_user_id,
      'Tier List de Armaduras',
      'Ranking completo das 15 armaduras de Pixel Blade — da lendária Kori''s Blessing até as armaduras iniciais.',
      '# Tier List de Armaduras

## Tier List

### S+ Tier (Absolute Melhores)

| Armadura | Raridade | Health | Speed | Energy |
|----------|----------|--------|-------|--------|
| Kori''s Blessing | Legendary | 300 | 12 | 200 |
| Nekros'' Shell | Legendary | 250 | 5 | 180 |

### S-Tier

| Armadura | Raridade | Health | Speed | Energy |
|----------|----------|--------|-------|--------|
| Void Armor | Legendary | 280 | 10 | 190 |
| King''s Armor | Epic | 180 | 5 | 150 |

### A-Tier

| Armadura | Raridade | Health | Speed | Energy |
|----------|----------|--------|-------|--------|
| Frost Mail | Epic | 200 | 8 | 170 |
| Samurai Armor | Epic | 190 | 12 | 175 |
| Sand Warrior Armor | Epic | 160 | 10 | 160 |

### B-Tier

| Armadura | Raridade | Health | Speed | Energy |
|----------|----------|--------|-------|--------|
| Yeti Hide | Rare | 140 | 5 | 145 |
| Mummy Wraps | Rare | 110 | 8 | 135 |
| Iron Plate | Rare | 120 | 0 | 120 |

### C-Tier

| Armadura | Raridade | Health | Speed | Energy |
|----------|----------|--------|-------|--------|
| Forest Guard | Rare | 100 | 10 | 130 |
| Leather Vest | Common | 75 | 5 | 110 |
| Desert Robes | Rare | 90 | 15 | 140 |
| Starter Armor | Common | 50 | 0 | 100 |

## Onde Conseguir

| Armadura | Onde Encontrar |
|----------|----------------|
| Kori''s Blessing | Kori boss drop (Haunted Tundra) |
| Nekros'' Shell | Nekros boss drop (Ancient Sands) |
| King''s Armor | Boss drops / Chests (Grasslands) |
| Void Armor | Eventos especiais |
| Samurai Armor | Boss drops / Chests (Haunted Tundra) |
| Christmas Outfit | Evento limitado (Vaulted) |',
      ARRAY['tier-list', 'armaduras', 'meta', 'ranking']::TEXT[],
      'published',
      'armor-tier-list'
    );
  END IF;

  -- ================================================================
  -- 4. Guia de Raids
  -- ================================================================
  IF NOT EXISTS (
    SELECT 1 FROM wiki_articles WHERE tenant_id = v_tenant_id AND slug = 'raids-guide'
  ) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    VALUES (
      v_tenant_id,
      v_user_id,
      'Guia de Raids',
      'Domine o modo Raid de Pixel Blade — waves infinitas, drops de anéis, dificuldades e estratégias para sobreviver cada vez mais.',
      '# Guia de Raids

Raids é o modo **endless wave defense** de Pixel Blade. A cada 5 waves um chefe aparece.

## Dificuldades

| Dificuldade | Recompensas |
|-------------|-------------|
| Noob | Anéis básicos, armas comuns, gold |
| Easy | Anéis raros, armas épicas, materiais de upgrade |
| Medium | Super anéis, armas lendárias, materiais raros |
| Hard | Melhores super anéis, lendárias exclusivas, recompensas máximas |

## Drops de Anéis

| Wave | Chance | Tipo |
|------|--------|------|
| 10+ | 10% por wave | Anéis normais |
| 30+ | 7.5% por wave | Super Anéis |
| 50+ | 15% por wave | Super Anéis melhores |

## Chefes por Wave

| Wave | Dificuldade | Dica |
|------|-------------|------|
| 5 | Aprender padrões | Use dash para desviar |
| 10 | Miniboss com adds | Mate adds primeiro |
| 20 | Chefe com múltiplas fases | Guarde ultimates |
| 30 | Múltiplos elites | Coordene com o time |

## Estratégias

- **Sempre use a fogueira** antes de enfrentar chefes
- **Guarde poções** para emergências — não desperdice
- **Construa rota de coleta de espíritos** — mate em círculos
- **Anel Timeless + Recovery** permite spam infinito de habilidade',
      ARRAY['guia', 'raids', 'endgame', 'aneis']::TEXT[],
      'published',
      'raids-guide'
    );
  END IF;

  -- ================================================================
  -- 5. Guia de Crafting
  -- ================================================================
  IF NOT EXISTS (
    SELECT 1 FROM wiki_articles WHERE tenant_id = v_tenant_id AND slug = 'crafting-guide'
  ) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    VALUES (
      v_tenant_id,
      v_user_id,
      'Guia de Crafting',
      'Tudo sobre o sistema de crafting com Hargon — receitas, materiais, custos e quais itens realmente valem a pena craftar.',
      '# Guia de Crafting

O ferreiro **Hargon** (disponível desde o Level 1) pode craftar armas, armaduras, anéis e poções. Compre 10+ itens de uma vez para 5% de desconto.

## Armas que Valem a Pena Craftar

### ABSOLUTAMENTE (Prioridade Máxima)

| Arma | Custo | Materiais | Por Quê |
|------|-------|-----------|---------|
| Solar Scythe | 10.000 Gold | 15 Diamond, 25 Gold Ore, 30 Fire Essence | #1 DPS contra chefes |
| Imperialist | 15.000 Gold | 20 Spirit Essence, 30 Diamond, 40 Frost Essence | #1 do ranking geral |

### SIM (Recomendados)

| Arma | Custo | Materiais |
|------|-------|-----------|
| Forged Steel | 3.500 Gold | 10 Coal, 20 Gold Ore, 40 Iron Ore |
| Tomb Hammer | 1.500 Gold | 15 Scorpion Tail, 25 Gold Ore |
| Steel Sword | 500 Gold | 5 Wood, 20 Iron Ore |

### TALVEZ (Melhor farmar como drop)

| Arma | Custo |
|------|-------|
| Blood Sickle | 1.000 Gold |
| Buster Blade | 4.500 Gold |

## Armaduras que Valem a Pena

| Armadura | Custo | Raridade | Bônus |
|----------|-------|----------|-------|
| Knight Set | 5.000 Gold total | Rare | +5% HP, +10% Defense |
| Desert Armor | 3.000 Gold/peça | Epic | +15% Fire Resist, +10% Speed |
| Crystal Armor | 12.000 Gold/peça | Legendary | Dano AOE escalando com Defense |

## Anéis

| Anel | Custo | Tier | Vale a Pena? |
|------|-------|------|-------------|
| Power Ring | 2.000 Gold (10 Diamond, 30 Gold Ore) | S | SIM — DPS universal |
| Flame Ring | 1.500 Gold (20 Fire Essence, 15 Gold Ore) | A | SIM — para builds de fogo |

## Poções

Craftar poções é **40-50% mais barato** que comprar:

| Poção | Preço Loja | Custo Craft | Economia |
|-------|-----------|-------------|----------|
| Health Flask | 20 Gold | 5 Gold, 2 Iron Ore, 5 Wood | 50% |
| Godly Potion | 3 por R$99 | 30 Gold, 5 Spirit Essence, 10 Gold Ore | 40% |

## Sistema de Enhancement (Level 40+)

Use **Enhancement Stones** para melhorar equipamentos até +10:
- Cada nível: +5-10% stats
- Custo aumenta exponencialmente
- Só vale a pena para equipamentos Lendários que você usará para sempre',
      ARRAY['guia', 'crafting', 'hargon', 'receitas']::TEXT[],
      'published',
      'crafting-guide'
    );
  END IF;

  -- ================================================================
  -- 6. Guia do Sistema de Espíritos
  -- ================================================================
  IF NOT EXISTS (
    SELECT 1 FROM wiki_articles WHERE tenant_id = v_tenant_id AND slug = 'spirit-system-guide'
  ) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    VALUES (
      v_tenant_id,
      v_user_id,
      'Guia do Sistema de Espíritos',
      'Entenda o sistema de espíritos de Pixel Blade — oubes, capacidade, Rage Spirits e como montar a build definitiva.',
      '# Guia do Sistema de Espíritos

Espíritos são **orbes amarelos** que dropam de inimigos derrotados e orbitam seu personagem. Eles são a mecânica mais importante do jogo.

## Funcionamento Básico

- **Capacidade padrão:** 2 slots
- **Capacidade máxima:** 10 slots
- **Bônus por espírito:** +5% velocidade de movimento
- **Chefes dropam 2x espíritos** (valem o dobro)

## Upgrades Essenciais

### S+ (OBRIGATÓRIOS) — O Coração da God Run

| Upgrade | Efeito | Por Rank |
|---------|--------|----------|
| Rage Spirits | Ataques básicos causam um hit extra por espírito | +8% dano, +5% speed por orbe |
| Spirit Capacity | Aumenta máximo de espíritos | +1 slot (máx. 10) |

### A-Tier

| Upgrade | Efeito |
|---------|--------|
| Life Steal | Cura ao coletar espíritos |
| Stamina | Aumenta stamina e regeneração |

## Sinergia entre Capacidade e Dano

| Capacidade | Bônus Dano Máx | Bônus Speed Máx |
|-----------|----------------|-----------------|
| 2 (padrão) | +16% | +10% |
| 5 | +40% | +25% |
| 8 | +64% | +40% |
| 10 (máx) | +80% | +50% |

## Fórmulas de Dano

**Dano Físico:** (ATK Base × (1 + Strength%)) × (1 + Rage Multiplier) / Attack Speed

**Rage Multiplier:** (1 + Rage Stacks × 0.05) × (Current Spirits / Capacity)

## Estratégia God Run

1. **Pegue Rage Spirits e Spirit Capacity** sempre que aparecerem
2. **Mantenha 8+ espíritos ativos** o tempo todo
3. **Nunca deixe cair abaixo de 6**
4. Use Life Steal para se curar coletando espíritos
5. Mate inimigos em círculo para criar rotas de coleta
6. Armas AOE (Imperialist, Solar Scythe) funcionam melhor',
      ARRAY['guia', 'espiritos', 'mecanica', 'upgrades', 'god-run']::TEXT[],
      'published',
      'spirit-system-guide'
    );
  END IF;

  -- ================================================================
  -- 7. Guia de Mundos
  -- ================================================================
  IF NOT EXISTS (
    SELECT 1 FROM wiki_articles WHERE tenant_id = v_tenant_id AND slug = 'worlds-guide'
  ) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    VALUES (
      v_tenant_id,
      v_user_id,
      'Guia de Mundos',
      'Walkthrough completo de todos os mundos de Pixel Blade — do Training Camp ao Crimson Abyss, com inimigos, chefes e loot.',
      '# Guia de Mundos

## Training Camp (Tutorial)

| Info | Detalhe |
|------|---------|
| Level | 1 |
| Tipo | Tutorial |
| Dano | Zero (área segura) |

Pratique: air-dash, parry, espaçamento. Essencial para iniciantes.

---

## Grasslands (World 1)

| Info | Detalhe |
|------|---------|
| Level | 2-5 |
| Capítulos | 3 |
| Dificuldade | Fácil-Médio |

### Chefes
| Capítulo | Chefe | Dificuldade |
|----------|-------|-------------|
| 1 | John the Lumberjack | Fácil |
| 2 | Goblin King | Médio |
| 3 | The Kingslayer | Difícil |

### Inimigos
Zombies, Archers, Giants, Mages, Cannon Goblins, Mortar Goblins, Treants

### Loot Notável
Wooden Scythe, Steel Sword, Crusher, Blood Sickle, Frost Blade, Kingslayer

---

## Ancient Sands (World 2)

| Info | Detalhe |
|------|---------|
| Level | 6-10 |
| Status | Em Breve |

### Chefes
| Capítulo | Chefe | Fraqueza |
|----------|-------|----------|
| 1 | Giant Sand Worm | Frost |
| 2 | Necros | Flame, Frost |
| 3 | Titan | Frost |

### Inimigos
Sand Scorpions (veneno), Mummies (maldição), Desert Bandits (bombas), Sand Worms (subterrâneo), Sand Golems (tanque)

---

## Haunted Tundra (World 3)

| Info | Detalhe |
|------|---------|
| Level | 11-15 |
| Status | Em Breve |
| Dificuldade | Alta |

### Chefes
| Capítulo | Chefe | Fraqueza |
|----------|-------|----------|
| 1 | Giant Yeti | Flame |
| 2 | The Musician | Flame |
| 3 | Kori | Flame |

**Kori:** ataque Charge Beam — esconda-se atrás das rochas!

---

## Crimson Abyss (World 4)

| Info | Detalhe |
|------|---------|
| Level | 20+ |
| Status | Em Breve |
| Capítulos | 3 |

O último mundo do Arco 1. Necessário para progredir ao Arco 2.',
      ARRAY['guia', 'mundos', 'walkthrough', 'progressao']::TEXT[],
      'published',
      'worlds-guide'
    );
  END IF;

  -- ================================================================
  -- 8. Lista de Códigos
  -- ================================================================
  IF NOT EXISTS (
    SELECT 1 FROM wiki_articles WHERE tenant_id = v_tenant_id AND slug = 'codes-list'
  ) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    VALUES (
      v_tenant_id,
      v_user_id,
      'Lista de Códigos',
      'Códigos ativos e expirados de Pixel Blade — resgate recompensas grátis como moedas, poções, anéis e baús.',
      '# Lista de Códigos

Códigos são **uso único por conta** e liberados durante updates, marcos e eventos.

## Como Resgatar

1. Entre no grupo Frost Blade Games no Roblox
2. Inicie Pixel Blade e complete o tutorial
3. Vá ao **Bank** (prédio amarelo à esquerda do spawn)
4. Interaja com **Theo** (NPC)
5. Digite o código exatamente como abaixo (case-sensitive)
6. Clique em Claim e depois Accept

## Códigos Ativos

| Código | Recompensas | Tipo | Verificado |
|--------|-------------|------|------------|
| UI | 3 Anéis, 1 Baú Tier 1, 500 Moedas | Update | 2026-02 |
| 650K | 300 Moedas, 12 Godly Potions | Milestone | 2026-02 |
| AncientSands | 1 Revive, 200 Moedas, 3 Godly Potions | World | 2026-02 |
| 625K | 3 Revives, 500 XP, 6 Godly Potions | Milestone | 2026-02 |
| PLUSHIE | 1 Anel, 2 Baús Tier 1 | Evento | 2026-02 |
| CrimsonNightmare | 3 Revives, 5-6 Godly Potions | World | 2026-01 |
| 600K | 3 Anéis, 1-2 Baús Tier 1 | Milestone | 2026-01 |
| 575K | 600 Moedas, 500 Stardust | Milestone | 2026-01 |
| 550K | 2 Anéis, 1 Baú Diário | Milestone | 2026-01 |
| World4 | 5 Revives, 500 Moedas | World | 2025-12 |
| goldentooth | 2.000 Moedas | Criador | 2025-12 |
| Quests | 1 Revive, 1000 XP, 250 Moedas, 9 Godly Potions | Evento | 2025-11 |
| Rings | 1 Anel, 300 Stardust | Evento | 2025-08 |
| Alpha | 1000 XP, 150 Moedas | Iniciante | 2025-06 |
| FBG | 1 Baú Diário Tier 1 | Grupo | 2025-05 |
| Theo | 250 Moedas | NPC | 2025-05 |

## Códigos de Criador
fudge, ogvexx, demer, blexor, Raven, Pickle

## Códigos Expirados
175K, 200K, 225K, 250K, 275K, 300K, 325K, 350K, 30M, 125k, 150K, FreeWish, SecretFudge, Tundra, Nightmare, Ancient, Potions, SorryForDelay, UpdateLog, XP, EarlyAccess, HollyJolly, MerryMerry, HotCocoa, CHRISTMAS25, SnowmanArm, BREAKABLES, FREEWISH, 100M, kori, delayblade

## Dicas
- Resgate códigos novos primeiro — eles expiram mais rápido
- A maioria dura 2-4 semanas
- Novos códigos a cada 2-3 semanas em média
- Major updates sempre incluem 2+ códigos novos',
      ARRAY['codigos', 'recompensas', 'resgate', 'promocional']::TEXT[],
      'published',
      'codes-list'
    );
  END IF;

  -- ================================================================
  -- 9. Guia de Anéis
  -- ================================================================
  IF NOT EXISTS (
    SELECT 1 FROM wiki_articles WHERE tenant_id = v_tenant_id AND slug = 'rings-guide'
  ) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    VALUES (
      v_tenant_id,
      v_user_id,
      'Guia de Anéis',
      'Guia completo sobre anéis em Pixel Blade — tiers, qualidades, stardust, refinamento e as melhores combinações para sua build.',
      '# Guia de Anéis

Anéis são **acessórios** que concedem bônus de stats. Dropam em Raids (Wave 10+).

## Tier List de Anéis

| Tier | Anéis |
|------|-------|
| **S** | Dragon Ring, Timeless Ring |
| **A** | Vampire Ring, Rage Ring, Power Ring |
| **B** | Element Ring, Shadow Ring, Polar Ring, Ghost Ring |
| **C** | Forest Ring, Serpent Ring, Health Ring |

## Sistema de Qualidade

Anéis têm qualidade de 1 a 118+:

| Tier | Range | Descrição |
|------|-------|-----------|
| Dull | 1-29 | Pior qualidade |
| Runed | 30-59 | Básica |
| Enchanted | 60-69 | Melhorada |
| Blessed | 70-79 | Boa |
| Shiny | 80-89 | Alta |
| Pristine | 90-99 | Muito alta (aura azul/ciano) |
| Volcanic | 100-109 | Excelente (aura vermelha/laranja) |
| Heirloom | 110-118 | Melhor — vale investir |

**Regra:** Qualidade 110+ é Heirloom. Anéis abaixo de 50 devem ser derretidos para Stardust.

## Stardust e Refinamento

Derreta anéis para obter **Stardust** e refine até +30 (ou +8 níveis):

| Nível | Custo Stardust |
|-------|---------------|
| Lv.1 | 100 |
| Lv.2 | 200 |
| Lv.3 | 400 |
| Lv.4 | 800 |
| Lv.5 | 1.600 |
| Lv.6 | 3.200 |
| Lv.7 | 6.400 |
| Lv.8 | 12.800 |

## Builds Recomendadas

| Build | Anéis | Sinergia |
|-------|-------|----------|
| Combo Infinito | Dragon Ring + Timeless Ring | Recovery Banner |
| Sobrevivência | Vampire Ring | Life Steal |
| DPS | Power Ring | Damage Stats |
| Elemental | Dragon Ring | Flame Element |
| Mobilidade | Ghost Ring | Speed Stats |

## Prioridade de Investimento

1. Dragon Ring + Timeless Ring (combo infinito)
2. Vampire Ring (sobrevivência)
3. Power Ring (DPS universal)
4. Qualquer anel S/A com qualidade 110+

## Fórmula de Stats
`y = (a × x) + b` onde x = qualidade, a = coeficiente, b = constante
Exemplo para qualidade 100: `y = (0.4286 × 100) + 9.1 = 52.0%`',
      ARRAY['guia', 'aneis', 'raids', 'stardust', 'refinamento']::TEXT[],
      'published',
      'rings-guide'
    );
  END IF;

  -- ================================================================
  -- 10. Estratégias para Chefões
  -- ================================================================
  IF NOT EXISTS (
    SELECT 1 FROM wiki_articles WHERE tenant_id = v_tenant_id AND slug = 'boss-strategies'
  ) THEN
    INSERT INTO wiki_articles (tenant_id, created_by, title, summary, content, tags, status, slug)
    VALUES (
      v_tenant_id,
      v_user_id,
      'Estratégias para Chefões',
      'Guia com estratégias detalhadas para todos os chefões de Pixel Blade — padrões de ataque, fases, fraquezas e dicas para cada um.',
      '# Estratégias para Chefões

## Grasslands

### John the Lumberjack (Capítulo 1)
- **Dificuldade:** Fácil
- **Ataques:** Axe Smash, Tornado
- **Estratégia:** Chefe simples para praticar. Use dash para desviar do Axe Smash.

### Goblin King (Capítulo 2)
- **Dificuldade:** Médio
- **Ataques:** Slam, Invocação de Goblins
- **Estratégia:** **Mate os goblins primeiro** antes de focar no chefe.

### The Kingslayer (Capítulo 3)
- **Dificuldade:** Difícil
- **Ataques:** Slams
- **Fase 2 (50% HP):** Invoca 3 inimigos aleatórios (Bolts ou Mages)
- **Estratégia:** Quando a fase 2 começar, elimine os adds imediatamente

---

## Ancient Sands

### Giant Sand Worm (Capítulo 1)
- **Dificuldade:** Médio
- **Fraqueza:** Frost
- **Ataques:** Escava e cospe projéteis
- **Estratégia:** Observe o movimento subterrâneo, desvie quando emergir

### Necros (Capítulo 2)
- **Dificuldade:** Difícil
- **Fraqueza:** Flame, Frost
- **Ataques:** Invisibilidade, Teletransporte, Magia negra
- **Estratégia:** Chefe difícil — acompanhe o movimento mesmo quando invisível

### Titan (Capítulo 3)
- **Dificuldade:** Difícil
- **Fraqueza:** Frost
- **Ataques:** Slams, Orbs
- **Estratégia:** Aprenda os padrões na Fase 1 antes de ir para o ataque total

---

## Haunted Tundra

### Giant Yeti (Capítulo 1)
- **Dificuldade:** Médio-Difícil
- **Fraqueza:** Flame
- **Ataques:** Bolas de neve, Lanças de gelo, Ground Slam
- **Estratégia:** Desvie das bolas de neve e lanças, puna após o Ground Slam

### The Musician (Capítulo 2)
- **Dificuldade:** Médio
- **Fraqueza:** Flame
- **Ataques:** Invocação de lacaios, Ataques musicais
- **Estratégia:** Chefe de mecânica — mate os lacaios primeiro

### Kori (Capítulo 3 — Final Boss)
- **Dificuldade:** Muito Difícil
- **Fraqueza:** Flame
- **Ataques:** Charge Beam, múltiplos ataques devastadores
- **Estratégia:** **Charge Beam — esconda-se atrás das rochas!**
- **Drop:** Kori''s Fang (100 de dano — melhor arma do jogo)

---

## Crimson Abyss

### John The Lumberjack (Miniboss)
- **Dificuldade:** Médio
- **Ataques:** Chop, Slice
- **Estratégia:** Maior que os gigantes normais — cuidado com ataques de machado

### Giant Goblin (Miniboss)
- **Dificuldade:** Médio
- **Acompanhado por:** 2 Mortar Goblins + 2 Cannon Goblins
- **Estratégia:** **Limpe os adds primeiro** — eles são muito perigosos juntos

### Kingslayer (Chefe Final)
- **Dificuldade:** Difícil
- **Fase 2 (50% HP):** Invoca 3 inimigos aleatórios
- **Estratégia:** Foco nos adds quando a fase 2 começar, depois volte ao chefe

---

## Dicas Gerais para Chefes

- **Use a fogueira** antes de enfrentar qualquer chefe
- **Guarde habilidades** para momentos críticos
- **Aprenda os padrões** antes de ser agressivo
- Em dificuldades mais altas, **não lute solo** — forme grupo
- **Dash e Parry** são suas melhores ferramentas de sobrevivência',
      ARRAY['guia', 'bosses', 'chefes', 'estrategias']::TEXT[],
      'published',
      'boss-strategies'
    );
  END IF;

  RAISE NOTICE 'Seed Pixel Blade V1 concluído: 10 artigos adicionados.';

END $$;

COMMIT;
