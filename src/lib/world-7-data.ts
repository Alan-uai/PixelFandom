
export const world7Data = {
    id: '007',
    name: 'World 7 - Clover Village',
    powers: [
      {
        id: 'grimoire-1',
        name: 'Grimoire 1',
        type: 'gacha',
        statType: 'energy',
        unlockCost: 'N/A', // Custo não especificado
        stats: [
          { id: 'water-grimoire', name: 'Water Grimoire', multiplier: '2x', rarity: 'Common' },
          { id: 'fire-grimoire', name: 'Fire Grimoire', multiplier: '3x', rarity: 'Uncommon' },
          { id: 'wind-grimoire', name: 'Wind Grimoire', multiplier: '4x', rarity: 'Rare' },
          { id: 'dark-grimoire', name: 'Dark Grimoire', multiplier: '5x', rarity: 'Epic' },
          { id: 'light-grimoire', name: 'Light Grimoire', multiplier: '8x', rarity: 'Legendary' },
          { id: 'anti-magic-grimoire', name: 'Anti-Magic Grimoire', multiplier: '10x', rarity: 'Mythic' },
          { id: 'time-magic-grimoire', name: 'Time Magic Grimoire', multiplier: '12x', rarity: 'Phantom' }
        ]
      },
      {
        id: 'water-spirit-progression',
        name: 'Water Spirit Progression',
        type: 'progression',
        statType: 'energy',
        unlockCost: 'N/A',
        maxLevel: 100,
        maxBoost: '1.00x Energy'
      },
      {
        id: 'wind-spirit-progression',
        name: 'Wind Spirit Progression',
        type: 'progression',
        statType: 'luck', // Assuming crit chance falls under luck
        unlockCost: 'N/A',
        maxLevel: 10,
        maxBoost: '5% Crit Chance'
      },
      {
        id: 'fire-spirit-progression',
        name: 'Fire Spirit Progression',
        type: 'progression',
        statType: 'damage',
        unlockCost: 'N/A',
        maxLevel: 100,
        maxBoost: '1.00x Damage'
      }
    ],
    npcs: [
        { id: 'noalle-npc', name: 'Noalle', rank: 'E', exp: 240, hp: '350de', world: 'World 7' },
        { id: 'megna-npc', name: 'Megna', rank: 'D', exp: 264, hp: '1.7Ud', world: 'World 7' },
        { id: 'finrel-npc', name: 'Finrel', rank: 'C', exp: 290, hp: '8.7Ud', world: 'World 7' },
        { id: 'aste-npc', name: 'Aste', rank: 'B', exp: 319, hp: '43Ud', world: 'World 7' },
        { id: 'yune-npc', name: 'Yune', rank: 'A', exp: 351, hp: '218Ud', world: 'World 7' },
        { id: 'yemi-npc', name: 'Yemi', rank: 'S', exp: 386, hp: '1dD', world: 'World 7' },
        { id: 'novi-chrone-boss', name: 'Novi Chroni', rank: 'SS', exp: 960, hp: '5.4dD', world: 'World 7', videoUrl: 'https://medal.tv/de/games/roblox/clips/kygyx0Eq9crbZK4rF?invite=cr-MSxTVVAsMzA5MTAxNTU4' },
    ],
    pets: [
        { id: 'noalle-pet', name: 'Noalle', rank: 'E', rarity: 'Common', energy_bonus: '732' },
        { id: 'megna-pet', name: 'Megna', rank: 'D', rarity: 'Uncommon', energy_bonus: '1.46k' },
        { id: 'finrel-pet', name: 'Finrel', rank: 'C', rarity: 'Rare', energy_bonus: '2.19k' },
        { id: 'aste-pet', name: 'Aste', rank: 'B', rarity: 'Epic', energy_bonus: '2.93k' },
        { id: 'yune-pet', name: 'Yune', rank: 'A', rarity: 'Legendary', energy_bonus: '3.66k' },
        { id: 'yemi-pet', name: 'Yemi', rank: 'S', rarity: 'Mythic', energy_bonus: '4.88k' },
        { id: 'novi-chroni-pet', name: 'Novi Chroni', rank: 'SS', rarity: 'Phantom', energy_bonus: '14.6k' }
    ],
    avatars: [
        { id: 'noalle-avatar', name: 'Noalle', rank: 'E', rarity: 'Common', energy_bonus: '732', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '4.39k', stats_lv_150: '6.22k' } },
        { id: 'megna-avatar', name: 'Megna', rank: 'D', rarity: 'Uncommon', energy_bonus: '1.46k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '8.79k', stats_lv_150: '12.4k' } },
        { id: 'finrel-avatar', name: 'Finrel', rank: 'C', rarity: 'Rare', energy_bonus: '2.19k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '13.1k', stats_lv_150: '18.6k' } },
        { id: 'aste-avatar', name: 'Aste', rank: 'B', rarity: 'Epic', energy_bonus: '2.93k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '17.5k', stats_lv_150: '24.9k' } },
        { id: 'yune-avatar', name: 'Yune', rank: 'A', rarity: 'Legendary', energy_bonus: '3.66k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '21.9k', stats_lv_150: '31.1k' } },
        { id: 'yemi-avatar', name: 'Yemi', rank: 'S', rarity: 'Mythic', energy_bonus: '4.88k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '29.2k', stats_lv_150: '41.5k' } },
        { id: 'novi-chroni-avatar', name: 'Novi Chroni', rank: 'SS', rarity: 'Phantom', energy_bonus: '14.6k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '87.8k', stats_lv_150: '124k' } }
    ],
    shadows: [
        {
            id: 'novi-chrone-shadow',
            name: 'Novi Chrone',
            type: 'Energy',
            stats: [
                {
                    rank: 'Rank SS',
                    rarity: 'Phantom',
                    bonus: '7% Energy',
                },
                {
                    rank: 'Rank SSS',
                    rarity: 'Supremo',
                    bonus: '7.5% Energy',
                }
            ]
        }
    ]
};
    
    