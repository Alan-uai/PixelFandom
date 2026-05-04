
export interface RarityOption {
    rarity: string;
    [key: string]: string; 
}

export interface Accessory {
    id: string;
    name: string;
    world: string;
    boss: string;
    rarity_options: RarityOption[];
}


export const accessories: Accessory[] = [
  {
    "id": "straw-hat",
    "name": "Straw Hat",
    "world": "World 1",
    "boss": "Kid Kohan",
    "rarity_options": [
        { "rarity": "C-Rank", "coins_bonus": "0.1", "energy_bonus": "0.01x", "exp_bonus": "1.0%", "damage_bonus": "0.05x", "movespeed_bonus": "10%" }
    ]
  },
  {
    "id": "shinigami-scarf",
    "name": "Shinigami Scarf",
    "world": "World 3",
    "boss": "Eizen",
    "rarity_options": [
        { "rarity": "B-Rank", "coins_bonus": "0.5", "energy_bonus": "0.05x", "exp_bonus": "2.5%", "damage_bonus": "0.1x", "movespeed_bonus": "25%" }
    ]
  },
  {
    "id": "cursed-blindfold",
    "name": "Cursed Blindfold",
    "world": "World 4",
    "boss": "Sakuni",
    "rarity_options": [
        { "rarity": "B-Rank", "coins_bonus": "0.75", "energy_bonus": "0.075x", "exp_bonus": "3.5%", "damage_bonus": "0.15x", "movespeed_bonus": "35%" }
    ]
  },
  {
    "id": "clover-pendant",
    "name": "Clover Pendant",
    "world": "World 7",
    "boss": "Novi Chroni",
    "rarity_options": [
        { "rarity": "A-Rank", "coins_bonus": "1.0", "energy_bonus": "0.1x", "exp_bonus": "5.0%", "damage_bonus": "0.25x", "movespeed_bonus": "50%" }
    ]
  },
  {
    "id": "akatsuki-cloak",
    "name": "Akatsuki Cloak",
    "world": "World 8",
    "boss": "Itechi",
    "rarity_options": [
        { "rarity": "A-Rank", "coins_bonus": "1.25", "energy_bonus": "0.15x", "exp_bonus": "5.0%", "damage_bonus": "0.3x", "movespeed_bonus": "50%" }
    ]
  },
  {
    "id": "soul-reaper-cloak",
    "name": "Soul Reaper Cloak",
    "world": "World 10",
    "boss": "Ken Turbo",
    "rarity_options": [
        { "rarity": "S-Rank", "coins_bonus": "1.5", "energy_bonus": "0.25x", "exp_bonus": "7.5%", "damage_bonus": "0.5x", "movespeed_bonus": "75%" }
    ]
  },
  {
    "id": "hunter-license",
    "name": "Hunter License",
    "world": "World 11",
    "boss": "Killas Godspeed",
    "rarity_options": [
      { "rarity": "S-Rank", "coins_bonus": "1.75", "energy_bonus": "0.35x", "exp_bonus": "7.5%", "damage_bonus": "0.6x", "movespeed_bonus": "75%" }
    ]
  },
  {
    "id": "sins-emblem",
    "name": "Sins Emblem",
    "world": "World 13",
    "boss": "Esanor",
    "rarity_options": [
      { "rarity": "SS-Rank", "coins_bonus": "2.0", "energy_bonus": "0.5x", "exp_bonus": "7.5%", "damage_bonus": "0.75x", "movespeed_bonus": "75%" }
    ]
  },
  {
    "id": "virtual-headset",
    "name": "Virtual Headset",
    "world": "World 15",
    "boss": "The Paladin",
    "rarity_options": [
      { "rarity": "SS-Rank", "coins_bonus": "2.25", "energy_bonus": "0.75x", "exp_bonus": "7.5%", "damage_bonus": "1x", "movespeed_bonus": "75%" }
    ]
  },
  {
    "id": "scout-cloak",
    "name": "Scout Cloak",
    "world": "World 11",
    "boss": "Eran",
    "rarity_options": [
      { "rarity": "Common", "energy_bonus": "0.1x" },
      { "rarity": "Uncommon", "energy_bonus": "0.15x" },
      { "rarity": "Rare", "energy_bonus": "0.2x" },
      { "rarity": "Epic", "energy_bonus": "0.25x" },
      { "rarity": "Legendary", "energy_bonus": "0.3x" },
      { "rarity": "Mythic", "energy_bonus": "0.35x" },
      { "rarity": "Phantom", "energy_bonus": "0.5x" },
      { "rarity": "Supreme", "energy_bonus": "0.75x" }
    ]
  },
  {
    "id": "pokita-slides",
    "name": "Pokita Slides",
    "world": "World 18",
    "boss": "Benji",
    "rarity_options": [
      { "rarity": "Common", "movespeed_bonus": "13.3%", "energy_bonus": "0.3x" },
      { "rarity": "Uncommon", "movespeed_bonus": "20.0%", "energy_bonus": "0.45x" },
      { "rarity": "Rare", "movespeed_bonus": "26.7%", "energy_bonus": "0.6x" },
      { "rarity": "Epic", "movespeed_bonus": "33.3%", "energy_bonus": "0.75x" },
      { "rarity": "Legendary", "movespeed_bonus": "40.0%", "energy_bonus": "0.9x" },
      { "rarity": "Mythic", "movespeed_bonus": "46.7%", "energy_bonus": "1.05x" },
      { "rarity": "Phantom", "movespeed_bonus": "66.7%", "energy_bonus": "1.5x" },
      { "rarity": "Supreme", "movespeed_bonus": "100.0%", "energy_bonus": "2.25x" }
    ]
  },
  {
    "id": "scarffy",
    "name": "Scarffy",
    "world": "World 20",
    "boss": "Young Kohan",
    "rarity_options": [
      { "rarity": "Common", "damage_bonus": "0.133x", "coins_bonus": "0.6", "exp_bonus": "2.0%" },
      { "rarity": "Uncommon", "damage_bonus": "0.2x", "coins_bonus": "0.9", "exp_bonus": "3.0%" },
      { "rarity": "Rare", "damage_bonus": "0.267x", "coins_bonus": "1.2", "exp_bonus": "4.0%" },
      { "rarity": "Epic", "damage_bonus": "0.333x", "coins_bonus": "1.5", "exp_bonus": "5.0%" },
      { "rarity": "Legendary", "damage_bonus": "0.4x", "coins_bonus": "1.8", "exp_bonus": "6.0%" },
      { "rarity": "Mythic", "damage_bonus": "0.467x", "coins_bonus": "2.1", "exp_bonus": "7.0%" },
      { "rarity": "Phantom", "damage_bonus": "0.667x", "coins_bonus": "3", "exp_bonus": "10.0%" },
      { "rarity": "Supreme", "damage_bonus": "1x", "coins_bonus": "4.5", "exp_bonus": "15.0%" }
    ]
  },
  {
    "id": "fire-force-pants",
    "name": "Fire Force Pants",
    "world": "World 19",
    "boss": "Shinro",
    "rarity_options": [
      { "rarity": "Common", "energy_bonus": "0.133x" },
      { "rarity": "Uncommon", "energy_bonus": "0.2x" },
      { "rarity": "Rare", "energy_bonus": "0.267x" },
      { "rarity": "Epic", "energy_bonus": "0.333x" },
      { "rarity": "Legendary", "energy_bonus": "0.4x" },
      { "rarity": "Mythic", "energy_bonus": "0.467x" },
      { "rarity": "Phantom", "energy_bonus": "0.667x" },
      { "rarity": "Supreme", "energy_bonus": "1x" }
    ]
  },
  {
    "id": "fire-witch-hat",
    "name": "Fire Witch Hat",
    "world": "World 19",
    "boss": "Witch Queen",
    "rarity_options": [
      { "rarity": "Common", "damage_bonus": "0.1x", "coins_bonus": "0.133" },
      { "rarity": "Uncommon", "damage_bonus": "0.15x", "coins_bonus": "0.2" },
      { "rarity": "Rare", "damage_bonus": "0.2x", "coins_bonus": "0.267" },
      { "rarity": "Epic", "damage_bonus": "0.25x", "coins_bonus": "0.333" },
      { "rarity": "Legendary", "damage_bonus": "0.3x", "coins_bonus": "0.4" },
      { "rarity": "Mythic", "damage_bonus": "0.35x", "coins_bonus": "0.467" },
      { "rarity": "Phantom", "damage_bonus": "0.5x", "coins_bonus": "0.667" },
      { "rarity": "Supreme", "damage_bonus": "0.75x", "coins_bonus": "1" }
    ]
  },
  {
    "id": "neck-fur",
    "name": "Neck Fur",
    "world": "World 22",
    "boss": "Zeta",
    "rarity_options": [
      { "rarity": "Common", "energy_bonus": "0.133x", "coins_bonus": "0.6", "exp_bonus": "2.0%" },
      { "rarity": "Uncommon", "energy_bonus": "0.2x", "coins_bonus": "0.9", "exp_bonus": "3.0%" },
      { "rarity": "Rare", "energy_bonus": "0.267x", "coins_bonus": "1.2", "exp_bonus": "4.0%" },
      { "rarity": "Epic", "energy_bonus": "0.333x", "coins_bonus": "1.5", "exp_bonus": "5.0%" },
      { "rarity": "Legendary", "energy_bonus": "0.4x", "coins_bonus": "1.8", "exp_bonus": "6.0%" },
      { "rarity": "Mythic", "energy_bonus": "0.467x", "coins_bonus": "2.1", "exp_bonus": "7.0%" },
      { "rarity": "Phantom", "energy_bonus": "0.667x", "coins_bonus": "3", "exp_bonus": "10.0%" },
      { "rarity": "Supreme", "energy_bonus": "1x", "coins_bonus": "4.5", "exp_bonus": "15.0%" }
    ]
  },
  {
    "id": "red-hero-boots",
    "name": "Red Hero Boots",
    "world": "World 23",
    "boss": "Bald Man",
    "rarity_options": [
      { "rarity": "Common", "movespeed_bonus": "13.3%", "energy_bonus": "0.3x" },
      { "rarity": "Uncommon", "movespeed_bonus": "20.0%", "energy_bonus": "0.45x" },
      { "rarity": "Rare", "movespeed_bonus": "26.7%", "energy_bonus": "0.6x" },
      { "rarity": "Epic", "movespeed_bonus": "33.3%", "energy_bonus": "0.75x" },
      { "rarity": "Legendary", "movespeed_bonus": "40.0%", "energy_bonus": "0.9x" },
      { "rarity": "Mythic", "movespeed_bonus": "46.7%", "energy_bonus": "1.05x" },
      { "rarity": "Phantom", "movespeed_bonus": "66.7%", "energy_bonus": "1.5x" },
      { "rarity": "Supreme", "movespeed_bonus": "100.0%", "energy_bonus": "2.25x" }
    ]
  },
  {
    "id": "crested-wingbands",
    "name": "Crested Wingbands",
    "world": "World 22",
    "boss": "Beta",
    "rarity_options": [
      { "rarity": "Common", "damage_bonus": "0.2x", "coins_bonus": "0.4", "exp_bonus": "1.0%" },
      { "rarity": "Uncommon", "damage_bonus": "0.3x", "coins_bonus": "0.6", "exp_bonus": "1.5%" },
      { "rarity": "Rare", "damage_bonus": "0.4x", "coins_bonus": "0.8", "exp_bonus": "2.0%" },
      { "rarity": "Epic", "damage_bonus": "0.5x", "coins_bonus": "1", "exp_bonus": "2.5%" },
      { "rarity": "Legendary", "damage_bonus": "0.6x", "coins_bonus": "1.2", "exp_bonus": "3.0%" },
      { "rarity": "Mythic", "damage_bonus": "0.7x", "coins_bonus": "1.4", "exp_bonus": "3.5%" },
      { "rarity": "Phantom", "damage_bonus": "1x", "coins_bonus": "2", "exp_bonus": "5.0%" },
      { "rarity": "Supreme", "damage_bonus": "1.5x", "coins_bonus": "3", "exp_bonus": "7.5%" }
    ]
  }
];
