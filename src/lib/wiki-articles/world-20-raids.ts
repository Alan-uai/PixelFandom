import type { WikiArticle } from '@/lib/types';

export const world20RaidsArticle: Omit<WikiArticle, 'createdAt'> = {
  id: 'world-20-raids',
  title: 'Raids do Mundo 20',
  summary: 'Requisitos de energia para as raids "Green Planet" e "Suffering" no Mundo 20.',
  content: 'Este guia detalha a quantidade de energia necessária para passar por ondas específicas nas raids do Mundo 20.',
  tags: ['raid', 'guia', 'mundo 20', 'energia', '20', 'geral'],
  imageUrl: 'wiki-10',
  tables: {
    raids: {
      headers: ['Wave', 'Green Planet Raid', 'Suffering Raid'],
      rows: [
        { 'Wave': '10', 'Green Planet Raid': '494 - qnTG', 'Suffering Raid': '200 - OcTG' },
        { 'Wave': '20', 'Green Planet Raid': '1.19 - ssTG', 'Suffering Raid': '600 - NoTG' },
        { 'Wave': '30', 'Green Planet Raid': '3.12 - ssTG', 'Suffering Raid': '---' },
        { 'Wave': '40', 'Green Planet Raid': '7.53 - ssTG', 'Suffering Raid': '---' },
        { 'Wave': '50', 'Green Planet Raid': '21.4 - ssTG', 'Suffering Raid': '---' },
        { 'Wave': '100', 'Green Planet Raid': '2.5 - spTG', 'Suffering Raid': '---' },
        { 'Wave': '115', 'Green Planet Raid': '10.1 - spTG', 'Suffering Raid': '---' },
        { 'Wave': '130', 'Green Planet Raid': '45.1 - spTG', 'Suffering Raid': '---' },
        { 'Wave': '150', 'Green Planet Raid': '286 - spTG', 'Suffering Raid': '---' },
        { 'Wave': '175', 'Green Planet Raid': '2.94 - OcTG', 'Suffering Raid': '---' },
        { 'Wave': '200', 'Green Planet Raid': '35.9 - OcTG', 'Suffering Raid': '---' },
      ]
    }
  }
};
