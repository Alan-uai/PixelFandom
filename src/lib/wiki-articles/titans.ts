import type { WikiArticle } from '@/lib/types';

export const titansArticle: Omit<WikiArticle, 'createdAt'> = {
  id: 'titans-world-11',
  title: 'Guia de Titãs (Mundo 11)',
  summary: 'Um guia sobre os Titãs, um tipo de "lutador" do Mundo 11, e o dano que eles causam em cada nível de estrela.',
  content: 'Titãs são lutadores especiais encontrados no Mundo 11. O dano deles é uma porcentagem do seu próprio dano total, tornando-os aliados poderosos. O dano aumenta significativamente com a evolução (estrelas).',
  tags: ['titã', 'lutador', 'dano', 'mundo 11', '11', 'guia', 'geral'],
  imageUrl: 'wiki-15',
  tables: {
    baseTitans: {
      headers: ['Titã (0 Estrelas)', 'Tempo de Ataque', 'Dano de Ataque'],
      rows: [
        { 'Titã (0 Estrelas)': 'Jaw Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '5%' },
        { 'Titã (0 Estrelas)': 'Female Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '10%' },
        { 'Titã (0 Estrelas)': 'Beast Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '15%' },
        { 'Titã (0 Estrelas)': 'Armored Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '20%' },
        { 'Titã (0 Estrelas)': 'Warhammer Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '25%' },
        { 'Titã (0 Estrelas)': 'Attack Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '30%' },
        { 'Titã (0 Estrelas)': 'Colossal Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '40%' },
      ],
    },
    oneStarTitans: {
      headers: ['Titã (1 Estrela)', 'Tempo de Ataque', 'Dano de Ataque'],
      rows: [
        { 'Titã (1 Estrela)': 'Jaw Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '7.5%' },
        { 'Titã (1 Estrela)': 'Female Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '15%' },
        { 'Titã (1 Estrela)': 'Beast Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '22.5%' },
        { 'Titã (1 Estrela)': 'Armored Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '30%' },
        { 'Titã (1 Estrela)': 'Warhammer Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '37.5%' },
        { 'Titã (1 Estrela)': 'Attack Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '45.0%' },
        { 'Titã (1 Estrela)': 'Colossal Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '60%' },
      ],
    },
    twoStarTitans: {
      headers: ['Titã (2 Estrelas)', 'Tempo de Ataque', 'Dano de Ataque'],
      rows: [
        { 'Titã (2 Estrelas)': 'Jaw Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '10%' },
        { 'Titã (2 Estrelas)': 'Female Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '20%' },
        { 'Titã (2 Estrelas)': 'Beast Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '30%' },
        { 'Titã (2 Estrelas)': 'Armored Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '40%' },
        { 'Titã (2 Estrelas)': 'Warhammer Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '50%' },
        { 'Titã (2 Estrelas)': 'Attack Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '60%' },
        { 'Titã (2 Estrelas)': 'Colossal Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '80%' },
      ],
    },
    threeStarTitans: {
      headers: ['Titã (3 Estrelas)', 'Tempo de Ataque', 'Dano de Ataque'],
      rows: [
        { 'Titã (3 Estrelas)': 'Jaw Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '15%' },
        { 'Titã (3 Estrelas)': 'Female Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '30%' },
        { 'Titã (3 Estrelas)': 'Beast Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '45%' },
        { 'Titã (3 Estrelas)': 'Armored Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '60%' },
        { 'Titã (3 Estrelas)': 'Warhammer Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '75%' },
        { 'Titã (3 Estrelas)': 'Attack Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '90%' },
        { 'Titã (3 Estrelas)': 'Colossal Titan', 'Tempo de Ataque': '1s', 'Dano de Ataque': '120%' },
      ],
    },
  },
};
