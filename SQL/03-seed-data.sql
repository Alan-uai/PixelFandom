-- =====================================================
-- PIXEL FANTASY - SEED DATA
-- Dados iniciais para o banco de dados
-- =====================================================

-- =====================================================
-- MUNDOS INICIAIS
-- =====================================================

INSERT INTO worlds (id, name, description, required_level, is_unlocked) VALUES
    ('11111111-1111-1111-1111-111111111111', 'World 1 - Beginner Village', 'O mundo inicial onde novos guerreiros começam sua jornada.', 1, true),
    ('22222222-2222-2222-2222-222222222222', 'World 2 - Forest of Echoes', 'Uma floresta misteriosa cheia de ecos antigos.', 15, false),
    ('33333333-3333-3333-3333-333333333333', 'World 3 - Desert Kingdom', 'Um reino desértico governado por reis antiguos.', 30, false),
    ('44444444-4444-4444-4444-444444444444', 'World 4 - Frozen Mountains', 'Montanhas congeladas onde o vento nunca para.', 45, false),
    ('55555555-5555-5555-5555-555555555555', 'World 5 - Ocean Temple', 'Um templo submerso guardado por criaturas marinhas.', 60, false);

-- =====================================================
-- BOSSES INICIAIS
-- =====================================================

INSERT INTO bosses (id, world_id, name, rank, hp, exp_reward, coin_reward, drop_items) VALUES
    ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Goblin King', 'B', '1,000', '100', '500', '{"sword": "Bloodthorn", "armor": "Leather Vest"}'::jsonb),
    ('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Forest Spider', 'A', '5,000', '250', '1,000', '{"ring": "Bronze Ring", "accessory": "Spider Amulet"}'::jsonb),
    ('b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Ancient Treant', 'S', '25,000', '1,000', '5,000', '{"potion": "Health Elixir", "aura": "Nature Aura"}'::jsonb),
    ('b4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Shadow Wolf', 'A', '10,000', '500', '2,500', '{"pet": "Shadow Pup", "chest": "Mystery Chest"}'::jsonb),
    ('b5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Echo Guardian', 'SS', '50,000', '2,000', '10,000', '{"fighter": "Titan Echo", "ring": "Silver Ring"}'::jsonb);

-- =====================================================
-- MASMORRAS INICIAIS
-- =====================================================

INSERT INTO dungeons (id, world_id, name, description, boss_id, required_level, energy_cost, reward_coins, reward_exp) VALUES
    ('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Goblin Cave', 'Uma caverna escura infestada de goblins.', 'b1111111-1111-1111-1111-111111111111', 1, 5, '500', '100'),
    ('d2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Spider Nest', 'Teias everywhere, cuidado com a aranha rainha.', 'b2222222-2222-2222-2222-222222222222', 5, 10, '1,000', '250'),
    ('d3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Ancient Ruins', 'Ruínas antigas de uma civilização perdida.', 'b3333333-3333-3333-3333-333333333333', 10, 20, '5,000', '1,000'),
    ('d4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Shadow Forest', 'Uma floresta coberta por sombras eternas.', 'b4444444-4444-4444-4444-444444444444', 15, 30, '2,500', '500'),
    ('d5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Echo Chamber', 'Uma câmara onde os ecos podem destruir você.', 'b5555555-5555-5555-5555-555555555555', 20, 50, '10,000', '2,000');

-- =====================================================
-- ESPADAS INICIAIS
-- =====================================================

INSERT INTO swords (id, name, type, rarity, base_damage, one_star_damage, two_star_damage, three_star_damage, world_id) VALUES
    ('s1111111-1111-1111-1111-111111111111', 'Bloodthorn', 'damage', 'comum', '0.25x', '0.5x', '0.75x', '1.25x', '11111111-1111-1111-1111-111111111111'),
    ('s2222222-2222-2222-2222-222222222222', 'Eclipse Warden', 'damage', 'incomum', '0.45x', '0.9x', '1.35x', '2.25x', '11111111-1111-1111-1111-111111111111'),
    ('s3333333-3333-3333-3333-333333333333', 'Obsidian Reaver', 'damage', 'raro', '0.75x', '1.5x', '2.25x', '3.75x', '11111111-1111-1111-1111-111111111111'),
    ('s4444444-4444-4444-4444-444444444444', 'Aquarius Edge', 'damage', 'lendario', '1x', '2x', '3x', '5x', '22222222-2222-2222-2222-222222222222'),
    ('s5555555-5555-5555-5555-555555555555', 'Doomsoul', 'damage', 'mitico', '1.25x', '2.5x', '3.75x', '6.25x', '22222222-2222-2222-2222-222222222222'),
    ('s6666666-6666-6666-6666-666666666666', 'Redmourne', 'damage', 'mitico', '1.5x', '3x', '4.5x', '7.5x', '22222222-2222-2222-2222-222222222222'),
    ('s7777777-7777-7777-7777-777777777777', 'Venomstrike', 'damage', 'phantom', '2x', '4x', '6x', '10x', '33333333-3333-3333-3333-333333333333'),
    ('s8888888-8888-8888-8888-888888888888', 'Stormreaver', 'scythe', 'supremo', '1.8x', '3.6x', '5.4x', '9x', '33333333-3333-3333-3333-333333333333'),
    ('s9999999-9999-9999-9999-999999999999', 'Excalibur', 'energy', 'lendario', '0.8x', '1.6x', '2.4x', '4x', '22222222-2222-2222-2222-222222222222');

-- =====================================================
-- ARMADURAS INICIAIS
-- =====================================================

INSERT INTO armors (id, name, rarity, world_id, drop_boss_id, damage_bonus, energy_bonus, coins_bonus, exp_bonus, movespeed_bonus) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'Leather Vest', 'comum', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', '0.05x', '0.02x', NULL, '0.05x', '5%'),
    ('a2222222-2222-2222-2222-222222222222', 'Iron Chestplate', 'incomum', '11111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', '0.1x', '0.05x', '0.05x', '0.1x', '3%'),
    ('a3333333-3333-3333-3333-333333333333', 'Steel Armor', 'raro', '11111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', '0.2x', '0.1x', '0.1x', '0.15x', '2%'),
    ('a4444444-4444-4444-4444-444444444444', 'Dragon Scale', 'epico', '22222222-2222-2222-2222-222222222222', 'b4444444-4444-4444-4444-444444444444', '0.35x', '0.15x', '0.15x', '0.2x', '1%'),
    ('a5555555-5555-5555-5555-555555555555', 'Celestial Robe', 'lendario', '22222222-2222-2222-2222-222222222222', 'b5555555-5555-5555-5555-555555555555', '0.5x', '0.25x', '0.2x', '0.25x', '0%');

-- =====================================================
-- POÇÕES INICIAIS
-- =====================================================

INSERT INTO potions (id, name, rarity, effect_type, effect_value, duration, cost_coins) VALUES
    ('p1111111-1111-1111-1111-111111111111', 'Small Health Potion', 'comum', 'heal', '100', 'instant', '50'),
    ('p2222222-2222-2222-2222-222222222222', 'Medium Health Potion', 'incomum', 'heal', '500', 'instant', '200'),
    ('p3333333-3333-3333-3333-333333333333', 'Large Health Potion', 'raro', 'heal', '2000', 'instant', '500'),
    ('p4444444-4444-4444-4444-444444444444', 'Energy Elixir', 'incomum', 'energy', '1.5x', '60s', '300'),
    ('p5555555-5555-5555-5555-555555555555', 'Power Surge', 'raro', 'damage', '2x', '30s', '1000');

-- =====================================================
-- ANÉIS INICIAIS
-- =====================================================

INSERT INTO rings (id, name, rarity, material, bonus_type, bonus_value) VALUES
    ('r1111111-1111-1111-1111-111111111111', 'Bronze Ring', 'comum', 'bronze', 'damage', '0.05x'),
    ('r2222222-2222-2222-2222-222222222222', 'Silver Ring', 'incomum', 'silver', 'energy', '0.1x'),
    ('r3333333-3333-3333-3333-333333333333', 'Gold Ring', 'raro', 'gold', 'coins', '0.15x'),
    ('r4444444-4444-4444-4444-444444444444', 'Rose Gold Energy Ring', 'epico', 'rose-gold', 'energy', '0.25x'),
    ('r5555555-5555-5555-5555-555555555555', 'Rose Gold Damage Ring', 'epico', 'rose-gold', 'damage', '0.2x'),
    ('r6666666-6666-6666-6666-666666666666', 'Rose Gold Luck Ring', 'epico', 'rose-gold', 'luck', '10%');

-- =====================================================
-- ACESSÓRIOS INICIAIS
-- =====================================================

INSERT INTO accessories (id, name, rarity, world_id, drop_boss_id, damage_bonus, energy_bonus, coins_bonus, exp_bonus, movespeed_bonus) VALUES
    ('ac111111-1111-1111-1111-111111111111', 'Spider Amulet', 'incomum', '11111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', '0.05x', '0.03x', '0.05x', NULL, '2%'),
    ('ac222222-2222-2222-2222-222222222222', 'Ancient Locket', 'raro', '11111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', '0.1x', '0.05x', '0.08x', '0.1x', '5%'),
    ('ac333333-3333-3333-3333-333333333333', 'Shadow Pendant', 'epico', '22222222-2222-2222-2222-222222222222', 'b4444444-4444-4444-4444-444444444444', '0.15x', '0.1x', '0.1x', '0.15x', '10%');

-- =====================================================
-- AURAS INICIAIS
-- =====================================================

INSERT INTO auras (id, name, rarity, bonus_type, bonus_value, world_id) VALUES
    ('au111111-1111-1111-1111-111111111111', 'Nature Aura', 'raro', 'damage', '0.1x', '11111111-1111-1111-1111-111111111111'),
    ('au222222-2222-2222-2222-222222222222', 'Fire Aura', 'epico', 'energy', '0.15x', '22222222-2222-2222-2222-222222222222'),
    ('au333333-3333-3333-3333-333333333333', 'Lightning Aura', 'lendario', 'coins', '0.2x', '33333333-3333-3333-3333-333333333333'),
    ('au444444-4444-4444-4444-444444444444', 'Void Aura', 'mitico', 'damage', '0.25x', '33333333-3333-3333-3333-333333333333');

-- =====================================================
-- PETS INICIAIS
-- =====================================================

INSERT INTO pets (id, name, rarity, rank, energy_bonus, world_id) VALUES
    ('pet11111-1111-1111-1111-111111111111', 'Baby Dragon', 'raro', 'B', '0.05x', '11111111-1111-1111-1111-111111111111'),
    ('pet22222-2222-2222-2222-222222222222', 'Shadow Pup', 'epico', 'A', '0.1x', '22222222-2222-2222-2222-222222222222'),
    ('pet33333-3333-3333-3333-333333333333', 'Phoenix Hatchling', 'lendario', 'S', '0.2x', '33333333-3333-3333-3333-333333333333');

-- =====================================================
-- FIGHTERS INICIAIS
-- =====================================================

INSERT INTO fighters (id, name, type, rarity, world_id, energy_bonus, damage_bonus, stats) VALUES
    ('f111111-1111-1111-1111-111111111111', 'Stone Golem', 'titan', 'raro', '11111111-1111-1111-1111-111111111111', '0.1x', '0.05x', '{"base": {"hp": 1000, "def": 50}}'::jsonb),
    ('f222222-2222-2222-2222-222222222222', 'Flame Spirit', 'stand', 'epico', '22222222-2222-2222-2222-222222222222', '0.15x', '0.1x', '{"base": {"hp": 1500, "atk": 100}}'::jsonb),
    ('f333333-3333-3333-3333-333333333333', 'Dark Phantom', 'shadow', 'lendario', '33333333-3333-3333-3333-333333333333', '0.2x', '0.15x', '{"base": {"hp": 2000, "crit": 10}, "rank_sss": {"bonus": "15% Damage", "cooldown": "2s"}}'::jsonb),
    ('f444444-4444-4444-4444-444444444444', 'Inferno Ghoul', 'ghoul', 'mitico', '33333333-3333-3333-3333-333333333333', '0.25x', '0.2x', '{"base": {"hp": 2500}}'::jsonb);

-- =====================================================
-- GAMEPASSES INICIAIS
-- =====================================================

INSERT INTO gamepasses (id, name, description, bonus_type, bonus_value, price_coins) VALUES
    ('gp11111-1111-1111-1111-111111111111', 'VIP Pass', 'Acesso VIP com bônus permanente', 'damage', '1.5x', '10000'),
    ('gp22222-2222-2222-2222-222222222222', 'Double Coins', 'Dobra todos os ganhos de moedas', 'coins', '2x', '15000'),
    ('gp33333-3333-3333-3333-333333333333', 'Auto Heal', 'Regeneração automática de vida', 'damage', '1.2x', '8000');

-- =====================================================
-- CONQUISTAS INICIAIS
-- =====================================================

INSERT INTO achievements (id, name, description, achievement_type, category, max_level, requirement, progression_bonus) VALUES
    ('ach1111-1111-1111-1111-111111111111', 'Friends Bonus V', 'Faça novos amigos no jogo', 'general', 'Friends', 100, '100 amigos', '0.5% Damage por nível'),
    ('ach2222-2222-2222-2222-222222222222', 'Total Coins XXVIII', 'Colete moedas ao longo da jornada', 'general', 'Coins', 50, '100N moedas', '1% Energy por nível'),
    ('ach3333-3333-3333-3333-333333333333', 'Total Energy XLV', 'Acumule energia total', 'general', 'Energy', 50, '1T energia', '1% Damage por nível'),
    ('ach4444-4444-4444-4444-444444444444', 'Time Played X', 'Tempo total jogado', 'general', 'Time', 10, '1000 horas', '0.5% Coins por nível'),
    ('ach5555-5555-5555-5555-555555555555', 'Star Opened X', 'Estrelas abertas em baús', 'general', 'Stars', 20, '500 estrelas', '0.5% Exp por nível'),
    ('ach6666-6666-6666-6666-666666666666', 'Total Enemies XIX', 'Derrote inimigos', 'general', 'Enemies', 25, '100M inimigos', '0.5% Luck por nível');

-- =====================================================
-- MISSÕES INICIAIS
-- =====================================================

INSERT INTO quests (id, name, description, world_id, required_level, reward_coins, reward_exp, reward_items) VALUES
    ('q111111-1111-1111-1111-111111111111', 'First Steps', 'Complete sua primeira masmorra', '11111111-1111-1111-1111-111111111111', 1, '100', '50', '{"potion": "Small Health Potion"}'::jsonb),
    ('q222222-2222-2222-2222-222222222222', 'Goblin Slayer', 'Derrote 10 goblins', '11111111-1111-1111-1111-111111111111', 1, '200', '100', '{"ring": "Bronze Ring"}'::jsonb),
    ('q333333-3333-3333-3333-333333333333', 'Boss Hunter', 'Derrote o Goblin King', '11111111-1111-1111-1111-111111111111', 5, '500', '250', '{"weapon": "Eclipse Warden"}'::jsonb),
    ('q444444-4444-4444-4444-444444444444', 'Forest Explorer', 'Complete todas as masmorras da World 2', '22222222-2222-2222-2222-222222222222', 15, '2000', '1000', '{"pet": "Shadow Pup"}'::jsonb);

-- =====================================================
-- BAÚS INICIAIS
-- =====================================================

INSERT INTO chests (id, name, rarity, world_id, cost_coins, cost_gems, possible_items, drop_rates) VALUES
    ('ch11111-1111-1111-1111-111111111111', 'Basic Chest', 'comum', '11111111-1111-1111-1111-111111111111', '100', '0', '{"common": ["Small Health Potion", "Bronze Ring"], "rare": ["Iron Chestplate"]}'::jsonb, '{"common": 0.7, "rare": 0.3}'::jsonb),
    ('ch22222-2222-2222-2222-222222222222', 'Mystery Chest', 'incomum', '11111111-1111-1111-1111-111111111111', '500', '10', '{"common": ["Silver Ring", "Medium Health Potion"], "rare": ["Steel Armor"], "epic": ["Nature Aura"]}'::jsonb, '{"common": 0.5, "rare": 0.35, "epic": 0.15}'::jsonb),
    ('ch33333-3333-3333-3333-333333333333', 'Gold Chest', 'raro', '22222222-2222-2222-2222-222222222222', '2000', '50', '{"rare": ["Dragon Scale"], "epic": ["Shadow Pendant", "Fire Aura"], "legendary": ["Baby Dragon"]}'::jsonb, '{"rare": 0.4, "epic": 0.45, "legendary": 0.15}'::jsonb),
    ('ch44444-4444-4444-4444-444444444444', 'Legendary Chest', 'epico', '33333333-3333-3333-3333-333333333333', '10000', '200', '{"epic": ["Celestial Robe", "Lightning Aura"], "mythic": ["Phoenix Hatchling", "Doomsoul"]}'::jsonb, '{"epic": 0.6, "mythic": 0.4}'::jsonb);

-- =====================================================
-- OBELISKOS INICIAIS
-- =====================================================

INSERT INTO obelisks (id, name, world_id, stat_type, max_level) VALUES
    ('ob11111-1111-1111-1111-111111111111', 'Damage Obelisk', '11111111-1111-1111-1111-111111111111', 'damage', 20),
    ('ob22222-2222-2222-2222-222222222222', 'Energy Obelisk', '11111111-1111-1111-1111-111111111111', 'energy', 20),
    ('ob33333-3333-3333-3333-333333333333', 'Luck Obelisk', '22222222-2222-2222-2222-222222222222', 'luck', 10);

-- =====================================================
-- PODERES INICIAIS
-- =====================================================

INSERT INTO powers (id, world_id, name, power_type, stat_type, max_level, max_boost, unlock_cost, leveling) VALUES
    ('pow1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Beginner Power', 'gacha', 'damage', 4, '3x', '5000', '{"token": "Power Token", "costPerLevel": 100, "maxLevel": 4}'::jsonb),
    ('pow2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Energy Flow', 'progression', 'energy', 10, '5x', '0', '{"token": "Energy Orb", "costPerLevel": 50, "maxLevel": 10}'::jsonb),
    ('pow3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Shadow Strike', 'gacha', 'damage', 4, '5x', '15000', '{"token": "Shadow Token", "costPerLevel": 150, "maxLevel": 4}'::jsonb);

-- =====================================================
-- POWER STATS INICIAIS
-- =====================================================

INSERT INTO power_stats (id, power_id, name, multiplier, rarity, probability, stat_type, energy_crit_bonus) VALUES
    ('ps1111-1111-1111-1111-111111111111', 'pow1111-1111-1111-1111-111111111111', 'Level 1', '1x', 'comum', 50.00, 'damage', NULL),
    ('ps2222-2222-2222-2222-222222222222', 'pow1111-1111-1111-1111-111111111111', 'Level 2', '1.5x', 'incomum', 30.00, 'damage', NULL),
    ('ps3333-3333-3333-3333-333333333333', 'pow1111-1111-1111-1111-111111111111', 'Level 3', '2x', 'raro', 15.00, 'damage', '0.5%'),
    ('ps4444-4444-4444-4444-444444444444', 'pow1111-1111-1111-1111-111111111111', 'Level 4', '3x', 'epico', 5.00, 'damage', '1%');

-- =====================================================
-- METADADOS
-- =====================================================

INSERT INTO game_metadata (id, version, last_updated_at) VALUES
    ('meta111-1111-1111-1111-111111111111', '1.0.0', NOW());

-- =====================================================
-- FIM DO SEED DATA
-- =====================================================