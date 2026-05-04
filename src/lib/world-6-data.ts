
export const world6Data = {
    id: '006',
    name: 'World 6 - Solo Island',
    powers: [
      {
        id: 'solo-hunter-rank',
        name: 'Solo Hunter Rank',
        type: 'gacha',
        statType: 'energy',
        unlockCost: 'N/A', // O custo não foi especificado
        stats: [
          { id: 'e-rank-hunter', name: 'E-Rank', multiplier: '2x', rarity: 'Common' },
          { id: 'd-rank-hunter', name: 'D-Rank', multiplier: '3x', rarity: 'Uncommon' },
          { id: 'c-rank-hunter', name: 'C-Rank', multiplier: '4x', rarity: 'Rare' },
          { id: 'b-rank-hunter', name: 'B-Rank', multiplier: '5x', rarity: 'Epic' },
          { id: 'a-rank-hunter', name: 'A-Rank', multiplier: '8x', rarity: 'Legendary' },
          { id: 's-rank-hunter', name: 'S-Rank', multiplier: '10x', rarity: 'Mythic' },
          { id: 'national-level-hunter', name: 'National Level Hunter', multiplier: '12x', rarity: 'Phantom' }
        ]
      },
      {
        id: 'reawakening-progression',
        name: 'ReAwakening Progression',
        type: 'progression',
        statType: 'energy',
        unlockCost: 'N/A',
        maxLevel: 210,
        maxBoost: '2.10x Energy'
      },
      {
        id: 'monarch-progression',
        name: 'Monarch Progression',
        type: 'progression',
        statType: 'mixed',
        unlockCost: 'N/A',
        maxLevel: 200,
        boosts: [
            { type: 'damage', value: '2.00x Damage' },
            { type: 'crit_damage', value: '50% Crit Damage' }
        ]
      }
    ],
    npcs: [
        { id: 'weak-sung-npc', name: 'Weak Sung', rank: 'E', exp: 119, hp: '2.2N', world: 'World 6' },
        { id: 'green-goblin-npc', name: 'Green Goblin', rank: 'D', exp: 131, hp: '11.2N', world: 'World 6' },
        { id: 'white-tiger-npc', name: 'White Tiger', rank: 'C', exp: 144, hp: '56N', world: 'World 6' },
        { id: 'cha-npc', name: 'Cha', rank: 'B', exp: 159, hp: '280N', world: 'World 6' },
        { id: 'choi-npc', name: 'Choi', rank: 'A', exp: 174, hp: '1.4de', world: 'World 6' },
        { id: 'solo-sung-npc', name: 'Solo Sung', rank: 'S', exp: 192, hp: '7de', world: 'World 6' },
        { id: 'statue-of-god-boss', name: 'Statue of God', rank: 'SS', exp: 480, hp: '35de', world: 'World 6', videoUrl: ['https://medal.tv/de/games/roblox/clips/kwqR5RhJmlHUslypt?invite=cr-MSxiUjIsMzA5MTAxNTU4', 'https://medal.tv/de/games/roblox/clips/kwrfK7BxWn8erwSoy?invite=cr-MSxGRUosMzA5MTAxNTU4'] },
    ],
    pets: [
        { id: 'weak-sung-pet', name: 'Weak Sung', rank: 'E', rarity: 'Common', energy_bonus: '293' },
        { id: 'green-goblin-pet', name: 'Green Goblin', rank: 'D', rarity: 'Uncommon', energy_bonus: '586' },
        { id: 'white-tiger-pet', name: 'White Tiger', rank: 'C', rarity: 'Rare', energy_bonus: '879' },
        { id: 'cha-pet', name: 'Cha', rank: 'B', rarity: 'Epic', energy_bonus: '1.17k' },
        { id: 'choi-pet', name: 'Choi', rank: 'A', rarity: 'Legendary', energy_bonus: '1.46k' },
        { id: 'solo-sung-pet', name: 'Solo Sung', rank: 'S', rarity: 'Mythic', energy_bonus: '1.95k' },
        { id: 'statue-of-god-pet', name: 'Statue of God', rank: 'SS', rarity: 'Phantom', energy_bonus: '5.85k' }
    ],
    avatars: [
        { id: 'weak-sung-avatar', name: 'Weak Sung', rank: 'E', rarity: 'Common', energy_bonus: '293', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '1.75k', stats_lv_150: '2.49k' } },
        { id: 'green-goblin-avatar', name: 'Green Goblin', rank: 'D', rarity: 'Uncommon', energy_bonus: '586', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '3.51k', stats_lv_150: '4.98k' } },
        { id: 'white-tiger-avatar', name: 'White Tiger', rank: 'C', rarity: 'Rare', energy_bonus: '879', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '5.27k', stats_lv_150: '7.47k' } },
        { id: 'cha-avatar', name: 'Cha', rank: 'B', rarity: 'Epic', energy_bonus: '1.17k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '7.03k', stats_lv_150: '9.96k' } },
        { id: 'choi-avatar', name: 'Choi', rank: 'A', rarity: 'Legendary', energy_bonus: '1.46k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '8.79k', stats_lv_150: '12.4k' } },
        { id: 'solo-sung-avatar', name: 'Solo Sung', rank: 'S', rarity: 'Mythic', energy_bonus: '1.95k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '11.7k', stats_lv_150: '16.6k' } },
        { id: 'statue-of-god-avatar', name: 'Statue of God', rank: 'SS', rarity: 'Phantom', energy_bonus: '5.85k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '35.1k', stats_lv_150: '49.8k' } }
    ],
    shadows: [
        {
            id: 'statue-of-god-shadow',
            name: 'Statue of God',
            type: 'Damage',
            stats: [
                {
                    rank: 'Rank SS',
                    rarity: 'Phantom',
                    bonus: '7% Damage',
                    cooldown: '2s',
                },
                {
                    rank: 'Rank SSS',
                    rarity: 'Supremo',
                    bonus: '7.5% Damage',
                    cooldown: '2s',
                }
            ]
        }
    ]
};

    