
export const world3Data = {
    id: '003',
    name: 'World 3 - Soul Society',
    powers: [
      {
        id: 'reiatsu-color',
        name: 'Reiatsu Color',
        type: 'gacha',
        statType: 'energy',
        unlockCost: '110k',
        leveling: {
            token: "Reiatsu Lvl Token",
            costPerLevel: 10,
            unlockWorld: 21,
            description: "Pode ser evoluído no Mundo 21 usando Reiatsu Lvl Tokens."
        },
        stats: [
          { id: 'gray-reiatsu', name: 'Gray Reiatsu', multiplier: '2x', rarity: 'Common', probability: 40.55 },
          { id: 'green-reiatsu', name: 'Green Reiatsu', multiplier: '3x', rarity: 'Uncommon', probability: 33 },
          { id: 'blue-reiatsu', name: 'Blue Reiatsu', multiplier: '4x', rarity: 'Rare', probability: 19.9 },
          { id: 'pink-reiatsu', name: 'Pink Reiatsu', multiplier: '5x', rarity: 'Epic', probability: 5 },
          { id: 'yellow-reiatsu', name: 'Yellow Reiatsu', multiplier: '6x', rarity: 'Legendary', probability: 1 },
          { id: 'red-reiatsu', name: 'Red Reiatsu', multiplier: '8x', rarity: 'Mythic', probability: 0.5 },
          { id: 'black-reiatsu', name: 'Black Reiatsu', multiplier: '10x', rarity: 'Phantom', probability: 0.05 },
        ],
      },
      {
        id: 'zanpakuto',
        name: 'Zanpakuto',
        type: 'gacha',
        statType: 'damage',
        unlockCost: '190k',
        leveling: {
            token: "Zanpakuto Lvl Token",
            costPerLevel: 10,
            unlockWorld: 21,
            description: "Pode ser evoluído no Mundo 21 usando Zanpakuto Lvl Tokens."
        },
        stats: [
          { id: 'common-zanpakuto', name: 'Common', multiplier: '2x', rarity: 'Common', probability: 40.55 },
          { id: 'uncommon-zanpakuto', name: 'Uncommon', multiplier: '3x', rarity: 'Uncommon', probability: 33 },
          { id: 'rare-zanpakuto', name: 'Rare', multiplier: '4x', rarity: 'Rare', probability: 19.9 },
          { id: 'epic-zanpakuto', name: 'Epic', multiplier: '5x', rarity: 'Epic', probability: 5 },
          { id: 'legendary-zanpakuto', name: 'Legendary', multiplier: '6x', rarity: 'Legendary', probability: 1 },
          { id: 'mythical-zanpakuto', name: 'Mythical', multiplier: '7.5x', rarity: 'Mythic', probability: 0.5 },
          { id: 'phantom-zanpakuto', name: 'Phantom', multiplier: '10x', rarity: 'Phantom', probability: 0.05 },
        ],
      },
      {
        id: 'spiritual-pressure',
        name: 'Spiritual Pressure',
        type: 'progression',
        unlockCost: '250k',
        statType: 'mixed',
        maxLevel: 210,
        boosts: [
            { type: 'damage', value: '1.01x' },
            { type: 'energy', value: '1.11x' },
        ]
      },
    ],
    npcs: [
      { id: 'hime-npc', name: 'Hime', rank: 'E', exp: 21, hp: '1.1qd', world: 'World 3' },
      { id: 'ichige-npc', name: 'Ichige', rank: 'D', exp: 22, hp: '5.8qd', world: 'World 3' },
      { id: 'uryua-npc', name: 'Uryua', rank: 'C', exp: 23, hp: '29qd', world: 'World 3' },
      { id: 'rakiu-npc', name: 'Rakiu', rank: 'B', exp: 24, hp: '146qd', world: 'World 3' },
      { id: 'yoichi-npc', name: 'Yoichi', rank: 'A', exp: 25, hp: '734qd', world: 'World 3' },
      { id: 'kahara-npc', name: 'Kahara', rank: 'S', exp: 26, hp: '3.6Qn', world: 'World 3' },
      { id: 'eizen-boss', name: 'Eizen', rank: 'SS', exp: 60, hp: '18Qn', world: 'World 3', videoUrl: 'https://medal.tv/de/games/roblox/clips/kurNlNFo63YGkTMnZ?invite=cr-MSxRTnQsMzA5MTAxNTU4' },
    ],
    pets: [
        { id: 'hime-pet', name: 'Hime', rank: 'E', rarity: 'Common', energy_bonus: '19' },
        { id: 'ichige-pet', name: 'Ichige', rank: 'D', rarity: 'Uncommon', energy_bonus: '38' },
        { id: 'uryua-pet', name: 'Uryua', rank: 'C', rarity: 'Rare', energy_bonus: '56' },
        { id: 'rakiu-pet', name: 'Rakiu', rank: 'B', rarity: 'Epic', energy_bonus: '75' },
        { id: 'yoichi-pet', name: 'Yoichi', rank: 'A', rarity: 'Legendary', energy_bonus: '94' },
        { id: 'kahara-pet', name: 'Kahara', rank: 'S', rarity: 'Mythic', energy_bonus: '125' },
        { id: 'eizen-pet', name: 'Eizen', rank: 'SS', rarity: 'Phantom', energy_bonus: '375' }
    ],
    avatars: [
        { id: 'hime-avatar', name: 'Hime', rank: 'E', rarity: 'Common', energy_bonus: '19', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '114', stats_lv_150: '161.5' } },
        { id: 'ichige-avatar', name: 'Ichige', rank: 'D', rarity: 'Uncommon', energy_bonus: '38', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '228', stats_lv_150: '323' } },
        { id: 'uryua-avatar', name: 'Uryua', rank: 'C', rarity: 'Rare', energy_bonus: '56', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '336', stats_lv_150: '476' } },
        { id: 'rakiu-avatar', name: 'Rakiu', rank: 'B', rarity: 'Epic', energy_bonus: '75', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '450', stats_lv_150: '637.5' } },
        { id: 'yoichi-avatar', name: 'Yoichi', rank: 'A', rarity: 'Legendary', energy_bonus: '94', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '564', stats_lv_150: '799' } },
        { id: 'kahara-avatar', name: 'Kahara', rank: 'S', rarity: 'Mythic', energy_bonus: '125', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '750', stats_lv_150: '1.06k' } },
        { id: 'eizen-avatar', name: 'Eizen', rank: 'SS', rarity: 'Phantom', energy_bonus: '375', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '2.25k', stats_lv_150: '3.18k' } }
    ],
    dungeons: [],
  };
  
    