import type { WikiArticle } from '@/lib/types';

export const prestigeArticle: Omit<WikiArticle, 'createdAt'> = {
    id: 'prestige-system',
    title: 'Sistema de Prestígio',
    summary: 'Entenda como prestigiar para aumentar seu limite de nível e ganhar mais poder.',
    content: `O sistema de Prestígio permite que os jogadores resetem seu nível em troca de bônus permanentes poderosos. Veja como funciona:`,
    tags: ['prestígio', 'nível', 'endgame', 'status', 'sistema', 'geral'],
    imageUrl: 'wiki-5',
    tables: {
      prestigeLevels: {
        headers: ['Prestígio', 'Nível Requerido', 'Novo Limite de Nível', 'Pontos de Status por Nível', 'Multiplicador de Exp'],
        rows: [
          { 'Prestígio': 1, 'Nível Requerido': 200, 'Novo Limite de Nível': 210, 'Pontos de Status por Nível': 2, 'Multiplicador de Exp': '0.1x' },
          { 'Prestígio': 2, 'Nível Requerido': 210, 'Novo Limite de Nível': 220, 'Pontos de Status por Nível': 3, 'Multiplicador de Exp': '0.2x' },
          { 'Prestígio': 3, 'Nível Requerido': 220, 'Novo Limite de Nível': 230, 'Pontos de Status por Nível': 4, 'Multiplicador de Exp': '0.3x' },
          { 'Prestígio': 4, 'Nível Requerido': 230, 'Novo Limite de Nível': 250, 'Pontos de Status por Nível': 5, 'Multiplicador de Exp': '0.4x' },
          { 'Prestígio': 5, 'Nível Requerido': 250, 'Novo Limite de Nível': 270, 'Pontos de Status por Nível': 6, 'Multiplicador de Exp': '0.5x' },
        ]
      }
    }
};
