import { z } from 'zod';

// ── Shared primitives ──

export const SpacingOptionSchema = z.enum(['none', 'sm', 'md', 'lg', 'xl']);
export const TextAlignSchema = z.enum(['left', 'center', 'right']);
export const BorderStyleSchema = z.enum(['none', 'solid', 'bottom']);
export const ShadowSizeSchema = z.enum(['none', 'sm', 'md', 'lg']);
export const UrlSchema = z.string().max(2000).default('');
export const ColorSchema = z.string().max(100).default('');

// ── Layout ──

export const SectionConfigSchema = z.object({
  columns: z.number().int().min(1).max(6).default(1),
  gap: SpacingOptionSchema.default('md'),
  equalHeight: z.boolean().default(false),
  verticalAlign: z.enum(['top', 'center', 'bottom']).default('top'),
  backgroundColor: ColorSchema.optional(),
  backgroundImage: z.string().max(2000).optional(),
  padding: SpacingOptionSchema.optional(),
});

export const ColumnConfigSchema = z.object({
  width: z.string().max(100).default('1fr'),
  verticalAlign: z.enum(['top', 'center', 'bottom']).default('top'),
});

// ── Content ──

export const HeroConfigSchema = z.object({
  layout: z.enum(['center', 'left', 'split', 'full-image']).default('center'),
  title: z.string().max(500).default(''),
  subtitle: z.string().max(1000).default(''),
  ctaText: z.string().max(100).default(''),
  ctaUrl: UrlSchema.default(''),
  ctaVariant: z.enum(['primary', 'outline', 'ghost']).default('primary'),
  imageUrl: UrlSchema.default(''),
  backgroundColor: ColorSchema.optional(),
  overlay: z.boolean().default(false),
});

export const HeadingConfigSchema = z.object({
  content: z.string().max(1000).default(''),
  level: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).default('h2'),
  color: ColorSchema.optional(),
  align: TextAlignSchema.default('left'),
});

export const ParagraphConfigSchema = z.object({
  content: z.string().max(10000).default(''),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  color: ColorSchema.optional(),
});

export const RichTextConfigSchema = z.object({
  title: z.string().max(200).optional(),
  html: z.string().max(50000).default(''),
});

export const ButtonConfigSchema = z.object({
  text: z.string().max(100).default(''),
  url: UrlSchema.default(''),
  variant: z.enum(['primary', 'outline', 'ghost', 'secondary']).default('primary'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  fullWidth: z.boolean().default(false),
});

export const DividerConfigSchema = z.object({
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  color: ColorSchema.optional(),
  thickness: z.enum(['sm', 'md', 'lg']).default('sm'),
});

export const SpacerConfigSchema = z.object({
  height: z.enum(['sm', 'md', 'lg', 'xl', '2xl']).default('md'),
});

export const ListConfigSchema = z.object({
  items: z.array(z.string().max(500)).max(100).default([]),
  ordered: z.boolean().default(false),
  style: z.enum(['disc', 'circle', 'square', 'decimal', 'roman']).default('disc'),
});

// ── Media ──

export const ImageConfigSchema = z.object({
  src: UrlSchema.default(''),
  alt: z.string().max(500).default(''),
  caption: z.string().max(500).optional(),
  link: UrlSchema.optional(),
  rounded: z.enum(['none', 'sm', 'md', 'full']).default('none'),
  shadow: ShadowSizeSchema.default('none'),
});

export const ImageGalleryItemSchema = z.object({
  src: UrlSchema,
  alt: z.string().max(500).optional(),
});

export const ImageGalleryConfigSchema = z.object({
  title: z.string().max(200).optional(),
  images: z.array(ImageGalleryItemSchema).max(100).default([]),
  columns: z.number().int().min(1).max(6).default(3),
  aspectRatio: z.enum(['square', 'video', 'wide', 'portrait']).default('square'),
});

export const VideoEmbedConfigSchema = z.object({
  title: z.string().max(200).optional(),
  url: UrlSchema.default(''),
  provider: z.enum(['youtube', 'vimeo', 'twitch']).default('youtube'),
  aspectRatio: z.enum(['16:9', '4:3', '1:1']).default('16:9'),
});

export const CoverConfigSchema = z.object({
  title: z.string().max(500).default(''),
  subtitle: z.string().max(1000).default(''),
  backgroundImage: UrlSchema.default(''),
  overlay: z.boolean().default(true),
  overlayColor: ColorSchema.optional(),
  height: z.enum(['sm', 'md', 'lg', 'full']).default('md'),
  textAlign: TextAlignSchema.default('center'),
});

export const MediaTextConfigSchema = z.object({
  title: z.string().max(500).default(''),
  content: z.string().max(5000).default(''),
  imageSrc: UrlSchema.default(''),
  imagePosition: z.enum(['left', 'right']).default('left'),
  imageRatio: z.enum(['50', '40', '60']).default('50'),
  ctaText: z.string().max(100).optional(),
  ctaUrl: UrlSchema.optional(),
});

export const IconConfigSchema = z.object({
  icon: z.union([z.string(), z.object({ icon: z.string(), animation: z.string().optional() })]).optional(),
  size: z.enum(['sm', 'md', 'lg', 'xl']).default('md'),
  color: ColorSchema.default('hsl(var(--primary))'),
  backgroundColor: ColorSchema.optional(),
  rounded: z.enum(['none', 'sm', 'md', 'full']).default('md'),
});

// ── Dynamic ──

export const ArticleGridArticleSchema = z.object({
  title: z.string().max(500),
  slug: z.string().max(200),
  summary: z.string().max(1000).optional(),
  date: z.string().max(50).optional(),
  imageUrl: UrlSchema.optional(),
});

export const ArticleGridConfigSchema = z.object({
  title: z.string().max(200).optional(),
  columns: z.number().int().min(1).max(6).default(3),
  articles: z.array(ArticleGridArticleSchema).max(100).default([]),
  tag: z.string().max(200).optional(),
  mode: z.enum(['manual', 'tag']).default('manual'),
  showImages: z.boolean().default(true),
  showSummaries: z.boolean().default(true),
});

export const ArticleCarouselArticleSchema = z.object({
  title: z.string().max(500),
  slug: z.string().max(200),
  summary: z.string().max(1000).optional(),
  imageUrl: UrlSchema.optional(),
});

export const ArticleDisplayFormatSchema = z.enum(['grid', 'list', 'carousel', 'carousel_infinite']);
export const ArticleTabsSubFormatSchema = z.enum(['list', 'carousel', 'grid']);

export const ArticleCarouselConfigSchema = z.object({
  title: z.string().max(200).optional(),
  tag: z.string().max(200).optional(),
  articles: z.array(ArticleCarouselArticleSchema).max(100).default([]),
  autoplay: z.boolean().default(true),
  interval: z.number().int().min(1000).max(30000).default(5000),
  displayFormat: ArticleDisplayFormatSchema.default('carousel'),
  columns: z.number().int().min(1).max(6).default(3),
  tabsEnabled: z.boolean().default(false),
  tabsSubFormat: ArticleTabsSubFormatSchema.default('list'),
});

export const NewsFeedItemSchema = z.object({
  title: z.string().max(500),
  date: z.string().max(50).optional(),
  excerpt: z.string().max(1000).optional(),
  link: UrlSchema.optional(),
  imageUrl: UrlSchema.optional(),
});

export const NewsFeedConfigSchema = z.object({
  title: z.string().max(200).optional(),
  items: z.array(NewsFeedItemSchema).max(100).default([]),
  mode: z.enum(['manual', 'tag']).default('manual'),
  tag: z.string().max(200).optional(),
  maxItems: z.number().int().min(1).max(100).default(10),
});

export const FeaturedListItemSchema = z.object({
  label: z.string().max(500),
  description: z.string().max(1000).optional(),
  icon: z.union([z.string(), z.object({ icon: z.string(), animation: z.string().optional() })]).optional(),
  imageUrl: UrlSchema.optional(),
});

export const FeaturedListConfigSchema = z.object({
  title: z.string().max(200).optional(),
  layout: z.enum(['list', 'grid', 'cards']).default('list'),
  items: z.array(FeaturedListItemSchema).max(100).default([]),
});

export const CategoryListConfigSchema = z.object({
  title: z.string().max(200).optional(),
  showCount: z.boolean().default(true),
  layout: z.enum(['list', 'grid', 'cloud']).default('list'),
});

export const LatestArticlesConfigSchema = z.object({
  title: z.string().max(200).optional(),
  count: z.number().int().min(1).max(50).default(6),
  columns: z.number().int().min(1).max(6).default(3),
  showImages: z.boolean().default(true),
  showSummaries: z.boolean().default(true),
  tag: z.string().max(200).optional(),
});

export const GameDataCardsConfigSchema = z.object({
  title: z.string().max(200).optional(),
  displayFormat: z.enum(['grid', 'list', 'carousel', 'carousel_infinite']).optional(),
  columnsCount: z.number().int().min(2).max(5).optional(),
  tabsEnabled: z.boolean().optional(),
  tabsSubFormat: z.enum(['list', 'carousel', 'grid']).optional(),
});

export const GameTableItemsConfigSchema = z.object({
  title: z.string().max(200).optional(),
  table: z.string().max(200).optional(),
  displayFormat: z.enum(['grid', 'cards', 'list', 'table']).optional(),
  columnsCount: z.number().int().min(1).max(5).optional(),
  itemsPerPage: z.number().int().min(4).max(100).optional(),
  showSearch: z.boolean().optional(),
  showFilters: z.boolean().optional(),
  showHeader: z.boolean().optional(),
});

export const ArticleSortBySchema = z.enum(['recent', 'most_voted', 'most_commented', 'popular']);
export const ArticleFeedLayoutSchema = z.enum(['grid', 'list', 'carousel', 'carousel_infinite']);

export const ArticleFeedConfigSchema = z.object({
  title: z.string().max(200).optional(),
  sortBy: ArticleSortBySchema.default('recent'),
  tag: z.string().max(200).optional(),
  layout: ArticleFeedLayoutSchema.default('grid'),
  columns: z.number().int().min(1).max(6).default(3),
  count: z.number().int().min(1).max(50).default(6),
  showImages: z.boolean().default(true),
  showSummaries: z.boolean().default(true),
});

// ── Data ──

export const RankingTableConfigSchema = z.object({
  title: z.string().max(200).optional(),
  headers: z.array(z.string().max(200)).max(20).default([]),
  rows: z.array(z.array(z.string().max(500)).max(20)).max(500).default([]),
  variant: z.enum(['default', 'striped', 'bordered', 'minimal']).default('default'),
});

export const PricingPlanSchema = z.object({
  name: z.string().max(200),
  price: z.string().max(50),
  currency: z.string().max(10).optional(),
  period: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
  features: z.array(z.string().max(500)).max(50).optional(),
  ctaText: z.string().max(100).optional(),
  ctaUrl: UrlSchema.optional(),
  highlighted: z.boolean().default(false),
  highlightColor: ColorSchema.optional(),
});

export const PricingTableConfigSchema = z.object({
  title: z.string().max(200).optional(),
  plans: z.array(PricingPlanSchema).max(10).default([]),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
});

export const StatisticItemSchema = z.object({
  label: z.string().max(200),
  value: z.string().max(100),
  prefix: z.string().max(20).optional(),
  suffix: z.string().max(20).optional(),
  icon: z.union([z.string(), z.object({ icon: z.string(), animation: z.string().optional() })]).optional(),
});

export const StatisticsConfigSchema = z.object({
  items: z.array(StatisticItemSchema).max(20).default([]),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  animate: z.boolean().default(true),
});

export const ProgressBarItemSchema = z.object({
  label: z.string().max(200),
  value: z.number().min(0).max(100),
  color: ColorSchema.optional(),
});

export const ProgressBarConfigSchema = z.object({
  items: z.array(ProgressBarItemSchema).max(20).default([]),
});

export const TimelineItemSchema = z.object({
  title: z.string().max(500),
  date: z.string().max(100).optional(),
  content: z.string().max(5000).optional(),
  icon: z.union([z.string(), z.object({ icon: z.string(), animation: z.string().optional() })]).optional(),
});

export const TimelineConfigSchema = z.object({
  items: z.array(TimelineItemSchema).max(50).default([]),
});

export const FaqItemSchema = z.object({
  question: z.string().max(500),
  answer: z.string().max(10000),
});

export const FaqConfigSchema = z.object({
  title: z.string().max(200).optional(),
  items: z.array(FaqItemSchema).max(100).default([]),
  layout: z.enum(['accordion', 'list']).default('accordion'),
});

// ── Interactive ──

export const DiscordEmbedConfigSchema = z.object({
  discordUrl: UrlSchema.default(''),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  variant: z.enum(['default', 'compact', 'minimal']).default('default'),
});

export const SocialLinkSchema = z.object({
  platform: z.string().max(100),
  url: UrlSchema,
});

export const SocialLinksConfigSchema = z.object({
  title: z.string().max(200).optional(),
  links: z.array(SocialLinkSchema).max(20).default([]),
  layout: z.enum(['row', 'column', 'grid']).default('row'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
});

export const CountdownConfigSchema = z.object({
  title: z.string().max(200).optional(),
  targetDate: z.string().max(50).default(''),
  targetTime: z.string().max(50).default(''),
  showDays: z.boolean().default(true),
  showHours: z.boolean().default(true),
  showMinutes: z.boolean().default(true),
  showSeconds: z.boolean().default(true),
  labelDays: z.string().max(20).optional(),
  labelHours: z.string().max(20).optional(),
  labelMinutes: z.string().max(20).optional(),
  labelSeconds: z.string().max(20).optional(),
});

export const ContactFormConfigSchema = z.object({
  title: z.string().max(200).default(''),
  subtitle: z.string().max(500).default(''),
  fields: z.array(z.string().max(500)).max(20).default([]),
  submitText: z.string().max(100).default('Enviar'),
  successMessage: z.string().max(500).default(''),
  notificationEmail: z.string().email().max(500).optional(),
});

export const PopoverConfigSchema = z.object({
  trigger: z.enum(['hover', 'click']).default('hover'),
  position: z.enum(['top', 'bottom', 'left', 'right']).default('top'),
  title: z.string().max(200).default(''),
  content: z.string().max(2000).default('Conteúdo do popover'),
  triggerText: z.string().max(100).default('Saiba mais'),
});

// ── Special ──

export const SearchConfigSchema = z.object({
  placeholder: z.string().max(100).default('Buscar...'),
  variant: z.enum(['default', 'minimal', 'full-width']).default('default'),
});

export const TabItemSchema = z.object({
  label: z.string().max(200),
  content: z.string().max(50000).optional(),
});

export const TabsConfigSchema = z.object({
  tabs: z.array(TabItemSchema).max(20).default([]),
  layout: z.enum(['top', 'left']).default('top'),
});

export const TemplatePartConfigSchema = z.object({
  templateId: z.string().max(200).optional(),
});

// ── Footer ──

export const FooterCreditsConfigSchema = z.object({
  brandName: z.string().max(200).default(''),
  year: z.union([z.literal('auto'), z.number().int()]).default('auto'),
  showHeart: z.boolean().default(true),
  showRights: z.boolean().default(true),
  align: TextAlignSchema.default('center'),
  size: z.enum(['sm', 'md']).default('sm'),
});

export const NewsletterConfigSchema = z.object({
  title: z.string().max(200).default(''),
  subtitle: z.string().max(500).default(''),
  placeholder: z.string().max(100).default('Seu email'),
  buttonText: z.string().max(100).default('Inscrever'),
  successMessage: z.string().max(500).default('Inscrito com sucesso!'),
  variant: z.enum(['default', 'outline', 'ghost']).default('default'),
  align: TextAlignSchema.default('center'),
});

export const AppBadgesConfigSchema = z.object({
  showApple: z.boolean().default(true),
  showGoogle: z.boolean().default(true),
  appleUrl: UrlSchema.default(''),
  googleUrl: UrlSchema.default(''),
  variant: z.enum(['black', 'white', 'color']).default('black'),
  align: TextAlignSchema.default('center'),
});

export const BackToTopConfigSchema = z.object({
  variant: z.enum(['arrow', 'chevron', 'text']).default('arrow'),
  label: z.string().max(100).default('Voltar ao topo'),
  position: z.enum(['right', 'center']).default('right'),
  showAfterScroll: z.boolean().default(true),
  scrollThreshold: z.number().int().min(0).max(5000).default(300),
});

export const PaymentIconsConfigSchema = z.object({
  icons: z.array(z.string().max(100)).max(20).default([]),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  variant: z.enum(['color', 'grayscale']).default('color'),
  align: TextAlignSchema.default('center'),
});

export const FooterBrandSocialLinkSchema = z.object({
  platform: z.string().max(100),
  url: UrlSchema,
});

export const FooterBrandConfigSchema = z.object({
  logo: UrlSchema.optional(),
  tagline: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  showSocialLinks: z.boolean().default(false),
  socialLinks: z.array(FooterBrandSocialLinkSchema).max(20).default([]),
  align: TextAlignSchema.default('center'),
});

export const LanguageSwitcherLanguageSchema = z.object({
  code: z.string().max(20),
  label: z.string().max(100),
});

export const LanguageSwitcherConfigSchema = z.object({
  languages: z.array(LanguageSwitcherLanguageSchema).max(50).default([]),
  defaultLanguage: z.string().max(20).optional(),
  variant: z.enum(['dropdown', 'flags']).default('dropdown'),
  showLabel: z.boolean().default(true),
});

export const FooterMenuLinkSchema = z.object({
  label: z.string().max(200),
  url: UrlSchema,
});

export const FooterMenuColumnSchema = z.object({
  title: z.string().max(200),
  links: z.array(FooterMenuLinkSchema).max(20).default([]),
});

export const FooterMenuConfigSchema = z.object({
  title: z.string().max(200).optional(),
  columns: z.array(FooterMenuColumnSchema).max(6).default([]),
  layout: z.enum(['columns', 'inline']).default('columns'),
});

// ── Error / 404 ──

export const ErrorDisplayConfigSchema = z.object({
  number: z.string().max(20).default('404'),
  size: z.enum(['sm', 'md', 'lg', 'xl']).default('xl'),
  font: z.enum(['default', 'mono', 'display', 'outline']).default('default'),
  title: z.string().max(500).default(''),
  subtitle: z.string().max(1000).default(''),
  glitchEnabled: z.boolean().default(false),
  showDecoration: z.boolean().default(true),
  backgroundColor: ColorSchema.optional(),
});

export const ErrorSearchConfigSchema = z.object({
  placeholder: z.string().max(100).default('Buscar na wiki...'),
  variant: z.enum(['default', 'minimal', 'full-width']).default('default'),
  showSuggestions: z.boolean().default(false),
  autoFocus: z.boolean().default(false),
});

export const ErrorSuggestionItemSchema = z.object({
  title: z.string().max(500),
  slug: z.string().max(200),
});

export const ErrorSuggestionsConfigSchema = z.object({
  title: z.string().max(200).default('Você pode estar procurando:'),
  maxItems: z.number().int().min(1).max(20).default(4),
  mode: z.enum(['manual', 'auto']).default('manual'),
  items: z.array(ErrorSuggestionItemSchema).max(20).default([]),
});

export const ErrorActionButtonSchema = z.object({
  label: z.string().max(100),
  url: UrlSchema,
  variant: z.enum(['primary', 'outline', 'ghost', 'secondary']).default('primary'),
  icon: z.string().max(100).optional(),
});

export const ErrorActionsConfigSchema = z.object({
  buttons: z.array(ErrorActionButtonSchema).max(6).default([]),
  layout: z.enum(['row', 'column', 'grid']).default('row'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
});

export const ErrorFunConfigSchema = z.object({
  gameType: z.enum(['clicker', 'trivia']).default('clicker'),
  redirectUrl: UrlSchema.default(''),
  triviaQuestion: z.string().max(500).default(''),
  triviaOptions: z.array(z.string().max(200)).max(6).default([]),
  triviaAnswer: z.string().max(200).default(''),
});

export const ErrorImageConfigSchema = z.object({
  src: UrlSchema.default(''),
  alt: z.string().max(500).default(''),
  overlay: z.boolean().default(false),
  overlayText: z.string().max(500).default(''),
  rounded: z.enum(['none', 'sm', 'md', 'full']).default('md'),
  maxWidth: z.string().max(50).optional(),
});

export const ErrorMapConfigSchema = z.object({
  title: z.string().max(200).default('Mapa do Site'),
  showSections: z.boolean().default(true),
  maxDepth: z.number().int().min(1).max(5).optional(),
  layout: z.enum(['list', 'grid']).default('list'),
});

export const ErrorQuoteItemSchema = z.object({
  text: z.string().max(2000),
  author: z.string().max(200).optional(),
});

export const ErrorQuoteConfigSchema = z.object({
  quotes: z.array(ErrorQuoteItemSchema).max(100).default([]),
  rotation: z.enum(['random', 'sequential']).default('random'),
  showAuthor: z.boolean().default(true),
  style: z.enum(['default', 'card', 'minimal']).default('default'),
});

export const ErrorFeedbackConfigSchema = z.object({
  title: z.string().max(200).default('Reportar Problema'),
  subtitle: z.string().max(500).default(''),
  placeholder: z.string().max(200).default(''),
  submitText: z.string().max(100).default('Enviar'),
  successMessage: z.string().max(500).default(''),
  showEmail: z.boolean().default(false),
  emailPlaceholder: z.string().max(200).optional(),
});

export const ErrorCountdownConfigSchema = z.object({
  redirectUrl: UrlSchema.default('/'),
  seconds: z.number().int().min(1).max(3600).default(10),
  message: z.string().max(500).default(''),
  showProgress: z.boolean().default(false),
  showSeconds: z.boolean().default(true),
  variant: z.enum(['default', 'minimal']).default('default'),
});

export const ErrorParticleConfigSchema = z.object({
  count: z.number().int().min(1).max(500).default(50),
  color: ColorSchema.default('#4BC5FF'),
  speed: z.enum(['slow', 'normal', 'fast']).default('normal'),
  type: z.enum(['stars', 'snow', 'firefly', 'bubbles']).default('stars'),
  opacity: z.number().min(0).max(1).default(0.6),
});

export const ErrorMazeConfigSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  showTimer: z.boolean().default(false),
  reward: z.string().max(200).optional(),
  rewardUrl: UrlSchema.optional(),
  size: z.number().int().min(4).max(20).default(8),
});

export const ErrorPollOptionSchema = z.object({
  label: z.string().max(500),
  votes: z.number().int().min(0).default(0),
});

export const ErrorPollConfigSchema = z.object({
  question: z.string().max(500).default(''),
  options: z.array(ErrorPollOptionSchema).max(10).default([]),
  showResults: z.boolean().default(false),
  allowMultiple: z.boolean().default(false),
});

export const ErrorFactItemSchema = z.object({
  text: z.string().max(2000),
  source: z.string().max(500).optional(),
});

export const ErrorFactConfigSchema = z.object({
  facts: z.array(ErrorFactItemSchema).max(100).default([]),
  rotation: z.enum(['random', 'sequential']).default('random'),
  showSource: z.boolean().default(true),
  style: z.enum(['default', 'card', 'minimal']).default('default'),
});

export const ErrorSocialConfigSchema = z.object({
  title: z.string().max(200).default('Não vá ainda!'),
  message: z.string().max(500).default(''),
  showShare: z.boolean().default(true),
  shareUrl: UrlSchema.optional(),
  showFollow: z.boolean().default(true),
  layout: z.enum(['row', 'column']).default('row'),
});

export const ErrorCharacterConfigSchema = z.object({
  character: z.enum(['sad-robot', 'ghost', 'alien', 'cat', 'dog', 'owl']).default('sad-robot'),
  mood: z.enum(['sad', 'happy', 'confused', 'wink']).default('sad'),
  speech: z.string().max(500).default(''),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  showBubble: z.boolean().default(true),
});

// ── Block Config Map ──

export const BlockConfigSchemas = {
  'section': SectionConfigSchema,
  'column': ColumnConfigSchema,
  'hero': HeroConfigSchema,
  'heading': HeadingConfigSchema,
  'paragraph': ParagraphConfigSchema,
  'rich-text': RichTextConfigSchema,
  'button': ButtonConfigSchema,
  'divider': DividerConfigSchema,
  'spacer': SpacerConfigSchema,
  'list': ListConfigSchema,
  'image': ImageConfigSchema,
  'image-gallery': ImageGalleryConfigSchema,
  'video-embed': VideoEmbedConfigSchema,
  'cover': CoverConfigSchema,
  'media-text': MediaTextConfigSchema,
  'icon': IconConfigSchema,
  'article-grid': ArticleGridConfigSchema,
  'article-carousel': ArticleCarouselConfigSchema,
  'news-feed': NewsFeedConfigSchema,
  'featured-list': FeaturedListConfigSchema,
  'category-list': CategoryListConfigSchema,
  'latest-articles': LatestArticlesConfigSchema,
  'game-data-cards': GameDataCardsConfigSchema,
  'game-table-items': GameTableItemsConfigSchema,
  'article-feed': ArticleFeedConfigSchema,
  'ranking-table': RankingTableConfigSchema,
  'pricing-table': PricingTableConfigSchema,
  'statistics': StatisticsConfigSchema,
  'progress-bar': ProgressBarConfigSchema,
  'timeline': TimelineConfigSchema,
  'faq': FaqConfigSchema,
  'discord-embed': DiscordEmbedConfigSchema,
  'social-links': SocialLinksConfigSchema,
  'countdown': CountdownConfigSchema,
  'contact-form': ContactFormConfigSchema,
  'popover': PopoverConfigSchema,
  'search': SearchConfigSchema,
  'tabs': TabsConfigSchema,
  'template-part': TemplatePartConfigSchema,
  'footer-credits': FooterCreditsConfigSchema,
  'newsletter': NewsletterConfigSchema,
  'app-badges': AppBadgesConfigSchema,
  'back-to-top': BackToTopConfigSchema,
  'payment-icons': PaymentIconsConfigSchema,
  'footer-brand': FooterBrandConfigSchema,
  'language-switcher': LanguageSwitcherConfigSchema,
  'footer-menu': FooterMenuConfigSchema,
  'error-display': ErrorDisplayConfigSchema,
  'error-search': ErrorSearchConfigSchema,
  'error-suggestions': ErrorSuggestionsConfigSchema,
  'error-actions': ErrorActionsConfigSchema,
  'error-fun': ErrorFunConfigSchema,
  'error-image': ErrorImageConfigSchema,
  'error-map': ErrorMapConfigSchema,
  'error-quote': ErrorQuoteConfigSchema,
  'error-feedback': ErrorFeedbackConfigSchema,
  'error-countdown': ErrorCountdownConfigSchema,
  'error-particle': ErrorParticleConfigSchema,
  'error-maze': ErrorMazeConfigSchema,
  'error-poll': ErrorPollConfigSchema,
  'error-fact': ErrorFactConfigSchema,
  'error-social': ErrorSocialConfigSchema,
  'error-character': ErrorCharacterConfigSchema,
} as const;

export type BlockSchemaKey = keyof typeof BlockConfigSchemas;

export function parseBlockConfig<T extends BlockSchemaKey>(type: T, data: unknown) {
  const schema = BlockConfigSchemas[type] as z.ZodTypeAny;
  return schema.parse(data) as z.infer<(typeof BlockConfigSchemas)[T]>;
}

export function safeParseBlockConfig<T extends BlockSchemaKey>(type: T, data: unknown) {
  const schema = BlockConfigSchemas[type] as z.ZodTypeAny;
  return schema.safeParse(data) as z.SafeParseReturnType<unknown, z.infer<(typeof BlockConfigSchemas)[T]>>;
}
