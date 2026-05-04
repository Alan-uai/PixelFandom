import type { WikiArticle } from '@/lib/types';

export const swordsArticle: Omit<WikiArticle, 'createdAt'> = {
  id: 'energy-swords',
  title: 'Espadas de Energia',
  summary: 'Um guia para as espadas que fornecem um multiplicador de energia, onde encontrá-las e seus status.',
  content: 'Espadas de energia são armas especiais que aumentam sua energia total com base em seu nível. Elas são encontradas em diferentes mundos.',
  tags: ['espadas', 'energia', 'arma', 'guia', 'geral', '3', '5', '15', '19'],
  imageUrl: 'wiki-8',
  tables: {
    world3: {
      headers: ['name', 'rarity', 'stats'],
      rows: [
        { name: 'Zangetsu', type: 'energy', rarity: 'Comum', stats: '0.05x' },
        { name: 'Zangetsu (1 Estrela)', type: 'energy', rarity: 'Raro', stats: '0.1x' },
        { name: 'Zangetsu (2 Estrelas)', type: 'energy', rarity: 'Lendário', stats: '0.15x' },
        { name: 'Zangetsu (3 Estrelas)', type: 'energy', rarity: 'Mítico', stats: '0.25x' },
      ],
    },
    world5: {
      headers: ['name', 'rarity', 'stats'],
      rows: [
        { name: 'Yellow Nichirin', type: 'energy', rarity: 'Comum', stats: '0.075x' },
        { name: 'Yellow Nichirin (1 Estrela)', type: 'energy', rarity: 'Raro', stats: '0.15x' },
        { name: 'Yellow Nichirin (2 Estrelas)', type: 'energy', rarity: 'Lendário', stats: '0.225x' },
        { name: 'Yellow Nichirin (3 Estrelas)', type: 'energy', rarity: 'Mítico', stats: '0.375x' },
      ],
    },
    world15: {
        headers: ['name', 'rarity', 'stats'],
        rows: [
            { name: 'Lucidator', type: 'energy', rarity: 'Comum', stats: '0.125x' },
            { name: 'Lucidator (1 Estrela)', type: 'energy', rarity: 'Raro', stats: '0.250x' },
            { name: 'Lucidator (2 Estrelas)', type: 'energy', rarity: 'Lendário', stats: '0.375x' },
            { name: 'Lucidator (3 Estrelas)', type: 'energy', rarity: 'Mítico', stats: '0.625x' },
        ],
    },
    world19: {
        headers: ['name', 'rarity', 'stats'],
        rows: [
            { name: 'Excalibur', type: 'energy', rarity: 'Comum', stats: '0.2x' },
            { name: 'Excalibur (1 Estrela)', type: 'energy', rarity: 'Raro', stats: '0.4x' },
            { name: 'Excalibur (2 Estrelas)', type: 'energy', rarity: 'Lendário', stats: '0.6x' },
            { name: 'Excalibur (3 Estrelas)', type: 'energy', rarity: 'Mítico', stats: '1x' },
        ],
    }
  },
};
