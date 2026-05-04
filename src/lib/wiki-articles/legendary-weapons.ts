import type { WikiArticle } from '@/lib/types';

export const legendaryWeaponsArticle: Omit<WikiArticle, 'createdAt'> = {
    id: 'legendary-weapons',
    title: 'Fabricação de Armas Lendárias',
    summary: 'Descubra os segredos para forjar as armas mais poderosas do jogo.',
    content: 'Armas lendárias são o auge do equipamento em Anime Eternal. Fabricar uma é uma jornada longa e árdua que requer materiais raros, um alto nível de fabricação e uma forja especial.\n\nOs materiais necessários, conhecidos como "Fragmentos Celestiais", são dropados por chefes de mundo e podem ser encontrados nas masmorras mais profundas. Você precisará de 100 fragmentos, juntamente com outros componentes raros, para tentar uma fabricação. A forja está localizada no pico do Monte Celestia. Cuidado, o caminho é traiçoeiro.',
    tags: ['fabricação', 'armas', 'lendário', 'endgame', 'guia', 'geral'],
    imageUrl: 'wiki-3',
};
