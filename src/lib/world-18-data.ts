
export const world18Data = {
    id: '018',
    name: 'World 18 - Chainsaw City',
    powers: [
      {
        id: 'debiru-hunter',
        name: 'Debiru Hunter',
        type: 'gacha',
        statType: 'energy',
        unlockCost: 'N/A',
        stats: [
          { name: 'Rookie Hunter', multiplier: '2x', rarity: 'Common', probability: 40.55 },
          { name: 'Field Hunter', multiplier: '3x', rarity: 'Uncommon', probability: 33 },
          { name: 'Contract Hunter', multiplier: '4.5x', rarity: 'Rare', probability: 19.9 },
          { name: 'Fiend Hunter', multiplier: '6x', rarity: 'Epic', probability: 5 },
          { name: 'Hybrid Hunter', multiplier: '8x', rarity: 'Legendary', probability: 1 },
          { name: 'Veteran Hunter', multiplier: '10x', rarity: 'Mythic', probability: 0.5 },
          { name: 'Special Division Hunter', multiplier: '12x', rarity: 'Phantom', probability: 0.05 },
          { name: 'Primal Threat Hunter', multiplier: '15x', rarity: 'Supreme', probability: 0.01 },
        ]
      },
      {
        id: 'akuma-powers',
        name: 'Akuma Powers',
        type: 'gacha',
        statType: 'damage',
        unlockCost: 'N/A',
        stats: [
          { name: 'Akuma: Ghost', multiplier: '1x', rarity: 'Common', probability: 40.55 },
          { name: 'Akuma: Fox', multiplier: '1.5x', rarity: 'Uncommon', probability: 33 },
          { name: 'Akuma: Future', multiplier: '2x', rarity: 'Rare', probability: 19.9 },
          { name: 'Akuma: Curse', multiplier: '3x', rarity: 'Epic', probability: 5 },
          { name: 'Akuma: Angel', multiplier: '5x', rarity: 'Legendary', probability: 1 },
          { name: 'Akuma: Crossbow', multiplier: '7x', rarity: 'Mythic', probability: 0.5 },
          { name: 'Akuma: Pokita', multiplier: '9x', rarity: 'Phantom', probability: 0.05 },
          { name: 'Akuma: Control', multiplier: '12x', rarity: 'Supreme', probability: 0.01 },
        ]
      },
      {
        id: 'pokita-power',
        name: 'Pokita Pet',
        type: 'gacha',
        statType: 'damage',
        unlockCost: 'N/A',
        stats: [
          { id: 'pokita-common', name: 'Pokita Pet (Common)', multiplier: '1x', rarity: 'Common' },
          { id: 'pokita-uncommon', name: 'Pokita Pet (Uncommon)', multiplier: '1.2x', rarity: 'Uncommon' },
          { id: 'pokita-rare', name: 'Pokita Pet (Rare)', multiplier: '1.4x', rarity: 'Rare' },
          { id: 'pokita-epic', name: 'Pokita Pet (Epic)', multiplier: '1.6x', rarity: 'Epic' },
          { id: 'pokita-legendary', name: 'Pokita Pet (Legendary)', multiplier: '1.8x', rarity: 'Legendary' },
          { id: 'pokita-mythical', name: 'Pokita Pet (Mythical)', multiplier: '2.0x', rarity: 'Mythic' },
          { id: 'pokita-phantom', name: 'Pokita Pet (Phantom)', multiplier: '2.4x', rarity: 'Phantom' },
          { id: 'pokita-supreme', name: 'Pokita Pet (Supreme)', multiplier: '3.0x', rarity: 'Supreme' },
        ]
      },
      {
        id: 'akuma-energy',
        name: 'Akuma Energy',
        type: 'progression',
        statType: 'energy',
        unlockCost: 'N/A',
        maxLevel: 160,
        maxBoost: '1.60x Energy'
      },
      {
        id: 'akuma-damage',
        name: 'Akuma Damage',
        type: 'progression',
        statType: 'damage',
        unlockCost: 'N/A',
        maxLevel: 110,
        maxBoost: '1.10x Damage'
      },
      {
        id: 'pokita-leveling',
        name: 'Pokita Leveling',
        type: 'progression',
        statType: 'mixed',
        unlockCost: 'N/A',
        description: 'Evolua o poder Pokita até o nível 50 usando Pokita Tokens.'
      }
    ],
    npcs: [
        { id: 'world18-e-rank', name: 'E Rank NPC', rank: 'E', exp: 2551239, hp: '1.5TGN', world: 'World 18', drops: { coins: { amount: '150NVG', probability: 0.8 } } },
        { id: 'world18-d-rank', name: 'D Rank NPC', rank: 'D', exp: 2806363, hp: '7.7TGN', world: 'World 18', drops: { coins: { amount: '770NVG', probability: 0.8 } } },
        { id: 'world18-c-rank', name: 'C Rank NPC', rank: 'C', exp: 3086999, hp: '38TGN', world: 'World 18', drops: { coins: { amount: '3.8TGN', probability: 0.8 } } },
        { id: 'world18-b-rank', name: 'B Rank NPC', rank: 'B', exp: 3395699, hp: '193TGN', world: 'World 18', drops: { coins: { amount: '19TGN', probability: 0.8 } } },
        { id: 'world18-a-rank', name: 'A Rank NPC', rank: 'A', exp: 3735269, hp: '965TGN', world: 'World 18', drops: { coins: { amount: '96TGN', probability: 0.8 } } },
        { id: 'world18-s-rank', name: 'S Rank NPC', rank: 'S', exp: 4108796, hp: '4.8UTG', world: 'World 18', drops: { coins: { amount: '480TGN', probability: 0.8 } } },
        { id: 'mr-chainsaw-boss', name: 'Mr Chainsaw', rank: 'SS', exp: 5135995, hp: '24UTG', world: 'World 18', drops: { coins: { amount: '2.4UTG', probability: 1 }, tokens: { amount: 5, probability: 0.5 } }, videoUrl: 'https://medal.tv/de/games/roblox/clips/l2ZPku6S7w3f74fTT?invite=cr-MSx2dVcsMzA5MTAxNTU4&v=19' },
        { id: 'world18-sss-rank', name: 'SSS Rank NPC', rank: 'SSS', exp: 6419993, hp: '121UTG', world: 'World 18', drops: { coins: { amount: '12UTG', probability: 1 } }, videoUrl: 'https://medal.tv/de/games/roblox/clips/l4MUigH8BtJIQsktT?invite=cr-MSxyMmksMzA5MTAxNTU4&v=13' },
    ],
    shadows: [
        {
            id: 'mr-chainsaw-shadow',
            name: 'Mr Chainsaw',
            type: 'Damage',
            stats: [
                {
                    rank: 'Rank SS',
                    rarity: 'Phantom',
                    bonus: '30.8% Damage',
                    cooldown: '2s',
                },
                {
                    rank: 'Rank SSS',
                    rarity: 'Supremo',
                    bonus: '33% Damage',
                    cooldown: '2s',
                }
            ]
        }
    ],
    dungeons: [
        {
            id: 'chainsaw-defense',
            name: 'Chainsaw Defense',
            description: 'Vai até a wave 1000 (w1k). Tem chance de dropar o poder Pokita.'
        }
    ],
    pets: []
};
