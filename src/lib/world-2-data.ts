
export const world2Data = {
    id: '002',
    name: 'World 2 - Windmill Island',
    powers: [
      {
        id: 'red-emperor-power',
        name: 'Red Emperor Power',
        type: 'gacha',
        statType: 'damage',
        unlockCost: '75k',
        stats: [
          { id: 'conquerors-haki', name: 'Conquerors Haki', multiplier: '1.1x', rarity: 'Rare', probability: 19.9 },
          { id: 'red-hair', name: 'Red Hair', multiplier: '1.2x', rarity: 'Epic', probability: 5 },
          { id: 'emperor', name: 'Emperor', multiplier: '1.3x', rarity: 'Legendary', probability: 1 },
          { id: 'yonko', name: 'Yonko', multiplier: '1.4x', rarity: 'Mythic', probability: 0.5 },
        ],
      },
      {
        id: 'pirate-crew',
        name: 'Pirate Crew',
        type: 'gacha',
        statType: 'energy',
        unlockCost: '25k',
        stats: [
            { id: 'whitebeard-pirates', name: 'Whitebeard Pirates', multiplier: '2x', rarity: 'Common', probability: 40.55 },
            { id: 'cross-guild', name: 'Cross Guild', multiplier: '3x', rarity: 'Uncommon', probability: 33 },
            { id: 'big-mom-pirates', name: 'Big Mom Pirates', multiplier: '4x', rarity: 'Rare', probability: 19.9 },
            { id: 'beast-pirates', name: 'Beast pirates', multiplier: '5x', rarity: 'Epic', probability: 5 },
            { id: 'blackbeard-pirates', name: 'Blackbeard Pirates', multiplier: '6x', rarity: 'Legendary', probability: 1 },
            { id: 'straw-hat-pirates', name: 'Straw Hat Pirates', multiplier: '8x', rarity: 'Mythic', probability: 0.5 },
            { id: 'red-haired-pirates', name: 'Red-Haired Pirates', multiplier: '10x', rarity: 'Phantom', probability: 0.05 }
        ]
      },
      {
        id: 'chef-power',
        name: 'Chef Power',
        type: 'gacha',
        statType: 'damage',
        unlockCost: '35k',
        stats: [
            { id: 'common-chef', name: 'Common Chef', multiplier: '1x', rarity: 'Common', probability: 40.55 },
            { id: 'uncommon-chef', name: 'Uncommon Chef', multiplier: '1.5x', rarity: 'Uncommon', probability: 33 },
            { id: 'rare-chef', name: 'Rare Chef', multiplier: '2x', rarity: 'Rare', probability: 19.9 },
            { id: 'epic-chef', name: 'Epic Chef', multiplier: '3x', rarity: 'Epic', probability: 5 },
            { id: 'legendary-chef', name: 'Legendary Chef', multiplier: '5x', rarity: 'Legendary', probability: 1 },
            { id: 'mythical-chef', name: 'Mythical Chef', multiplier: '7x', rarity: 'Mythic', probability: 0.5 },
            { id: 'phantom-chef', name: 'Phantom Chef', multiplier: '10x', rarity: 'Phantom', probability: 0.05 }
        ]
      },
      {
        id: 'demon-fruit',
        name: 'Demon Fruit',
        type: 'gacha',
        unlockCost: '55k',
        // statType is defined on individual stats because it's mixed
        stats: [
          { id: 'bomb-fruit', name: 'Bomb Fruit', multiplier: '2x', statType: 'coin', rarity: 'Common' },
          { id: 'rubber-fruit', name: 'Rubber Fruit', multiplier: '3x', statType: 'energy', rarity: 'Uncommon' },
          { id: 'sand-fruit', name: 'Sand Fruit', multiplier: '4x', statType: 'coin', rarity: 'Rare' },
          { id: 'flame-fruit', name: 'Flame Fruit', multiplier: '5x', statType: 'energy', rarity: 'Epic' },
          { id: 'smoke-fruit', name: 'Smoke Fruit', multiplier: '6x', statType: 'energy', rarity: 'Legendary' },
          { id: 'magma-fruit', name: 'Magma Fruit', multiplier: '7x', statType: 'damage', rarity: 'Legendary' },
          { id: 'revive-fruit', name: 'Revive Fruit', multiplier: '8x', statType: 'energy', rarity: 'Mythic' },
          { id: 'string-fruit', name: 'String Fruit', multiplier: '9x', statType: 'coin', rarity: 'Mythic' },
          { id: 'human-fruit', name: 'Human Fruit', multiplier: '10x', statType: 'coin', rarity: 'Phantom' },
          { id: 'dark-fruit', name: 'Dark Fruit', multiplier: '11x', statType: 'coin', rarity: 'Phantom' },
          { id: 'quake-fruit', name: 'Quake Fruit', multiplier: '12x', statType: 'damage', rarity: 'Phantom' },
          { id: 'money-fruit', name: 'Money Fruit', multiplier: '1x', statType: 'coin', rarity: 'Uncommon' },
          { id: 'phoenix-fruit', name: 'Phoenix Fruit', multiplier: '15x', statType: 'energy', rarity: 'Phantom' },
          { id: 'dough-fruit', name: 'Dough Fruit', multiplier: '10x', statType: 'energy', rarity: 'Phantom' },
        ]
      },
      {
        id: 'haki-upgrade',
        name: 'Haki Upgrade',
        type: 'progression',
        unlockCost: '100k',
        statType: 'damage',
        maxLevel: 60,
        maxBoost: '0.6x Damage'
      }
    ],
    npcs: [
        { id: 'nomi-npc', name: 'Nomi', rank: 'E', exp: 9, hp: '7.5B', world: 'World 2' },
        { id: 'usup-npc', name: 'Usup', rank: 'D', exp: 10, hp: '37.5B', world: 'World 2' },
        { id: 'robins-npc', name: 'Robins', rank: 'C', exp: 11, hp: '187.5B', world: 'World 2' },
        { id: 'senji-npc', name: 'Senji', rank: 'B', exp: 12, hp: '937.5B', world: 'World 2' },
        { id: 'zaro-npc', name: 'Zaro', rank: 'A', exp: 13, hp: '4.6T', world: 'World 2' },
        { id: 'loffy-npc', name: 'Loffy', rank: 'S', exp: 14, hp: '23.4T', world: 'World 2' },
        { id: 'shanks-boss', name: 'Shanks', rank: 'SS', exp: 30, hp: '117T', world: 'World 2', videoUrl: 'https://medal.tv/de/games/roblox/clips/kurLprKrE11td2ij-?invite=cr-MSxwSUosMzA5MTAxNTU4' },
    ],
    pets: [
        { id: 'nomi-pet', name: 'Nomi', rank: 'E', rarity: 'Common', energy_bonus: '8' },
        { id: 'usup-pet', name: 'Usup', rank: 'D', rarity: 'Uncommon', energy_bonus: '15' },
        { id: 'robins-pet', name: 'Robins', rank: 'C', rarity: 'Rare', energy_bonus: '23' },
        { id: 'senji-pet', name: 'Senji', rank: 'B', rarity: 'Epic', energy_bonus: '30' },
        { id: 'zaro-pet', name: 'Zaro', rank: 'A', rarity: 'Legendary', energy_bonus: '38' },
        { id: 'loffy-pet', name: 'Loffy', rank: 'S', rarity: 'Mythic', energy_bonus: '50' },
        { id: 'shanks-pet', name: 'Shanks', rank: 'SS', rarity: 'Phantom', energy_bonus: '150' }
    ],
    avatars: [
        { id: 'nomi-avatar', name: 'Nomi', rank: 'E', rarity: 'Common', energy_bonus: '8', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '48', stats_lv_150: '68' } },
        { id: 'usup-avatar', name: 'Usup', rank: 'D', rarity: 'Uncommon', energy_bonus: '15', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '90', stats_lv_150: '127.5' } },
        { id: 'robins-avatar', name: 'Robins', rank: 'C', rarity: 'Rare', energy_bonus: '23', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '138', stats_lv_150: '195.5' } },
        { id: 'senji-avatar', name: 'Senji', rank: 'B', rarity: 'Epic', energy_bonus: '30', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '180', stats_lv_150: '255' } },
        { id: 'zaro-avatar', name: 'Zaro', rank: 'A', rarity: 'Legendary', energy_bonus: '38', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '228', stats_lv_150: '323' } },
        { id: 'loffy-avatar', name: 'Loffy', rank: 'S', rarity: 'Mythic', energy_bonus: '50', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '300', stats_lv_150: '425' } },
        { id: 'shanks-avatar', name: 'Shanks', rank: 'SS', rarity: 'Phantom', energy_bonus: '150', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '900', stats_lv_150: '1.27k' } }
    ],
    dungeons: [
        {
            id: 'restaurante',
            name: 'Restaurante',
            boss: 'Don Krieg',
            description: 'Sobe até o nível 1000. Dropa 5 tokens para poderes de mundos iniciais, cada um com 20% de chance de drop.'
        }
    ],
  };
  
    