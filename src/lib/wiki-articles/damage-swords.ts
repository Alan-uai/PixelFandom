import type { WikiArticle } from '@/lib/types';

export const damageSwordsArticle: Omit<WikiArticle, 'createdAt'> = {
  id: 'damage-swords',
  title: 'Espadas de Dano (Evolução)',
  summary: 'Um guia para as espadas de dano e seus multiplicadores em cada nível de evolução (estrela), incluindo informações sobre a espada de evento Golden Venom Strike.',
  content: `Espadas de dano aumentam seu poder de ataque. A cada evolução (nível de estrela), o multiplicador de dano aumenta significativamente. Para maximizar ainda mais o dano, as espadas podem ser aprimoradas com encantamentos como **Respirações** e **Runas**, que também possuem suas próprias raridades e bônus.

**Nota Especial sobre a Golden Venom Strike:** A Golden Venom Strike foi uma espada de evento da atualização 17, que saiu na atualização 18 e não está mais disponível para obtenção. Ela era adquirida no Mundo 2 ao trocar uma Venomstrike de 3 estrelas (Phantom) por ela. A Golden Venom Strike possui um multiplicador de dano base de 38x e não possui estrelas ou passivas.`,
  tags: ['espadas', 'dano', 'arma', 'guia', 'geral', 'evolução', 'golden venom', 'respiração', 'runa'],
  imageUrl: 'wiki-9',
  tables: {
    damageSwords: {
      headers: ['name', 'rarity', 'type', 'base_damage', 'one_star_damage', 'two_star_damage', 'three_star_damage'],
      rows: [
        { name: 'Bloodthorn', rarity: 'Comum', type: 'damage', base_damage: '0.25x', one_star_damage: '0.5x', two_star_damage: '0.75x', three_star_damage: '1.25x' },
        { name: 'Eclipse Warden', rarity: 'Incomum', type: 'damage', base_damage: '0.45x', one_star_damage: '0.9x', two_star_damage: '1.35x', three_star_damage: '2.25x' },
        { name: 'Obsidian Reaver', rarity: 'Raro', type: 'damage', base_damage: '0.75x', one_star_damage: '1.5x', two_star_damage: '2.25x', three_star_damage: '3.75x' },
        { name: 'Aquarius Edge', rarity: 'Lendário', type: 'damage', base_damage: '1x', one_star_damage: '2x', two_star_damage: '3x', three_star_damage: '5x' },
        { name: 'Doomsoul', rarity: 'Mítico', type: 'damage', base_damage: '1.25x', one_star_damage: '2.5x', two_star_damage: '3.75x', three_star_damage: '6.25x' },
        { name: 'Redmourne', rarity: 'Mítico', type: 'damage', base_damage: '1.5x', one_star_damage: '3x', two_star_damage: '4.5x', three_star_damage: '7.5x' },
        { name: 'Venomstrike', rarity: 'Phantom', type: 'damage', base_damage: '2x', one_star_damage: '4x', two_star_damage: '6x', three_star_damage: '10x' },
        { name: 'Golden Venom Strike', rarity: 'Evento', type: 'damage', base_damage: '38x', one_star_damage: '38x', two_star_damage: '38x', three_star_damage: '38x' },
      ],
    },
  },
};
