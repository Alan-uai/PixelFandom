import type { WikiArticle } from '@/lib/types';

export const standsArticle: Omit<WikiArticle, 'createdAt'> = {
  id: 'stands-world-16',
  title: 'Guia de Stands (Mundo 16)',
  summary: 'Um guia sobre os Stands, um tipo de "lutador" do Mundo 16, e os bônus de energia que eles fornecem.',
  content: 'Stands são lutadores especiais encontrados no Mundo 16. Eles fornecem um bônus percentual à sua energia total, aumentando seu poder. O bônus aumenta com a raridade do Stand.',
  tags: ['stand', 'lutador', 'energia', 'mundo 16', '16', 'guia', 'geral'],
  imageUrl: 'wiki-2', // Reusing aura image for now
  tables: {
    stands: {
      headers: ['Stand', 'Raridade', 'Bônus de Energia'],
      rows: [
        { 'Stand': 'Star Platinum', 'Raridade': 'Comum', 'Bônus de Energia': '2%' },
        { 'Stand': 'Magicians Red', 'Raridade': 'Incomum', 'Bônus de Energia': '4%' },
        { 'Stand': 'Hierophant Green', 'Raridade': 'Raro', 'Bônus de Energia': '6%' },
        { 'Stand': 'The World', 'Raridade': 'Épico', 'Bônus de Energia': '10%' },
        { 'Stand': 'King Crimson', 'Raridade': 'Lendário', 'Bônus de Energia': '15%' },
        { 'Stand': 'Killer Queen', 'Raridade': 'Mítico', 'Bônus de Energia': '20%' },
        { 'Stand': 'Golden Experience', 'Raridade': 'Mítico', 'Bônus de Energia': '25%' },
        { 'Stand': 'Golden Experience Requiem', 'Raridade': 'Phantom', 'Bônus de Energia': '35%' },
        { 'Stand': 'The World Over Heaven', 'Raridade': 'Phantom', 'Bônus de Energia': '40%' },
      ]
    }
  }
};
