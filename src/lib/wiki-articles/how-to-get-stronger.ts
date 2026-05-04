import type { WikiArticle } from '@/lib/types';

export const howToGetStrongerArticle: Omit<WikiArticle, 'createdAt'> = {
  id: 'how-to-get-stronger',
  title: 'Como Ficar Mais Forte',
  summary: 'Um guia estratégico com objetivos e prioridades para otimizar sua progressão no Anime Eternal.',
  content: `Este guia fornece um conjunto de objetivos e prioridades para ajudar os jogadores a ficarem mais fortes e progredirem eficientemente.

### Objetivos Principais
- Pegar todos os phantoms/supremes de todas as ilhas.
- Completar os achievements.
- Completar o Index.
- Pegar acessórios de boss SS (capa/chinelo/chapéu/cachecol/máscara).
- Pegar joias de craft das dungeons (colar/anel/brinco).
- Maximizar todas as progressões de ilha.
- Completar o máximo possível de obeliscos.
- Pegar time full mítico/phantom da última ilha que você estiver.
- Pegar e evoluir as espadas do mundo 3, 5, 15 de energia.

### Gamepasses por Categoria
- **Energia:** Double Energy, Fast click, More Equips, Extra Champions Equips, Vip
- **Dano:** Double Damage, Double Weapon, Extra Titan
- **Utilidade:** Fast Roll, Double Souls, Double Coins, Remote Access, Double Exp

### Ordem de Prioridade de Gamepass
1. Fast click
2. Double Energy
3. Double Damage
4. Double Weapon
5. Double Exp
6. Fast Roll
7. Extra Champions Equips
8. More Equips
9. Double Souls
10. Vip
11. Extra Stand
12. Extra Titan

### Perguntas Frequentes
**Compensa comprar Exclusive Stars?**
Não compensa. É muito melhor comprar o Starter Pack #1 por 300 créditos, que já vem com o avatar top e 1 pet bom.
`,
  tags: ['guia', 'estratégia', 'dicas', 'forte', 'progressão', 'gamepass', 'geral'],
  imageUrl: 'wiki-3', // Reusing a relevant image
};
