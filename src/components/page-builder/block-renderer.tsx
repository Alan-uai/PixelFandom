'use client';

import type { BlockConfig, BlockType } from './types';
import { buildBlockClasses, buildBlockStyle } from '@/lib/block-styles';
import { MotionBlockWrapper } from './motion-block-wrapper';
import { HeroBlock } from './blocks/hero-block';
import { HeadingBlock } from './blocks/heading-block';
import { ParagraphBlock } from './blocks/paragraph-block';
import { RichTextBlock } from './blocks/rich-text-block';
import { ButtonBlock } from './blocks/button-block';
import { DividerBlock } from './blocks/divider-block';
import { SpacerBlock } from './blocks/spacer-block';
import { ListBlock } from './blocks/list-block';
import { ImageBlock } from './blocks/image-block';
import { ImageGalleryBlock } from './blocks/image-gallery-block';
import { VideoEmbedBlock } from './blocks/video-embed-block';
import { CoverBlock } from './blocks/cover-block';
import { MediaTextBlock } from './blocks/media-text-block';
import { IconBlock } from './blocks/icon-block';
import { ArticleGridBlock } from './blocks/article-grid-block';
import { ArticleCarouselBlock } from './blocks/article-carousel-block';
import { NewsFeedBlock } from './blocks/news-feed-block';
import { FeaturedListBlock } from './blocks/featured-list-block';
import { CategoryListBlock } from './blocks/category-list-block';
import { LatestArticlesBlock } from './blocks/latest-articles-block';
import { GameDataCardsBlock } from './blocks/game-data-cards-block';
import { ArticleFeedBlock } from './blocks/article-feed-block';
import { RankingTableBlock } from './blocks/ranking-table-block';
import { PricingTableBlock } from './blocks/pricing-table-block';
import { StatisticsBlock } from './blocks/statistics-block';
import { ProgressBarBlock } from './blocks/progress-bar-block';
import { TimelineBlock } from './blocks/timeline-block';
import { FaqBlock } from './blocks/faq-block';
import { DiscordEmbedBlock } from './blocks/discord-embed-block';
import { SocialLinksBlock } from './blocks/social-links-block';
import { CountdownBlock } from './blocks/countdown-block';
import { ContactFormBlock } from './blocks/contact-form-block';
import { SearchBlock } from './blocks/search-block';
import { TabsBlock } from './blocks/tabs-block';
import { SectionBlock } from './blocks/section-block';
import { FooterCreditsBlock } from './blocks/footer-credits-block';
import { NewsletterBlock } from './blocks/newsletter-block';
import { AppBadgesBlock } from './blocks/app-badges-block';
import { BackToTopBlock } from './blocks/back-to-top-block';
import { PaymentIconsBlock } from './blocks/payment-icons-block';
import { FooterBrandBlock } from './blocks/footer-brand-block';
import { LanguageSwitcherBlock } from './blocks/language-switcher-block';
import { FooterMenuBlock } from './blocks/footer-menu-block';
import { ErrorDisplayBlock } from './blocks/error-display-block';
import { ErrorSearchBlock } from './blocks/error-search-block';
import { ErrorSuggestionsBlock } from './blocks/error-suggestions-block';
import { ErrorActionsBlock } from './blocks/error-actions-block';
import { ErrorFunBlock } from './blocks/error-fun-block';
import { ErrorImageBlock } from './blocks/error-image-block';
import { ErrorMapBlock } from './blocks/error-map-block';
import { ErrorQuoteBlock } from './blocks/error-quote-block';
import { ErrorFeedbackBlock } from './blocks/error-feedback-block';
import { ErrorCountdownBlock } from './blocks/error-countdown-block';
import { ErrorParticleBlock } from './blocks/error-particle-block';
import { ErrorMazeBlock } from './blocks/error-maze-block';
import { ErrorPollBlock } from './blocks/error-poll-block';
import { ErrorFactBlock } from './blocks/error-fact-block';
import { ErrorSocialBlock } from './blocks/error-social-block';
import { ErrorCharacterBlock } from './blocks/error-character-block';
import React from 'react'

interface BlockRendererProps {
  block: BlockConfig;
  tenantId?: string;
  preview?: boolean;
  basePath?: string;
}

export function BlockRenderer({ block, tenantId, preview, basePath }: BlockRendererProps) {
  const baseClasses = buildBlockClasses(block.style);
  const baseStyle = buildBlockStyle(block.style);

  const renderContent = () => {
    switch (block.type as BlockType) {
      case 'section':
        return <SectionBlock config={block.config as any} tenantId={tenantId} preview={preview}>{block.children}</SectionBlock>;
      case 'hero':
        return <HeroBlock config={block.config as any} />;
      case 'heading':
        return <HeadingBlock config={block.config as any} />;
      case 'paragraph':
        return <ParagraphBlock config={block.config as any} />;
      case 'rich-text':
        return <RichTextBlock config={block.config as any} />;
      case 'button':
        return <ButtonBlock config={block.config as any} />;
      case 'divider':
        return <DividerBlock config={block.config as any} />;
      case 'spacer':
        return <SpacerBlock config={block.config as any} />;
      case 'list':
        return <ListBlock config={block.config as any} />;
      case 'image':
        return <ImageBlock config={block.config as any} />;
      case 'image-gallery':
        return <ImageGalleryBlock config={block.config as any} />;
      case 'video-embed':
        return <VideoEmbedBlock config={block.config as any} />;
      case 'cover':
        return <CoverBlock config={block.config as any} />;
      case 'media-text':
        return <MediaTextBlock config={block.config as any} />;
      case 'icon':
        return <IconBlock config={block.config as any} />;
      case 'article-grid':
        return <ArticleGridBlock config={block.config as any} tenantId={tenantId} />;
      case 'article-carousel':
        return <ArticleCarouselBlock config={block.config as any} />;
      case 'news-feed':
        return <NewsFeedBlock config={block.config as any} />;
      case 'featured-list':
        return <FeaturedListBlock config={block.config as any} />;
      case 'category-list':
        return <CategoryListBlock config={block.config as any} />;
      case 'latest-articles':
        return <LatestArticlesBlock config={block.config as any} />;
      case 'game-data-cards':
        return <GameDataCardsBlock config={block.config as any} tenantId={tenantId} basePath={basePath} />;
      case 'article-feed':
        return <ArticleFeedBlock config={block.config as any} tenantId={tenantId} basePath={basePath} />;
      case 'ranking-table':
        return <RankingTableBlock config={block.config as any} />;
      case 'pricing-table':
        return <PricingTableBlock config={block.config as any} />;
      case 'statistics':
        return <StatisticsBlock config={block.config as any} />;
      case 'progress-bar':
        return <ProgressBarBlock config={block.config as any} />;
      case 'timeline':
        return <TimelineBlock config={block.config as any} />;
      case 'faq':
        return <FaqBlock config={block.config as any} />;
      case 'discord-embed':
        return <DiscordEmbedBlock config={block.config as any} />;
      case 'social-links':
        return <SocialLinksBlock config={block.config as any} />;
      case 'countdown':
        return <CountdownBlock config={block.config as any} />;
      case 'contact-form':
        return <ContactFormBlock config={block.config as any} />;
      case 'search':
        return <SearchBlock config={block.config as any} />;
      case 'tabs':
        return <TabsBlock config={block.config as any} />;
      case 'footer-credits':
        return <FooterCreditsBlock config={block.config as any} />;
      case 'newsletter':
        return <NewsletterBlock config={block.config as any} />;
      case 'app-badges':
        return <AppBadgesBlock config={block.config as any} />;
      case 'back-to-top':
        return <BackToTopBlock config={block.config as any} />;
      case 'payment-icons':
        return <PaymentIconsBlock config={block.config as any} />;
      case 'footer-brand':
        return <FooterBrandBlock config={block.config as any} />;
      case 'language-switcher':
        return <LanguageSwitcherBlock config={block.config as any} />;
      case 'footer-menu':
        return <FooterMenuBlock config={block.config as any} />;
      case 'error-display':
        return <ErrorDisplayBlock config={block.config as any} />;
      case 'error-search':
        return <ErrorSearchBlock config={block.config as any} />;
      case 'error-suggestions':
        return <ErrorSuggestionsBlock config={block.config as any} />;
      case 'error-actions':
        return <ErrorActionsBlock config={block.config as any} />;
      case 'error-fun':
        return <ErrorFunBlock config={block.config as any} />;
      case 'error-image':
        return <ErrorImageBlock config={block.config as any} />;
      case 'error-map':
        return <ErrorMapBlock config={block.config as any} />;
      case 'error-quote':
        return <ErrorQuoteBlock config={block.config as any} />;
      case 'error-feedback':
        return <ErrorFeedbackBlock config={block.config as any} />;
      case 'error-countdown':
        return <ErrorCountdownBlock config={block.config as any} />;
      case 'error-particle':
        return <ErrorParticleBlock config={block.config as any} />;
      case 'error-maze':
        return <ErrorMazeBlock config={block.config as any} />;
      case 'error-poll':
        return <ErrorPollBlock config={block.config as any} />;
      case 'error-fact':
        return <ErrorFactBlock config={block.config as any} />;
      case 'error-social':
        return <ErrorSocialBlock config={block.config as any} />;
      case 'error-character':
        return <ErrorCharacterBlock config={block.config as any} />;
      default:
        return <div className="p-4 text-sm text-muted-foreground">Bloco desconhecido: {block.type}</div>;
    }
  };

  if (block.type === 'section' || block.type === 'column') {
    return <>{renderContent()}</>;
  }

  return (
    <MotionBlockWrapper animation={block.style?.animation} className={baseClasses} style={baseStyle}>
      {renderContent()}
    </MotionBlockWrapper>
  );
}
