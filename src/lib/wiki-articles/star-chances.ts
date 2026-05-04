import type { WikiArticle } from '@/lib/types';

export const starChancesArticle: Omit<WikiArticle, 'createdAt'> = {
  id: 'star-chances',
  title: 'Chances Base das Estrelas',
  summary: 'Uma tabela de referência para as chances de obter cada raridade de pet em cada Estrela (caixa de pet).',
  content: 'Esta tabela detalha o custo de cada Estrela e as chances base de obter um pet de uma raridade específica, de Comum a Supremo. Essas chances podem ser aumentadas com bônus de sorte.',
  tags: ['estrela', 'star', 'pet', 'chance', 'sorte', 'raridade', 'guia', 'geral'],
  imageUrl: 'wiki-5',
  tables: {
    starChances: {
      headers: ['Egg Name', 'Egg Cost', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical', 'Phantom', 'Supreme'],
      rows: [
        { 'Egg Name': 'Star 1', 'Egg Cost': '2.50E+01', 'Common': '40.00000%', 'Uncommon': '39.63000%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0150%', 'Phantom': '0.0050%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 2', 'Egg Cost': '2.50E+02', 'Common': '40.00000%', 'Uncommon': '39.63000%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0150%', 'Phantom': '0.0050%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 3', 'Egg Cost': '2.50E+03', 'Common': '40.00000%', 'Uncommon': '39.63000%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0150%', 'Phantom': '0.0050%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 4', 'Egg Cost': '2.50E+04', 'Common': '40.00000%', 'Uncommon': '39.63000%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0150%', 'Phantom': '0.0050%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 5', 'Egg Cost': '3.13E+05', 'Common': '40.00000%', 'Uncommon': '39.63750%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0025%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 6', 'Egg Cost': '3.91E+06', 'Common': '40.00000%', 'Uncommon': '39.63750%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0025%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 7', 'Egg Cost': '2.15E+08', 'Common': '40.00000%', 'Uncommon': '39.63900%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0010%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 8', 'Egg Cost': '1.07E+09', 'Common': '40.00000%', 'Uncommon': '39.63900%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0010%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 9', 'Egg Cost': '2.15E+10', 'Common': '40.00000%', 'Uncommon': '39.63900%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0010%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 10', 'Egg Cost': '1.07E+11', 'Common': '40.00000%', 'Uncommon': '39.63910%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0009%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 11', 'Egg Cost': '5.37E+11', 'Common': '40.00000%', 'Uncommon': '39.63910%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0009%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 12', 'Egg Cost': '5.66E+12', 'Common': '40.00000%', 'Uncommon': '39.63910%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0009%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 13', 'Egg Cost': '6.43E+13', 'Common': '40.00000%', 'Uncommon': '39.63910%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0009%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 14', 'Egg Cost': '1.29E+15', 'Common': '40.00000%', 'Uncommon': '39.63910%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0009%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 15', 'Egg Cost': '2.57E+16', 'Common': '40.00000%', 'Uncommon': '39.63910%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0009%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 16', 'Egg Cost': '7.72E+17', 'Common': '40.00000%', 'Uncommon': '39.63910%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0009%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 17', 'Egg Cost': '7.72E+18', 'Common': '40.00000%', 'Uncommon': '39.63910%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0009%', 'Supreme': '0.0000%' },
        { 'Egg Name': 'Star 18', 'Egg Cost': '1.16E+20', 'Common': '40.00000%', 'Uncommon': '39.63912%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0008%', 'Supreme': '0.00008%' },
        { 'Egg Name': 'Star 19', 'Egg Cost': '1.74E+21', 'Common': '40.00000%', 'Uncommon': '39.63912%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0008%', 'Supreme': '0.00008%' },
        { 'Egg Name': 'Star 20', 'Egg Cost': '2.60E+22', 'Common': '40.00000%', 'Uncommon': '39.63917%', 'Rare': '14.00000%', 'Epic': '6.00000%', 'Legendary': '0.35000%', 'Mythical': '0.0100%', 'Phantom': '0.0008%', 'Supreme': '0.00003%' }
      ]
    }
  }
};
