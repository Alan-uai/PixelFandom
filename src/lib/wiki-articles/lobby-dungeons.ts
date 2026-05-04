import type { WikiArticle } from '@/lib/types';

export const lobbyDungeonsArticle: Omit<WikiArticle, 'createdAt'> = {
  id: 'lobby-dungeons',
  title: 'Guia de Dungeons do Lobby',
  summary: 'Um guia completo com horários, vida do chefe e requisitos de dano para as dungeons do lobby.',
  content: 'Este guia detalha as informações essenciais para participar e ter sucesso nas dungeons acessíveis pelo lobby central do jogo. Use esta tabela como referência para saber quando cada dungeon abre e se você tem o dano necessário. O "Tempo Otimizado" refere-se ao tempo de conclusão com rank máximo de velocidade e acessórios de velocidade.',
  tags: ['dungeon', 'lobby', 'guia', 'requisitos', 'dano', 'geral'],
  imageUrl: 'wiki-11', // Reusing a relevant image
  tables: {
    lobbySchedule: {
      headers: ['Horário', 'Dificuldade', 'Vida Último Boss', 'Dano Mínimo', 'Dano Recomendado', 'Tempo Otimizado'],
      rows: [
        { 'Horário': 'XX:00', 'Dificuldade': 'Easy', 'Vida Último Boss': '600x-1Sp', 'Dano Mínimo': '800qn', 'Dano Recomendado': '1sx', 'Tempo Otimizado': '1m 12s' },
        { 'Horário': 'XX:10', 'Dificuldade': 'Medium', 'Vida Último Boss': '60o-100o', 'Dano Mínimo': '50sp', 'Dano Recomendado': '100SP', 'Tempo Otimizado': '1m 12s' },
        { 'Horário': 'XX:20', 'Dificuldade': 'Hard', 'Vida Último Boss': '100de-140d', 'Dano Mínimo': '80N', 'Dano Recomendado': '150N', 'Tempo Otimizado': '1m 12s' },
        { 'Horário': 'XX:30', 'Dificuldade': 'Insane', 'Vida Último Boss': '90DD-130DD', 'Dano Mínimo': '60Ud', 'Dano Recomendado': '100Ud', 'Tempo Otimizado': '1m 12s' },
        { 'Horário': 'XX:40', 'Dificuldade': 'Crazy', 'Vida Último Boss': '90Qnd-35Nvd', 'Dano Mínimo': '300qnd', 'Dano Recomendado': '1Nvd', 'Tempo Otimizado': '1m 12s' },
        { 'Horário': 'XX:50', 'Dificuldade': 'Nightmare', 'Vida Último Boss': '40VG-50VG', 'Dano Mínimo': '500spg', 'Dano Recomendado': '700SPG', 'Tempo Otimizado': '' },
        { 'Horário': 'XX:15', 'Dificuldade': 'Leaf Raid (1800)', 'Vida Último Boss': '///////// ', 'Dano Mínimo': '18qntg', 'Dano Recomendado': '50QNTG', 'Tempo Otimizado': '' },
      ],
    },
  },
};
