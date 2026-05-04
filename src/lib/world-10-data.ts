
export const world10Data = {
    id: '010',
    name: 'World 10 - Magic Hunter City',
    powers: [
        {
            id: 'energy-spell-card',
            name: 'Energy Spell Card',
            type: 'gacha',
            statType: 'energy',
            unlockCost: 'N/A',
            stats: [
                { id: 'energy-card-i', name: 'Energy Card I', multiplier: '2x', rarity: 'Common' },
                { id: 'energy-card-ii', name: 'Energy Card II', multiplier: '3x', rarity: 'Uncommon' },
                { id: 'energy-card-iii', name: 'Energy Card III', multiplier: '4x', rarity: 'Rare' },
                { id: 'energy-card-iv', name: 'Energy Card IV', multiplier: '5x', rarity: 'Epic' },
                { id: 'energy-card-v', name: 'Energy Card V', multiplier: '8x', rarity: 'Legendary' },
                { id: 'energy-card-vi', name: 'Energy Card VI', multiplier: '10x', rarity: 'Mythic' },
                { id: 'energy-card-vii', name: 'Energy Card VII', multiplier: '12x', rarity: 'Phantom' }
            ]
        },
        {
            id: 'damage-spell-card',
            name: 'Damage Spell Card',
            type: 'gacha',
            statType: 'damage',
            unlockCost: 'N/A',
            stats: [
                { id: 'damage-card-i', name: 'Damage Card I', multiplier: '1x', rarity: 'Common' },
                { id: 'damage-card-ii', name: 'Damage Card II', multiplier: '1.5x', rarity: 'Uncommon' },
                { id: 'damage-card-iii', name: 'Damage Card III', multiplier: '2x', rarity: 'Rare' },
                { id: 'damage-card-iv', name: 'Damage Card IV', multiplier: '4x', rarity: 'Epic' },
                { id: 'damage-card-v', name: 'Damage Card V', multiplier: '6x', rarity: 'Legendary' },
                { id: 'damage-card-vi', name: 'Damage Card VI', multiplier: '8x', rarity: 'Mythic' },
                { id: 'damage-card-vii', name: 'Damage Card VII', multiplier: '10x', rarity: 'Phantom' },
                { id: 'damage-card-viii', name: 'Damage Card VIII', multiplier: '12x', rarity: 'Supreme' }
            ]
        },
        {
            id: 'ten-progression',
            name: 'Ten Progression',
            type: 'progression',
            statType: 'energy',
            unlockCost: 'N/A',
            maxLevel: 110,
            maxBoost: '1.10x Energy'
        },
        {
            id: 'contract-of-greed',
            name: 'Contract of Greed',
            type: 'progression',
            statType: 'coin',
            unlockCost: 'N/A',
            maxLevel: 100,
            maxBoost: '100% Coinsboost'
        }
    ],
    npcs: [
        { id: 'world10-e-rank', name: 'E Rank NPC', rank: 'E', exp: 4893, hp: '264sxD', world: 'World 10', drops: { coins: { amount: '26sxD', probability: 0.8 } } },
        { id: 'world10-d-rank', name: 'D Rank NPC', rank: 'D', exp: 5383, hp: '1.3SpD', world: 'World 10', drops: { coins: { amount: '130sxD', probability: 0.8 } } },
        { id: 'world10-c-rank', name: 'C Rank NPC', rank: 'C', exp: 5921, hp: '6.6SpD', world: 'World 10', drops: { coins: { amount: '660sxD', probability: 0.8 } } },
        { id: 'world10-b-rank', name: 'B Rank NPC', rank: 'B', exp: 6513, hp: '33SpD', world: 'World 10', drops: { coins: { amount: '3.3SpD', probability: 0.8 } } },
        { id: 'world10-a-rank', name: 'A Rank NPC', rank: 'A', exp: 7164, hp: '166SpD', world: 'World 10', drops: { coins: { amount: '16SpD', probability: 0.8 } } },
        { id: 'world10-s-rank', name: 'S Rank NPC', rank: 'S', exp: 7881, hp: '830SpD', world: 'World 10', drops: { coins: { amount: '83SpD', probability: 0.8 } } },
        { id: 'killas-godspeed-boss', name: 'Killas Godspeed', rank: 'SS', exp: 11520, hp: '4.1OcD', world: 'World 10', drops: { coins: { amount: '410SpD', probability: 1 }, tokens: { amount: 5, probability: 0.5 } }, videoUrl: 'https://medal.tv/de/games/roblox/clips/kHyprteEO9LhXHbj8?invite=cr-MSxVUFIsMzA5MTAxNTU4' },
    ],
    shadows: [
        {
            id: 'killas-godspeed-shadow',
            name: 'Killas Godspeed',
            type: 'Damage',
            stats: [
                {
                    rank: 'Rank SS',
                    rarity: 'Phantom',
                    bonus: '15.4% Damage',
                    cooldown: '2s',
                },
                {
                    rank: 'Rank SSS',
                    rarity: 'Supremo',
                    bonus: '16.5% Damage',
                    cooldown: '2s',
                }
            ]
        }
    ],
    obelisks: [
        {
            id: 'energy-obelisk',
            name: 'Obelisco de Energia',
            statType: 'energy',
            maxLevel: 20
        }
    ],
    pets: [],
    avatars: [],
    dungeons: []
};
