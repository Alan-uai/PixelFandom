import type { WikiArticle } from '@/lib/types';

export const achievementsGuideArticle: Omit<WikiArticle, 'createdAt'> = {
  id: 'achievements-guide',
  title: 'Guia de Conquistas',
  summary: 'Um guia completo para todas as conquistas do jogo, incluindo gerais, de raids e totais.',
  content: `Este guia detalha todas as conquistas disponíveis no Anime Eternal, seus requisitos e as recompensas que elas oferecem.

### Conquistas Gerais
Estas são conquistas que você progride ao longo do tempo jogando.

### Conquistas de Raids (Salas)
Estas conquistas são obtidas ao alcançar certas salas (rooms) nas dungeons do lobby. O bônus para as salas 10, 20, 30 e 40 varia de raid para raid, mas a sala 50 sempre concede +1 espaço para equipar pet.

### Conquistas de Conclusão Total de Raids
Estas são recompensas por completar uma raid do lobby um certo número de vezes. A recompensa final geralmente são Créditos, uma moeda F2P.

### Análise de Tempo das Raids
Os tempos abaixo representam a média para **completar (solar) a raid**, não o tempo que o portal fica aberto (que é de 20 minutos, com 2 minutos para entrar). A velocidade de movimento base é considerada 100%.
- **Pokita (100% de Velocidade):** Acessório de evento que dobra a velocidade de movimento. O tempo médio com ele é de **1 minuto, 12 segundos e 25 nanossegundos**.
- **Clover Pendant (50% de Velocidade):** O melhor acessório de velocidade não-evento. O tempo médio com ele seria de aproximadamente **1 minuto, 36 segundos**.
- **Sem Acessórios (Velocidade Base):** Sem nenhum bônus de velocidade, o tempo seria de aproximadamente **2 minutos e 24 segundos**.

**Nota:** A raid Kaiju tem um tempo diferente de **2 minutos e 16 segundos** com o Pokita (100%). Os tempos para outros acessórios seguiriam uma lógica de cálculo similar.
`,
  tags: ['conquistas', 'achievements', 'guia', 'raid', 'créditos', 'geral'],
  imageUrl: 'wiki-4',
  tables: {
    general: {
      headers: ['Conquista', 'Nível Máx/Requisito', 'Progressão'],
      rows: [
        { Conquista: 'Friends Bonus V', 'Nível Máx/Requisito': '96h', Progressão: '5% de energia a cada lvl' },
        { Conquista: 'Total coins XXVIII', 'Nível Máx/Requisito': '100N', Progressão: '5% coins (x10 a cada lvl)' },
        { Conquista: 'Total energy XLV', 'Nível Máx/Requisito': '10QnD', Progressão: '5% energia (x10 a cada lvl)' },
        { Conquista: 'Time Played X', 'Nível Máx/Requisito': '1250h', Progressão: '5% energia' },
        { Conquista: 'Star opened X', 'Nível Máx/Requisito': '5M', Progressão: '+1 equip pet (lvl 1), depois +1 star open' },
        { Conquista: 'Total Enemies XIX', 'Nível Máx/Requisito': '75M', Progressão: '5% damage' },
      ]
    },
    totalRaids: {
      headers: ['Raid', '25 Conclusões', '50 Conclusões', '75 Conclusões', '100 Conclusões'],
      rows: [
        { Raid: 'Easy', '25 Conclusões': 'Bônus Variável', '50 Conclusões': 'Bônus Variável', '75 Conclusões': 'Bônus Variável', '100 Conclusões': '250 Créditos' },
        { Raid: 'Medium', '25 Conclusões': 'Bônus Variável', '50 Conclusões': 'Bônus Variável', '75 Conclusões': 'Bônus Variável', '100 Conclusões': '350 Créditos' },
        { Raid: 'Hard', '25 Conclusões': 'Bônus Variável', '50 Conclusões': 'Bônus Variável', '75 Conclusões': 'Bônus Variável', '100 Conclusões': '550 Créditos' },
        { Raid: 'Insane', '25 Conclusões': 'Bônus Variável', '50 Conclusões': 'Bônus Variável', '75 Conclusões': 'Bônus Variável', '100 Conclusões': '750 Créditos' },
        { Raid: 'Crazy', '25 Conclusões': 'Bônus Variável', '50 Conclusões': 'Bônus Variável', '75 Conclusões': 'Bônus Variável', '100 Conclusões': '1k Créditos' },
      ]
    },
    specialRaids: {
        headers: ['Raid', 'Requisito', 'Recompensa'],
        rows: [
            { Raid: 'Nightmare', Requisito: '25 Conclusões', Recompensa: '1k Créditos' },
            { Raid: 'Leaf Raid', Requisito: 'Room 2000', Recompensa: '200 Créditos' },
        ]
    }
  }
};
