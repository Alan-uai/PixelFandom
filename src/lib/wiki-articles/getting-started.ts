import type { WikiArticle } from '@/lib/types';

export const gettingStartedArticle: Omit<WikiArticle, 'createdAt'> = {
    id: 'getting-started',
    title: 'Começando no Anime Eternal',
    summary: "Um guia para iniciantes para começar sua aventura no mundo do Anime Eternal.",
    content: `Bem-vindo ao Anime Eternal! Este guia irá guiá-lo através das principais características do Mundo 1, o hub central do jogo.

**Criação de Personagem e Primeira Missão**
Primeiro, você precisa escolher sua classe inicial: Guerreiro, Mago ou Ladino. Cada classe tem habilidades únicas. Sua primeira missão será dada pelo Ancião da Vila em Vento Argênteo, que lhe ensinará a se mover, combater e interagir com o mundo.

**Legenda de Cores de Raridade**
No jogo, a cor de fundo do nome de um item indica sua raridade:
*   **Cinza:** Comum
*   **Verde:** Incomum
*   **Azul:** Raro
*   **Lilás/Magenta:** Épico
*   **Amarelo:** Lendário
*   **Red:** Mítico
*   **Roxo:** Phantom
*   **Laranja/Arco-íris:** Supreme

**Principais Atividades no Mundo 1:**
*   **Placares de Líderes Globais:** Confira os melhores jogadores do mundo e veja sua posição.
*   **Subir de Rank e Nível de Avatar:** O Mundo 1 é onde você aumentará seu Rank e o nível de seus avatares.
*   **Baús e Missões Diárias:** Encontre e colete baús e complete missões diárias para obter recompensas valiosas.
*   **Dungeon do Mundo - Torneio:** Sua primeira dungeon específica do mundo é o Torneio, que vai até a Sala 550.
*   **Lobby de Dungeons:** Acesse uma variedade de dungeons especiais, que são diferentes das dungeons encontradas em cada mundo. As dungeons de lobby são: **Fácil, Média, Difícil, Insana, Louca, Pesadelo e Folha**. Todas as outras raids e dungeons pertencem a mundos específicos.`,
    tags: ['iniciante', 'guia', 'novo jogador', 'classe', 'mundo 1', 'geral', '1', 'raridade'],
    imageUrl: 'wiki-1',
};
