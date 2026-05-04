
export const world17Data = {
    id: '017',
    name: 'World 17 - Ghoul City',
    powers: [
      {
        id: 'investigators-power',
        name: 'Investigators',
        type: 'gacha',
        statType: 'energy',
        unlockCost: 'N/A',
        stats: [
          { id: 'bureau', name: 'Bureau', multiplier: '2x', rarity: 'Common' },
          { id: 'assistants', name: 'Assistants', multiplier: '3x', rarity: 'Uncommon' },
          { id: 'rank-3-inv', name: 'Rank 3', multiplier: '4.5x', rarity: 'Rare' },
          { id: 'rank-2-inv', name: 'Rank 2', multiplier: '6x', rarity: 'Epic' },
          { id: 'rank-1-inv', name: 'Rank 1', multiplier: '8x', rarity: 'Legendary' },
          { id: 'first-class-inv', name: 'First Class', multiplier: '10x', rarity: 'Mythic' },
          { id: 'associate-special-class', name: 'Associate Special Class', multiplier: '12x', rarity: 'Phantom' },
          { id: 'special-class', name: 'Special Class', multiplier: '15x', rarity: 'Supreme' }
        ]
      },
      {
        id: 'kagune-power',
        name: 'Kagune',
        type: 'gacha',
        statType: 'damage',
        unlockCost: 'N/A',
        leveling: {
            token: 'Flesh Token',
            costPerLevel: 5,
            maxLevel: 50,
            description: "Pode ser evoluído até o nível 50 usando Flesh Tokens para atingir um multiplicador de 18x."
        },
        stats: [
          { id: 'retto', name: 'Retto', multiplier: '1x', rarity: 'Common' },
          { id: 'hakuro', name: 'Hakuro', multiplier: '1.5x', rarity: 'Uncommon' },
          { id: 'shinku', name: 'Shinku', multiplier: '2x', rarity: 'Rare' },
          { id: 'tetsuba', name: 'Tetsuba', multiplier: '3x', rarity: 'Epic' },
          { id: 'shidare', name: 'Shidare', multiplier: '5x', rarity: 'Legendary' },
          { id: 'hakuja', name: 'Hakuja', multiplier: '7x', rarity: 'Mythic' },
          { id: 'mukade', name: 'Mukade', multiplier: '9x', rarity: 'Phantom' },
          { id: 'koumyaku', name: 'Koumyaku', multiplier: '12x', rarity: 'Supreme' }
        ]
      },
      {
        id: 'damage-cells-progression',
        name: 'Damage Cells',
        type: 'progression',
        statType: 'damage',
        unlockCost: 'N/A',
        maxLevel: 110,
        maxBoost: '1.10x Damage'
      }
    ],
    npcs: [
        { id: 'world17-e-rank', name: 'E Rank NPC', rank: 'E', exp: 1267295, hp: '97OVG', world: 'World 17', drops: { coins: { amount: '9.7OVG', probability: 0.8 } } },
        { id: 'world17-d-rank', name: 'D Rank NPC', rank: 'D', exp: 1394024, hp: '488OVG', world: 'World 17', drops: { coins: { amount: '48OVG', probability: 0.8 } } },
        { id: 'world17-c-rank', name: 'C Rank NPC', rank: 'C', exp: 1533427, hp: '2.4NVG', world: 'World 17', drops: { coins: { amount: '240OVG', probability: 0.8 } } },
        { id: 'world17-b-rank', name: 'B Rank NPC', rank: 'B', exp: 1686770, hp: '12NVG', world: 'World 17', drops: { coins: { amount: '1.2NVG', probability: 0.8 } } },
        { id: 'world17-a-rank', name: 'A Rank NPC', rank: 'A', exp: 1855446, hp: '61NVG', world: 'World 17', drops: { coins: { amount: '6.1NVG', probability: 0.8 } } },
        { id: 'world17-s-rank', name: 'S Rank NPC', rank: 'S', exp: 2040991, hp: '305NVG', world: 'World 17', drops: { coins: { amount: '30NVG', probability: 0.8 } } },
        { id: 'arama-boss', name: 'Arama', rank: 'SS', exp: 3061508, hp: '1.5TGN', world: 'World 17', drops: { coins: { amount: '150NVG', probability: 1 }, tokens: { amount: 5, probability: 0.5 } }, videoUrl: 'https://medal.tv/de/games/roblox/clips/l0h3JeBUIJm4ecYAo?invite=cr-MSwwRG0sMzA5MTAxNTU4&v=24' },
    ],
    shadows: [
        {
            id: 'arama-shadow',
            name: 'Arama',
            type: 'Energy',
            stats: [
                {
                    rank: 'Rank SS',
                    rarity: 'Phantom',
                    bonus: '26.6% Energy',
                },
                {
                    rank: 'Rank SSS',
                    rarity: 'Supremo',
                    bonus: '28.5% Energy',
                }
            ]
        }
    ],
    dungeons: [
        {
            id: 'ghoul-raid',
            name: 'Ghoul Raid',
            description: 'Vai até a wave 1000 (w1k). Tem chance de dropar a Ghoul Mask.'
        }
    ],
    accessories: [
        { id: 'ghoul-mask-common', name: 'Ghoul Mask', rarity: 'Common', damage_bonus: '1x' },
        { id: 'ghoul-mask-uncommon', name: 'Ghoul Mask', rarity: 'Uncommon', damage_bonus: '1.2x' },
        { id: 'ghoul-mask-rare', name: 'Ghoul Mask', rarity: 'Rare', damage_bonus: '1.4x' },
        { id: 'ghoul-mask-epic', name: 'Ghoul Mask', rarity: 'Epic', damage_bonus: '1.6x' },
        { id: 'ghoul-mask-legendary', name: 'Ghoul Mask', rarity: 'Legendary', damage_bonus: '1.8x' },
        { id: 'ghoul-mask-mythic', name: 'Ghoul Mask', rarity: 'Mythic', damage_bonus: '2.0x' },
        { id: 'ghoul-mask-phantom', name: 'Ghoul Mask', rarity: 'Phantom', damage_bonus: '2.4x' },
        { id: 'ghoul-mask-supreme', name: 'Ghoul Mask', rarity: 'Supreme', damage_bonus: '3.0x' }
    ]
};
