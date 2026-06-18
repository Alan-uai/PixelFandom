import type { LucideIcon } from 'lucide-react';

export type IconAnimation = 'none' | 'pulse' | 'spin' | 'bounce' | 'shake' | 'wiggle' | 'float' | 'glow';

export interface IconDef {
  icon: string;
  animation?: IconAnimation;
}

// ── Block Types ──

export type BlockType =
  // Layout
  | 'section'
  | 'column'
  // Content
  | 'hero'
  | 'heading'
  | 'paragraph'
  | 'rich-text'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'list'
  // Media
  | 'image'
  | 'image-gallery'
  | 'video-embed'
  | 'cover'
  | 'media-text'
  | 'icon'
  // Dynamic / Wiki
  | 'article-grid'
  | 'article-carousel'
  | 'news-feed'
  | 'featured-list'
  | 'category-list'
  | 'latest-articles'
  | 'game-data-cards'
  | 'game-table-items'
  | 'article-feed'
  // Data
  | 'ranking-table'
  | 'pricing-table'
  | 'statistics'
  | 'progress-bar'
  | 'timeline'
  | 'faq'
  // Interactive
  | 'discord-embed'
  | 'social-links'
  | 'countdown'
  | 'contact-form'
  // Special
  | 'search'
  | 'tabs'
  | 'template-part'
  // Footer
  | 'footer-credits'
  | 'newsletter'
  | 'app-badges'
  | 'back-to-top'
  | 'payment-icons'
  | 'footer-brand'
  | 'language-switcher'
  | 'footer-menu'
  // Error / 404
  | 'error-display'
  | 'error-search'
  | 'error-suggestions'
  | 'error-actions'
  | 'error-fun'
  | 'error-image'
  | 'error-map'
  | 'error-quote'
  | 'error-feedback'
  | 'error-countdown'
  | 'error-particle'
  | 'error-maze'
  | 'error-poll'
  | 'error-fact'
  | 'error-social'
  | 'error-character';

export type BlockCategory = 'layout' | 'content' | 'media' | 'dynamic' | 'data' | 'interactive' | 'special' | 'footer' | 'error';

// ── Block Style (predefined options only) ──

export type SpacingOption = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type BorderStyle = 'none' | 'solid' | 'bottom';
export type ShadowSize = 'none' | 'sm' | 'md' | 'lg';
export type TextAlign = 'left' | 'center' | 'right';
export type VisibilityMode = 'all' | 'desktop-only' | 'mobile-only';

// ── Animation System ──

export type AnimationType =
  | 'none'
  // Fade
  | 'fade-in'
  | 'fade-in-left'
  | 'fade-in-right'
  | 'fade-in-up'
  | 'fade-in-down'
  | 'fade-in-scale'
  // Slide
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  // Zoom
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-in-down'
  | 'zoom-in-up'
  | 'zoom-in-left'
  | 'zoom-in-right'
  // Bounce
  | 'bounce-in'
  | 'bounce-in-up'
  | 'bounce-in-down'
  | 'bounce-in-left'
  | 'bounce-in-right'
  // Flip / 3D
  | 'flip-x'
  | 'flip-y'
  | 'flip-x-in'
  | 'flip-y-in'
  | 'perspective-up'
  | 'perspective-down'
  | 'three-d-tilt'
  | 'card-flip'
  // Attention
  | 'pulse'
  | 'pulse-soft'
  | 'shake'
  | 'shake-x'
  | 'swing'
  | 'wobble'
  | 'jello'
  | 'glow'
  | 'float'
  | 'bounce-loop'
  | 'ping-soft'
  | 'heartbeat'
  // Motion (Framer)
  | 'spring-up'
  | 'spring-down'
  | 'spring-in'
  | 'reveal'
  | 'blur-in'
  | 'mask-in'
  // Emphasis
  | 'scale-up'
  | 'scale-down'
  | 'spotlight'
  | 'highlight'
  // Chain
  | 'chain-sequential'
  | 'chain-parallel'
  | 'chain-stagger'
  | 'chain-stagger-reverse'
  // Footer-specific
  | 'reveal-up'
  | 'drop-in'
  | 'expand-in'
  | 'border-pulse'
  | 'color-cycle'
  | 'slide-up-blur'
  | 'vibrate'
  | 'clip-in'
  // Error / 404 Distortion
  | 'glitch-1'
  | 'glitch-2'
  | 'glitch-text'
  | 'shake-hard'
  | 'flicker'
  | 'scanline'
  | 'vhs'
  | 'static-noise'
  | 'wobble'
  | 'skew'
  | 'crash'
  | 'drift'
  // Error / 404 Interactive
  | 'typewriter'
  | 'morph'
  | 'bounce-404'
  | 'zoom-pulse'
  // Error / 404 Special FX
  | 'matrix-rain'
  | 'retro-pixel'
  | 'rainbow'
  | 'ascii-reveal'
  | 'path-draw'
  | 'flip-3d-error'
  | 'tilt-error'
  | 'float-error'
  | 'pulse-error';

export type DurationOption = 'fast' | 'normal' | 'slow';
export type DelayOption = 'none' | 'short' | 'medium' | 'long';
export type EasingOption = 'ease' | 'ease-out' | 'ease-in' | 'ease-in-out' | 'bounce' | 'spring';
export type HoverEffect = 'none' | 'scale' | 'lift' | 'glow' | 'tilt' | 'rotate';
export type TapEffect = 'none' | 'scale' | 'ripple';
export type ChainMode = 'sequential' | 'parallel' | 'stagger';

export interface AnimationStep {
  type: AnimationType;
  duration?: DurationOption;
  delay?: DelayOption;
  easing?: EasingOption;
}

export interface AnimationConfig {
  type: AnimationType;
  duration?: DurationOption;
  delay?: DelayOption;
  easing?: EasingOption;
  iteration?: 'once' | 'infinite' | number;
  animateOnScroll?: boolean;
  // Gesture
  hoverEffect?: HoverEffect;
  tapEffect?: TapEffect;
  // 3D
  perspective?: boolean;
  tiltOnHover?: boolean;
  tiltMax?: number;
  // Chain
  steps?: AnimationStep[];
  chainMode?: ChainMode;
  staggerDelay?: number;
}

export interface BlockStyle {
  backgroundColor?: string;
  padding?: SpacingOption;
  margin?: SpacingOption;
  border?: BorderStyle;
  borderColor?: string;
  shadow?: ShadowSize;
  textAlign?: TextAlign;
  animation?: AnimationConfig;
  visibility?: VisibilityMode;
  width?: 'full' | 'contained' | 'auto';
}

// ── Block Configs ──

// Layout
export interface SectionConfig {
  columns: number;
  gap: SpacingOption;
  equalHeight: boolean;
  verticalAlign: 'top' | 'center' | 'bottom';
  backgroundColor?: string;
  backgroundImage?: string;
  padding?: SpacingOption;
}

export interface ColumnConfig {
  width: string;
  verticalAlign: 'top' | 'center' | 'bottom';
}

// Content
export interface HeroConfig {
  layout?: 'center' | 'left' | 'split' | 'full-image';
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  ctaVariant?: 'primary' | 'outline' | 'ghost';
  imageUrl?: string;
  backgroundColor?: string;
  overlay?: boolean;
}

export interface HeadingConfig {
  content?: string;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  color?: string;
  align?: TextAlign;
}

export interface ParagraphConfig {
  content?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export interface RichTextConfig {
  title?: string;
  html?: string;
}

export interface ButtonConfig {
  text?: string;
  url?: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export interface DividerConfig {
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  thickness?: 'sm' | 'md' | 'lg';
}

export interface SpacerConfig {
  height?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export interface ListConfig {
  items?: string[];
  ordered?: boolean;
  style?: 'disc' | 'circle' | 'square' | 'decimal' | 'roman';
}

// Media
export interface ImageConfig {
  src?: string;
  alt?: string;
  caption?: string;
  link?: string;
  rounded?: 'none' | 'sm' | 'md' | 'full';
  shadow?: ShadowSize;
}

export interface ImageGalleryConfig {
  title?: string;
  images?: Array<{ src: string; alt?: string }>;
  columns?: number;
  aspectRatio?: 'square' | 'video' | 'wide' | 'portrait';
}

export interface VideoEmbedConfig {
  title?: string;
  url?: string;
  provider?: 'youtube' | 'vimeo' | 'twitch';
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

export interface CoverConfig {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  overlay?: boolean;
  overlayColor?: string;
  height?: 'sm' | 'md' | 'lg' | 'full';
  textAlign?: TextAlign;
}

export interface MediaTextConfig {
  title?: string;
  content?: string;
  imageSrc?: string;
  imagePosition?: 'left' | 'right';
  imageRatio?: '50' | '40' | '60';
  ctaText?: string;
  ctaUrl?: string;
}

export interface IconConfig {
  icon?: string | IconDef;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  backgroundColor?: string;
  rounded?: 'none' | 'sm' | 'md' | 'full';
}

// Dynamic
export interface ArticleGridConfig {
  title?: string;
  columns?: number;
  articles?: Array<{ title: string; slug: string; summary?: string; date?: string; imageUrl?: string }>;
  tag?: string;
  mode?: 'manual' | 'tag';
  showImages?: boolean;
  showSummaries?: boolean;
}

export interface ArticleCarouselConfig {
  title?: string;
  tag?: string;
  articles?: Array<{ title: string; slug: string; summary?: string; imageUrl?: string }>;
  autoplay?: boolean;
  interval?: number;
}

export interface NewsFeedConfig {
  title?: string;
  items?: Array<{ title: string; date?: string; excerpt?: string; link?: string; imageUrl?: string }>;
  mode?: 'manual' | 'tag';
  tag?: string;
  maxItems?: number;
}

export interface FeaturedListConfig {
  title?: string;
  layout?: 'list' | 'grid' | 'cards';
  items?: Array<{ label: string; description?: string; icon?: string | IconDef; imageUrl?: string }>;
}

export interface CategoryListConfig {
  title?: string;
  showCount?: boolean;
  layout?: 'list' | 'grid' | 'cloud';
}

export interface LatestArticlesConfig {
  title?: string;
  count?: number;
  columns?: number;
  showImages?: boolean;
  showSummaries?: boolean;
  tag?: string;
}

export interface GameDataCardsConfig {
  title?: string;
  displayFormat?: 'grid' | 'list' | 'carousel' | 'carousel_infinite';
  columnsCount?: number;
  tabsEnabled?: boolean;
  tabsSubFormat?: 'list' | 'carousel' | 'grid';
}

export interface GameTableItemsConfig {
  title?: string;
  table?: string;
  displayFormat?: 'grid' | 'cards' | 'list' | 'table';
  columnsCount?: number;
  itemsPerPage?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  showHeader?: boolean;
}

export type ArticleSortBy = 'recent' | 'most_voted' | 'most_commented' | 'popular';
export type ArticleFeedLayout = 'grid' | 'list' | 'carousel';

export interface ArticleFeedConfig {
  title?: string;
  sortBy?: ArticleSortBy;
  tag?: string;
  layout?: ArticleFeedLayout;
  columns?: number;
  count?: number;
  showImages?: boolean;
  showSummaries?: boolean;
}

// Data
export interface RankingTableConfig {
  title?: string;
  headers?: string[];
  rows?: string[][];
  variant?: 'default' | 'striped' | 'bordered' | 'minimal';
}

export interface PricingTableConfig {
  title?: string;
  plans?: Array<{
    name: string;
    price: string;
    currency?: string;
    period?: string;
    description?: string;
    features?: string[];
    ctaText?: string;
    ctaUrl?: string;
    highlighted?: boolean;
    highlightColor?: string;
  }>;
  columns?: 2 | 3 | 4;
}

export interface StatisticsConfig {
  items?: Array<{
    label: string;
    value: string;
    prefix?: string;
    suffix?: string;
    icon?: string | IconDef;
  }>;
  columns?: 2 | 3 | 4;
  animate?: boolean;
}

export interface ProgressBarConfig {
  items?: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
}

export interface TimelineConfig {
  items?: Array<{
    title: string;
    date?: string;
    content?: string;
    icon?: string | IconDef;
  }>;
}

export interface FaqConfig {
  title?: string;
  items?: Array<{
    question: string;
    answer: string;
  }>;
  layout?: 'accordion' | 'list';
}

// Interactive
export interface DiscordEmbedConfig {
  discordUrl?: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'compact' | 'minimal';
}

export interface SocialLinksConfig {
  title?: string;
  links?: Array<{
    platform: string;
    url: string;
  }>;
  layout?: 'row' | 'column' | 'grid';
  size?: 'sm' | 'md' | 'lg';
}

export interface CountdownConfig {
  title?: string;
  targetDate?: string;
  targetTime?: string;
  showDays?: boolean;
  showHours?: boolean;
  showMinutes?: boolean;
  showSeconds?: boolean;
  labelDays?: string;
  labelHours?: string;
  labelMinutes?: string;
  labelSeconds?: string;
}

export interface ContactFormConfig {
  title?: string;
  subtitle?: string;
  fields?: string[];
  submitText?: string;
  successMessage?: string;
  notificationEmail?: string;
}

// Special
export interface SearchConfig {
  placeholder?: string;
  variant?: 'default' | 'minimal' | 'full-width';
}

export interface TabsConfig {
  tabs?: Array<{
    label: string;
    content?: string;
  }>;
  layout?: 'top' | 'left';
}

export interface TemplatePartConfig {
  templateId?: string;
}

// ── Footer ──

export interface FooterCreditsConfig {
  brandName?: string;
  year?: 'auto' | number;
  showHeart?: boolean;
  showRights?: boolean;
  align?: TextAlign;
  size?: 'sm' | 'md';
}

export interface NewsletterConfig {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  variant?: 'default' | 'outline' | 'ghost';
  align?: TextAlign;
}

export interface AppBadgesConfig {
  showApple?: boolean;
  showGoogle?: boolean;
  appleUrl?: string;
  googleUrl?: string;
  variant?: 'black' | 'white' | 'color';
  align?: TextAlign;
}

export interface BackToTopConfig {
  variant?: 'arrow' | 'chevron' | 'text';
  label?: string;
  position?: 'right' | 'center';
  showAfterScroll?: boolean;
  scrollThreshold?: number;
}

export interface PaymentIconsConfig {
  icons?: string[];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'color' | 'grayscale';
  align?: TextAlign;
}

export interface FooterBrandConfig {
  logo?: string;
  tagline?: string;
  description?: string;
  showSocialLinks?: boolean;
  socialLinks?: Array<{ platform: string; url: string }>;
  align?: TextAlign;
}

export interface LanguageSwitcherConfig {
  languages?: Array<{ code: string; label: string }>;
  defaultLanguage?: string;
  variant?: 'dropdown' | 'flags';
  showLabel?: boolean;
}

export interface FooterMenuConfig {
  title?: string;
  columns?: Array<{
    title: string;
    links?: Array<{ label: string; url: string }>;
  }>;
  layout?: 'columns' | 'inline';
}

// ── Error / 404 ──

export interface ErrorDisplayConfig {
  number?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  title?: string;
  subtitle?: string;
  glitchEnabled?: boolean;
  animation?: string;
  showDecoration?: boolean;
  backgroundColor?: string;
}

export interface ErrorSearchConfig {
  placeholder?: string;
  variant?: 'default' | 'minimal' | 'full-width';
  showSuggestions?: boolean;
  autoFocus?: boolean;
}

export interface ErrorSuggestionsConfig {
  title?: string;
  maxItems?: number;
  mode?: 'manual' | 'auto';
  items?: Array<{ title: string; slug: string }>;
}

export interface ErrorActionsConfig {
  buttons?: Array<{
    label: string;
    url: string;
    variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
    icon?: string;
  }>;
  layout?: 'row' | 'column' | 'grid';
  size?: 'sm' | 'md' | 'lg';
}

export interface ErrorFunConfig {
  type?: 'game' | 'redirect' | 'trivia';
  gameType?: 'clicker' | 'runner' | 'breaker';
  redirectUrl?: string;
  redirectSeconds?: number;
  triviaQuestion?: string;
  triviaOptions?: string[];
  triviaAnswer?: string;
}

export interface ErrorImageConfig {
  src?: string;
  alt?: string;
  overlay?: boolean;
  overlayText?: string;
  animation?: string;
  rounded?: 'none' | 'sm' | 'md' | 'full';
  maxWidth?: string;
}

export interface ErrorMapConfig {
  title?: string;
  showSections?: boolean;
  maxDepth?: number;
  layout?: 'list' | 'grid';
}

export interface ErrorQuoteConfig {
  quotes?: Array<{ text: string; author?: string }>;
  rotation?: 'fixed' | 'random';
  showAuthor?: boolean;
  style?: 'default' | 'card' | 'minimal';
}

export interface ErrorFeedbackConfig {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  submitText?: string;
  successMessage?: string;
  showEmail?: boolean;
  emailPlaceholder?: string;
}

export interface ErrorCountdownConfig {
  redirectUrl?: string;
  seconds?: number;
  message?: string;
  showProgress?: boolean;
  showSeconds?: boolean;
  variant?: 'default' | 'minimal';
}

export interface ErrorParticleConfig {
  count?: number;
  color?: string;
  speed?: 'slow' | 'normal' | 'fast';
  type?: 'stars' | 'snow' | 'firefly' | 'bubbles';
  opacity?: number;
}

export interface ErrorMazeConfig {
  difficulty?: 'easy' | 'medium' | 'hard';
  showTimer?: boolean;
  reward?: string;
  rewardUrl?: string;
  size?: number;
}

export interface ErrorPollConfig {
  question?: string;
  options?: Array<{ label: string; votes: number }>;
  showResults?: boolean;
  allowMultiple?: boolean;
}

export interface ErrorFactConfig {
  facts?: Array<{ text: string; source?: string }>;
  rotation?: 'fixed' | 'random';
  showSource?: boolean;
  style?: 'default' | 'card' | 'minimal';
}

export interface ErrorSocialConfig {
  title?: string;
  message?: string;
  showShare?: boolean;
  shareUrl?: string;
  showFollow?: boolean;
  layout?: 'row' | 'column';
}

export interface ErrorCharacterConfig {
  character?: 'sad-robot' | 'confused-cat' | 'funny-ghost' | 'lost-pixel' | '404-bot';
  mood?: 'sad' | 'confused' | 'funny' | 'determined';
  animation?: string;
  speech?: string;
  size?: 'sm' | 'md' | 'lg';
  showBubble?: boolean;
}

// ── Block Config Map ──

export type BlockConfigMap = {
  'section': SectionConfig;
  'column': ColumnConfig;
  'hero': HeroConfig;
  'heading': HeadingConfig;
  'paragraph': ParagraphConfig;
  'rich-text': RichTextConfig;
  'button': ButtonConfig;
  'divider': DividerConfig;
  'spacer': SpacerConfig;
  'list': ListConfig;
  'image': ImageConfig;
  'image-gallery': ImageGalleryConfig;
  'video-embed': VideoEmbedConfig;
  'cover': CoverConfig;
  'media-text': MediaTextConfig;
  'icon': IconConfig;
  'article-grid': ArticleGridConfig;
  'article-carousel': ArticleCarouselConfig;
  'news-feed': NewsFeedConfig;
  'featured-list': FeaturedListConfig;
  'category-list': CategoryListConfig;
  'latest-articles': LatestArticlesConfig;
  'game-data-cards': GameDataCardsConfig;
  'game-table-items': GameTableItemsConfig;
  'article-feed': ArticleFeedConfig;
  'ranking-table': RankingTableConfig;
  'pricing-table': PricingTableConfig;
  'statistics': StatisticsConfig;
  'progress-bar': ProgressBarConfig;
  'timeline': TimelineConfig;
  'faq': FaqConfig;
  'discord-embed': DiscordEmbedConfig;
  'social-links': SocialLinksConfig;
  'countdown': CountdownConfig;
  'contact-form': ContactFormConfig;
  'search': SearchConfig;
  'tabs': TabsConfig;
  'template-part': TemplatePartConfig;
  'footer-credits': FooterCreditsConfig;
  'newsletter': NewsletterConfig;
  'app-badges': AppBadgesConfig;
  'back-to-top': BackToTopConfig;
  'payment-icons': PaymentIconsConfig;
  'footer-brand': FooterBrandConfig;
  'language-switcher': LanguageSwitcherConfig;
  'footer-menu': FooterMenuConfig;
  // Error / 404
  'error-display': ErrorDisplayConfig;
  'error-search': ErrorSearchConfig;
  'error-suggestions': ErrorSuggestionsConfig;
  'error-actions': ErrorActionsConfig;
  'error-fun': ErrorFunConfig;
  'error-image': ErrorImageConfig;
  'error-map': ErrorMapConfig;
  'error-quote': ErrorQuoteConfig;
  'error-feedback': ErrorFeedbackConfig;
  'error-countdown': ErrorCountdownConfig;
  'error-particle': ErrorParticleConfig;
  'error-maze': ErrorMazeConfig;
  'error-poll': ErrorPollConfig;
  'error-fact': ErrorFactConfig;
  'error-social': ErrorSocialConfig;
  'error-character': ErrorCharacterConfig;
};

// ── Block Config ──

export interface BlockConfig<T extends BlockType = BlockType> {
  id: string;
  type: T;
  config: BlockConfigMap[T];
  style?: BlockStyle;
  children?: BlockConfig[];
}

export interface PageLayout {
  blocks: BlockConfig[];
}

// ── Block Definition ──

export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: LucideIcon;
  defaultConfig: Record<string, unknown>;
  description: string;
  category: BlockCategory;
  supportsChildren?: boolean;
}

// ── Floating Islands ──

export type SlotFlowId = 'current' | 'leftPriority' | 'rightPriority' | 'centerFirst' | 'centerAlways' | 'sidesFirst' | 'fillRight' | 'centerSpread';

export type ClipStyleId =
  | 'trapezoid-subtle'
  | 'trapezoid'
  | 'trapezoid-sharp'
  | 'trapezoid-extreme'
  | 'rectangle'
  | 'inverted-subtle'
  | 'inverted'
  | 'inverted-sharp'
  | 'pentagon'
  | 'pentagon-inverted'
  | 'chevron';

export type FloatingIslandType = 'multi-timer' | 'queue-timer' | 'video-list' | 'category-table' | 'wiki-list' | 'carousel' | 'list';
export type FloatingIslandPosition = 'left' | 'center' | 'right';

export interface IslandMedia {
  type: 'image' | 'gif' | 'video' | 'link';
  url: string;
  displayMode: 'always' | 'on-trigger';
}

export interface FloatingIslandConfig {
  id: string;
  position: FloatingIslandPosition;
  type: FloatingIslandType;
  title: string;
  enabled: boolean;
  config: Record<string, unknown>;
  endsAt?: string | null;
}

// ── Widget Config (Chat + Voice) ──

export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'bottom-center';
export type WidgetSize = 'sm' | 'md' | 'lg';
export type WidgetAnimation = 'none' | 'pulse' | 'bounce' | 'float' | 'glow';

export interface WidgetChatConfig {
  enabled?: boolean;
  position?: WidgetPosition;
  size?: WidgetSize;
  color?: string;
  animation?: WidgetAnimation;
  icon?: string;
}

export interface WidgetVoiceConfig {
  enabled?: boolean;
  position?: WidgetPosition;
  size?: WidgetSize;
  color?: string;
  animation?: WidgetAnimation;
}

export interface CardPosition {
  edge: 'top' | 'bottom' | 'left' | 'right';
  offsetPct: number; // 0-100
}

export interface CardPositions {
  follow: CardPosition;
  vote: CardPosition;
}

export interface WidgetLayout {
  chat?: WidgetChatConfig;
  voice?: WidgetVoiceConfig;
  cardPositions?: {
    article_card: CardPositions;
    marketing_card: CardPositions;
  };
}

export interface FloatingIslandLayout {
  islands: FloatingIslandConfig[];
  slotFlow: SlotFlowId;
  clipStyle: ClipStyleId;
}
