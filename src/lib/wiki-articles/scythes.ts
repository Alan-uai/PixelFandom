import type { WikiArticle } from '@/lib/types';

export const scythesArticle: Omit<WikiArticle, 'createdAt'> = {
  id: 'scythes-world-21',
  title: 'Foices (Mundo 21)',
  summary: 'Um guia para as foices do Mundo 21, as armas mais recentes do jogo, e seus multiplicadores de dano.',
  content: `As foices são as armas introduzidas no Mundo 21. Elas oferecem multiplicadores de dano significativos que aumentam com a evolução (estrelas), de forma similar aos Titãs. Além disso, as foices podem vir com encantamentos de **Passiva**, que concedem bônus adicionais e também possuem raridades distintas.

### Fabricação (Scythe Exchanger)
É possível fabricar foices mais poderosas, como a **Stormreaver**. A fabricação requer:
- 10x Phantom Requiem
- 10k Exchange Coin 2
- 1x Item Desconhecido`,
  tags: ['foice', 'arma', 'mundo 21', '21', 'guia', 'geral', 'passiva', 'fabricação'],
  imageUrl: 'wiki-14',
  tables: {
    scythes: {
      headers: ['name', 'rarity', 'base_damage', 'one_star_damage', 'two_star_damage', 'three_star_damage'],
      rows: [
        { name: 'Venomleaf', type: 'scythe', rarity: 'Comum', base_damage: '0.75x', one_star_damage: '1.5x', two_star_damage: '2.25x', three_star_damage: '3.75x' },
        { name: 'Cryoscythe', type: 'scythe', rarity: 'Incomum', base_damage: '1x', one_star_damage: '2x', two_star_damage: '3x', three_star_damage: '5x' },
        { name: 'Toxinfang', type: 'scythe', rarity: 'Raro', base_damage: '1.75x', one_star_damage: '3.5x', two_star_damage: '5.25x', three_star_damage: '8.75x' },
        { name: 'Crimson Thorn', type: 'scythe', rarity: 'Lendário', base_damage: '2.2x', one_star_damage: '4.4x', two_star_damage: '6.6x', three_star_damage: '11x' },
        { name: 'Bonehowl', type: 'scythe', rarity: 'Mítico', base_damage: '2.75x', one_star_damage: '5.5x', two_star_damage: '8.25x', three_star_damage: '13.75x' },
        { name: 'Ashfang', type: 'scythe', rarity: 'Phantom', base_damage: '3.5x', one_star_damage: '7x', two_star_damage: '10.5x', three_star_damage: '17.5x' },
        { name: 'Phantom Requiem', type: 'scythe', rarity: 'Phantom', base_damage: '4.25x', one_star_damage: '8.5x', two_star_damage: '12.75x', three_star_damage: '21.25x' },
        { name: 'Stormreaver', type: 'scythe', rarity: 'Supremo', base_damage: '5x', one_star_damage: '10x', two_star_damage: '15x', three_star_damage: '25x' },
      ]
    }
  }
};
