import type { BlockType, BlockDefinition, BlockCategory } from '@/components/page-builder/types';
import {
  LayoutTemplate, Columns3, Image, Heading, Text, AlignJustify, MousePointerClick,
  Minus, Square, List, ImageIcon, Images, Video, BookOpen, ImagesIcon,
  Grid3X3, Newspaper, Star, FolderOpen, FileText,
  Trophy, DollarSign, BarChart3, GitGraph, HelpCircle,
  MessageCircle, Share2, TimerReset, FormInput, Search, Table2, Puzzle,
  Copyright, Mail, Smartphone, ArrowUpToLine, CreditCard, Globe, Menu,
  TriangleAlert, SearchX, Shuffle, ArrowUpRight, Gamepad2, ImageOff,
  Route, Quote, BugOff, TimerOff, Sparkles, Rabbit, Vote,
  Lightbulb, HeartHandshake, Bot, Database,
  type LucideIcon,
} from 'lucide-react';

export const BLOCK_REGISTRY: BlockDefinition[] = [
  // ── Layout ──
  { type: 'section', label: 'Seção', icon: LayoutTemplate as LucideIcon, category: 'layout', description: 'Container com colunas flexíveis', defaultConfig: { columns: 1, gap: 'md', equalHeight: true, verticalAlign: 'top' }, supportsChildren: true },
  { type: 'column', label: 'Coluna', icon: Columns3 as LucideIcon, category: 'layout', description: 'Coluna interna de seção', defaultConfig: { width: '100%', verticalAlign: 'top' }, supportsChildren: true },

  // ── Content ──
  { type: 'hero', label: 'Hero', icon: Image as LucideIcon, category: 'content', description: 'Banner principal com CTA', defaultConfig: { layout: 'center', title: 'Título Hero', subtitle: 'Subtítulo', ctaText: 'Começar', ctaVariant: 'primary', overlay: true } },
  { type: 'heading', label: 'Título', icon: Heading as LucideIcon, category: 'content', description: 'Título customizável (h1-h6)', defaultConfig: { content: 'Título Aqui', level: 'h2', align: 'left' } },
  { type: 'paragraph', label: 'Parágrafo', icon: Text as LucideIcon, category: 'content', description: 'Parágrafo de texto', defaultConfig: { content: 'Texto do parágrafo...', size: 'md' } },
  { type: 'rich-text', label: 'Texto Rico', icon: AlignJustify as LucideIcon, category: 'content', description: 'Conteúdo HTML sanitizado', defaultConfig: { html: '<p>Conteúdo aqui</p>' } },
  { type: 'button', label: 'Botão', icon: MousePointerClick as LucideIcon, category: 'content', description: 'Botão CTA', defaultConfig: { text: 'Clique aqui', url: '', variant: 'primary', size: 'md', fullWidth: false } },
  { type: 'divider', label: 'Divisor', icon: Minus as LucideIcon, category: 'content', description: 'Linha divisória', defaultConfig: { style: 'solid', thickness: 'sm' } },
  { type: 'spacer', label: 'Espaçador', icon: Square as LucideIcon, category: 'content', description: 'Espaçamento vertical', defaultConfig: { height: 'md' } },
  { type: 'list', label: 'Lista', icon: List as LucideIcon, category: 'content', description: 'Lista ordenada/não-ordenada', defaultConfig: { items: ['Item 1', 'Item 2', 'Item 3'], ordered: false, style: 'disc' } },

  // ── Media ──
  { type: 'image', label: 'Imagem', icon: ImageIcon as LucideIcon, category: 'media', description: 'Imagem única com legenda', defaultConfig: { src: '', alt: '', rounded: 'none', shadow: 'none' } },
  { type: 'image-gallery', label: 'Galeria', icon: Images as LucideIcon, category: 'media', description: 'Galeria de imagens', defaultConfig: { title: 'Galeria', images: [], columns: 3, aspectRatio: 'square' } },
  { type: 'video-embed', label: 'Vídeo', icon: Video as LucideIcon, category: 'media', description: 'Embed YouTube/Vimeo/Twitch', defaultConfig: { url: '', provider: 'youtube', aspectRatio: '16:9' } },
  { type: 'cover', label: 'Cover', icon: BookOpen as LucideIcon, category: 'media', description: 'Imagem full-width com overlay', defaultConfig: { title: 'Título Cover', subtitle: 'Subtítulo', overlay: true, height: 'md', textAlign: 'center' } },
  { type: 'media-text', label: 'Mídia + Texto', icon: ImagesIcon as LucideIcon, category: 'media', description: 'Imagem e texto lado a lado', defaultConfig: { title: 'Título', content: 'Conteúdo...', imagePosition: 'left', imageRatio: '50' } },
  { type: 'icon', label: 'Ícone', icon: Star as LucideIcon, category: 'media', description: 'Ícone decorativo', defaultConfig: { icon: 'lucide:star', size: 'lg', rounded: 'none' } },

  // ── Dynamic ──
  { type: 'article-grid', label: 'Grid Artigos', icon: Grid3X3 as LucideIcon, category: 'dynamic', description: 'Grade de artigos', defaultConfig: { title: 'Artigos', columns: 3, mode: 'tag', showImages: true, showSummaries: true } },
  { type: 'article-carousel', label: 'Carrossel Artigos', icon: Newspaper as LucideIcon, category: 'dynamic', description: 'Carrossel de artigos', defaultConfig: { title: 'Artigos', autoplay: true, interval: 5000, displayFormat: 'carousel', columns: 3, tabsEnabled: false, tabsSubFormat: 'list' } },
  { type: 'news-feed', label: 'Feed Notícias', icon: Newspaper as LucideIcon, category: 'dynamic', description: 'Feed de notícias', defaultConfig: { title: 'Notícias', mode: 'manual', items: [], maxItems: 10 } },
  { type: 'featured-list', label: 'Lista Destaques', icon: Star as LucideIcon, category: 'dynamic', description: 'Itens em destaque', defaultConfig: { title: 'Destaques', layout: 'list', items: [] } },
  { type: 'category-list', label: 'Categorias', icon: FolderOpen as LucideIcon, category: 'dynamic', description: 'Lista de categorias', defaultConfig: { title: 'Categorias', showCount: true, layout: 'list' } },
  { type: 'latest-articles', label: 'Artigos Recentes', icon: FileText as LucideIcon, category: 'dynamic', description: 'Artigos recentes automáticos', defaultConfig: { title: 'Recentes', count: 6, columns: 3, showImages: true, showSummaries: true } },
  { type: 'game-data-cards', label: 'Grid de Dados', icon: Database as LucideIcon, category: 'dynamic', description: 'Grid de tabelas do jogo da wiki', defaultConfig: { title: 'Dados do Jogo' } },
  { type: 'game-table-items', label: 'Itens de Tabela', icon: Database as LucideIcon, category: 'dynamic', description: 'Itens de uma tabela do jogo com visualização configurável', defaultConfig: { title: '', displayFormat: 'grid', columnsCount: 3, itemsPerPage: 20, showSearch: true, showFilters: true, showHeader: true } },
  { type: 'article-feed', label: 'Lista de Artigos', icon: Grid3X3 as LucideIcon, category: 'dynamic', description: 'Artigos com filtro e ordenação (recentes, votados, comentados)', defaultConfig: { title: 'Artigos', sortBy: 'recent', layout: 'grid', columns: 3, count: 6, showImages: true, showSummaries: true } },

  // ── Data ──
  { type: 'ranking-table', label: 'Tabela Ranking', icon: Trophy as LucideIcon, category: 'data', description: 'Tabela de rankings', defaultConfig: { title: 'Ranking', headers: ['#', 'Item', 'Valor'], rows: [['1', '', '']], variant: 'default' } },
  { type: 'pricing-table', label: 'Tabela Preços', icon: DollarSign as LucideIcon, category: 'data', description: 'Planos de preço', defaultConfig: { title: 'Planos', columns: 3, plans: [{ name: 'Básico', price: 'R$ 0', period: '/mês', features: ['Feature 1'], ctaText: 'Começar', highlighted: false }] } },
  { type: 'statistics', label: 'Estatísticas', icon: BarChart3 as LucideIcon, category: 'data', description: 'Números com destaque', defaultConfig: { columns: 3, animate: true, items: [{ label: 'Usuários', value: '1000' }] } },
  { type: 'progress-bar', label: 'Barra Progresso', icon: BarChart3 as LucideIcon, category: 'data', description: 'Barras de progresso', defaultConfig: { items: [{ label: 'Skill', value: 75 }] } },
  { type: 'timeline', label: 'Linha do Tempo', icon: GitGraph as LucideIcon, category: 'data', description: 'Timeline vertical', defaultConfig: { items: [{ title: 'Evento', date: '2024', content: 'Descrição' }] } },
  { type: 'faq', label: 'FAQ', icon: HelpCircle as LucideIcon, category: 'data', description: 'Perguntas frequentes', defaultConfig: { title: 'FAQ', layout: 'accordion', items: [{ question: 'Pergunta?', answer: 'Resposta...' }] } },

  // ── Interactive ──
  { type: 'discord-embed', label: 'Discord Embed', icon: MessageCircle as LucideIcon, category: 'interactive', description: 'Convite do Discord', defaultConfig: { discordUrl: '', title: 'Junte-se ao Discord', description: 'Participe da comunidade!', variant: 'default' } },
  { type: 'social-links', label: 'Redes Sociais', icon: Share2 as LucideIcon, category: 'interactive', description: 'Links para redes sociais', defaultConfig: { title: 'Siga-nos', layout: 'row', size: 'md', links: [{ platform: 'Discord', url: '' }] } },
  { type: 'countdown', label: 'Contagem Regressiva', icon: TimerReset as LucideIcon, category: 'interactive', description: 'Timer para evento', defaultConfig: { title: 'Lançamento em:', showDays: true, showHours: true, showMinutes: true, showSeconds: true, labelDays: 'dias', labelHours: 'horas', labelMinutes: 'minutos', labelSeconds: 'segundos' } },
  { type: 'contact-form', label: 'Formulário Contato', icon: FormInput as LucideIcon, category: 'interactive', description: 'Formulário de contato', defaultConfig: { title: 'Entre em contato', fields: ['name', 'email', 'message'], submitText: 'Enviar', successMessage: 'Mensagem enviada!' } },
  { type: 'popover', label: 'Popover / Tooltip', icon: MessageCircle as LucideIcon, category: 'interactive', description: 'Popover, tooltip ou aba flutuante', defaultConfig: { trigger: 'hover', position: 'top', title: '', content: 'Conteúdo do popover', triggerText: 'Saiba mais' } },

  // ── Special ──
  { type: 'search', label: 'Busca', icon: Search as LucideIcon, category: 'special', description: 'Barra de busca', defaultConfig: { placeholder: 'Pesquisar...', variant: 'default' } },
  { type: 'tabs', label: 'Abas', icon: Table2 as LucideIcon, category: 'special', description: 'Conteúdo em abas', defaultConfig: { layout: 'top', tabs: [{ label: 'Aba 1', content: 'Conteúdo da aba 1' }] } },
  { type: 'template-part', label: 'Template Reutilizável', icon: Puzzle as LucideIcon, category: 'special', description: 'Bloco de template salvo', defaultConfig: { templateId: '' } },

  // ── Footer ──
  { type: 'footer-credits', label: 'Créditos', icon: Copyright as LucideIcon, category: 'footer', description: 'Copyright com ano automático', defaultConfig: { brandName: 'PixelFandom', year: 'auto', showHeart: true, showRights: true, align: 'center', size: 'md' } },
  { type: 'newsletter', label: 'Newsletter', icon: Mail as LucideIcon, category: 'footer', description: 'Formulário de email', defaultConfig: { title: 'Newsletter', subtitle: 'Receba novidades', placeholder: 'seu@email.com', buttonText: 'Assinar', successMessage: 'Inscrito com sucesso!', variant: 'default', align: 'center' } },
  { type: 'app-badges', label: 'App Badges', icon: Smartphone as LucideIcon, category: 'footer', description: 'Apple Store + Google Play', defaultConfig: { showApple: true, showGoogle: true, appleUrl: '', googleUrl: '', variant: 'black', align: 'center' } },
  { type: 'back-to-top', label: 'Voltar ao Topo', icon: ArrowUpToLine as LucideIcon, category: 'footer', description: 'Botão scroll-to-top', defaultConfig: { variant: 'chevron', label: 'Voltar ao topo', position: 'center', showAfterScroll: true, scrollThreshold: 300 } },
  { type: 'payment-icons', label: 'Pagamentos', icon: CreditCard as LucideIcon, category: 'footer', description: 'Ícones de pagamento', defaultConfig: { icons: ['visa', 'mastercard', 'paypal', 'pix'], size: 'md', variant: 'grayscale', align: 'center' } },
  { type: 'footer-brand', label: 'Marca', icon: Star as LucideIcon, category: 'footer', description: 'Logo + descrição + redes', defaultConfig: { logo: '', tagline: 'PixelFandom', description: 'Sua wiki de games', showSocialLinks: true, socialLinks: [{ platform: 'Discord', url: '' }], align: 'center' } },
  { type: 'language-switcher', label: 'Idiomas', icon: Globe as LucideIcon, category: 'footer', description: 'Seletor de idioma', defaultConfig: { languages: [{ code: 'pt-BR', label: 'Português' }, { code: 'en', label: 'English' }], defaultLanguage: 'pt-BR', variant: 'dropdown', showLabel: true } },
  { type: 'footer-menu', label: 'Menu Footer', icon: Menu as LucideIcon, category: 'footer', description: 'Colunas de links', defaultConfig: { title: 'Links', columns: [{ title: 'Produto', links: [{ label: 'Features', url: '#' }] }, { title: 'Empresa', links: [{ label: 'Sobre', url: '#' }] }], layout: 'columns' } },

  // ── Error / 404 ──
  { type: 'error-display', label: 'Exibição 404', icon: TriangleAlert as LucideIcon, category: 'error', description: 'Número 404 estilizado com título e animação', defaultConfig: { number: '404', size: 'xl', title: 'Página não encontrada', subtitle: 'O conteúdo que você procura não existe ou foi movido.', glitchEnabled: true, showDecoration: true } },
  { type: 'error-search', label: 'Busca 404', icon: SearchX as LucideIcon, category: 'error', description: 'Barra de busca para encontrar conteúdo perdido', defaultConfig: { placeholder: 'Buscar na wiki...', variant: 'default', showSuggestions: true, autoFocus: false } },
  { type: 'error-suggestions', label: 'Sugestões', icon: Shuffle as LucideIcon, category: 'error', description: 'Artigos sugeridos para o visitante', defaultConfig: { title: 'Você pode estar procurando:', maxItems: 4, mode: 'manual', items: [{ title: 'Artigo 1', slug: '' }, { title: 'Artigo 2', slug: '' }] } },
  { type: 'error-actions', label: 'Ações 404', icon: ArrowUpRight as LucideIcon, category: 'error', description: 'Botões de ação rápida (voltar, home, contato)', defaultConfig: { buttons: [{ label: 'Voltar ao Início', url: '/', variant: 'primary' }, { label: 'Relatar Erro', url: '', variant: 'outline' }], layout: 'row', size: 'md' } },
  { type: 'error-fun', label: 'Diversão 404', icon: Gamepad2 as LucideIcon, category: 'error', description: 'Mini-game ou easter egg interativo', defaultConfig: { type: 'game', gameType: 'clicker', redirectUrl: '/', redirectSeconds: 10, triviaQuestion: 'Quantos bits tem um byte?', triviaOptions: ['4', '8', '16', '32'], triviaAnswer: '8' } },
  { type: 'error-image', label: 'Ilustração 404', icon: ImageOff as LucideIcon, category: 'error', description: 'Imagem decorativa de erro', defaultConfig: { src: '', alt: 'Ilustração 404', overlay: false, overlayText: '', animation: 'float-error', rounded: 'md' } },
  { type: 'error-map', label: 'Mapa do Site', icon: Route as LucideIcon, category: 'error', description: 'Estrutura do site para navegação', defaultConfig: { title: 'Mapa do Site', showSections: true, maxDepth: 2, layout: 'list' } },
  { type: 'error-quote', label: 'Citação', icon: Quote as LucideIcon, category: 'error', description: 'Citação inspiradora ou engraçada', defaultConfig: { quotes: [{ text: 'Nem todos que vagam estão perdidos.', author: 'J.R.R. Tolkien' }], rotation: 'random', showAuthor: true, style: 'card' } },
  { type: 'error-feedback', label: 'Feedback', icon: BugOff as LucideIcon, category: 'error', description: 'Formulário para reportar link quebrado', defaultConfig: { title: 'Reportar Problema', subtitle: 'Ajude-nos a melhorar!', placeholder: 'Descreva o que você estava procurando...', submitText: 'Enviar', successMessage: 'Obrigado! Seu feedback nos ajuda a melhorar.', showEmail: false, emailPlaceholder: 'Seu email (opcional)' } },
  { type: 'error-countdown', label: 'Redirecionamento', icon: TimerOff as LucideIcon, category: 'error', description: 'Redirecionamento automático com contagem regressiva', defaultConfig: { redirectUrl: '/', seconds: 10, message: 'Redirecionando para o início em:', showProgress: true, showSeconds: true, variant: 'default' } },
  { type: 'error-particle', label: 'Partículas', icon: Sparkles as LucideIcon, category: 'error', description: 'Fundo animado com partículas', defaultConfig: { count: 50, color: '#4BC5FF', speed: 'normal', type: 'stars', opacity: 0.6 } },
  { type: 'error-maze', label: 'Labirinto', icon: Rabbit as LucideIcon, category: 'error', description: 'Mini labirinto para se distrair', defaultConfig: { difficulty: 'easy', showTimer: true, reward: 'Desbloquear surpresa', rewardUrl: '', size: 8 } },
  { type: 'error-poll', label: 'Enquete', icon: Vote as LucideIcon, category: 'error', description: 'Enquete de distração', defaultConfig: { question: 'O que você estava procurando?', options: [{ label: 'Um artigo específico', votes: 0 }, { label: 'Só navegando', votes: 0 }, { label: 'Cai aqui por acidente', votes: 0 }], showResults: true, allowMultiple: false } },
  { type: 'error-fact', label: 'Fato Curioso', icon: Lightbulb as LucideIcon, category: 'error', description: 'Fato aleatório sobre a wiki', defaultConfig: { facts: [{ text: 'Esta wiki foi criada por fãs para fãs.', source: 'PixelFandom' }], rotation: 'random', showSource: true, style: 'card' } },
  { type: 'error-social', label: 'Social 404', icon: HeartHandshake as LucideIcon, category: 'error', description: 'Links de engajamento social', defaultConfig: { title: 'Não vá ainda!', message: 'Siga-nos nas redes sociais enquanto isso:', showShare: true, showFollow: true, layout: 'row' } },
  { type: 'error-character', label: 'Mascote', icon: Bot as LucideIcon, category: 'error', description: 'Mascote animado com balão de fala', defaultConfig: { character: 'sad-robot', mood: 'sad', animation: 'float-error', speech: 'Oops! Parece que você se perdeu...', size: 'md', showBubble: true } },
];

export const ERROR_BLOCK_TYPES: BlockType[] = [
  'section', 'column',
  'heading', 'paragraph', 'button', 'divider', 'spacer', 'list',
  'image', 'icon',
  'statistics', 'faq',
  'countdown', 'discord-embed', 'social-links',
  'search', 'back-to-top', 'hero',
  'error-display', 'error-search', 'error-suggestions', 'error-actions',
  'error-fun', 'error-image', 'error-map', 'error-quote',
  'error-feedback', 'error-countdown', 'error-particle', 'error-maze',
  'error-poll', 'error-fact', 'error-social', 'error-character',
];

export const FOOTER_BLOCK_TYPES: BlockType[] = [
  'section',
  'column',
  'heading', 'paragraph', 'rich-text', 'button', 'divider', 'spacer', 'list',
  'image', 'icon',
  'featured-list', 'latest-articles',
  'social-links', 'discord-embed',
  'search',
  'footer-credits', 'newsletter', 'app-badges', 'back-to-top',
  'payment-icons', 'footer-brand', 'language-switcher', 'footer-menu',
];

export const CATEGORIES: { id: BlockCategory; label: string; icon: LucideIcon }[] = [
  { id: 'layout', label: 'Layout', icon: LayoutTemplate as LucideIcon },
  { id: 'content', label: 'Conteúdo', icon: Text as LucideIcon },
  { id: 'media', label: 'Mídia', icon: ImageIcon as LucideIcon },
  { id: 'dynamic', label: 'Dinâmico', icon: FileText as LucideIcon },
  { id: 'data', label: 'Dados', icon: BarChart3 as LucideIcon },
  { id: 'interactive', label: 'Interativo', icon: MousePointerClick as LucideIcon },
  { id: 'special', label: 'Especiais', icon: Puzzle as LucideIcon },
  { id: 'footer', label: 'Footer', icon: Copyright as LucideIcon },
  { id: 'error', label: 'Erro 404', icon: TriangleAlert as LucideIcon },
];

export function getBlockDefinition(type: BlockType): BlockDefinition | undefined {
  return BLOCK_REGISTRY.find((b) => b.type === type);
}

export function getBlocksByCategory(category: BlockCategory): BlockDefinition[] {
  return BLOCK_REGISTRY.filter((b) => b.category === category);
}
