import type { WikiArticle } from '@/lib/types';

export const worldBossesArticle: Omit<WikiArticle, 'createdAt'> = {
  id: 'world-bosses',
  title: 'Guia de Chefes de Mundo',
  summary: 'Um guia completo para todos os chefes de mundo, seus status e o HP/DPS necessário para derrotá-los.',
  content: `Este guia fornece uma lista de chefes de Rank-SS e SSS, detalhando o HP necessário para um "one-hit kill" e o DPS médio para derrotá-los em 30 segundos.`,
  tags: ['chefes', 'guia', 'dps', 'hp', 'recompensas', 'geral', '1', '2', '3', '4', '5', '6', '7', '8', '10', '11', '13', '15', '16', '17', '19', '20'],
  imageUrl: 'wiki-7',
  tables: {
    ssBosses: {
      headers: ['Mundo', 'Chefe (Rank SS)', 'HP para Hit Kill', 'DPS (30s)'],
      rows: [
        { 'Mundo': 1, 'Chefe (Rank SS)': 'Kid Kohan', 'HP para Hit Kill': '2.5Qd', 'DPS (30s)': '83.33T' },
        { 'Mundo': 2, 'Chefe (Rank SS)': 'Shanks', 'HP para Hit Kill': '5.00sx', 'DPS (30s)': '166.67Qn' },
        { 'Mundo': 3, 'Chefe (Rank SS)': 'Eizen', 'HP para Hit Kill': '2.5Sp', 'DPS (30s)': '83.33sx' },
        { 'Mundo': 4, 'Chefe (Rank SS)': 'Sakuni', 'HP para Hit Kill': '120.00Sp', 'DPS (30s)': '4.00Sp' },
        { 'Mundo': 5, 'Chefe (Rank SS)': 'Rangoki', 'HP para Hit Kill': '31.2de', 'DPS (30s)': '1.04de' },
        { 'Mundo': 6, 'Chefe (Rank SS)': 'Statue of God', 'HP para Hit Kill': '195 Ud', 'DPS (30s)': '6.50Ud' },
        { 'Mundo': 7, 'Chefe (Rank SS)': 'Novi Chroni', 'HP para Hit Kill': '101TdD', 'DPS (30s)': '3.37tdD' },
        { 'Mundo': 8, 'Chefe (Rank SS)': 'Itechi', 'HP para Hit Kill': '2.82QnD', 'DPS (30s)': '94.00qdD' },
        { 'Mundo': 8, 'Chefe (Rank SS)': 'Madera', 'HP para Hit Kill': '5.64QnD', 'DPS (30s)': '188.00qdD' },
        { 'Mundo': 10, 'Chefe (Rank SS)': 'Ken Turbo', 'HP para Hit Kill': '494SxD', 'DPS (30s)': '16.47sxD' },
        { 'Mundo': 11, 'Chefe (Rank SS)': 'Killas Godspeed', 'HP para Hit Kill': '296OcD', 'DPS (30s)': '9.87OcD' },
        { 'Mundo': 11, 'Chefe (Rank SS)': 'Eran', 'HP para Hit Kill': '49.4Vgn', 'DPS (30s)': '1.65Vgn' },
        { 'Mundo': 13, 'Chefe (Rank SS)': 'Esanor', 'HP para Hit Kill': '9.77DVg', 'DPS (30s)': '325.67UVg' },
        { 'Mundo': 13, 'Chefe (Rank SS)': 'Number 8', 'HP para Hit Kill': '5.55qtV', 'DPS (30s)': '185.00TVg' },
        { 'Mundo': 14, 'Chefe (Rank SS)': 'Valzora', 'HP para Hit Kill': '4.79SeV', 'DPS (30s)': '159.67QnV' },
        { 'Mundo': 15, 'Chefe (Rank SS)': 'The Paladin', 'HP para Hit Kill': '967SPG', 'DPS (30s)': '32.23SPG' },
        { 'Mundo': 16, 'Chefe (Rank SS)': 'Dio', 'HP para Hit Kill': '195NVG', 'DPS (30s)': '6.50NVG' },
        { 'Mundo': 17, 'Chefe (Rank SS)': 'Arama', 'HP para Hit Kill': '686UTG', 'DPS (30s)': '22.87UTG' },
        { 'Mundo': 18, 'Chefe (Rank SS)': 'Mr. Chainsaw', 'HP para Hit Kill': '1.5TGN', 'DPS (30s)': '50.00NVG' },
        { 'Mundo': 19, 'Chefe (Rank SS)': 'Hero of Hell', 'HP para Hit Kill': '121UTG', 'DPS (30s)': '4.03UTG' },
        { 'Mundo': 19, 'Chefe (Rank SS)': 'Leonardo', 'HP para Hit Kill': '121UTG', 'DPS (30s)': '4.03UTG' },
        { 'Mundo': '19', 'Chefe (Rank SS)': 'Bansho', 'HP para Hit Kill': '605UTG', 'DPS (30s)': '20.17UTG' },
        { 'Mundo': 20, 'Chefe (Rank SS)': 'Koku SSJ', 'HP para Hit Kill': '9.4tsTG', 'DPS (3s)': '313.33DTG' },
        { 'Mundo': 20, 'Chefe (Rank SSS)': 'Frezi Final Form', 'HP para Hit Kill': '47qTG', 'DPS (30s)': '1.57qTG' },
        { 'Mundo': 21, 'Chefe (Rank SSS)': 'Cifer', 'HP para Hit Kill': '744QnTG', 'DPS (30s)': '24.80QnTG' },
        { 'Mundo': 21, 'Chefe (Rank SSS)': 'Vasto Ichge', 'HP para Hit Kill': '3.7ssTG', 'DPS (30s)': '123.33QnTG' }
      ]
    }
  }
};
