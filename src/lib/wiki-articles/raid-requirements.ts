import type { WikiArticle } from '@/lib/types';

export const raidRequirementsArticle: Omit<WikiArticle, 'createdAt'> = {
  id: 'raid-requirements',
  title: 'Requisitos de Energia para Raids',
  summary: 'Um guia completo com os requisitos de energia para passar por diferentes ondas em várias raids e dungeons do jogo.',
  content: `Este guia consolida a energia necessária para progredir nas principais raids e dungeons do Anime Eternal. É importante notar que as raids podem ser solo ou em grupo.

**Raids Solo (1 Jogador):**
*   **Gleam Raid (Mundo 15):** Uma raid de desafio individual.
*   **Raid Sins (Mundo 12):** Outra raid projetada para um único jogador.

**Raids em Grupo (até 4 Jogadores):**
*   Todas as outras raids não mencionadas como "solo" permitem a participação de até 4 jogadores.

Abaixo estão as tabelas com os requisitos de HP e DPS para as novas raids, e a tabela consolidada para as raids mais antigas.

### Cálculo de HP Exponencial para Raids

Para raids como **Titan Defense** e **Progression Raid**, o HP dos inimigos aumenta exponencialmente a cada sala. Em vez de uma tabela gigante, use a seguinte fórmula para estimar o HP:

**Fórmula:** \`HP(sala) = HP_inicial * (HP_final / HP_inicial)^((sala - 1) / 999)\`

**Valores Base:**
*   **Titan Defense:**
    *   HP Inicial (Sala 1): 7.62 sxD (7.62e51)
    *   HP Final (Sala 1000): 1.63 TGN (1.63e93)
*   **Progression Raid:**
    *   HP Inicial (Sala 1): 57.2 DD (5.72e40)
    *   HP Final (Sala 1000): 12.3 SeV (1.23e82)

**Exemplo de Uso:** Para calcular o DPS necessário para a sala 500 da Titan Defense, a IA primeiro calcularia o HP dessa sala usando a fórmula e depois dividiria o resultado por 30 para obter uma estimativa de DPS para uma luta de 30 segundos.

A **Mundo Raid**, localizada no Lobby 2, é desbloqueada junto com o Mundo 21. Sua mecânica é similar à da Gleam Raid: cada onda completada é uma conquista que concede um nível de um poder exclusivo da raid (do comum ao supremo), além de uma conquista final que recompensa com créditos.`,
  tags: ['raid', 'dungeon', 'energia', 'guia', 'geral', 'solo'],
  imageUrl: 'wiki-11',
  tables: {
    gleamRaidWorld15: {
      headers: ['Wave', 'HP', 'DPS'],
      rows: [
        { 'Wave': 1, 'HP': '12.00 - QnV', 'DPS': '500 - QtV' },
        { 'Wave': 2, 'HP': '240.00 - QnV', 'DPS': '10 - QnV' },
        { 'Wave': 3, 'HP': '4.80 - SeV', 'DPS': '170 - QnV' },
        { 'Wave': 4, 'HP': '96.00 - SeV', 'DPS': '3.5 - SeV' },
        { 'Wave': 5, 'HP': '1.92 - SpG', 'DPS': '80 - SeV' },
        { 'Wave': 6, 'HP': '38.40 - SpG', 'DPS': '1.5 - SpG' },
        { 'Wave': 7, 'HP': '768.00 - SpG', 'DPS': '30 - SpG' },
        { 'Wave': 8, 'HP': '16.36 - OvG', 'DPS': '650 - SpG' },
        { 'Wave': 9, 'HP': '307.20 - OvG', 'DPS': '12 - OvG' },
        { 'Wave': 10, 'HP': '6.14 - NvG', 'DPS': '230 - OvG' }
      ]
    },
    mundoRaidWorld21: {
      headers: ['Wave', 'HP', 'DPS'],
      rows: [
        { 'Wave': 1, 'HP': '81 - NoTG', 'DPS': '8.1 - NoTG' },
        { 'Wave': 2, 'HP': '2.91 - QdDR', 'DPS': '700 - NoTG' },
        { 'Wave': 3, 'HP': '58 - QdDR', 'DPS': '5.8 - QdDR' },
        { 'Wave': 4, 'HP': '1.16 - uQDR', 'DPS': '600 - QdDR' },
        { 'Wave': 5, 'HP': '23.3 - uQDR', 'DPS': '2.33 - uQDR' },
        { 'Wave': 6, 'HP': '466 - uQDR', 'DPS': '46 - uQDR' },
        { 'Wave': 7, 'HP': '9.32 - dQDR', 'DPS': '932 - uQDR' },
        { 'Wave': 8, 'HP': '186 - dQDR', 'DPS': '18.6 - dQDR' },
        { 'Wave': 9, 'HP': '3.73 - tQDR', 'DPS': '373 - dQDR' },
        { 'Wave': 10, 'HP': '74.5 - tQDR', 'DPS': '7.45 - tQDR' }
      ]
    },
    requirements: {
      headers: ['Wave', 'Tournament Raid', 'Restaurant Raid', 'Cursed Raid', 'Leaf Raid', 'Progression Raid', 'Titan Defense', 'Raid Sins', 'Kaiju Dungeon', 'Progression Raid 2', 'Ghoul Raid', 'Chainsaw Defense', 'Nether World Raid', 'Green Planet Raid'],
      rows: [
        { 'Wave': 50, 'Tournament Raid': '10 QD', 'Restaurant Raid': '750 T', 'Cursed Raid': '500 QN', 'Leaf Raid': '500 UD', 'Progression Raid': '500 DD', 'Titan Defense': '300 SXD', 'Raid Sins': '111 OCD', 'Kaiju Dungeon': '500 UVG', 'Progression Raid 2': '200 QNV', 'Ghoul Raid': '600 SPG', 'Chainsaw Defense': '230 TGN', 'Nether World Raid': '6 TSTG', 'Green Planet Raid': '21.4 - ssTG' },
        { 'Wave': 100, 'Tournament Raid': '11 N', 'Restaurant Raid': '140 QD', 'Cursed Raid': '140 QD', 'Leaf Raid': '5 DD', 'Progression Raid': '62 TDD', 'Titan Defense': '20 SPD', 'Raid Sins': '13 NVD', 'Kaiju Dungeon': '//////', 'Progression Raid 2': '24 SEV', 'Ghoul Raid': '70 OVG', 'Chainsaw Defense': '27 UTG', 'Nether World Raid': '40 QTTG', 'Green Planet Raid': '2.5 - spTG' },
        { 'Wave': 200, 'Tournament Raid': '14 NVD', 'Restaurant Raid': '2 SX', 'Cursed Raid': '860 SP', 'Leaf Raid': '75 TDD', 'Progression Raid': '900 QDD', 'Titan Defense': '250 OCD', 'Raid Sins': '200 VGN', 'Kaiju Dungeon': '//////', 'Progression Raid 2': '333 SPG', 'Ghoul Raid': '1 TGN', 'Chainsaw Defense': '375 DTG', 'Nether World Raid': '//////', 'Green Planet Raid': '35.9 - OcTG' },
        { 'Wave': 300, 'Tournament Raid': '17 NVG', 'Restaurant Raid': '27,5 SP', 'Cursed Raid': '12 N', 'Leaf Raid': '1 QND', 'Progression Raid': '12 SXD', 'Titan Defense': '10 VGN', 'Raid Sins': '2 DVG', 'Kaiju Dungeon': '//////', 'Progression Raid 2': '5 NVG', 'Ghoul Raid': '13 UTG', 'Chainsaw Defense': '5 QTTG', 'Nether World Raid': '//////', 'Green Planet Raid': '?????' },
        { 'Wave': 500, 'Tournament Raid': '????', 'Restaurant Raid': '5 DE', 'Cursed Raid': '2,25 DD', 'Leaf Raid': '200 SPG', 'Progression Raid': '2,25 NVD', 'Titan Defense': '650 DVG', 'Raid Sins': '10 OVG', 'Kaiju Dungeon': '//////', 'Progression Raid 2': '900 UTG', 'Ghoul Raid': '2,5 QTTG', 'Chainsaw Defense': '1 SPTG', 'Nether World Raid': '//////', 'Green Planet Raid': '?????' },
        { 'Wave': 750, 'Tournament Raid': '//////', 'Restaurant Raid': '110 TDD', 'Cursed Raid': '500 QND', 'Leaf Raid': '4,5 UVG', 'Progression Raid': '50 DVG', 'Titan Defense': '15 SEV', 'Raid Sins': '200 UTG', 'Kaiju Dungeon': '//////', 'Progression Raid 2': '20 QNTG', 'Ghoul Raid': '55 SPTG', 'Chainsaw Defense': '22 QDDR', 'Nether World Raid': '//////', 'Green Planet Raid': '?????' },
        { 'Wave': 1000, 'Tournament Raid': '//////', 'Restaurant Raid': '2,5 SPD', 'Cursed Raid': '1,1 NVD', 'Leaf Raid': '95 QTV', 'Progression Raid': '1 SEV', 'Titan Defense': '350 NVG', 'Raid Sins': '//////', 'Kaiju Dungeon': '//////', 'Progression Raid 2': '500 OCTG', 'Ghoul Raid': '2 UQDR', 'Chainsaw Defense': '//////', 'Nether World Raid': '//////', 'Green Planet Raid': '?????' },
        { 'Wave': 1200, 'Tournament Raid': '//////', 'Restaurant Raid': '//////', 'Cursed Raid': '//////', 'Leaf Raid': '18 SPG', 'Progression Raid': '//////', 'Titan Defense': '//////', 'Raid Sins': '//////', 'Kaiju Dungeon': '//////', 'Progression Raid 2': '//////', 'Ghoul Raid': '//////', 'Chainsaw Defense': '//////', 'Nether World Raid': '//////', 'Green Planet Raid': '?????' },
        { 'Wave': 1400, 'Tournament Raid': '//////', 'Restaurant Raid': '//////', 'Cursed Raid': '//////', 'Leaf Raid': '3,5 TGN', 'Progression Raid': '//////', 'Titan Defense': '//////', 'Raid Sins': '//////', 'Kaiju Dungeon': '//////', 'Progression Raid 2': '//////', 'Ghoul Raid': '//////', 'Chainsaw Defense': '//////', 'Nether World Raid': '//////', 'Green Planet Raid': '?????' },
        { 'Wave': 1600, 'Tournament Raid': '//////', 'Restaurant Raid': '//////', 'Cursed Raid': '//////', 'Leaf Raid': '650 DTG', 'Progression Raid': '//////', 'Titan Defense': '//////', 'Raid Sins': '//////', 'Kaiju Dungeon': '//////', 'Progression Raid 2': '//////', 'Ghoul Raid': '//////', 'Chainsaw Defense': '//////', 'Nether World Raid': '//////', 'Green Planet Raid': '?????' },
        { 'Wave': 1800, 'Tournament Raid': '//////', 'Restaurant Raid': '//////', 'Cursed Raid': '//////', 'Leaf Raid': '100 QNTG', 'Progression Raid': '//////', 'Titan Defense': '//////', 'Raid Sins': '//////', 'Kaiju Dungeon': '//////', 'Progression Raid 2': '//////', 'Ghoul Raid': '//////', 'Chainsaw Defense': '//////', 'Nether World Raid': '//////', 'Green Planet Raid': '?????' },
        { 'Wave': 2000, 'Tournament Raid': '//////', 'Restaurant Raid': '//////', 'Cursed Raid': '//////', 'Leaf Raid': '35 OCTG', 'Progression Raid': '//////', 'Titan Defense': '//////', 'Raid Sins': '//////', 'Kaiju Dungeon': '//////', 'Progression Raid 2': '//////', 'Ghoul Raid': '//////', 'Chainsaw Defense': '//////', 'Nether World Raid': '//////', 'Green Planet Raid': '?????' },
      ]
    }
  }
};
