
export const generalAchievements = [
    {
      id: 'friends-bonus',
      name: 'Friends Bonus V',
      type: 'general',
      category: 'Friends',
      maxLevel: 5,
      requirement: '96h',
      progressionBonus: '5% de energia a cada lvl',
    },
    {
      id: 'total-coins',
      name: 'Total coins XXVIII',
      type: 'general',
      category: 'Coins',
      maxLevel: 28,
      requirement: '100N',
      progressionBonus: '5% coins (a cada Level multiplica por 10)',
    },
    {
      id: 'total-energy',
      name: 'Total energy XLV',
      type: 'general',
      category: 'Energy',
      maxLevel: 45,
      requirement: '10QnD',
      progressionBonus: '5% energia (a cada Level multiplica por 10)',
    },
    {
      id: 'time-played',
      name: 'Time Played X',
      type: 'general',
      category: 'Time',
      maxLevel: 10,
      requirement: '1250h',
      progressionBonus: '5% energia',
    },
    {
      id: 'star-opened',
      name: 'Star opened X',
      type: 'general',
      category: 'Stars',
      maxLevel: 10,
      requirement: '5M',
      progressionBonus: '+1 equip pet no primeiro nível, depois +1 star open. O valor dobra a cada nível.',
    },
    {
      id: 'total-enemies',
      name: 'Total Enemies XIX',
      type: 'general',
      category: 'Enemies',
      maxLevel: 19,
      requirement: '75M',
      progressionBonus: '5% damage',
    },
  ];
  
  export const raidRoomAchievements = [
    {
        id: 'easy-dungeon-rooms',
        name: 'Easy Dungeon Rooms',
        type: 'raid_rooms',
        category: 'Dungeon',
        tiers: [
            { requirement: 'Room 10', bonus: '5% Dano (varia)'},
            { requirement: 'Room 20', bonus: '... (varia)'},
            { requirement: 'Room 30', bonus: '... (varia)'},
            { requirement: 'Room 40', bonus: '... (varia)'},
            { requirement: 'Room 50', bonus: '+1 equip pet'},
        ]
    },
    {
        id: 'dragon-raid-rooms',
        name: 'Dragon Raid Rooms',
        type: 'raid_rooms',
        category: 'Raid',
        tiers: [
            { requirement: 'Room 50', bonus: '25% Dano'},
            { requirement: 'Room 100', bonus: '25% Energia'},
            { requirement: 'Room 150', bonus: '25% Dano'},
            { requirement: 'Room 200', bonus: '25% Energia'},
            { requirement: 'Room 250', bonus: '25% Dano'},
            { requirement: 'Room 300', bonus: '25% Energia'},
            { requirement: 'Room 350', bonus: '25% Dano'},
            { requirement: 'Room 400', bonus: '25% Energia'},
            { requirement: 'Room 450', bonus: '25% Dano'},
            { requirement: 'Room 500', bonus: '25% Energia'},
        ]
    },
    {
        id: 'gleam-raid-rooms',
        name: 'Gleam Raid Rooms',
        type: 'raid_rooms',
        category: 'Raid',
        tiers: [
            { requirement: 'Wave 1', bonus: 'Gleam Power (Common)'},
            { requirement: 'Wave 2', bonus: 'Gleam Power (Uncommon)'},
            { requirement: 'Wave 3', bonus: 'Gleam Power (Rare)'},
            { requirement: 'Wave 4', bonus: 'Gleam Power (Epic)'},
            { requirement: 'Wave 5', bonus: 'Gleam Power (Legendary)'},
            { requirement: 'Wave 6', bonus: 'Gleam Power (Mythic)'},
            { requirement: 'Wave 7', bonus: 'Gleam Power (Phantom)'},
            { requirement: 'Wave 8', bonus: 'Gleam Power (Supreme)'},
        ]
    }
    // ... Add similar structures for Medium, Hard, Crazy, Insane, Nightmare
  ];
  
  export const totalRaidsAchievements = [
    {
        id: 'easy-dungeon-total',
        name: 'Easy Dungeon Total',
        type: 'total_raids',
        category: 'Dungeon',
        tiers: [
            { requirement: '25 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '50 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '75 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '100 Completions', bonus: '250 Créditos'},
        ]
    },
    {
        id: 'medium-dungeon-total',
        name: 'Medium Dungeon Total',
        type: 'total_raids',
        category: 'Dungeon',
        tiers: [
            { requirement: '25 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '50 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '75 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '100 Completions', bonus: '350 Créditos'},
        ]
    },
    {
        id: 'hard-dungeon-total',
        name: 'Hard Dungeon Total',
        type: 'total_raids',
        category: 'Dungeon',
        tiers: [
            { requirement: '25 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '50 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '75 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '100 Completions', bonus: '550 Créditos'},
        ]
    },
    {
        id: 'insane-dungeon-total',
        name: 'Insane Dungeon Total',
        type: 'total_raids',
        category: 'Dungeon',
        tiers: [
            { requirement: '25 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '50 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '75 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '100 Completions', bonus: '750 Créditos'},
        ]
    },
    {
        id: 'crazy-dungeon-total',
        name: 'Crazy Dungeon Total',
        type: 'total_raids',
        category: 'Dungeon',
        tiers: [
            { requirement: '25 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '50 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '75 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '100 Completions', bonus: '1k Créditos'},
        ]
    },
    {
        id: 'nightmare-dungeon-total',
        name: 'Nightmare Dungeon Total',
        type: 'total_raids',
        category: 'Dungeon',
        tiers: [
            { requirement: '25 Completions', bonus: '1k Créditos'},
        ]
    },
    {
        id: 'leaf-raid-total',
        name: 'Leaf Raid Total',
        type: 'total_raids',
        category: 'Raid',
        tiers: [
            { requirement: 'Room 2000', bonus: '200 Créditos'},
        ]
    },
     {
        id: 'kaiju-dungeon-total',
        name: 'Kaiju Dungeon Total',
        type: 'total_raids',
        category: 'Dungeon',
        tiers: [
            { requirement: '25 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '50 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '75 Completions', bonus: 'Variação de poder e porcentagem'},
            { requirement: '100 Completions', bonus: '200 Créditos'},
        ]
    }
  ];
  
  export const allAchievements = [...generalAchievements, ...raidRoomAchievements, ...totalRaidsAchievements];
  
