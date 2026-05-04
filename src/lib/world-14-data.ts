
export const world14Data = {
    id: '014',
    name: 'World 14 - Tempest Capital',
    powers: [
      {
        id: 'species',
        name: 'Species',
        type: 'gacha',
        statType: 'energy',
        unlockCost: 'N/A',
        stats: [
          { id: 'goblin', name: 'Goblin', multiplier: '2x', rarity: 'Common', probability: 40.55 },
          { id: 'lizardman', name: 'Lizardman', multiplier: '3x', rarity: 'Uncommon', probability: 33 },
          { id: 'slime', name: 'Slime', multiplier: '4.5x', rarity: 'Rare', probability: 19.9 },
          { id: 'dryad', name: 'Dryad', multiplier: '6x', rarity: 'Epic', probability: 5 },
          { id: 'kijin', name: 'Kijin', multiplier: '8x', rarity: 'Legendary', probability: 1 },
          { id: 'dragonoid', name: 'Dragonoid', multiplier: '10x', rarity: 'Mythic', probability: 0.5 },
          { id: 'primordial-daemon', name: 'Primordial Daemon', multiplier: '12x', rarity: 'Phantom', probability: 0.05 },
          { id: 'true-dragon', name: 'True Dragon', multiplier: '15x', rarity: 'Supreme', probability: 0.01 },
        ],
      },
      {
        id: 'ultimate-skills',
        name: 'Ultimate Skills',
        type: 'gacha',
        statType: 'damage',
        unlockCost: 'N/A',
        stats: [
            { id: 'amaterasu', name: 'Amaterasu', multiplier: '1x', rarity: 'Common', probability: 40.55 },
            { id: 'true-hero', name: 'True Hero', multiplier: '1.5x', rarity: 'Uncommon', probability: 33 },
            { id: 'uriel', name: 'Uriel', multiplier: '2x', rarity: 'Rare', probability: 19.9 },
            { id: 'satanael', name: 'Satanael', multiplier: '4x', rarity: 'Epic', probability: 5 },
            { id: 'lucifer', name: 'Lucifer', multiplier: '6x', rarity: 'Legendary', probability: 1 },
            { id: 'yog-sothoth', name: 'Yog-Sothoth', multiplier: '8x', rarity: 'Mythic', probability: 0.5 },
            { id: 'beelzebub', name: 'Beelzebub', multiplier: '10x', rarity: 'Phantom', probability: 0.05 },
            { id: 'raphael', name: 'Raphael', multiplier: '12x', rarity: 'Supreme', probability: 0.01 },
        ]
      },
      {
        id: 'demon-lord-energy',
        name: 'Demon Lord Energy',
        type: 'progression',
        statType: 'energy',
        unlockCost: 'N/A',
        maxLevel: 210,
        maxBoost: '2.10x Energy'
      },
      {
        id: 'demon-lord-damage',
        name: 'Demon Lord Damage',
        type: 'progression',
        statType: 'damage',
        unlockCost: 'N/A',
        maxLevel: 210,
        maxBoost: '2.10x Damage'
      },
      {
        id: 'demon-lord-coins',
        name: 'Demon Lord Coins',
        type: 'progression',
        statType: 'coin',
        unlockCost: 'N/A',
        maxLevel: 100,
        maxBoost: '1.00x Coins'
      },
      {
        id: 'demon-lord-luck',
        name: 'Demon Lord Luck',
        type: 'progression',
        statType: 'luck',
        unlockCost: 'N/A',
        maxLevel: 50,
        maxBoost: '0.50x Luck'
      }
    ],
    npcs: [
        { id: 'world14-e-rank', name: 'E Rank NPC', rank: 'E', exp: 155329, hp: '25qtV', world: 'World 14' },
        { id: 'world14-d-rank', name: 'D Rank NPC', rank: 'D', exp: 170862, hp: '126qtV', world: 'World 14' },
        { id: 'world14-c-rank', name: 'C Rank NPC', rank: 'C', exp: 187948, hp: '633qtV', world: 'World 14' },
        { id: 'world14-b-rank', name: 'B Rank NPC', rank: 'B', exp: 206742, hp: '3.1QnV', world: 'World 14' },
        { id: 'world14-a-rank', name: 'A Rank NPC', rank: 'A', exp: 227417, hp: '15QnV', world: 'World 14' },
        { id: 'world14-s-rank', name: 'S Rank NPC', rank: 'S', exp: 250158, hp: '79QnV', world: 'World 14' },
        { id: 'valzora-boss', name: 'Valzora', rank: 'SS', exp: 368640, hp: '397QnV', world: 'World 14', videoUrl: 'https://medal.tv/de/games/roblox/clips/kUUpBMXPZC6xw76cU?invite=cr-MSxUa3YsMzA5MTAxNTU4&v=9' },
    ],
    shadows: [
        {
            id: 'valzora-shadow',
            name: 'Valzora',
            type: 'Damage',
            stats: [
                {
                    rank: 'Rank SS',
                    rarity: 'Phantom',
                    bonus: '22.4% Damage',
                    cooldown: '2s',
                },
                {
                    rank: 'Rank SSS',
                    rarity: 'Supremo',
                    bonus: '24% Damage',
                    cooldown: '2s',
                }
            ]
        }
    ],
    dungeons: [
      {
        id: 'dragon-raid',
        name: 'Raid do Dragão',
        description: 'Vai até a wave 1000 (w1k).'
      }
    ]
};
