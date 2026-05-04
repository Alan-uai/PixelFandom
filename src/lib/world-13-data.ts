
export const world13Data = {
    id: '013',
    name: 'World 13 - Kaiju Base',
    powers: [
      {
        id: 'kaiju-powers',
        name: 'Kaiju Powers',
        type: 'gacha',
        statType: 'energy',
        unlockCost: 'N/A',
        stats: [
          { id: 'phaneroplus', name: 'Phaneroplus', multiplier: '2x', rarity: 'Common', probability: 40.55 },
          { id: 'philinosoma', name: 'Philinosoma', multiplier: '3x', rarity: 'Uncommon', probability: 33 },
          { id: 'primigenius-honju', name: 'Primigenius Honju', multiplier: '4.5x', rarity: 'Rare', probability: 19.9 },
          { id: 'preondactyl', name: 'Preondactyl', multiplier: '6x', rarity: 'Epic', probability: 5 },
          { id: 'mixogastero', name: 'Mixogastero', multiplier: '8x', rarity: 'Legendary', probability: 1 },
          { id: 'no-10', name: 'No. 10', multiplier: '10x', rarity: 'Mythic', probability: 0.5 },
          { id: 'no-9', name: 'No. 9', multiplier: '12x', rarity: 'Phantom', probability: 0.05 },
          { id: 'no-8', name: 'No. 8', multiplier: '15x', rarity: 'Supreme', probability: 0.01 },
        ]
      },
      {
        id: 'fortitude-level',
        name: 'Fortitude Level',
        type: 'progression',
        statType: 'damage',
        unlockCost: 'N/A',
        maxLevel: 210,
        maxBoost: '2.10x Damage'
      },
      {
        id: 'kaiju-energy',
        name: 'Kaiju Energy',
        type: 'progression',
        statType: 'energy',
        unlockCost: 'N/A',
        maxLevel: 110,
        maxBoost: '1.10x Energy'
      }
    ],
    npcs: [
        { id: 'world13-e-rank', name: 'E Rank NPC', rank: 'E', exp: 38327, hp: '104UVg', world: 'World 13', drops: { coins: { amount: '10UVg', probability: 0.8 } } },
        { id: 'world13-d-rank', name: 'D Rank NPC', rank: 'D', exp: 42160, hp: '522UVg', world: 'World 13', drops: { coins: { amount: '52UVg', probability: 0.8 } } },
        { id: 'world13-c-rank', name: 'C Rank NPC', rank: 'C', exp: 46376, hp: '2.6DVg', world: 'World 13', drops: { coins: { amount: '260UVg', probability: 0.8 } } },
        { id: 'world13-b-rank', name: 'B Rank NPC', rank: 'B', exp: 51013, hp: '13DVg', world: 'World 13', drops: { coins: { amount: '1.3DVg', probability: 0.8 } } },
        { id: 'world13-a-rank', name: 'A Rank NPC', rank: 'A', exp: 56115, hp: '65DVg', world: 'World 13', drops: { coins: { amount: '6.5DVg', probability: 0.8 } } },
        { id: 'world13-s-rank', name: 'S Rank NPC', rank: 'S', exp: 61726, hp: '327DVg', world: 'World 13', drops: { coins: { amount: '32DVg', probability: 0.8 } } },
        { id: 'number-8-boss', name: 'Number 8', rank: 'SS', exp: 92160, hp: '1.6TVg', world: 'World 13', drops: { coins: { amount: '160DVg', probability: 1 }, tokens: { amount: 5, probability: 0.5 } }, videoUrl: 'https://medal.tv/de/games/roblox/clips/kP6HV0AtQKNRT9X_k?invite=cr-MSxGQ2YsMzA5MTAxNTU4&v=28' },
    ],
    shadows: [
        {
            id: 'number-8-shadow',
            name: 'Number 8',
            type: 'Energy',
            stats: [
                {
                    rank: 'Rank SS',
                    rarity: 'Phantom',
                    bonus: '19.6% Energy',
                },
                {
                    rank: 'Rank SSS',
                    rarity: 'Supremo',
                    bonus: '21% Energy',
                }
            ]
        }
    ],
    dungeons: [
      {
        id: 'kaiju-dungeon',
        name: 'Kaiju Dungeon',
        description: 'Vai até a wave 50 (w50). O tempo para derrotá-la é diferente das outras raids.'
      }
    ]
};
