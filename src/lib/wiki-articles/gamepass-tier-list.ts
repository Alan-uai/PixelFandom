import type { WikiArticle } from '@/lib/types';

export const gamepassTierListArticle: Omit<WikiArticle, 'createdAt'> = {
  id: 'gamepass-tier-list',
  title: 'Tier List de Gamepasses',
  summary: 'Uma tier list da comunidade para as gamepasses, classificando-as da mais para a menos útil para jogadores novos e de endgame.',
  content: `Esta tier list classifica as gamepasses disponíveis no jogo com base em sua utilidade geral e impacto. A lista é dividida em duas partes: uma para novos jogadores e outra para jogadores de endgame.

### Sugestões para Novos Jogadores

Estas são sugestões, não uma lista imposta a seguir.

### Se você está no Endgame

Estas são as gamepasses que você deve ter no endgame.`,
  tags: ['gamepass', 'tier list', 'endgame', 'compra', 'guia', 'geral', 'double aura', 'extra shadow'],
  imageUrl: 'wiki-12',
  tables: {
    newPlayerTiers: {
      headers: ['Tier', 'Gamepass', 'Recomendação'],
      rows: [
        { Tier: 'S', Gamepass: 'Fast Click, Fast Roll, Fast Star, 2x Damage', Recomendação: 'Estes são os passes mais importantes. Você deve comprá-los primeiro.' },
        { Tier: 'A', Gamepass: '+3 Champions Equip, +2 Champions Equip, Double Weapon Equip', Recomendação: 'Depois de ter os primeiros passes, compre estes a seguir.' },
        { Tier: 'B', Gamepass: '2x EXP, VIP, Extra Shadow, Double Aura, Extra Stand, Remote Gacha', Recomendação: 'Você precisará desses passes para progredir mais rápido no futuro.' },
        { Tier: 'C', Gamepass: '2x Soul, +2 Gacha, +5 Star Open, 2x Coin, Super Luck, Extra Luck, Lucky, Extra Titan', Recomendação: 'Esses passes não são necessários, mas dão um bom bônus. Compre-os somente depois de todos os outros.' },
        { Tier: 'D', Gamepass: '+10 Backpack Space, +20 Backpack Space', Recomendação: 'Não vale a pena. Compre por último se realmente quiser.' },
      ],
    },
    endgameTiers: {
      headers: ['Tier', 'Gamepass', 'Recomendação'],
      rows: [
        { Tier: 'S', Gamepass: 'Fast Click, Fast Roll, Fast Star, 2x Damage, 2x Energy, Double Weapon Equip, Triple Weapon Equip, Extra Shadow, Extra Titan, Double Aura', Recomendação: 'Deve ter no endgame.' },
        { Tier: 'A', Gamepass: '+3 Champions Equip, +2 Champions Equip, 2x EXP, VIP, Extra Stand, Remote Gacha, 2x Coin', Recomendação: 'Deveria ter para um progresso mais rápido.' },
        { Tier: 'B', Gamepass: '2x Soul, +2 Gacha, +5 Star Open, Super Luck, Extra Luck, Lucky', Recomendação: 'Principalmente Qualidade de Vida e economia de tempo.' },
        { Tier: 'C', Gamepass: '+10 Backpack Space, +20 Backpack Space', Recomendação: 'Não é realmente necessário, mas é bom ter no endgame.' },
      ],
    }
  },
};
