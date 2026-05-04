
export const world11Data = {
    id: '011',
    name: 'World 11 - Titan City',
    powers: [
        {
            id: 'titan-families',
            name: 'Titan Families',
            type: 'gacha',
            statType: 'energy',
            unlockCost: 'N/A',
            stats: [
                { id: 'grice-family', name: 'Grice Family', multiplier: '2x', rarity: 'Common', probability: 40.55 },
                { id: 'leonhart-family', name: 'Leonhart Family', multiplier: '3x', rarity: 'Uncommon', probability: 33 },
                { id: 'braun-family', name: 'Braun Family', multiplier: '4x', rarity: 'Rare', probability: 19.9 },
                { id: 'tybur-family', name: 'Tybur Family', multiplier: '6x', rarity: 'Epic', probability: 5 },
                { id: 'ackerman-family', name: 'Ackerman Family', multiplier: '8x', rarity: 'Legendary', probability: 1 },
                { id: 'yeager-family', name: 'Yeager Family', multiplier: '12x', rarity: 'Mythic', probability: 0.5 },
                { id: 'reiss-family', name: 'Reiss Family', multiplier: '15x', rarity: 'Phantom', probability: 0.05 },
            ]
        },
        {
            id: 'titan-evolution',
            name: 'Titan Evolution',
            type: 'progression',
            statType: 'mixed',
            unlockCost: 'N/A',
            description: 'Evolua os Titãs. 2 de 0★ para 1★ (custo: 1k Exchange Token 1). 2 de 1★ para 2★ (custo: 2.5k Exchange Token 1). 2 de 2★ para 3★ (custo: 5k Exchange Token 1).'
        }
    ],
    titans: [
        { id: 'jaw-titan', name: 'Jaw Titan', type: 'Titan' },
        { id: 'female-titan', name: 'Female Titan', type: 'Titan' },
        { id: 'beast-titan', name: 'Beast Titan', type: 'Titan' },
        { id: 'armored-titan', name: 'Armored Titan', type: 'Titan' },
        { id: 'warhammer-titan', name: 'Warhammer Titan', type: 'Titan' },
        { id: 'attack-titan', name: 'Attack Titan', type: 'Titan' },
        { id: 'colossal-titan', name: 'Colossal Titan', type: 'Titan' },
    ],
    npcs: [
        { id: 'world11-e-rank', name: 'E Rank NPC', rank: 'E', exp: 9457, hp: '41OcD', world: 'World 11', drops: { coins: { amount: '4.1OcD', probability: 0.8 } } },
        { id: 'world11-d-rank', name: 'D Rank NPC', rank: 'D', exp: 10403, hp: '205OcD', world: 'World 11', drops: { coins: { amount: '20OcD', probability: 0.8 } } },
        { id: 'world11-c-rank', name: 'C Rank NPC', rank: 'C', exp: 11443, hp: '1NvD', world: 'World 11', drops: { coins: { amount: '100OcD', probability: 0.8 } } },
        { id: 'world11-b-rank', name: 'B Rank NPC', rank: 'B', exp: 12587, hp: '5.2NvD', world: 'World 11', drops: { coins: { amount: '520OcD', probability: 0.8 } } },
        { id: 'world11-a-rank', name: 'A Rank NPC', rank: 'A', exp: 13846, hp: '26NvD', world: 'World 11', drops: { coins: { amount: '2.6NvD', probability: 0.8 } } },
        { id: 'world11-s-rank', name: 'S Rank NPC', rank: 'S', exp: 15231, hp: '131NvD', world: 'World 11', drops: { coins: { amount: '13NvD', probability: 0.8 } } },
        { id: 'eran-boss', name: 'Eran', rank: 'SS', exp: 23040, hp: '655NvD', world: 'World 11', drops: { coins: { amount: '65NvD', probability: 1 }, tokens: { amount: 5, probability: 0.5 } }, videoUrl: 'https://medal.tv/de/games/roblox/clips/kJKefSM1O9otSOGv3?invite=cr-MSw0M0IsMzA5MTAxNTU4' },
    ],
    dungeons: [
        {
            id: 'titan-defense',
            name: 'Titan Defense',
            description: 'A raid tem 1000 salas (w1k). Um Titã por sala atravessa o mapa. Se ele chegar ao outro lado, a raid acaba e você é derrotado.'
        }
    ],
    shadows: [
        {
            id: 'eren-shadow',
            name: 'Eren',
            type: 'Energy',
            stats: [
                {
                    id: 'eren-phantom',
                    rank: 'Rank SS',
                    rarity: 'Phantom',
                    bonus: '15.4% Energy',
                },
                {
                    id: 'eren-supreme',
                    rank: 'Rank SSS',
                    rarity: 'Supremo',
                    bonus: '16.5% Energy',
                }
            ]
        }
    ]
};
