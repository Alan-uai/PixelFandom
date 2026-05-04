
export const world8Data = {
    id: '008',
    name: 'World 8 - Leaf Village',
    powers: [
      {
        id: 'power-eye',
        name: 'Power Eye',
        type: 'gacha',
        statType: 'mixed', 
        unlockCost: 'N/A', 
        stats: [
          { name: 'Single Tomoe Eye', multiplier: '2.5x', statType: 'damage', rarity: 'Common' },
          { name: 'Double Tomoe Eye', multiplier: '3x', statType: 'damage', rarity: 'Uncommon' },
          { name: 'Triple Tomoe Eye', multiplier: '4x', statType: 'damage', rarity: 'Rare' },
          { name: 'Triad Insight Eye', multiplier: '5x', statType: 'damage', rarity: 'Epic' },
          { name: 'Cyclone Eye', multiplier: '0.5x', statType: 'damage', rarity: 'Legendary' },
          { name: 'Whirlpool\'s Depth Eye', multiplier: '6x', statType: 'damage', rarity: 'Legendary' },
          { name: 'Triad Nexus Eye', multiplier: '1x', statType: 'damage', rarity: 'Mythic' },
          { name: 'Eclipse Eye', multiplier: '8x', statType: 'damage', rarity: 'Mythic' },
          { name: 'Atomic Insight Eye', multiplier: '1x', statType: 'damage', rarity: 'Mythic' },
          { name: 'Eternal Eclipse Eye', multiplier: '2x', statType: 'damage', rarity: 'Mythic' },
          { name: 'Eternal Atomic Eye', multiplier: '12x', statType: 'damage', rarity: 'Phantom' },
          { name: 'Eye Of Six Paths', multiplier: '15x', statType: 'damage', rarity: 'Supreme' }
        ]
      },
      {
        id: 'chakra-progression',
        name: 'Chakra Progression',
        type: 'progression',
        statType: 'energy',
        unlockCost: 'N/A',
        maxLevel: 210,
        maxBoost: '2.10x Energy'
      },
      {
        id: 'damage-range',
        name: 'Damage Range',
        type: 'progression',
        statType: 'damage',
        unlockCost: 'N/A',
        maxLevel: 10,
        maxBoost: 'N/A' 
      }
    ],
    npcs: [
        { id: 'sekuri-npc', name: 'Sekuri', rank: 'E', exp: 483, hp: '54dD', world: 'World 8' },
        { id: 'kid-norto-npc', name: 'Kid Norto', rank: 'D', exp: 531, hp: '270dD', world: 'World 8' },
        { id: 'kid-seske-npc', name: 'Kid Seske', rank: 'C', exp: 584, hp: '1.3tD', world: 'World 8' },
        { id: 'kakashki-npc', name: 'Kakashki', rank: 'B', exp: 643, hp: '6.7tD', world: 'World 8' },
        { id: 'jiria-npc', name: 'Jiria', rank: 'A', exp: 707, hp: '33tD', world: 'World 8' },
        { id: 'tsuni-npc', name: 'Tsuni', rank: 'S', exp: 777, hp: '168tD', world: 'World 8' },
        { id: 'itechi-boss', name: 'Itechi', rank: 'SS', exp: 1920, hp: '844tD', world: 'World 8', videoUrl: 'https://medal.tv/de/games/roblox/clips/kBu5h6Im0kz9y_wjT?invite=cr-MSxNQUksMzA5MTAxNTU4' },
        { id: 'madera-boss', name: 'Madera', rank: 'SS', exp: 2880, hp: '1.6qdD', world: 'World 8', videoUrl: 'https://medal.tv/de/games/roblox/clips/kBu8xd6Vy3lE5nDOv?invite=cr-MSxYeUcsMzA5MTAxNTU4' },
    ],
    pets: [
        { id: 'sekuri-pet', name: 'Sekuri', rank: 'E', rarity: 'Common', energy_bonus: '1.83k' },
        { id: 'kid-norto-pet', name: 'Kid Norto', rank: 'D', rarity: 'Uncommon', energy_bonus: '3.66k' },
        { id: 'kid-seske-pet', name: 'Kid Seske', rank: 'C', rarity: 'Rare', energy_bonus: '5.49k' },
        { id: 'kakashki-pet', name: 'Kakashki', rank: 'B', rarity: 'Epic', energy_bonus: '7.32k' },
        { id: 'jiria-pet', name: 'Jiria', rank: 'A', rarity: 'Legendary', energy_bonus: '9.15k' },
        { id: 'tsuni-pet', name: 'Tsuni', rank: 'S', rarity: 'Mythic', energy_bonus: '12.2k' },
        { id: 'itechi-pet', name: 'Itechi', rank: 'SS', rarity: 'Phantom', energy_bonus: '36.6k' },
        { id: 'madera-pet', name: 'Madera', rank: 'SS', rarity: 'Phantom', energy_bonus: '40.2k' }
    ],
    avatars: [
        { id: 'sekuri-avatar', name: 'Sekuri', rank: 'E', rarity: 'Common', energy_bonus: '1.83k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '10.9k', stats_lv_150: '15.5k' } },
        { id: 'kid-norto-avatar', name: 'Kid Norto', rank: 'D', rarity: 'Uncommon', energy_bonus: '3.66k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '21.9k', stats_lv_150: '31.1k' } },
        { id: 'kid-seske-avatar', name: 'Kid Seske', rank: 'C', rarity: 'Rare', energy_bonus: '5.49k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '32.9k', stats_lv_150: '46.6k' } },
        { id: 'kakashki-avatar', name: 'Kakashki', rank: 'B', rarity: 'Epic', energy_bonus: '7.32k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '43.9k', stats_lv_150: '62.2k' } },
        { id: 'jiria-avatar', name: 'Jiria', rank: 'A', rarity: 'Legendary', energy_bonus: '9.15k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '54.9k', stats_lv_150: '77.8k' } },
        { id: 'tsuni-avatar', name: 'Tsuni', rank: 'S', rarity: 'Mythic', energy_bonus: '12.2k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '73.2k', stats_lv_150: '103k' } },
        { id: 'itechi-avatar', name: 'Itechi', rank: 'SS', rarity: 'Phantom', energy_bonus: '36.6k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '219.6k', stats_lv_150: '311k' } },
        { id: 'madera-avatar', name: 'Madera', rank: 'SS', rarity: 'Phantom', energy_bonus: '40.2k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '241.2k', stats_lv_150: '342k' } }
    ],
    shadows: [
        {
            id: 'madara-shadow',
            name: 'Madara',
            type: 'Damage',
            stats: [
                {
                    rank: 'Rank SS',
                    rarity: 'Phantom',
                    bonus: '11.2% Damage',
                    cooldown: '2s',
                },
                {
                    rank: 'Rank SSS',
                    rarity: 'Supreme',
                    bonus: '12% Damage',
                    cooldown: '2s',
                }
            ]
        }
    ]
};

    