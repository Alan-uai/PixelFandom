-- =====================================================
-- SEED DATA - INSERT JSON DATA INTO TABLES
-- This file contains INSERT statements to populate tables
-- with data extracted from Pixel Blade wiki
-- =====================================================

-- =====================================================
-- SEED WEAPONS
-- =====================================================

INSERT INTO weapons (name, rarity, weapon_type, damage_min, damage_max, crit_chance_min, crit_chance_max, attack_speed, knockback, element, ability_name, ability_description, ability_energy_cost, ability_cooldown, obtain_method, tier, notes) VALUES
('Wooden Sword', 'common', 'Sword', 9, 83.2, 10, 40, 'medium', 1.6, 'none', 'Tornado', 'Whirling AOE attack for 2.5s', NULL, NULL, 'Starting weapon (Tutorial)', 'd', 'Base sword'),
('Steel Sword', 'common', 'Sword', 11, 101.8, 10, 40, 'medium', 2, 'none', 'Tornado', 'Whirling AOE attack for 2.5s', NULL, NULL, 'Craft (500 Gold) or Chests', 'd', NULL),
('Wooden Scythe', 'common', 'Scythe', 12, 111, 10, 40, 'medium', 2.4, 'none', 'Rejuvenate', 'Heal 10% HP + 10% HP shield', NULL, NULL, 'Chests or Enemy drops', 'd', NULL),
('Crusher', 'common', 'Hammer', 16, 148, 10, 40, 'slow', 3, 'none', 'Smash', 'Leap to nearest enemy and deal damage', NULL, NULL, 'Chests or Enemy drops', 'd', NULL),
('Sinner', 'common', 'Sword', 12, 111, 10, 40, 'fast', 2, 'none', 'Adrenaline', 'Speed boost + 9% HP shield', NULL, NULL, 'Heroic only - Chests', 'd', NULL),
('Wing Blade', 'rare', 'Sword', 18, 116, 12.5, 47.5, 'fast', 2, 'none', 'Pierce', 'Dash forward, stunning pierce attack', NULL, NULL, 'Enemy drops', 'c', NULL),
('Frost Blade', 'rare', 'Sword', 19, 122.5, 12.5, 47.5, 'medium', 2, 'frost', 'Sub-Zero', 'Frost blast + extra frost damage for 5s', NULL, NULL, 'Enemy drops or Chests', 'c', 'Control specialist'),
('Blood Sickle', 'rare', 'Scythe', 24, 154.8, 12.5, 47.5, 'medium', 2, 'none', 'Berserk', 'Temporary speed and damage boost', NULL, NULL, 'Grasslands drops', 'c', NULL),
('Moon Sickle', 'rare', 'Scythe', 22, 142, 12.5, 47.5, 'medium', 2, 'poison', 'Lunar Spell', 'Tracking poison projectile', NULL, NULL, 'Ancient Sands drops', 'c', NULL),
('Tomb Hammer', 'rare', 'Hammer', 28, 180.6, 12.5, 47.5, 'slow', 3, 'none', 'Berserk', 'Temporary speed and damage boost', NULL, NULL, 'Craft (1500 Gold) or drops', 'c', 'Reliable mid-game'),
('Ninja Blade', 'rare', 'Sword', 32, 195.2, 15, 50, 'fast', 2, 'none', 'Slash', 'Dash to closest enemy, strike twice (+5.7% damage each)', NULL, 7, 'Enemy drops', 'd', 'Ability uses 2x stamina'),
('Cactus Sword', 'rare', 'Sword', 11, 101.8, 10, 40, 'fast', 2, 'none', 'Spikes', 'Grow spikes around, damage multiple times', NULL, NULL, 'Drops', 'd', NULL),
('Shadow Scythe', 'epic', 'Scythe', 40, 244, 17.5, 57.5, 'medium', 3, 'poison', 'Venom', 'Poison damage over 5s', NULL, NULL, 'Heroic drops', 'c', NULL),
('Ghost Katana', 'epic', 'Katana', 36, 219.6, 17.5, 57.5, 'fast', 2, 'ghost', 'Spiritual Warp', 'Teleport + 5% heal, stun enemies (1.5x damage)', NULL, NULL, 'Chests or boss drops', 'b', NULL),
('Necromancer Blade', 'epic', 'Sword', 36, 190, 17.5, 57.5, 'medium', 2.5, 'dark', 'Raise The Dead', 'Summon ghouls, heal 2.5% (requires 2 souls)', NULL, NULL, 'Ancient Sands drops', 'b', NULL),
('Ice Spear', 'epic', 'Sword', 35, 185, 17.5, 57.5, 'medium', 3, 'frost', NULL, 'Frost spear weapon', NULL, NULL, 'Haunted Tundra drops', 'b', NULL),
('Sandstorm', 'epic', 'Sword', 32, 168, 17.5, 57.5, 'medium', 2.5, 'earth', NULL, 'Desert storm blade', NULL, NULL, 'Ancient Sands drops', 'b', NULL),
('Forged Steel', 'epic', 'Greatsword', 44, 268.4, 15, 50, 'slow', 3, 'none', 'Titan', 'Shockwave stun + 13% HP + ~1.11% damage boost', 40, NULL, 'Craft (3500 Gold)', 'b', 'Best Epic for tanks'),
('Buster Blade', 'epic', 'Greatsword', 49, 298.9, 15, 50, 'slow', 3, 'none', 'Earthquake', 'Area rocks at half base damage', NULL, NULL, 'Heroic only', 'c', NULL),
('Nightmare Blade', 'epic', 'Sword', 35, 213.5, 10, 45, 'medium', 2, 'none', 'Blind', 'Stun nearby enemies briefly', NULL, NULL, 'Heroic only', 'c', NULL),
('Imperialist', 'legendary', 'Greatsword', 52, 300, 17.5, 57.5, 'medium', 3.5, 'frost', 'Lightning', 'Chain lightning (9 enemies) + stun + speed boost', 40, NULL, 'Craft (15000 Gold) or Kori boss', 's', '#1 ranked weapon'),
('Solar Scythe', 'legendary', 'Scythe', 60, 267, 10, 50, 'medium', 3, 'fire', 'Solar', 'Channel beam, fire damage to nearby enemies', NULL, NULL, 'Craft (10000 Gold)', 's', '#1 boss DPS'),
('Golden Hand', 'legendary', 'Greatsword', 48, 280, 17.5, 57.5, 'medium', 3, 'none', NULL, 'Golden gauntlet weapon', NULL, NULL, 'Boss drops or Raids', 's', NULL),
('Royalist', 'legendary', 'Sword', 45, 260, 17.5, 57.5, 'medium', 3, 'none', NULL, 'Royal weapon of the kingdom', NULL, NULL, 'Boss drops', 'a', 'Invisibility + i-frames'),
('Kori''s Fang', 'legendary', 'Sword', 100, 100, 17.5, 57.5, 'medium', 3.5, 'frost', NULL, 'Weapon from Kori boss', NULL, NULL, 'Kori boss drop (World 3)', 's', 'Best in game - 100 damage'),
('Void Slayer', 'legendary', 'Sword', 95, 95, 17.5, 57.5, 'medium', 3, 'void', NULL, 'Void-destroying weapon', NULL, NULL, 'Boss drops', 'a', NULL),
('Nekros'' Blade', 'legendary', 'Sword', 80, 80, 17.5, 57.5, 'medium', 2.5, 'dark', NULL, 'Necromancer boss weapon', NULL, NULL, 'Nekros boss drop', 'a', NULL),
('Sky Watcher', 'legendary', 'Greatsword', 66, 293.7, 17.5, 57.5, 'medium', 3, 'none', 'Cosmic Vision', 'Mark enemies +25% damage per star card (max 8)', 45, 22, 'Tundra Nightmare drop', 's', 'Stack with Spirit Capacity'),
('Black Star', 'legendary', 'Sword', 66, 293.7, 17.5, 57.5, 'medium', 3, 'none', 'Black Hole', 'Black hole sucks enemies and deals DOT', NULL, NULL, 'World 3 weapon', 's', 'Burst king'),
('Infested Blade', 'legendary', 'Sword', 52, 231.4, 17.5, 57.5, 'medium', 2, 'poison', 'Blood Snowstorm', 'AOE frost + poison damage', NULL, NULL, 'Drops', 'd', 'Worst legendary'),
('Halloween Scythe', 'vaulted', 'Scythe', 42, 240, 17.5, 57.5, 'medium', 3, 'none', NULL, 'Limited Halloween event weapon', NULL, NULL, 'Limited Halloween event', 'd', NULL),
('Christmas Blade', 'vaulted', 'Sword', 40, 230, 17.5, 57.5, 'medium', 2.5, 'none', NULL, 'Limited Christmas event weapon', NULL, NULL, 'Limited Christmas event', 'd', NULL);

-- =====================================================
-- SEED ARMORS
-- =====================================================

INSERT INTO armors (name, rarity, world_name, health_bonus, speed_bonus, energy_bonus, tier, obtain_method) VALUES
('Starter Armor', 'common', 'Grasslands', 50, 0, 100, 'c', 'Starting gear'),
('Leather Vest', 'common', 'Grasslands', 75, 5, 110, 'c', 'Chests or shops'),
('Iron Plate', 'rare', 'Grasslands', 120, 0, 120, 'b', 'Shops or enemy drops'),
('Forest Guard', 'rare', 'Grasslands', 100, 10, 130, 'c', 'Enemy drops or chests'),
('King''s Armor', 'epic', 'Grasslands', 180, 5, 150, 's', 'Boss drops or chests'),
('Desert Robes', 'rare', 'Ancient Sands', 90, 15, 140, 'c', 'Shops or drops'),
('Mummy Wraps', 'rare', 'Ancient Sands', 110, 8, 135, 'b', 'Enemy drops'),
('Sand Warrior Armor', 'epic', 'Ancient Sands', 160, 10, 160, 'a', 'Boss drops or chests'),
('Nekros'' Shell', 'legendary', 'Ancient Sands', 250, 5, 180, 's_plus', 'Nekros boss drop'),
('Yeti Hide', 'rare', 'Haunted Tundra', 140, 5, 145, 'b', 'Enemy drops'),
('Samurai Armor', 'epic', 'Haunted Tundra', 190, 12, 175, 'a', 'Boss drops or chests'),
('Frost Mail', 'epic', 'Haunted Tundra', 200, 8, 170, 'a', 'Enemy drops or chests'),
('Kori''s Blessing', 'legendary', 'Haunted Tundra', 300, 12, 200, 's_plus', 'Kori boss drop'),
('Void Armor', 'legendary', 'Special', 280, 10, 190, 's', 'Special events or drops'),
('Christmas Outfit', 'vaulted', 'Special', 150, 15, 160, 'd', 'Limited event (Vaulted)');

-- =====================================================
-- SEED RINGS
-- =====================================================

INSERT INTO rings (name, tier, rarity, description, starting_banner, key_buffs, synergy, is_craftable, obtain_method) VALUES
('Dragon Ring', 's', 'legendary', 'Fire damage ring - best for DPS', 'Flame Element', '["Damage", "Energy Recovery", "Flame Damage"]', 'Infinite combo build', false, 'Raids (Wave 30+)'),
('Timeless Ring', 's', 'legendary', 'Ability recovery and damage ring', 'Recovery', '["Dash Recovery", "Energy Recovery", "Speed"]', 'Infinite ability build', false, 'Raids (Wave 30+)'),
('Power Ring', 'a', 'legendary', 'Strong overall damage ring', 'Stamina', '["Ability Recovery", "Energy Recovery", "Max Energy"]', 'Crit-focused builds', true, 'Raids or Craft'),
('Vampire Ring', 'a', 'legendary', 'Life steal ring - best for survival', 'Life Steal', '["Agility", "Poison Element", "Spirit Damage"]', 'Survival build', false, 'Raids'),
('Rage Ring', 'a', 'legendary', 'Aggressive DPS ring', 'Rage Spirits', '["Crit Damage", "Damage", "Dodge Chance"]', 'Aggressive playstyle', false, 'Raids'),
('Element Ring', 'b', 'epic', 'Elemental damage ring', 'Elemental Circle', '["Frost Element", "Fire Element", "Poison Element"]', 'Elemental circle build', false, 'Raids'),
('Shadow Ring', 'b', 'epic', 'Shadow damage ring', 'Critical', '["Crit", "Agility"]', 'Assassin builds', false, 'Raids'),
('Polar Ring', 'b', 'epic', 'Frost-focused ring', 'Frost Element', '["Ability Recovery", "Dodge Chance", "Frost Element"]', 'Frost control builds', false, 'Raids'),
('Ghost Ring', 'b', 'epic', 'Ghost element ring', 'Speed', '["Speed", "Dash", "Dash Energy Cost"]', 'Mobility builds', false, 'Raids'),
('Forest Ring', 'c', 'rare', 'Nature healing ring', 'Thorns', '["Crit", "Health"]', 'Sustain builds', false, 'Raids'),
('Serpent Ring', 'c', 'rare', 'Poison-focused ring', 'Poison Element', '["Health", "Max Energy", "Poison Element"]', 'Poison DOT builds', false, 'Raids'),
('Health Ring', 'c', 'common', 'Basic health ring', 'Health Boost', '["Health", "Max Energy"]', 'Tank builds (weak overall)', false, 'Raids');

-- =====================================================
-- SEED POTIONS
-- =====================================================

INSERT INTO potions (name, effects, shop_price, crafting_cost, crafting_materials, savings_percentage, unlock_level, max_uses_per_run) VALUES
('Godly Potion', '["Large shield", "Heal 30%", "Damage boost 20s"]', 50, 30, '{"gold": 30, "spirit_essence": 5, "gold_ore": 10}', 40, 5, 3),
('Dragon Flask', '["Small shield", "Speed boost", "Damage boost 8s"]', 60, NULL, NULL, NULL, 5, 3),
('Health Flask', '["Heal 15% HP"]', 20, 5, '{"gold": 5, "iron_ore": 2, "wood": 5}', 50, 5, 3),
('Energy Flask', '["Heal 10% HP", "Heal 50% Energy"]', 30, NULL, NULL, NULL, 5, 3);

-- =====================================================
-- SEED UPGRADES
-- =====================================================

INSERT INTO upgrades (name, category, description, effect, per_rank_effect, max_ranks, tier, priority_order, is_must_pick, notes) VALUES
('Rage Spirits', 'offensive', 'Increases Damage and Movement Speed for every Spirit orb', '+8% damage, +5% speed per orb', '+8% damage, +5% speed', 4, 's_plus', 1, true, 'Core engine for God Run'),
('Spirit Capacity', 'utility', 'Increases maximum Spirit orbs you can carry', '+1 spirit slot (max 10)', '+1 slot per rank', 4, 's_plus', 2, true, 'Must be paired with Rage Spirits'),
('Flame Element', 'offensive', 'Adds Burn to your attacks', '~21 total damage over 3 ticks', '+21 DoT per level', 4, 'a', 3, false, 'Highest damage elemental DOT'),
('Life Steal', 'defensive', 'Restores HP whenever you get a Spirit Orb', 'Heals on spirit pickup', '+Heal per rank', 4, 'a', 4, false, 'Sustain core'),
('Stamina', 'utility', 'Increases Stamina and Stamina Regeneration', 'More dodges and faster recovery', '+Stamina per rank', 4, 'a', 5, false, 'Best defensive upgrade'),
('Frost Element', 'offensive', 'Adds Frost to your attacks', '~10.4 total damage over 4 ticks + Slow', '+10.4 DoT per level', 4, 'b', 6, false, 'Crowd control'),
('Poison Element', 'offensive', 'Adds Poison to your attacks', '~15.8 total damage over 2 ticks', '+15.8 DoT per level', 4, 'b', 7, false, 'Secondary element'),
('Critical Boost', 'offensive', 'Increases Critical Strike chance', '+Crit chance', '+Crit per rank', 4, 'b', 8, false, 'Only strong if stacked'),
('Recovery', 'utility', 'Reduces the cooldown of your Weapon''s skill', '-Cooldown time', '-Cooldown per rank', 4, 'b', 9, false, 'Can achieve infinite Solar Beam'),
('Health Boost', 'defensive', 'Increases max HP', '+HP', '+HP per rank', 4, 'd', 10, false, 'Redundant with high speed'),
('Agility', 'utility', 'Increases chance to ignore an attack', '+Dodge chance', '+Chance per rank', 4, 'c', 11, false, 'Too unreliable'),
('Thorns', 'defensive', 'Returns damage to attackers that hit you', '100% damage return', '+Damage per rank', 4, 'd', 12, false, 'Requires taking damage'),
('Element Circle', 'offensive', 'AOE damage circle around player', 'Periodic damage + element scaling', '+Tick rate per rank', 4, 'c', 13, false, 'Inconsistent damage');

-- =====================================================
-- SEED WORLDS
-- =====================================================

INSERT INTO worlds (world_name, world_number, world_type, level_range, status, description, environment, chapters, levels_per_chapter, difficulties, is_coming_soon) VALUES
('Training Camp', 0, 'Tutorial', '1', 'available', 'Safe training area for new players', 'Training area', 1, 5, '["Normal"]', false),
('Grasslands', 1, 'World 1', '2-5', 'available', 'Open fields, forests, and castles. First real combat zone.', 'Open fields, forests, castles', 3, 5, '["Normal", "Heroic", "Nightmare"]', false),
('Ancient Sands', 2, 'World 2', '6-10', 'coming_soon', 'A vast desert with pyramids and ancient ruins', 'Desert, Pyramids, Ruins', 3, 5, '["Normal", "Heroic", "Nightmare"]', true),
('Haunted Tundra', 3, 'World 3', '11-15', 'coming_soon', 'A frozen wasteland with blizzards and haunted creatures', 'Frozen wasteland, Blizzards', 3, 5, '["Normal", "Heroic", "Nightmare"]', true),
('Crimson Abyss', 4, 'World 4', '20+', 'available', 'The fourth world and the last in Arc 1', 'Crimson themed dungeon', 3, 5, '["Normal", "Heroic", "Nightmare (Upcoming)"]', false);

-- =====================================================
-- SEED ENEMIES (sample - major ones)
-- =====================================================

INSERT INTO enemies (name, world_name, chapters, enemy_type, description, health_level, speed_level, strength_level, difficulty, xp_drop, coin_drop, weakness) VALUES
('Zombie', 'Grasslands', '[1,2,3]', 'close_range', 'Most common foes, grab and bite attack', 'Low', 'Medium', 'Weak', 'Easy', '1-3', '0-2', NULL),
('Archer', 'Grasslands', '[1,2,3]', 'long_range', 'Skilled trackers with deadly bows', 'Low', 'Medium', 'Weak', 'Easy', '1-3', '0-2', NULL),
('Giant', 'Grasslands', '[1,2,3]', 'close_range', 'Towering giants with massive maces', 'Medium', 'Slow', 'Medium', 'Easy', '1-3', '0-2', NULL),
('Mage', 'Grasslands', '[1,2,3]', 'long_range', 'Cast Fire, Frost, or Poison debuffs', 'Low', 'Medium', 'Medium', 'Easy', '1-3', '0-2', NULL),
('Cannon Goblin', 'Grasslands', '[1,2,3]', 'long_range', 'Operate cannons, cannot move', 'Low', 'Immobile', 'Medium', 'Easy', '1-3', '0-2', NULL),
('Mortar Goblin', 'Grasslands', '[1,2,3]', 'long_range', 'Shoot explosives from sky, stun and burn', 'Low', 'Immobile', 'Medium', 'Easy', '1-3', '0-2', NULL),
('Bolt', 'Grasslands', '[3]', 'close_range', 'Dual daggers, lightning fast, stuns', 'Medium', 'Fast', 'Medium', 'Medium', '1-3', '0-2', NULL),
('Sand Scorpion', 'Ancient Sands', '[1,2,3]', 'melee', 'Fast melee, poison sting', 'Low', 'Fast', 'Low', 'Easy', '1-3', '0-2', ARRAY['frost']::element_type[]),
('Mummy', 'Ancient Sands', '[1,2,3]', 'melee', 'Ancient bandages, curse debuff', 'High', 'Medium', 'Medium', 'Medium', '1-3', '0-2', NULL),
('Yeti', 'Haunted Tundra', '[1,2,3]', 'melee', 'Large yeti, throws snowballs and ice spikes', 'High', 'Medium', 'High', 'Hard', '1-3', '0-2', ARRAY['fire']::element_type[]);

-- =====================================================
-- SEED BOSSES
-- =====================================================

INSERT INTO bosses (name, world_name, chapter, boss_type, description, hp_level, difficulty, attacks, strategy, xp_drop) VALUES
('John the Lumberjack', 'Grasslands', 1, 'Mini-boss', 'Simple melee boss - good for practicing', 'Medium', 'Easy', '["Axe Smash", "Tornado"]', 'Simple melee, good practice', '12-20'),
('Goblin King', 'Grasslands', 2, 'Boss', 'Goblin leader with minion summons', 'High', 'Medium', '["Slam attacks", "Minion Summons"]', 'Clear goblin minions first', 'Unknown'),
('The Kingslayer', 'Grasslands', 3, 'Final Boss', 'Final boss of Grasslands, two phases', 'High', 'Hard', '["Slam attacks", "Phase 2: Summon 3 enemies at 50% HP"]', 'Kill adds when phase 2 starts', 'Unknown'),
('Giant Sand Worm', 'Ancient Sands', 1, 'Boss', 'Massive worm burrows and spits projectiles', 'High', 'Medium', '["Burrows underground", "Spits projectiles"]', 'Watch for underground movement', 'Unknown'),
('Necros', 'Ancient Sands', 2, 'Boss', 'Necromancer, invisible and teleport', 'High', 'Hard', '["Invisibility", "Teleport", "Dark magic"]', 'Track movement when invisible', 'Unknown'),
('Titan', 'Ancient Sands', 3, 'Final Boss', 'Two-phase giant with slam and orb attacks', 'Very High', 'Hard', '["Slam", "Orb attacks", "Phase 2: More aggressive"]', 'Learn attack patterns in phase 1', 'Unknown'),
('Giant Yeti', 'Haunted Tundra', 1, 'Boss', 'Massive yeti with snowballs and ice spikes', 'Very High', 'Medium-Hard', '["Snowballs", "Ice spikes", "Ground slam"]', 'Dodge snowballs, punish after slam', 'Unknown'),
('The Musician', 'Haunted Tundra', 2, 'Boss', 'Summons minions to protect itself', 'High', 'Medium', '["Minion Summons", "Musical attacks"]', 'Kill minions first', 'Unknown'),
('Kori', 'Haunted Tundra', 3, 'Final Boss', 'Final boss of Tundra, multiple devastating attacks', 'Very High', 'Very Hard', '["Charge Beam", "Multiple attacks"]', 'Charge Beam - hide behind rocks', 'Unknown');

-- =====================================================
-- SEED CRAFTING RECIPES
-- =====================================================

INSERT INTO crafting_recipes (item_name, item_type, rarity, gold_cost, materials, is_worth_crafting, worth_notes) VALUES
('Steel Sword', 'weapon', 'common', 500, '{"wood": 5, "iron_ore": 20}', true, 'Essential early upgrade'),
('Blood Sickle', 'weapon', 'rare', 1000, '{"slime_goo": 10, "iron_ore": 30}', false, 'Easier to farm as drop'),
('Tomb Hammer', 'weapon', 'rare', 1500, '{"scorpion_tail": 15, "gold_ore": 25}', true, 'Reliable mid-game weapon'),
('Forged Steel', 'weapon', 'epic', 3500, '{"coal": 10, "gold_ore": 20, "iron_ore": 40}', true, 'Best Epic for tanks'),
('Solar Scythe', 'weapon', 'legendary', 10000, '{"diamonds": 15, "gold_ore": 25, "fire_essence": 30}', true, '#1 boss DPS weapon'),
('Imperialist', 'weapon', 'legendary', 15000, '{"spirit_essence": 20, "diamonds": 30, "frost_essence": 40}', true, '#1 ranked weapon'),
('Power Ring', 'ring', 'legendary', 2000, '{"diamonds": 10, "gold_ore": 30}', true, 'Universal DPS boost'),
('Flame Ring', 'ring', 'epic', 1500, '{"fire_essence": 20, "gold_ore": 15}', true, 'For fire builds'),
('Knight Set (Full)', 'armor', 'rare', 5000, '{"gold_ore": 20, "iron_ore": 50}', true, 'Best early armor set');

-- =====================================================
-- VERIFY DATA
-- =====================================================

-- SELECT count(*) FROM weapons;
-- SELECT count(*) FROM armors;
-- SELECT count(*) FROM rings;
-- SELECT count(*) FROM potions;
-- SELECT count(*) FROM upgrades;
-- SELECT count(*) FROM worlds;
-- SELECT count(*) FROM enemies;
-- SELECT count(*) FROM bosses;
-- SELECT count(*) FROM crafting_recipes;
-- SELECT count(*) FROM codes;

-- SELECT * FROM weapons WHERE tier = 's';
-- SELECT * FROM rings WHERE tier = 's';
-- SELECT * FROM upgrades WHERE is_must_pick = true;