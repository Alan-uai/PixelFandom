
export const world4Data = {
    id: '004',
    name: 'World 4 - Cursed School',
    powers: [
      {
        id: 'curses',
        name: 'Curses',
        type: 'gacha',
        statType: 'energy',
        unlockCost: '500k',
        stats: [
          { id: 'blazing-cataclysm', name: 'Blazing Cataclysm', multiplier: '2x', rarity: 'Common', probability: 40.55 },
          { id: 'nullborn-phantom', name: 'Nullborn Phantom', multiplier: '3x', rarity: 'Uncommon', probability: 33 },
          { id: 'infernal-crater', name: 'Infernal Crater', multiplier: '4x', rarity: 'Rare', probability: 19.9 },
          { id: 'abyssal-tide', name: 'Abyssal Tide', multiplier: '5x', rarity: 'Epic', probability: 5 },
          { id: 'verdant-calamity', name: 'Verdant Calamity', multiplier: '6x', rarity: 'Legendary', probability: 1 },
          { id: 'soulbender', name: 'Soulbender', multiplier: '8x', rarity: 'Mythic', probability: 0.5 },
          { id: 'wandered-mind', name: 'Wandered Mind', multiplier: '10x', rarity: 'Phantom', probability: 0.05 },
        ],
      },
      {
        id: 'swords-world4',
        name: 'Swords',
        type: 'gacha',
        statType: 'damage',
        unlockCost: '1M',
        stats: [
          { id: 'bloodthorn-sword', name: 'Bloodthorn', multiplier: '0.5x', rarity: 'Common', probability: 40.55 },
          { id: 'eclipse-warden-sword', name: 'Eclipse Warden', multiplier: '0.9x', rarity: 'Uncommon', probability: 33 },
          { id: 'obsidian-reaver-sword', name: 'Obsidian Reaver', multiplier: '1.5x', rarity: 'Rare', probability: 19.9 },
          { id: 'aquarius-edge-sword', name: 'Aquarius Edge', multiplier: '2x', rarity: 'Epic', probability: 5 },
          { id: 'doomsoul-sword', name: 'Doomsoul', multiplier: '2.5x', rarity: 'Legendary', probability: 1 },
          { id: 'redmourne-sword', name: 'Redmourne', multiplier: '3x', rarity: 'Mythic', probability: 0.5 },
          { id: 'venomstrike-sword', name: 'Venomstrike', multiplier: '4x', rarity: 'Phantom', probability: 0.05 },
        ],
      },
      {
        id: 'cursed-progression',
        name: 'Cursed Progression',
        type: 'progression',
        unlockCost: '2.5M',
        statType: 'damage',
        maxLevel: 410,
        maxBoost: '4.10x Damage'
      },
      {
        id: 'cursed-power',
        name: 'Cursed Power',
        type: 'gacha',
        unlockCost: '1.5M',
        statType: 'mixed',
        stats: [
            { id: 'common-curse', name: 'Common Curse', multiplier: '0.6x', statType: 'damage', rarity: 'Common', probability: 40.55 },
            { id: 'uncommon-curse', name: 'Uncommon Curse', multiplier: '0.8x', statType: 'damage', rarity: 'Uncommon', probability: 33 },
            { id: 'rare-curse', name: 'Rare Curse', multiplier: '1x', statType: 'damage', energy_crit_bonus: '1.00%', rarity: 'Rare', probability: 19.9 },
            { id: 'epic-curse', name: 'Epic Curse', multiplier: '2x', statType: 'damage', energy_crit_bonus: '2.00%', rarity: 'Epic', probability: 5 },
            { id: 'legendary-curse', name: 'Legendary Curse', multiplier: '3x', statType: 'damage', energy_crit_bonus: '3.00%', rarity: 'Legendary', probability: 1 },
            { id: 'mythical-curse', name: 'Mythical Curse', multiplier: '4x', statType: 'damage', energy_crit_bonus: '4.00%', rarity: 'Mythic', probability: 0.5 },
            { id: 'phantom-curse', name: 'Phantom Curse', multiplier: '5x', statType: 'damage', energy_crit_bonus: '5.00%', rarity: 'Phantom', probability: 0.05 }
        ]
      }
    ],
    npcs: [
        { id: 'itodo-npc', name: 'Itodo', rank: 'E', exp: 39, hp: '91Qn', world: 'World 4' },
        { id: 'nebara-npc', name: 'Nebara', rank: 'D', exp: 41, hp: '455Qn', world: 'World 4' },
        { id: 'magum-npc', name: 'Magum', rank: 'C', exp: 43, hp: '2.2sx', world: 'World 4' },
        { id: 'meki-npc', name: 'Meki', rank: 'B', exp: 45, hp: '11.3sx', world: 'World 4' },
        { id: 'tage-npc', name: 'Tage', rank: 'A', exp: 47, hp: '56sx', world: 'World 4' },
        { id: 'gajo-npc', name: 'Gajo', rank: 'S', exp: 50, hp: '284sx', world: 'World 4' },
        { id: 'sakuni-boss', name: 'Sakuni', rank: 'SS', exp: 120, hp: '1.4Sp', world: 'World 4', videoUrl: 'https://medal.tv/de/games/roblox/clips/kxFRqlwFr5gQANr-2?invite=cr-MSw5MlgsMzA5MTAxNTU4' },
    ],
    pets: [
        { id: 'itodo-pet', name: 'Itodo', rank: 'E', rarity: 'Common', energy_bonus: '47' },
        { id: 'nebara-pet', name: 'Nebara', rank: 'D', rarity: 'Uncommon', energy_bonus: '94' },
        { id: 'magum-pet', name: 'Magum', rank: 'C', rarity: 'Rare', energy_bonus: '141' },
        { id: 'meki-pet', name: 'Meki', rank: 'B', rarity: 'Epic', energy_bonus: '188' },
        { id: 'tage-pet', name: 'Tage', rank: 'A', rarity: 'Legendary', energy_bonus: '234' },
        { id: 'gajo-pet', name: 'Gajo', rank: 'S', rarity: 'Mythic', energy_bonus: '313' },
        { id: 'sakuni-pet', name: 'Sakuni', rank: 'SS', rarity: 'Phantom', energy_bonus: '938' }
    ],
    avatars: [
        { id: 'itodo-avatar', name: 'Itodo', rank: 'E', rarity: 'Common', energy_bonus: '47', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '282', stats_lv_150: '399' } },
        { id: 'nebara-avatar', name: 'Nebara', rank: 'D', rarity: 'Uncommon', energy_bonus: '94', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '564', stats_lv_150: '799' } },
        { id: 'magum-avatar', name: 'Magum', rank: 'C', rarity: 'Rare', energy_bonus: '141', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '846', stats_lv_150: '1.19k' } },
        { id: 'meki-avatar', name: 'Meki', rank: 'B', rarity: 'Epic', energy_bonus: '188', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '1.12k', stats_lv_150: '1.59k' } },
        { id: 'tage-avatar', name: 'Tage', rank: 'A', rarity: 'Legendary', energy_bonus: '234', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '1.40k', stats_lv_150: '1.98k' } },
        { id: 'gajo-avatar', name: 'Gajo', rank: 'S', rarity: 'Mythic', energy_bonus: '313', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '1.87k', stats_lv_150: '2.66k' } },
        { id: 'sakuni-avatar', name: 'Sakuni', rank: 'SS', rarity: 'Phantom', energy_bonus: '938', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '5.62k', stats_lv_150: '7.97k' } }
    ],
    dungeons: [
        {
            id: 'cursed-dungeon',
            name: 'Cursed Raid',
            description: 'A Cursed Raid está localizada no Mundo 4. Ela vai até a wave 1000 (w1k) e dropa 11 tokens para poderes de mundos iniciais, cada um com 9% de chance de drop.'
        }
    ],
  };
  
    