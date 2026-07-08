import type { PanelComponent } from './types';

import {
  SelectField, CheckboxField, TextField, UrlField,
} from './shared/fields';
import { ItemsListEditor } from './shared/items-list-editor';

// ── Content ──
import { ParagraphPanel, RichTextPanel, DividerPanel, SpacerPanel, ListPanel } from './content-panels';

// ── Media ──
import { ImagePanel, ImageGalleryPanel, VideoEmbedPanel, CoverPanel, MediaTextPanel } from './media-panels';

// ── Dynamic ──
import { ArticleGridPanel, ArticleCarouselPanel, NewsFeedPanel, FeaturedListPanel, CategoryListPanel, LatestArticlesPanel, GameTableItemsPanel, ArticleFeedPanel } from './dynamic-panels';

// ── Data ──
import { RankingTablePanel, StatisticsPanel, ProgressBarPanel, TimelinePanel, FaqPanel, GameDataCardsPanel } from './data-panels';

// ── Interactive ──
import { DiscordEmbedPanel, SocialLinksPanel, SearchPanel, TabsPanel, PopoverPanel } from './interactive-panels';

// ── Footer ──
import { FooterCreditsPanel, NewsletterPanel, AppBadgesPanel, BackToTopPanel, PaymentIconsPanel, FooterBrandPanel, LanguageSwitcherPanel, FooterMenuPanel } from './footer-panels';

// ── Error / 404 ──
import { ErrorDisplayPanel, ErrorSearchPanel, ErrorSuggestionsPanel, ErrorActionsPanel, ErrorFunPanel, ErrorImagePanel, ErrorMapPanel, ErrorQuotePanel, ErrorFeedbackPanel, ErrorCountdownPanel, ErrorParticlePanel, ErrorMazePanel, ErrorPollPanel, ErrorFactPanel, ErrorSocialPanel, ErrorCharacterPanel } from './error-panels';

export const configPanels: Record<string, PanelComponent | undefined> = {
  // ── Layout ──
  section: SectionPanel,
  column: undefined,

  // ── Content ──
  hero: HeroPanel,
  heading: HeadingPanel,
  paragraph: ParagraphPanel,
  'rich-text': RichTextPanel,
  button: ButtonPanel,
  divider: DividerPanel,
  spacer: SpacerPanel,
  list: ListPanel,

  // ── Media ──
  image: ImagePanel,
  'image-gallery': ImageGalleryPanel,
  'video-embed': VideoEmbedPanel,
  cover: CoverPanel,
  'media-text': MediaTextPanel,
  icon: IconPanel,

  // ── Dynamic ──
  'article-grid': ArticleGridPanel,
  'article-carousel': ArticleCarouselPanel,
  'news-feed': NewsFeedPanel,
  'featured-list': FeaturedListPanel,
  'category-list': CategoryListPanel,
  'latest-articles': LatestArticlesPanel,
  'article-feed': ArticleFeedPanel,

  // ── Data ──
  'ranking-table': RankingTablePanel,
  'pricing-table': PricingTablePanel,
  statistics: StatisticsPanel,
  'progress-bar': ProgressBarPanel,
  timeline: TimelinePanel,
  faq: FaqPanel,
  'game-data-cards': GameDataCardsPanel,
  'game-table-items': GameTableItemsPanel,

  // ── Interactive ──
  'discord-embed': DiscordEmbedPanel,
  'social-links': SocialLinksPanel,
  countdown: CountdownPanel,
  'contact-form': ContactFormPanel,
  popover: PopoverPanel,
  search: SearchPanel,
  tabs: TabsPanel,

  // ── Footer ──
  'footer-credits': FooterCreditsPanel,
  newsletter: NewsletterPanel,
  'app-badges': AppBadgesPanel,
  'back-to-top': BackToTopPanel,
  'payment-icons': PaymentIconsPanel,
  'footer-brand': FooterBrandPanel,
  'language-switcher': LanguageSwitcherPanel,
  'footer-menu': FooterMenuPanel,

  // ── Error / 404 ──
  'error-display': ErrorDisplayPanel,
  'error-search': ErrorSearchPanel,
  'error-suggestions': ErrorSuggestionsPanel,
  'error-actions': ErrorActionsPanel,
  'error-fun': ErrorFunPanel,
  'error-image': ErrorImagePanel,
  'error-map': ErrorMapPanel,
  'error-quote': ErrorQuotePanel,
  'error-feedback': ErrorFeedbackPanel,
  'error-countdown': ErrorCountdownPanel,
  'error-particle': ErrorParticlePanel,
  'error-maze': ErrorMazePanel,
  'error-poll': ErrorPollPanel,
  'error-fact': ErrorFactPanel,
  'error-social': ErrorSocialPanel,
  'error-character': ErrorCharacterPanel,
};

// ── Legacy panels kept inline for simplicity ──

// Section
function SectionPanel({ config, onChange }: { config: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  return (
    <>
      <SelectField label="Colunas" value={String(config.columns || 1)} options={[
        { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' },
        { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' },
      ]} onChange={(v) => onChange('columns', Number(v))} />
      <SelectField label="Espaçamento" value={(config.gap as string) || 'md'} options={[
        { label: 'Sem', value: 'none' }, { label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' }, { label: 'Grande', value: 'lg' },
      ]} onChange={(v) => onChange('gap', v)} />
      <SelectField label="Alinhamento Vertical" value={(config.verticalAlign as string) || 'top'} options={[
        { label: 'Topo', value: 'top' }, { label: 'Centro', value: 'center' }, { label: 'Fundo', value: 'bottom' },
      ]} onChange={(v) => onChange('verticalAlign', v)} />
      <CheckboxField label="Altura igual" checked={!!config.equalHeight} onChange={(v) => onChange('equalHeight', v)} id="eq-height" />
    </>
  );
}

// Hero
function HeroPanel({ config, onChange }: { config: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  return (
    <>
      <SelectField label="Layout" value={(config.layout as string) || 'center'} options={[
        { label: 'Centro', value: 'center' }, { label: 'Esquerda', value: 'left' },
        { label: 'Dividido', value: 'split' }, { label: 'Imagem Total', value: 'full-image' },
      ]} onChange={(v) => onChange('layout', v)} />
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <TextField label="Subtítulo" value={(config.subtitle as string) || ''} onChange={(v) => onChange('subtitle', v)} />
      <TextField label="Texto do CTA" value={(config.ctaText as string) || ''} onChange={(v) => onChange('ctaText', v)} />
      <UrlField label="URL do CTA" value={(config.ctaUrl as string) || ''} onChange={(v) => onChange('ctaUrl', v)} />
      <UrlField label="URL da Imagem" value={(config.imageUrl as string) || ''} onChange={(v) => onChange('imageUrl', v)} />
      <CheckboxField label="Overlay escuro" checked={!!config.overlay} onChange={(v) => onChange('overlay', v)} id="hero-overlay" />
    </>
  );
}

// Heading
function HeadingPanel({ config, onChange }: { config: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  return (
    <>
      <TextField label="Conteúdo" value={(config.content as string) || ''} onChange={(v) => onChange('content', v)} />
      <SelectField label="Nível" value={(config.level as string) || 'h2'} options={[
        { label: 'H1', value: 'h1' }, { label: 'H2', value: 'h2' }, { label: 'H3', value: 'h3' },
        { label: 'H4', value: 'h4' }, { label: 'H5', value: 'h5' }, { label: 'H6', value: 'h6' },
      ]} onChange={(v) => onChange('level', v)} />
      <SelectField label="Alinhamento" value={(config.align as string) || 'left'} options={[
        { label: 'Esquerda', value: 'left' }, { label: 'Centro', value: 'center' }, { label: 'Direita', value: 'right' },
      ]} onChange={(v) => onChange('align', v)} />
    </>
  );
}

// Button
function ButtonPanel({ config, onChange }: { config: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  return (
    <>
      <TextField label="Texto" value={(config.text as string) || ''} onChange={(v) => onChange('text', v)} />
      <UrlField label="URL" value={(config.url as string) || ''} onChange={(v) => onChange('url', v)} />
      <SelectField label="Variante" value={(config.variant as string) || 'primary'} options={[
        { label: 'Primário', value: 'primary' }, { label: 'Outline', value: 'outline' },
        { label: 'Ghost', value: 'ghost' }, { label: 'Secundário', value: 'secondary' },
      ]} onChange={(v) => onChange('variant', v)} />
      <SelectField label="Tamanho" value={(config.size as string) || 'md'} options={[
        { label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' }, { label: 'Grande', value: 'lg' },
      ]} onChange={(v) => onChange('size', v)} />
      <CheckboxField label="Largura total" checked={!!config.fullWidth} onChange={(v) => onChange('fullWidth', v)} id="btn-full" />
    </>
  );
}

// Icon
function IconPanel({ config, onChange }: { config: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  const icon = config.icon as any || { icon: 'lucide:star', animation: 'none' };
  const iconId = typeof icon === 'string' ? icon : icon?.icon || 'lucide:star';
  const animation = typeof icon === 'object' ? icon?.animation || 'none' : 'none';
  return (
    <>
      <IconField label="Ícone" value={icon} onChange={(v) => onChange('icon', v)} />
      <SelectField label="Animação" value={animation} options={[
        { label: 'Nenhuma', value: 'none' }, { label: 'Pulso', value: 'pulse' },
        { label: 'Girar', value: 'spin' }, { label: 'Pular', value: 'bounce' },
        { label: 'Chacoalhar', value: 'shake' }, { label: 'Balançar', value: 'wiggle' },
        { label: 'Flutuar', value: 'float' }, { label: 'Brilho', value: 'glow' },
      ]} onChange={(v) => onChange('icon', { icon: iconId, animation: v })} />
      <SelectField label="Tamanho" value={(config.size as string) || 'md'} options={[
        { label: 'Pequeno', value: 'sm' }, { label: 'Médio', value: 'md' },
        { label: 'Grande', value: 'lg' }, { label: 'Extra Grande', value: 'xl' },
      ]} onChange={(v) => onChange('size', v)} />
      <TextField label="Cor" value={(config.color as string) || 'hsl(var(--primary))'} onChange={(v) => onChange('color', v)} />
      <TextField label="Cor de Fundo" value={(config.backgroundColor as string) || ''} onChange={(v) => onChange('backgroundColor', v)} />
      <SelectField label="Arredondamento" value={(config.rounded as string) || 'md'} options={[
        { label: 'Nenhum', value: 'none' }, { label: 'Pequeno', value: 'sm' },
        { label: 'Médio', value: 'md' }, { label: 'Total', value: 'full' },
      ]} onChange={(v) => onChange('rounded', v)} />
    </>
  );
}

// Pricing Table
function PricingTablePanel({ config, onChange }: { config: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <SelectField label="Colunas" value={String((config.columns as number) || 3)} options={[
        { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' },
      ]} onChange={(v) => onChange('columns', Number(v))} />
      <ItemsListEditor
        label="Planos"
        fields={[
          { key: 'name', label: 'Nome', type: 'text' },
          { key: 'price', label: 'Preço', type: 'text', placeholder: 'R$ 29' },
          { key: 'period', label: 'Período', type: 'text', placeholder: '/mês' },
          { key: 'description', label: 'Descrição', type: 'textarea' },
          { key: 'ctaText', label: 'Texto do CTA', type: 'text', placeholder: 'Assinar' },
          { key: 'ctaUrl', label: 'URL do CTA', type: 'url' },
          { key: 'highlighted', label: 'Destaque', type: 'select', options: [
            { label: 'Não', value: 'false' }, { label: 'Sim', value: 'true' },
          ]},
        ]}
        items={(config.plans as Record<string, unknown>[]) || []}
        onChange={(v) => onChange('plans', v)}
      />
    </>
  );
}

// Countdown
function CountdownPanel({ config, onChange }: { config: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <TextField label="Data Alvo" value={(config.targetDate as string) || ''} onChange={(v) => onChange('targetDate', v)} />
      <TextField label="Hora Alvo" value={(config.targetTime as string) || ''} onChange={(v) => onChange('targetTime', v)} />
      {(['showDays', 'showHours', 'showMinutes', 'showSeconds'] as const).map((key) => (
        <CheckboxField key={key} label={key.replace('show', 'Mostrar ')} checked={!!config[key]} onChange={(v) => onChange(key, v)} id={`cd-${key}`} />
      ))}
    </>
  );
}

// Contact Form
function ContactFormPanel({ config, onChange }: { config: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  return (
    <>
      <TextField label="Título" value={(config.title as string) || ''} onChange={(v) => onChange('title', v)} />
      <TextField label="Subtítulo" value={(config.subtitle as string) || ''} onChange={(v) => onChange('subtitle', v)} />
      <TextField label="Texto do Botão" value={(config.submitText as string) || 'Enviar'} onChange={(v) => onChange('submitText', v)} />
      <TextField label="Mensagem de Sucesso" value={(config.successMessage as string) || ''} onChange={(v) => onChange('successMessage', v)} />
      <ItemsListEditor
        label="Campos"
        fields={[{ key: 'value', label: 'Campo', type: 'text' }]}
        items={(config.fields as Record<string, unknown>[]) || []}
        onChange={(v) => onChange('fields', v)}
      />
    </>
  );
}

// IconField helper (shared between panels)
import { useState } from 'react';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { IconPicker } from '@/components/ui/icon-picker';

function IconField({ label, value, onChange }: { label: string; value: any; onChange: (v: any) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const iconId = typeof value === 'string' ? value : value?.icon || 'lucide:star';
  const animation = typeof value === 'object' ? value?.animation || 'none' : 'none';

  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1.5 rounded-md border bg-background px-2 py-1">
          <IconRenderer icon={iconId} size="sm" />
          <input
            type="text"
            value={iconId}
            onChange={(e) => {
              if (typeof value === 'string') onChange(e.target.value);
              else onChange({ icon: e.target.value, animation });
            }}
            placeholder="lucide:star"
            className="flex-1 bg-transparent text-xs outline-none"
          />
        </div>
        <button type="button" onClick={() => setPickerOpen(true)} className="rounded-md border bg-background px-2 py-1 text-xs hover:bg-accent">
          Browse
        </button>
      </div>
      {pickerOpen && (
        <IconPicker
          value={iconId}
          animation={animation}
          onChange={(newIconId, newAnim) => {
            const newVal = typeof value === 'string' ? newIconId : { icon: newIconId, animation: newAnim };
            onChange(newVal);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
