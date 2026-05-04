import type { WikiArticle } from '@/lib/types';

export const jewelryCraftingArticle: Omit<WikiArticle, 'createdAt'> = {
  id: 'jewelry-crafting',
  title: 'Guia de Fabricação de Jóias',
  summary: 'Aprenda a fabricar anéis, braceletes, colares e brincos nas Dungeons do Lobby e os bônus que eles oferecem.',
  content: `As jóias são acessórios poderosos que fornecem bônus significativos de status. Elas são fabricadas (crafted) usando materiais obtidos nas Dungeons do Lobby (Easy, Medium, Hard, Insane, Crazy).

### Tipos de Jóias e Bônus
Existem quatro tipos de slots para jóias: anel, bracelete, colar e brinco. Cada peça pode ser fabricada para fornecer um de quatro bônus diferentes:
- **Dano:** Aumenta seu multiplicador de dano.
- **Energia:** Aumenta seu multiplicador de energia.
- **Moedas:** Aumenta seu multiplicador de moedas.
- **Sorte:** Aumenta sua sorte para obter itens de maior raridade.

### Níveis e Materiais
As jóias possuem quatro níveis, cada um exigindo um material diferente e oferecendo um bônus maior:
- **Bronze:** O nível inicial.
- **Silver:** O segundo nível.
- **Gold:** O terceiro nível.
- **Rose-Gold:** O nível final e mais poderoso.

É importante notar que você só pode equipar jóias que fornecem o mesmo tipo de bônus (por exemplo, todas as quatro peças devem ser de dano ou todas de energia). Você não pode misturar um anel de dano com um colar de energia.`,
  tags: ['jóias', 'fabricação', 'crafting', 'dungeon', 'lobby', 'anel', 'bracelete', 'colar', 'brinco', 'guia'],
  imageUrl: 'wiki-4',
  tables: {
    jewelryBonuses: {
      headers: ['Nível', 'Bônus de Dano', 'Bônus de Energia', 'Bônus de Moedas', 'Bônus de Sorte'],
      rows: [
        { Nível: 'Bronze', 'Bônus de Dano': '0.1x', 'Bônus de Energia': '0.1x', 'Bônus de Moedas': '0.1x', 'Bônus de Sorte': '5.00%' },
        { Nível: 'Silver', 'Bônus de Dano': '0.25x', 'Bônus de Energia': '0.25x', 'Bônus de Moedas': '0.25x', 'Bônus de Sorte': '10.00%' },
        { Nível: 'Gold', 'Bônus de Dano': '0.5x', 'Bônus de Energia': '0.5x', 'Bônus de Moedas': '0.5x', 'Bônus de Sorte': '20.00%' },
        { Nível: 'Rose-Gold', 'Bônus de Dano': '0.75x', 'Bônus de Energia': '0.75x', 'Bônus de Moedas': '0.75x', 'Bônus de Sorte': '35.00%' },
      ],
    },
  },
};
