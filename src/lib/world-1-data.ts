
export const world1Data = {
    id: '001',
    name: 'World 1 - Earth City',
    powers: [
      {
        id: 'dragon-race',
        name: 'Dragon Race',
        type: 'gacha',
        statType: 'energy',
        unlockCost: '1k',
        leveling: {
            token: "Dragon Race Lvl Token",
            costPerLevel: 40,
            unlockWorld: 20,
            maxLevel: 25,
            description: "Pode ser evoluído no Mundo 20 usando Dragon Race Lvl Tokens."
        },
        stats: [
          { name: 'Human', multiplier: '2x', rarity: 'Common', probability: 40.55 },
          { name: 'Android', multiplier: '3x', rarity: 'Uncommon', probability: 33 },
          { name: 'Namekian', multiplier: '4x', rarity: 'Rare', probability: 19.9 },
          { name: 'Frost Demon', multiplier: '5x', rarity: 'Epic', probability: 5 },
          { name: 'Majin', multiplier: '6x', rarity: 'Legendary', probability: 1 },
          { name: 'Half-Saiyan', multiplier: '8x', rarity: 'Mythic', probability: 0.5 },
          { name: 'Saiyan', multiplier: '10x', rarity: 'Phantom', probability: 0.05 },
        ],
      },
      {
        id: 'saiyan-evolution',
        name: 'Saiyan Evolution',
        type: 'gacha',
        statType: 'energy',
        unlockCost: '10k',
        leveling: {
            token: "Saiyan Lvl Token",
            costPerLevel: 40,
            unlockWorld: 20,
            maxLevel: 25,
            description: "Pode ser evoluído no Mundo 20 usando Saiyan Lvl Tokens."
        },
        stats: [
          { name: 'Great Ape', multiplier: '2x', rarity: 'Common', probability: 40.55 },
          { name: 'Super Saiyan Grad 1', multiplier: '3x', rarity: 'Uncommon', probability: 33 },
          { name: 'Super Saiyan Grad 2', multiplier: '4x', rarity: 'Rare', probability: 19.9 },
          { name: 'Super Saiyan Grad 3', multiplier: '5x', rarity: 'Epic', probability: 5 },
          { name: 'Full Power Super Saiyan', multiplier: '6x', rarity: 'Legendary', probability: 1 },
          { name: 'Super Saiyan 2', multiplier: '8x', rarity: 'Mythic', probability: 0.5 },
          { name: 'Super Saiyan 3', multiplier: '10x', rarity: 'Phantom', probability: 0.05 },
        ],
      },
    ],
    npcs: [
        { id: 'kriluni-npc', name: 'Kriluni', rank: 'E', exp: 1, hp: '100k', world: 'World 1' },
        { id: 'ymicha-npc', name: 'Ymicha', rank: 'D', exp: 2, hp: '500k', world: 'World 1' },
        { id: 'tian-shan-npc', name: 'Tian Shan', rank: 'C', exp: 3, hp: '2.5M', world: 'World 1' },
        { id: 'kohan-npc', name: 'Kohan', rank: 'B', exp: 4, hp: '12.5M', world: 'World 1' },
        { id: 'picco-npc', name: 'Picco', rank: 'A', exp: 5, hp: '62.5M', world: 'World 1' },
        { id: 'koku-npc', name: 'Koku', rank: 'S', exp: 6, hp: '312.5M', world: 'World 1' },
        { id: 'kid-kohan-boss', name: 'Kid Kohan', rank: 'SS', exp: 15, hp: '1.5B', world: 'World 1', videoUrl: 'https://medal.tv/de/games/roblox/clips/kurF3svOvD-eS9F7H?invite=cr-MSxGUk4sMzA5MTAxNTU4' },
    ],
    pets: [
        { id: 'kriluni-pet', name: 'Kriluni', rank: 'E', rarity: 'Common', energy_bonus: '3' },
        { id: 'ymicha-pet', name: 'Ymicha', rank: 'D', rarity: 'Uncommon', energy_bonus: '6' },
        { id: 'tian-shan-pet', name: 'Tian Shan', rank: 'C', rarity: 'Rare', energy_bonus: '9' },
        { id: 'kohan-pet', name: 'Kohan', rank: 'B', rarity: 'Epic', energy_bonus: '12' },
        { id: 'picco-pet', name: 'Picco', rank: 'A', rarity: 'Legendary', energy_bonus: '15' },
        { id: 'koku-pet', name: 'Koku', rank: 'S', rarity: 'Mythic', energy_bonus: '20' },
        { id: 'kid-kohan-pet', name: 'Kid Kohan', rank: 'SS', rarity: 'Phantom', energy_bonus: '60' }
    ],
    avatars: [
        { id: 'kriluni-avatar', name: 'Kriluni', rank: 'E', rarity: 'Common', energy_bonus: '3', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '18', stats_lv_150: '25.5' } },
        { id: 'ymicha-avatar', name: 'Ymicha', rank: 'D', rarity: 'Uncommon', energy_bonus: '6', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '36', stats_lv_150: '51' } },
        { id: 'tian-shan-avatar', name: 'Tian Shan', rank: 'C', rarity: 'Rare', energy_bonus: '9', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '54', stats_lv_150: '76.5' } },
        { id: 'kohan-avatar', name: 'Kohan', rank: 'B', rarity: 'Epic', energy_bonus: '12', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '72', stats_lv_150: '102' } },
        { id: 'picco-avatar', name: 'Picco', rank: 'A', rarity: 'Legendary', energy_bonus: '15', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '90', stats_lv_150: '127.5' } },
        { id: 'koku-avatar', name: 'Koku', rank: 'S', rarity: 'Mythic', energy_bonus: '20', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '120', stats_lv_150: '170' } },
        { id: 'kid-kohan-avatar', name: 'Kid Kohan', rank: 'SS', rarity: 'Phantom', energy_bonus: '60', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '360', stats_lv_150: '510' } }
    ],
    dungeons: [
        {
            id: 'tournemant',
            name: 'Tournemant'
        }
    ],
  };
  
    