
export const world21Data = {
    id: '021',
    name: 'World 21 - Hollow World',
    powers: [
        {
            id: 'bankai',
            name: 'Bankai',
            type: 'gacha',
            unlockCost: '6k',
            statType: 'mixed'
        },
        {
            id: 'espada',
            name: 'Espada',
            type: 'gacha',
            unlockCost: '2k',
            statType: 'mixed',
            stats: [
                { id: 'espada-9', name: "Espada 9", "multiplier": "1x" },
                { id: 'espada-8', name: "Espada 8", "multiplier": "2x" },
                { id: 'espada-7', name: "Espada 7", "multiplier": "3x" },
                { id: 'espada-6', name: "Espada 6", "multiplier": "4x" },
                { id: 'espada-5', name: "Espada 5", "multiplier": "5x" },
                { id: 'espada-4', name: "Espada 4", "multiplier": "6x" },
                { id: 'espada-3', name: "Espada 3", "multiplier": "7.5x" },
                { id: 'espada-2', name: "Espada 2", "multiplier": "10x" },
                { id: 'espada-1', name: "Espada 1", "multiplier": "12x" },
                { id: 'espada-0', name: "Espada 0", "multiplier": "15x" }
            ]
        },
        {
            id: 'hollow-power',
            name: 'Hollow Power',
            type: 'gacha',
            unlockCost: 'N/A',
            statType: 'damage',
            stats: [
              { id: 'hollow-common', name: 'Common Hollow Power', multiplier: '1x', rarity: 'Common' },
              { id: 'hollow-uncommon', name: 'Uncommon Hollow Power', multiplier: '1.5x', rarity: 'Uncommon' },
              { id: 'hollow-rare', name: 'Rare Hollow Power', multiplier: '2x', rarity: 'Rare' },
              { id: 'hollow-epic', name: 'Epic Hollow Power', multiplier: '3x', rarity: 'Epic' },
              { id: 'hollow-legendary', name: 'Legendary Hollow Power', multiplier: '5x', rarity: 'Legendary' },
              { id: 'hollow-mythical', name: 'Mythical Hollow Power', multiplier: '7x', rarity: 'Mythic' },
              { id: 'hollow-phantom', name: 'Phantom Hollow Power', multiplier: '10x', rarity: 'Phantom' },
              { id: 'hollow-supreme', name: 'Supreme Hollow Power', multiplier: '12x', rarity: 'Supreme' }
            ]
        }
    ],
    npcs: [
        { id: 'world21-e-rank', name: 'E Rank NPC', rank: 'E', exp: 50816596, hp: '3.7ssTG', world: 'World 21', drops: { coins: { amount: '370QnTG', probability: 0.8 } } },
        { id: 'world21-d-rank', name: 'D Rank NPC', rank: 'D', exp: 55898255, hp: '18ssTG', world: 'World 21', drops: { coins: { amount: '1.8ssTG', probability: 0.8 } } },
        { id: 'world21-c-rank', name: 'C Rank NPC', rank: 'C', exp: 61488081, hp: '94ssTG', world: 'World 21', drops: { coins: { amount: '9.4ssTG', probability: 0.8 } } },
        { id: 'world21-b-rank', name: 'B Rank NPC', rank: 'B', exp: 67636889, hp: '470ssTG', world: 'World 21', drops: { coins: { amount: '47ssTG', probability: 0.8 } } },
        { id: 'world21-a-rank', name: 'A Rank NPC', rank: 'A', exp: 74400578, hp: '2.3SpTG', world: 'World 21', drops: { coins: { amount: '230ssTG', probability: 0.8 } } },
        { id: 'world21-s-rank', name: 'S Rank NPC', rank: 'S', exp: 81840636, hp: '11SpTG', world: 'World 21', drops: { coins: { amount: '1.1SpTG', probability: 0.8 } } },
        { id: 'cifer-boss', name: 'Cifer', rank: 'SSS', exp: 102300794, hp: '58SpTG', world: 'World 21', drops: { coins: { amount: '5.8SpTG', probability: 1 }, tokens: { amount: 5, probability: 0.5 } }, videoUrl: 'https://medal.tv/games/roblox/clips/lcBwbquhlkIYP19j9?invite=cr-MSxVcW4sMzA5MTAxNTU4' },
        { id: 'vasto-ichge-boss', name: 'Vasto Ichge', rank: 'SSS', exp: 153451192, hp: '292SpTG', world: 'World 21', drops: { coins: { amount: '29SpTG', probability: 1 } }, videoUrl: 'https://medal.tv/de/games/roblox/clips/lcBzqous0DSaCV4Kb?invite=cr-MSxoZHMsMzA5MTAxNTU4&v=39' },
    ],
    shadows: [
        {
            id: 'cifer-shadow',
            name: 'Cifer',
            type: 'Energy',
            stats: [
                {
                    rank: 'Rank SS',
                    rarity: 'Phantom',
                    bonus: '35% Energy',
                },
                {
                    rank: 'Rank SSS',
                    rarity: 'Supremo',
                    bonus: '37.5% Energy',
                }
            ]
        }
    ]
};
