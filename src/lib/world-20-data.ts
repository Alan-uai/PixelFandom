
export const world20Data = {
    id: '020',
    name: 'World 20 - Green Planet',
    powers: [
      {
        id: 'grand-elder-power',
        name: 'Grand Elder Power',
        type: 'gacha',
        statType: 'energy',
        unlockCost: '1.50OcTG',
        stats: [
          { name: 'Sleeping Power', multiplier: '2x', rarity: 'Common', probability: 40.55 },
          { name: 'Stirring Spirit', multiplier: '3x', rarity: 'Uncommon', probability: 33 },
          { name: 'Hidden Potential', multiplier: '4.5x', rarity: 'Rare', probability: 19.9 },
          { name: 'Inner Strength', multiplier: '6x', rarity: 'Legendary', probability: 5 },
          { name: 'Power Unleashed', multiplier: '8x', rarity: 'Mythic', probability: 1 },
          { name: 'True Potential', multiplier: '10x', rarity: 'Phantom', probability: 0.5 },
          { name: 'Limitless Growth', multiplier: '12x', rarity: 'Phantom', probability: 0.5 },
          { name: 'Potential Unbound', multiplier: '15x', rarity: 'Supreme', probability: 0.05 },
        ],
      },
      {
        id: 'frost-demon-evolution',
        name: 'Frost Demon Evolution',
        type: 'gacha',
        statType: 'damage',
        unlockCost: '2.00OcTG',
        stats: [
          { name: 'Second Form', multiplier: '1x', rarity: 'Common', probability: 40.55 },
          { name: 'Third Form', multiplier: '1.5x', rarity: 'Uncommon', probability: 33 },
          { name: 'Final Form', multiplier: '2x', rarity: 'Rare', probability: 19.9 },
          { name: '50% Power', multiplier: '3x', rarity: 'Legendary', probability: 5 },
          { name: '100% Full Power', multiplier: '5x', rarity: 'Mythic', probability: 1 },
          { name: 'Mecha Form', multiplier: '7x', rarity: 'Phantom', probability: 0.5 },
          { name: 'Golden Form', multiplier: '9x', rarity: 'Phantom', probability: 0.5 },
          { name: 'Black Form', multiplier: '12x', rarity: 'Supreme', probability: 0.05 },
        ],
      },
       {
        id: 'dragon-energy',
        name: 'Dragon Energy',
        type: 'progression',
        unlockCost: '2.5OcTG',
        statType: 'energy',
        maxLevel: 50,
        maxBoost: '1x Energy'
      },
      {
        id: 'dragon-damage',
        name: 'Dragon Damage',
        type: 'progression',
        unlockCost: '3.0OcTG',
        statType: 'damage',
        maxLevel: 500,
        maxBoost: '10x Damage'
      }
    ],
    npcs: [
      { id: 'world20-e-rank', name: 'E Rank NPC', rank: 'E', exp: 20193989, hp: '47qTG', world: 'World 20', drops: { coins: { amount: '4.7qTG', probability: 0.8 } } },
      { id: 'world20-d-rank', name: 'D Rank NPC', rank: 'D', exp: 22213388, hp: '237qTG', world: 'World 20', drops: { coins: { amount: '23qTG', probability: 0.8 } } },
      { id: 'world20-c-rank', name: 'C Rank NPC', rank: 'C', exp: 24434727, hp: '1.1QnTG', world: 'World 20', drops: { coins: { amount: '110qTG', probability: 0.8 } } },
      { id: 'world20-b-rank', name: 'B Rank NPC', rank: 'B', exp: 26878199, hp: '5.9QnTG', world: 'World 20', drops: { coins: { amount: '590qTG', probability: 0.8 } } },
      { id: 'world20-a-rank', name: 'A Rank NPC', rank: 'A', exp: 29566019, hp: '29QnTG', world: 'World 20', drops: { coins: { amount: '2.9QnTG', probability: 0.8 } } },
      { id: 'world20-s-rank', name: 'S Rank NPC', rank: 'S', exp: 32522621, hp: '148QnTG', world: 'World 20', drops: { coins: { amount: '14QnTG', probability: 0.8 } } },
      { id: 'koku-ssj-boss', name: 'Koku SSJ', rank: 'SS', exp: 48783932, hp: '744QnTG', world: 'World 20', drops: { coins: { amount: '74QnTG', probability: 1 }, tokens: { amount: 5, probability: 0.5 } }, videoUrl: 'https://medal.tv/de/games/roblox/clips/la4KjuzWNGjdX6o0t?invite=cr-MSx2dDMsMzA5MTAxNTU4&v=15' },
      { id: 'frezi-final-form-boss', name: 'Frezi Final Form', rank: 'SSS', exp: 73175898, hp: '3.7ssTG', world: 'World 20', drops: { coins: { amount: '370QnTG', probability: 1 } }, videoUrl: 'https://medal.tv/de/games/roblox/clips/la4DM9ohHQLUgw5sD?invite=cr-MSx6UkgsMzA5MTAxNTU4&v=27' },
    ],
    pets: [],
    dungeons: [
        {
            id: 'dungeon-lobby-2',
            name: 'Lobby de Dungeons 2',
            description: 'Um novo lobby de dungeons desbloqueado no Mundo 20. Usa Exchange Tokens 2 e contém as raids: Green, Suffering, Mundo e Hollow.'
        }
    ],
    shadows: [
        {
            id: 'goku-ssj-shadow',
            name: 'Goku SSJ',
            type: 'Damage',
            stats: [
                {
                    rank: 'Rank SS',
                    rarity: 'Phantom',
                    bonus: '35% Damage',
                    cooldown: '2s',
                },
                {
                    rank: 'Rank SSS',
                    rarity: 'Supremo',
                    bonus: '37.5% Damage',
                    cooldown: '2s',
                }
            ]
        }
    ],
    obelisks: [
        {
            id: 'luck-obelisk',
            name: 'Obelisco da Sorte',
            statType: 'luck',
            maxLevel: 10
        }
    ]
  };
