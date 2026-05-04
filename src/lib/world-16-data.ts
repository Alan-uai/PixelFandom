
export const world16Data = {
    id: '016',
    name: 'World 16 - Cairo',
    powers: [
      {
        id: 'onomatopoeia-power',
        name: 'Onomatopoeia',
        type: 'gacha',
        statType: 'energy',
        unlockCost: 'N/A',
        stats: [
          { id: 'common-onomato', name: 'Common Onomatopoeia', multiplier: '2x', rarity: 'Common', probability: 40.55 },
          { id: 'uncommon-onomato', name: 'Uncommon Onomatopoeia', multiplier: '3x', rarity: 'Uncommon', probability: 33 },
          { id: 'rare-onomato', name: 'Rare Onomatopoeia', multiplier: '4.5x', rarity: 'Rare', probability: 19.9 },
          { id: 'epic-onomato', name: 'Epic Onomatopoeia', multiplier: '6x', rarity: 'Epic', probability: 5 },
          { id: 'legendary-onomato', name: 'Legendary Onomatopoeia', multiplier: '8x', rarity: 'Legendary', probability: 1 },
          { id: 'mythical-onomato', name: 'Mythical Onomatopoeia', multiplier: '10x', rarity: 'Mythic', probability: 0.5 },
          { id: 'phantom-onomato', name: 'Phantom Onomatopoeia', multiplier: '12x', rarity: 'Phantom', probability: 0.05 },
          { id: 'supreme-onomato', name: 'Supreme Onomatopoeia', multiplier: '15x', rarity: 'Supreme', probability: 0.01 },
        ],
      },
       {
        id: 'ripple-energy',
        name: 'Ripple Energy',
        type: 'progression',
        statType: 'energy',
        unlockCost: 'N/A',
        maxLevel: 110,
        maxBoost: '1.10x Energy'
      },
      {
        id: 'stand-evolution',
        name: 'Stand Evolution',
        type: 'progression',
        statType: 'mixed',
        unlockCost: 'N/A',
        description: 'Evolua os Stands. 2 de 0★ para 1★ (custo: 1k Exchange Token 1). 2 de 1★ para 2★ (custo: 2.5k Exchange Token 1). 2 de 2★ para 3★ (custo: 5k Exchange Token 1).'
      }
    ],
    npcs: [
        { id: 'world16-e-rank', name: 'E Rank NPC', rank: 'E', exp: 629512, hp: '6.2SPG', world: 'World 16', drops: { coins: { amount: '620SeV', probability: 0.8 } } },
        { id: 'world16-d-rank', name: 'D Rank NPC', rank: 'D', exp: 692464, hp: '31SPG', world: 'World 16', drops: { coins: { amount: '3.1SPG', probability: 0.8 } } },
        { id: 'world16-c-rank', name: 'C Rank NPC', rank: 'C', exp: 761710, hp: '156SPG', world: 'World 16', drops: { coins: { amount: '15SPG', probability: 0.8 } } },
        { id: 'world16-b-rank', name: 'B Rank NPC', rank: 'B', exp: 837881, hp: '782SPG', world: 'World 16', drops: { coins: { amount: '78SPG', probability: 0.8 } } },
        { id: 'world16-a-rank', name: 'A Rank NPC', rank: 'A', exp: 921669, hp: '3.9OVG', world: 'World 16', drops: { coins: { amount: '390SPG', probability: 0.8 } } },
        { id: 'world16-s-rank', name: 'S Rank NPC', rank: 'S', exp: 1013836, hp: '19OVG', world: 'World 16', drops: { coins: { amount: '1.9OVG', probability: 0.8 } } },
        { id: 'dio-boss', name: 'Dio', rank: 'SS', exp: 1520754, hp: '97OVG', world: 'World 16', drops: { coins: { amount: '9.7OVG', probability: 1 }, tokens: { amount: 5, probability: 0.5 } }, videoUrl: 'https://medal.tv/de/games/roblox/clips/kXhWRGJIILo0hPhvz?invite=cr-MSxuUmksMzA5MTAxNTU4&v=19' },
    ],
    dungeons: [
        {
            id: 'progression-raid-2',
            name: 'Progression Raid 2',
            description: 'Vai até a wave 1000 (w1k).'
        }
    ],
    shadows: [
        {
            id: 'dio-shadow',
            name: 'Dio',
            type: 'Damage',
            stats: [
                {
                    rank: 'Rank SS',
                    rarity: 'Phantom',
                    bonus: '26.6% Damage',
                    cooldown: '2s',
                },
                {
                    rank: 'Rank SSS',
                    rarity: 'Supremo',
                    bonus: '28.5% Damage',
                    cooldown: '2s',
                }
            ]
        }
    ],
    stands: [
        { id: 'star-platinum', name: 'Star Platinum', rarity: 'Comum', energy_bonus: '2%' },
        { id: 'magicians-red', name: 'Magicians Red', rarity: 'Incomum', energy_bonus: '4%' },
        { id: 'hierophant-green', name: 'Hierophant Green', rarity: 'Raro', energy_bonus: '6%' },
        { id: 'the-world', name: 'The World', rarity: 'Épico', energy_bonus: '10%' },
        { id: 'king-crimson', name: 'King Crimson', rarity: 'Lendário', energy_bonus: '15%' },
        { id: 'killer-queen', name: 'Killer Queen', rarity: 'Mítico', energy_bonus: '20%' },
        { id: 'golden-experience', name: 'Golden Experience', rarity: 'Mítico', energy_bonus: '25%' },
        { id: 'golden-experience-requiem', name: 'Golden Experience Requiem', rarity: 'Phantom', energy_bonus: '35%' },
        { id: 'the-world-over-heaven', name: 'The World Over Heaven', rarity: 'Phantom', energy_bonus: '40%' }
    ]
};
