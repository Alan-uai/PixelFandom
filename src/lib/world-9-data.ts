
export const world9Data = {
    id: '009',
    name: 'World 9 - Spirit Residence',
    powers: [
        {
            id: 'psychic-mayhem',
            name: 'Psychic Mayhem',
            type: 'gacha',
            statType: 'energy',
            unlockCost: 'N/A', // Custo não especificado
            stats: [
                { id: 'illusion-casting', name: 'Illusion Casting', multiplier: '2x', rarity: 'Common' },
                { id: 'mind-swap', name: 'Mind Swap', multiplier: '3x', rarity: 'Uncommon' },
                { id: 'brain-freeze-field', name: 'Brain Freeze Field', multiplier: '4x', rarity: 'Rare' },
                { id: 'kinetic-absorption', name: 'Kinetic Absorption', multiplier: '5x', rarity: 'Epic' },
                { id: 'precognition', name: 'Precognition', multiplier: '8x', rarity: 'Legendary' },
                { id: 'psychic-barrier', name: 'Psychic Barrier', multiplier: '10x', rarity: 'Mythic' },
                { id: 'energy-aura-blast', name: 'Energy Aura Blast', multiplier: '12x', rarity: 'Phantom' }
            ]
        },
        {
            id: 'lucky-spirit',
            name: 'Lucky Spirit',
            type: 'progression',
            statType: 'luck',
            unlockCost: 'N/A',
            maxLevel: 50,
            maxBoost: '50% Luckboost'
        },
        {
            id: 'spiritual-upgrade',
            name: 'Spiritual Upgrade',
            type: 'progression',
            statType: 'damage',
            unlockCost: 'N/A',
            maxLevel: 60,
            maxBoost: '0,6x Damage'
        }
    ],
    npcs: [
        { id: 'ken-npc', name: 'Ken', rank: 'E', exp: 972, hp: '16qdD', world: 'World 9' },
        { id: 'aira-npc', name: 'Aira', rank: 'D', exp: 1215, hp: '84qdD', world: 'World 9' },
        { id: 'jiji-npc', name: 'Jiji', rank: 'C', exp: 1518, hp: '422qdD', world: 'World 9' },
        { id: 'momo-npc', name: 'Momo', rank: 'B', exp: 1898, hp: '2.1QnD', world: 'World 9' },
        { id: 'alien-npc', name: 'Alien', rank: 'A', exp: 2373, hp: '10.5QnD', world: 'World 9' },
        { id: 'saiko-npc', name: 'Saiko', rank: 'S', exp: 3915, hp: '52QnD', world: 'World 9' },
        { id: 'ken-turbo-boss', name: 'Ken Turbo', rank: 'SS', exp: 5760, hp: '264QnD', world: 'World 9', videoUrl: 'https://medal.tv/de/games/roblox/clips/kEjtnJtKOc4qEqOGw?invite=cr-MSxoZVUsMzA5MTAxNTU4' },
    ],
    pets: [
        { id: 'ken-pet', name: 'Ken', rank: 'E', rarity: 'Common', energy_bonus: '4.57k' },
        { id: 'aira-pet', name: 'Aira', rank: 'D', rarity: 'Uncommon', energy_bonus: '9.15k' },
        { id: 'jiji-pet', name: 'Jiji', rank: 'C', rarity: 'Rare', energy_bonus: '13.7k' },
        { id: 'momo-pet', name: 'Momo', rank: 'B', rarity: 'Epic', energy_bonus: '18.3k' },
        { id: 'alien-pet', name: 'Alien', rank: 'A', rarity: 'Legendary', energy_bonus: '22.8k' },
        { id: 'saiko-pet', name: 'Saiko', rank: 'S', rarity: 'Mythic', energy_bonus: '30.5k' },
        { id: 'ken-turbo-pet', name: 'Ken Turbo', rank: 'SS', rarity: 'Phantom', energy_bonus: '91.5k' }
    ],
    avatars: [
        { id: 'ken-avatar', name: 'Ken', rank: 'E', rarity: 'Common', energy_bonus: '4.57k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '27.4k', stats_lv_150: '38.9k' } },
        { id: 'aira-avatar', name: 'Aira', rank: 'D', rarity: 'Uncommon', energy_bonus: '9.15k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '54.9k', stats_lv_150: '77.8k' } },
        { id: 'jiji-avatar', name: 'Jiji', rank: 'C', rarity: 'Rare', energy_bonus: '13.7k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '82.3k', stats_lv_150: '116k' } },
        { id: 'momo-avatar', name: 'Momo', rank: 'B', rarity: 'Epic', energy_bonus: '18.3k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '109k', stats_lv_150: '155k' } },
        { id: 'alien-avatar', name: 'Alien', rank: 'A', rarity: 'Legendary', energy_bonus: '22.8k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '137k', stats_lv_150: '194k' } },
        { id: 'saiko-avatar', name: 'Saiko', rank: 'S', rarity: 'Mythic', energy_bonus: '30.5k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '183k', stats_lv_150: '259k' } },
        { id: 'ken-turbo-avatar', name: 'Ken Turbo', rank: 'SS', rarity: 'Phantom', energy_bonus: '91.5k', leveling: { maxLevel: 150, costUnit: 'Soul', stats_lv_100: '549k', stats_lv_150: '778k' } }
    ],
    shadows: [
        {
            id: 'ken-turbo-shadow',
            name: 'Ken Turbo',
            type: 'Energy',
            stats: [
                {
                    rank: 'Rank SS',
                    rarity: 'Phantom',
                    bonus: '11.2% Energy',
                },
                {
                    rank: 'Rank SSS',
                    rarity: 'Supreme',
                    bonus: '12% Energy',
                }
            ]
        }
    ],
    dungeons: [
      {
        id: 'progression-raid',
        name: 'Progression Raid',
        description: 'Vai até a wave 1000 (w1k).'
      }
    ]
};

    