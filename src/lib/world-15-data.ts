
export const world15Data = {
    id: '015',
    name: 'World 15 - Virtual City',
    powers: [
      {
        id: 'power-energy-runes',
        name: 'Power Energy Runes',
        type: 'gacha',
        statType: 'energy',
        unlockCost: 'N/A',
        stats: [
          { name: 'Common Energy Rune', multiplier: '2x', rarity: 'Common' },
          { name: 'Uncommon Energy Rune', multiplier: '3x', rarity: 'Uncommon' },
          { name: 'Rare Energy Rune', multiplier: '4.5x', rarity: 'Rare' },
          { name: 'Epic Energy Rune', multiplier: '6x', rarity: 'Epic' },
          { name: 'Legendary Energy Rune', multiplier: '8x', rarity: 'Legendary' },
          { name: 'Mythical Energy Rune', multiplier: '10x', rarity: 'Mythic' },
          { name: 'Phantom Energy Rune', multiplier: '12x', rarity: 'Phantom' },
          { name: 'Supreme Energy Rune', multiplier: '15x', rarity: 'Supreme' },
        ],
      },
      {
        id: 'gleam-raid-power',
        name: 'Gleam Raid Power',
        type: 'gacha',
        statType: 'damage',
        unlockCost: 'N/A',
        stats: [
          { name: 'Common Gleam Power', multiplier: '1x', rarity: 'Common' },
          { name: 'Uncommon Gleam Power', multiplier: '1.5x', rarity: 'Uncommon' },
          { name: 'Rare Gleam Power', multiplier: '2x', rarity: 'Rare' },
          { name: 'Epic Gleam Power', multiplier: '4x', rarity: 'Epic' },
          { name: 'Legendary Gleam Power', multiplier: '6x', rarity: 'Legendary' },
          { name: 'Mythical Gleam Power', multiplier: '8x', rarity: 'Mythic' },
          { name: 'Phantom Gleam Power', multiplier: '10x', rarity: 'Phantom' },
          { name: 'Supreme Gleam Power', multiplier: '12x', rarity: 'Supreme' },
        ],
      },
      {
        id: 'swordsman-energy',
        name: 'Swordsman Energy',
        type: 'progression',
        statType: 'energy',
        unlockCost: 'N/A',
        maxLevel: 210,
        maxBoost: '2.10x Energy'
      },
      {
        id: 'swordsman-damage',
        name: 'Swordsman Damage',
        type: 'progression',
        statType: 'damage',
        unlockCost: 'N/A',
        maxLevel: 110,
        maxBoost: '1.10x Damage'
      }
    ],
    npcs: [
        { id: 'world15-e-rank', name: 'E Rank NPC', rank: 'E', exp: 155329, hp: '25qtV', world: 'World 15', drops: { coins: { amount: '2.5qtV', probability: 0.8 } } },
        { id: 'world15-d-rank', name: 'D Rank NPC', rank: 'D', exp: 170862, hp: '126qtV', world: 'World 15', drops: { coins: { amount: '12qtV', probability: 0.8 } } },
        { id: 'world15-c-rank', name: 'C Rank NPC', rank: 'C', exp: 187948, hp: '633qtV', world: 'World 15', drops: { coins: { amount: '63qtV', probability: 0.8 } } },
        { id: 'world15-b-rank', name: 'B Rank NPC', rank: 'B', exp: 206742, hp: '3.1QnV', world: 'World 15', drops: { coins: { amount: '310qtV', probability: 0.8 } } },
        { id: 'world15-a-rank', name: 'A Rank NPC', rank: 'A', exp: 227417, hp: '15QnV', world: 'World 15', drops: { coins: { amount: '1.5QnV', probability: 0.8 } } },
        { id: 'world15-s-rank', name: 'S Rank NPC', rank: 'S', exp: 250158, hp: '79QnV', world: 'World 15', drops: { coins: { amount: '7.9QnV', probability: 0.8 } } },
        { id: 'the-paladin-boss', name: 'The Paladin', rank: 'SS', exp: 368640, hp: '397QnV', world: 'World 15', drops: { coins: { amount: '39QnV', probability: 1 }, tokens: { amount: 5, probability: 0.5 } }, videoUrl: 'https://medal.tv/de/games/roblox/clips/kUUqqSLH1lfcYmDOH?invite=cr-MSw1NjUsMzA5MTAxNTU4&v=22' },
    ],
    shadows: [
        {
            id: 'the-paladin-shadow',
            name: 'The Paladin',
            type: 'Energy',
            stats: [
                {
                    rank: 'Rank SS',
                    rarity: 'Phantom',
                    bonus: '22.4% Energy',
                },
                {
                    rank: 'Rank SSS',
                    rarity: 'Supremo',
                    bonus: '24% Energy',
                }
            ]
        }
    ],
    dungeons: [
        {
            id: 'gleam-raid',
            name: 'Gleam Raid',
            description: 'Uma raid de 10 ondas onde cada onda recompensa o jogador com um nível de poder do "Gleam Power", de comum a supremo.'
        }
    ],
    obelisks: [
        {
            id: 'damage-obelisk',
            name: 'Obelisco de Dano',
            statType: 'damage',
            maxLevel: 20
        }
    ]
};
