import type { BlockConfig } from '@/components/page-builder/types';

export interface BuiltInTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  blocks: BlockConfig[];
}

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'landing-simple',
    name: 'Landing Page Simples',
    category: 'pagina',
    description: 'Hero + recursos + CTA final',
    blocks: [
      {
        id: 't-hero',
        type: 'hero',
        config: {
          layout: 'center',
          title: 'Bem-vindo à Nossa Wiki',
          subtitle: 'Explore todo o conteúdo e participe da comunidade',
          ctaText: 'Começar Agora',
          ctaVariant: 'primary',
          overlay: true,
        },
      },
      {
        id: 't-section-1',
        type: 'section',
        config: { columns: 3, gap: 'md', equalHeight: true, verticalAlign: 'top' },
        children: [
          {
            id: 't-col-1',
            type: 'column' as any,
            config: { width: '33.33%', verticalAlign: 'top' },
            children: [
              { id: 't-icon-1', type: 'icon' as any, config: { icon: 'star', size: 'lg' } as any },
              { id: 't-head-1', type: 'heading' as any, config: { content: 'Recurso 1', level: 'h3', align: 'center' } },
              { id: 't-para-1', type: 'paragraph' as any, config: { content: 'Descrição do recurso incrível da sua wiki.', size: 'md' } },
            ],
          },
          {
            id: 't-col-2',
            type: 'column' as any,
            config: { width: '33.33%', verticalAlign: 'top' },
            children: [
              { id: 't-icon-2', type: 'icon' as any, config: { icon: 'heart', size: 'lg' } as any },
              { id: 't-head-2', type: 'heading' as any, config: { content: 'Recurso 2', level: 'h3', align: 'center' } },
              { id: 't-para-2', type: 'paragraph' as any, config: { content: 'Outra funcionalidade importante para seus usuários.', size: 'md' } },
            ],
          },
          {
            id: 't-col-3',
            type: 'column' as any,
            config: { width: '33.33%', verticalAlign: 'top' },
            children: [
              { id: 't-icon-3', type: 'icon' as any, config: { icon: 'users', size: 'lg' } as any },
              { id: 't-head-3', type: 'heading' as any, config: { content: 'Recurso 3', level: 'h3', align: 'center' } },
              { id: 't-para-3', type: 'paragraph' as any, config: { content: 'Mais um benefício que faz diferença.', size: 'md' } },
            ],
          },
        ],
      },
      {
        id: 't-cta',
        type: 'button',
        config: { text: 'Junte-se à Comunidade', url: '', variant: 'primary', size: 'lg', fullWidth: false },
      },
    ],
  },
  {
    id: 'hero-article-grid',
    name: 'Hero + Grid Artigos',
    category: 'secao',
    description: 'Hero com artigo em grid',
    blocks: [
      {
        id: 'th-hero',
        type: 'hero',
        config: { layout: 'center', title: 'Título Principal', subtitle: 'Subtítulo impactante', ctaText: 'Saiba Mais', ctaVariant: 'primary', overlay: true },
      },
      {
        id: 'th-grid',
        type: 'article-grid',
        config: { title: 'Artigos Recentes', columns: 3, mode: 'tag', showImages: true, showSummaries: true },
      },
    ],
  },
  {
    id: 'pricing-section',
    name: 'Tabela de Preços',
    category: 'secao',
    description: 'Seção com planos',
    blocks: [
      {
        id: 'tp-head',
        type: 'heading',
        config: { content: 'Nossos Planos', level: 'h2', align: 'center' },
      },
      {
        id: 'tp-pricing',
        type: 'pricing-table',
        config: {
          title: '',
          columns: 3,
          plans: [
            { name: 'Básico', price: 'Grátis', period: '', features: ['Feature 1', 'Feature 2'], ctaText: 'Começar', highlighted: false },
            { name: 'Pro', price: 'R$ 29', period: '/mês', features: ['Feature 1', 'Feature 2', 'Feature 3'], ctaText: 'Assinar', highlighted: true, highlightColor: 'var(--primary)' },
            { name: 'Enterprise', price: 'R$ 99', period: '/mês', features: ['Tudo do Pro', 'Feature extra'], ctaText: 'Contato', highlighted: false },
          ],
        },
      },
    ],
  },
  {
    id: 'faq-section',
    name: 'FAQ Completa',
    category: 'secao',
    description: 'Perguntas frequentes',
    blocks: [
      {
        id: 'tf-faq',
        type: 'faq',
        config: {
          title: 'Perguntas Frequentes',
          layout: 'accordion',
          items: [
            { question: 'Como faço para participar?', answer: 'Basta se cadastrar e começar a explorar o conteúdo.' },
            { question: 'O conteúdo é gratuito?', answer: 'Sim, todo o conteúdo básico é gratuito.' },
            { question: 'Posso contribuir?', answer: 'Sim! Qualquer membro pode contribuir com conteúdo.' },
          ],
        },
      },
    ],
  },
  {
    id: 'hero-features-cta',
    name: 'Hero + Features + CTA',
    category: 'pagina',
    description: 'Landing page completa',
    blocks: [
      {
        id: 'hf-hero',
        type: 'hero',
        config: { layout: 'center', title: 'Sua Wiki', subtitle: 'Crie, compartilhe, colabore', ctaText: 'Começar', ctaVariant: 'primary', overlay: true },
      },
      {
        id: 'hf-section',
        type: 'section',
        config: { columns: 2, gap: 'md', equalHeight: true, verticalAlign: 'center' },
        children: [
          {
            id: 'hf-col-1',
            type: 'column' as any,
            config: { width: '50%', verticalAlign: 'center' },
            children: [
              { id: 'hf-head', type: 'heading' as any, config: { content: 'Por que escolher nossa wiki?', level: 'h2', align: 'left' } },
              { id: 'hf-para', type: 'paragraph' as any, config: { content: 'Temos o melhor conteúdo organizado por comunidade.', size: 'md' } },
            ],
          },
          {
            id: 'hf-col-2',
            type: 'column' as any,
            config: { width: '50%', verticalAlign: 'center' },
            children: [
              { id: 'hf-img', type: 'image' as any, config: { src: '', alt: 'Imagem ilustrativa', rounded: 'md', shadow: 'md' } },
            ],
          },
        ],
      },
      {
        id: 'hf-cta',
        type: 'button',
        config: { text: 'Explorar Agora', url: '', variant: 'primary', size: 'lg', fullWidth: false },
      },
    ],
  },
  // ── 404 Error Templates ──
  {
    id: 'error-classic',
    name: '404 Clássico',
    category: 'erro',
    description: 'Glitch display + busca + ações padrão',
    blocks: [
      {
        id: 'err-classic-display',
        type: 'error-display',
        config: { number: '404', size: 'xl', title: 'Página não encontrada', subtitle: 'O conteúdo que você procura não existe ou foi movido.', glitchEnabled: true, showDecoration: true },
      },
      {
        id: 'err-classic-search',
        type: 'error-search',
        config: { placeholder: 'Buscar na wiki...' },
      },
      {
        id: 'err-classic-actions',
        type: 'error-actions',
        config: { buttons: [{ label: 'Voltar ao Início', url: '/', variant: 'primary' }, { label: 'Relatar Erro', url: '', variant: 'outline' }], layout: 'row', size: 'md' },
      },
    ],
  },
  {
    id: 'error-fun',
    name: '404 Divertido',
    category: 'erro',
    description: 'Mascote + mini-game + fatos curiosos',
    blocks: [
      {
        id: 'err-fun-char',
        type: 'error-character',
        config: { character: 'sad-robot', mood: 'sad', animation: 'float-error', speech: 'Oops! Você se perdeu por aqui...', size: 'md', showBubble: true },
      },
      {
        id: 'err-fun-game',
        type: 'error-fun',
        config: { type: 'game', gameType: 'clicker', redirectUrl: '/', redirectSeconds: 10 },
      },
      {
        id: 'err-fun-fact',
        type: 'error-fact',
        config: { facts: [{ text: 'Esta wiki foi criada por fãs para fãs.', source: 'PixelFandom' }], rotation: 'random', showSource: true },
      },
    ],
  },
  {
    id: 'error-helpful',
    name: '404 Útil',
    category: 'erro',
    description: 'Sugestões + mapa do site + feedback + redes sociais',
    blocks: [
      {
        id: 'err-helpful-display',
        type: 'error-display',
        config: { number: '404', size: 'lg', title: 'Hmm, não encontramos isso', subtitle: 'Mas podemos ajudar você a encontrar o que precisa.', glitchEnabled: false, showDecoration: true },
      },
      {
        id: 'err-helpful-suggestions',
        type: 'error-suggestions',
        config: { title: 'Você pode estar procurando:', maxItems: 4, mode: 'manual', items: [{ title: 'Artigo Principal', slug: '' }, { title: 'Guia do Iniciante', slug: '' }] },
      },
      {
        id: 'err-helpful-map',
        type: 'error-map',
        config: { title: 'Mapa do Site', showSections: true, maxDepth: 2, layout: 'list' },
      },
      {
        id: 'err-helpful-feedback',
        type: 'error-feedback',
        config: { title: 'Reportar Problema', subtitle: 'Ajude-nos a melhorar!', placeholder: 'O que você estava procurando?', submitText: 'Enviar', successMessage: 'Obrigado!', showEmail: false },
      },
      {
        id: 'err-helpful-social',
        type: 'error-social',
        config: { title: 'Não vá ainda!', message: 'Siga-nos nas redes sociais enquanto isso:', showShare: true, showFollow: true, layout: 'row' },
      },
    ],
  },
];

export function getBuiltInTemplate(id: string): BuiltInTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}
