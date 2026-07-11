'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { supabase } from '@/supabase';
import { useCachedData } from '@/hooks/use-cached-data';
import { useSiteCache } from '@/lib/site-cache';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { Label } from '@/components/ui/label';
import { Select3D } from '@/components/ui/select3d';
import { ElasticSlider3D } from '@/components/ui/elastic-slider-3d';
import { ImageUpload } from '@/components/ui/image-upload';
import { MediaLibrary } from '@/components/ui/media-library';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import * as Popover from '@radix-ui/react-popover';
import { useToast } from '@/hooks/use-toast';
import { SelectCard } from '@/components/ui/select-card';
import { Loader2, Image, LayoutGrid, List, FileText, Pipette, AlertTriangle, Trash2, Download, LayoutDashboard, Layers, Database, BookOpen } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTenantRole } from '@/hooks/use-tenant-role';
import { useRegisterUnsavedChanges } from '@/components/unsaved-changes';
import { THEME_PRESETS } from '@/lib/theme-presets';

export default function WikiSettingsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const { toast } = useToast();
  const [tenantState, setTenantState] = useState<any>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [savedConfig, setSavedConfig] = useState<{
    name: string; description: string; logoUrl: string; coverImageUrl: string;
    discordUrl: string; gameUrl: string; faviconUrl: string; ogImage: string;
    primaryColor: string; backgroundColor: string; cardColor: string; sidebarColor: string; accentColor: string;
    fontFamily: string; headingFont: string; borderRadius: string;
    sidebarWidth: 'narrow' | 'normal' | 'wide'; headerStyle: 'compact' | 'expanded' | 'minimal'; articlesPerRow: number;
    gameTableDisplayFormat: string; gameTableColumnsCount: number;
    gameTableTabsEnabled: boolean; gameTableTabsSubFormat: string;
    listingDisplayFormat: string; listingColumnsCount: number;
    listingItemsPerPage: number; listingPagination: string;
    listingShowSearch: boolean; listingShowFilters: boolean; listingShowHeader: boolean;
    listingCardStyle: string; listingCardLayout: string; listingHoverEffect: string;
    articleDisplayFormat: string; articleColumnsCount: number;
    articleShowImages: boolean; articleShowSummaries: boolean;
  }>({
    name: '', description: '', logoUrl: '', coverImageUrl: '',
    discordUrl: '', gameUrl: '', faviconUrl: '', ogImage: '',
    primaryColor: '198 100% 65%', backgroundColor: '', cardColor: '', sidebarColor: '', accentColor: '',
    fontFamily: '', headingFont: '', borderRadius: '',
    sidebarWidth: 'normal', headerStyle: 'compact', articlesPerRow: 3,
    gameTableDisplayFormat: 'grid', gameTableColumnsCount: 4,
    gameTableTabsEnabled: false, gameTableTabsSubFormat: 'list',
    listingDisplayFormat: 'grid', listingColumnsCount: 4,
    listingItemsPerPage: 20, listingPagination: 'paginated',
    listingShowSearch: true, listingShowFilters: true, listingShowHeader: true,
    listingCardStyle: 'default', listingCardLayout: 'card', listingHoverEffect: 'scale',
    articleDisplayFormat: 'grid', articleColumnsCount: 3,
    articleShowImages: true, articleShowSummaries: true,
  });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [gameUrl, setGameUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [primaryColor, setPrimaryColor] = useState('198 100% 65%');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [cardColor, setCardColor] = useState('');
  const [sidebarColor, setSidebarColor] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [fontFamily, setFontFamily] = useState('');
  const [headingFont, setHeadingFont] = useState('');
  const [borderRadius, setBorderRadius] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState<'narrow' | 'normal' | 'wide'>('normal');
  const [headerStyle, setHeaderStyle] = useState<'compact' | 'expanded' | 'minimal'>('compact');
  const [articlesPerRow, setArticlesPerRow] = useState(3);
  const [gameTableDisplayFormat, setGameTableDisplayFormat] = useState('grid');
  const [gameTableColumnsCount, setGameTableColumnsCount] = useState(4);
  const [gameTableTabsEnabled, setGameTableTabsEnabled] = useState(false);
  const [gameTableTabsSubFormat, setGameTableTabsSubFormat] = useState('list');
  const [listingDisplayFormat, setListingDisplayFormat] = useState('grid');
  const [listingColumnsCount, setListingColumnsCount] = useState(4);
  const [listingItemsPerPage, setListingItemsPerPage] = useState(20);
  const [listingPagination, setListingPagination] = useState('paginated');
  const [listingShowSearch, setListingShowSearch] = useState(true);
  const [listingShowFilters, setListingShowFilters] = useState(true);
  const [listingShowHeader, setListingShowHeader] = useState(true);
  const [listingCardStyle, setListingCardStyle] = useState('default');
  const [listingCardLayout, setListingCardLayout] = useState('card');
  const [listingHoverEffect, setListingHoverEffect] = useState('scale');
  const [articleDisplayFormat, setArticleDisplayFormat] = useState('grid');
  const [articleColumnsCount, setArticleColumnsCount] = useState(3);
  const [articleShowImages, setArticleShowImages] = useState(true);
  const [articleShowSummaries, setArticleShowSummaries] = useState(true);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const mediaLibrarySetter = useRef<((url: string) => void) | null>(null);
  const mediaLibraryPathPrefix = useRef<string>('uploads');

  const cacheKey = `tenant:${slug}`;
  const { data: tenant, loading } = useCachedData<any>(
    cacheKey,
    async () => {
      const { data } = await supabase.from('tenants').select('*').eq('slug', slug).single();
      return data!;
    }
  );

  useEffect(() => {
    if (!tenant) return;
    setTenantState(tenant);
    setName(tenant.name);
    setDescription(tenant.description || '');
    setLogoUrl(tenant.logo_url || '');
    setCoverImageUrl(tenant.cover_image || '');
    setDiscordUrl(tenant.discord_url || '');
    setGameUrl(tenant.game_url || '');
    setFaviconUrl(tenant.favicon_url || '');
    setOgImage(tenant.og_image || '');
    const theme = (tenant.theme as Record<string, any>) || {};
    setPrimaryColor(theme.primary_color || '198 100% 65%');
    setBackgroundColor(theme.background_color || '');
    setCardColor(theme.card_color || '');
    setSidebarColor(theme.sidebar_color || '');
    setAccentColor(theme.accent_color || '');
    setFontFamily(theme.font_family || '');
    setHeadingFont(theme.heading_font || '');
    setBorderRadius(theme.border_radius || '');
    setSidebarWidth(theme.sidebar_width || 'normal');
    setHeaderStyle(theme.header_style || 'compact');
    setArticlesPerRow(theme.articles_per_row || 3);
    const gtDisplay = (theme.game_tables_display as Record<string, any>) || {};
    setGameTableDisplayFormat(gtDisplay.default_format || 'grid');
    setGameTableColumnsCount(gtDisplay.default_columns || 4);
    setGameTableTabsEnabled(gtDisplay.tabs_enabled || false);
    setGameTableTabsSubFormat(gtDisplay.tabs_sub_format || 'list');
    const listingDisplay = (theme.game_table_listing_display as Record<string, any>) || {};
    setListingDisplayFormat(listingDisplay.default_format || 'grid');
    setListingColumnsCount(listingDisplay.default_columns || 4);
    setListingItemsPerPage(listingDisplay.items_per_page || 20);
    setListingPagination(listingDisplay.pagination || 'paginated');
    setListingShowSearch(listingDisplay.show_search ?? true);
    setListingShowFilters(listingDisplay.show_filters ?? true);
    setListingShowHeader(listingDisplay.show_header ?? true);
    setListingCardStyle(listingDisplay.card_style || 'default');
    setListingCardLayout(listingDisplay.card_layout || 'card');
    setListingHoverEffect(listingDisplay.hover_effect || 'scale');
    const articlesDisplay = (theme.articles_display as Record<string, any>) || {};
    setArticleDisplayFormat(articlesDisplay.default_format || 'grid');
    setArticleColumnsCount(articlesDisplay.default_columns || 3);
    setArticleShowImages(articlesDisplay.show_images ?? true);
    setArticleShowSummaries(articlesDisplay.show_summaries ?? true);
    setSavedConfig({
      name: tenant.name,
      description: tenant.description || '',
      logoUrl: tenant.logo_url || '',
      coverImageUrl: tenant.cover_image || '',
      discordUrl: tenant.discord_url || '',
      gameUrl: tenant.game_url || '',
      faviconUrl: tenant.favicon_url || '',
      ogImage: tenant.og_image || '',
      primaryColor: theme.primary_color || '198 100% 65%',
      backgroundColor: theme.background_color || '',
      cardColor: theme.card_color || '',
      sidebarColor: theme.sidebar_color || '',
      accentColor: theme.accent_color || '',
      fontFamily: theme.font_family || '',
      headingFont: theme.heading_font || '',
      borderRadius: theme.border_radius || '',
      sidebarWidth: theme.sidebar_width || 'normal',
      headerStyle: theme.header_style || 'compact',
      articlesPerRow: theme.articles_per_row || 3,
      gameTableDisplayFormat: gtDisplay.default_format || 'grid',
      gameTableColumnsCount: gtDisplay.default_columns || 4,
      gameTableTabsEnabled: gtDisplay.tabs_enabled || false,
      gameTableTabsSubFormat: gtDisplay.tabs_sub_format || 'list',
      listingDisplayFormat: listingDisplay.default_format || 'grid',
      listingColumnsCount: listingDisplay.default_columns || 4,
      listingItemsPerPage: listingDisplay.items_per_page || 20,
      listingPagination: listingDisplay.pagination || 'paginated',
      listingShowSearch: listingDisplay.show_search ?? true,
      listingShowFilters: listingDisplay.show_filters ?? true,
      listingShowHeader: listingDisplay.show_header ?? true,
      listingCardStyle: listingDisplay.card_style || 'default',
      listingCardLayout: listingDisplay.card_layout || 'card',
      listingHoverEffect: listingDisplay.hover_effect || 'scale',
      articleDisplayFormat: articlesDisplay.default_format || 'grid',
      articleColumnsCount: articlesDisplay.default_columns || 3,
      articleShowImages: articlesDisplay.show_images ?? true,
      articleShowSummaries: articlesDisplay.show_summaries ?? true,
    });
  }, [tenant]);

  useEffect(() => {
    const el = descriptionRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, [description]);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name, description,
          logo_url: logoUrl || null, cover_image: coverImageUrl || null,
          discord_url: discordUrl || null, game_url: gameUrl || null,
          favicon_url: faviconUrl || null, og_image: ogImage || null,
          theme: {
            primary_color: primaryColor,
            background_color: backgroundColor || null,
            card_color: cardColor || null,
            sidebar_color: sidebarColor || null,
            accent_color: accentColor || null,
            font_family: fontFamily || null,
            heading_font: headingFont || null,
            border_radius: borderRadius || null,
            sidebar_width: sidebarWidth,
            header_style: headerStyle,
            articles_per_row: articlesPerRow,
            game_tables_display: {
              default_format: gameTableDisplayFormat,
              default_columns: gameTableColumnsCount,
              tabs_enabled: gameTableTabsEnabled,
              tabs_sub_format: gameTableTabsSubFormat,
            },
            game_table_listing_display: {
              default_format: listingDisplayFormat,
              default_columns: listingColumnsCount,
              items_per_page: listingItemsPerPage,
              pagination: listingPagination,
              show_search: listingShowSearch,
              show_filters: listingShowFilters,
              show_header: listingShowHeader,
              card_style: listingCardStyle,
              card_layout: listingCardLayout,
              hover_effect: listingHoverEffect,
            },
            articles_display: {
              default_format: articleDisplayFormat,
              default_columns: articleColumnsCount,
              show_images: articleShowImages,
              show_summaries: articleShowSummaries,
            },
            widgets: {},
          },
        })
        .eq('slug', slug);

      if (error) {
        toast({ variant: 'destructive', title: tc('error'), description: error.message });
        throw error;
      }

      setSavedConfig({
        name, description, logoUrl, coverImageUrl,
        discordUrl, gameUrl, faviconUrl, ogImage,
        primaryColor, backgroundColor, cardColor, sidebarColor, accentColor,
        fontFamily, headingFont, borderRadius,
        sidebarWidth, headerStyle, articlesPerRow,
        gameTableDisplayFormat, gameTableColumnsCount,
        gameTableTabsEnabled, gameTableTabsSubFormat,
        listingDisplayFormat, listingColumnsCount, listingItemsPerPage, listingPagination,
        listingShowSearch, listingShowFilters, listingShowHeader,
        listingCardStyle, listingCardLayout, listingHoverEffect,
        articleDisplayFormat, articleColumnsCount, articleShowImages, articleShowSummaries,
      });

      useSiteCache.getState().set(cacheKey, {
        ...tenantState,
        name,
        description,
        logo_url: logoUrl || null,
        cover_image: coverImageUrl || null,
        discord_url: discordUrl || null,
        game_url: gameUrl || null,
        favicon_url: faviconUrl || null,
        og_image: ogImage || null,
        theme: {
          primary_color: primaryColor,
          background_color: backgroundColor || null,
          card_color: cardColor || null,
          sidebar_color: sidebarColor || null,
          accent_color: accentColor || null,
          font_family: fontFamily || null,
          heading_font: headingFont || null,
          border_radius: borderRadius || null,
          sidebar_width: sidebarWidth,
          header_style: headerStyle,
          articles_per_row: articlesPerRow,
          game_tables_display: {
            default_format: gameTableDisplayFormat,
            default_columns: gameTableColumnsCount,
            tabs_enabled: gameTableTabsEnabled,
            tabs_sub_format: gameTableTabsSubFormat,
          },
          game_table_listing_display: {
            default_format: listingDisplayFormat,
            default_columns: listingColumnsCount,
            items_per_page: listingItemsPerPage,
            pagination: listingPagination,
            show_search: listingShowSearch,
            show_filters: listingShowFilters,
            show_header: listingShowHeader,
            card_style: listingCardStyle,
            hover_effect: listingHoverEffect,
          },
          articles_display: {
            default_format: articleDisplayFormat,
            default_columns: articleColumnsCount,
            show_images: articleShowImages,
            show_summaries: articleShowSummaries,
          },
          widgets: {},
        },
      });
    } catch (err) {
      if (!(err as any)?.message?.includes?.('supabase')) toast({ variant: 'destructive', title: tc('unexpected_error'), description: t('save_failed') });
      throw err;
    }
  };

  const isDirty =
    name !== savedConfig.name ||
    description !== savedConfig.description ||
    logoUrl !== savedConfig.logoUrl ||
    coverImageUrl !== savedConfig.coverImageUrl ||
    discordUrl !== savedConfig.discordUrl ||
    gameUrl !== savedConfig.gameUrl ||
    faviconUrl !== savedConfig.faviconUrl ||
    ogImage !== savedConfig.ogImage ||
    primaryColor !== savedConfig.primaryColor ||
    backgroundColor !== savedConfig.backgroundColor ||
    cardColor !== savedConfig.cardColor ||
    sidebarColor !== savedConfig.sidebarColor ||
    accentColor !== savedConfig.accentColor ||
    fontFamily !== savedConfig.fontFamily ||
    headingFont !== savedConfig.headingFont ||
    borderRadius !== savedConfig.borderRadius ||
    sidebarWidth !== savedConfig.sidebarWidth ||
    headerStyle !== savedConfig.headerStyle ||
    articlesPerRow !== savedConfig.articlesPerRow ||
    gameTableDisplayFormat !== savedConfig.gameTableDisplayFormat ||
    gameTableColumnsCount !== savedConfig.gameTableColumnsCount ||
    gameTableTabsEnabled !== savedConfig.gameTableTabsEnabled ||
    gameTableTabsSubFormat !== savedConfig.gameTableTabsSubFormat ||
    listingDisplayFormat !== savedConfig.listingDisplayFormat ||
    listingColumnsCount !== savedConfig.listingColumnsCount ||
    listingItemsPerPage !== savedConfig.listingItemsPerPage ||
    listingPagination !== savedConfig.listingPagination ||
    listingShowSearch !== savedConfig.listingShowSearch ||
    listingShowFilters !== savedConfig.listingShowFilters ||
    listingShowHeader !== savedConfig.listingShowHeader ||
    listingCardStyle !== savedConfig.listingCardStyle ||
    listingCardLayout !== savedConfig.listingCardLayout ||
    listingHoverEffect !== savedConfig.listingHoverEffect ||
    articleDisplayFormat !== savedConfig.articleDisplayFormat ||
    articleColumnsCount !== savedConfig.articleColumnsCount ||
    articleShowImages !== savedConfig.articleShowImages ||
    articleShowSummaries !== savedConfig.articleShowSummaries;

  useRegisterUnsavedChanges({
    isDirty,
    onSave: handleSave,
    onDiscard: () => setSavedConfig({
      name, description, logoUrl, coverImageUrl,
      discordUrl, gameUrl, faviconUrl, ogImage,
      primaryColor, backgroundColor, cardColor, sidebarColor, accentColor,
      fontFamily, headingFont, borderRadius,
      sidebarWidth, headerStyle, articlesPerRow,
      gameTableDisplayFormat, gameTableColumnsCount,
      gameTableTabsEnabled, gameTableTabsSubFormat,
      listingDisplayFormat, listingColumnsCount, listingItemsPerPage, listingPagination,
      listingShowSearch, listingShowFilters, listingShowHeader,
      listingCardStyle, listingCardLayout, listingHoverEffect,
      articleDisplayFormat, articleColumnsCount, articleShowImages, articleShowSummaries,
    }),
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenantState) {
    return <p className="text-muted-foreground">{t('wiki_not_found')}</p>;
  }

  return (
    <>
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      <CollapsibleSection id="basic-info" title={t('basic_info.title')} description={t('basic_info.description')} storageKey="basic-info">
        <div className="space-y-4">
          <FloatingLabelInput
            label={t('basic_info.name_label')}
            info={t('basic_info.name_info')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <FloatingLabelTextarea
            label={t('basic_info.description_label')}
            info={t('basic_info.description_info')}
            value={description}
            ref={descriptionRef}
            onChange={(e) => {
              setDescription(e.target.value);
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = el.scrollHeight + 'px';
            }}
            className="min-h-[80px]"
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="media" title={t('media.title')} description={t('media.description')} defaultOpen={false} storageKey="media">
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2">{t('media.logo_label')}</h4>
            <p className="text-xs text-muted-foreground mb-2">{t('media.logo_hint')}</p>
            <ImageUpload bucket="wiki-images" pathPrefix={`wiki-logos/${slug}`} value={logoUrl} onChange={setLogoUrl} label={t('media.logo_upload')} previewSize="w-20 h-20" tenantId={tenantState?.id} onOpenLibrary={() => { mediaLibrarySetter.current = setLogoUrl; mediaLibraryPathPrefix.current = `wiki-logos/${slug}`; setMediaLibraryOpen(true); }} />
            <p className="text-xs text-muted-foreground mt-2">{t('media.logo_recommendation')}</p>
          </div>
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">{t('media.cover_label')}</h4>
            <p className="text-xs text-muted-foreground mb-2">{t('media.cover_hint')}</p>
            <ImageUpload bucket="wiki-images" pathPrefix={`wiki-covers/${slug}`} value={coverImageUrl} onChange={setCoverImageUrl} label={t('media.cover_upload')} previewSize="w-40 h-24" tenantId={tenantState?.id} onOpenLibrary={() => { mediaLibrarySetter.current = setCoverImageUrl; mediaLibraryPathPrefix.current = `wiki-covers/${slug}`; setMediaLibraryOpen(true); }} />
            <p className="text-xs text-muted-foreground mt-2">{t('media.cover_recommendation')}</p>
          </div>
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">{t('media.favicon_label')}</h4>
            <p className="text-xs text-muted-foreground mb-2">{t('media.favicon_hint')}</p>
            <ImageUpload bucket="wiki-images" pathPrefix={`wiki-favicons/${slug}`} value={faviconUrl} onChange={setFaviconUrl} label={t('media.favicon_upload')} previewSize="w-10 h-10" tenantId={tenantState?.id} onOpenLibrary={() => { mediaLibrarySetter.current = setFaviconUrl; mediaLibraryPathPrefix.current = `wiki-favicons/${slug}`; setMediaLibraryOpen(true); }} />
            <p className="text-xs text-muted-foreground mt-2">{t('media.favicon_recommendation')}</p>
          </div>
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">{t('media.og_label')}</h4>
            <p className="text-xs text-muted-foreground mb-2">{t('media.og_hint')}</p>
            <ImageUpload bucket="wiki-images" pathPrefix={`wiki-og/${slug}`} value={ogImage} onChange={setOgImage} label={t('media.og_upload')} previewSize="w-40 h-24" tenantId={tenantState?.id} onOpenLibrary={() => { mediaLibrarySetter.current = setOgImage; mediaLibraryPathPrefix.current = `wiki-og/${slug}`; setMediaLibraryOpen(true); }} />
            <p className="text-xs text-muted-foreground mt-2">{t('media.og_recommendation')}</p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="theme" title={t('theme.title')} description={t('theme.description')} storageKey="theme">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium mb-2">{t('theme.presets_label')}</p>
            <div className="grid grid-cols-3 gap-2">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setPrimaryColor(preset.colors.primary);
                    setAccentColor(preset.colors.accent || '');
                    setBackgroundColor(preset.colors.background);
                    setCardColor(preset.colors.card);
                  }}
                  className="relative rounded-lg border p-2 text-left transition-colors hover:border-primary/50"
                  title={preset.name}
                >
                  <div className="flex gap-1 mb-1.5">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: `hsl(${preset.colors.primary})` }} />
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: `hsl(${preset.colors.accent || preset.colors.primary})` }} />
                  </div>
                  <p className="text-[10px] font-medium truncate">{preset.name}</p>
                  <span className={`text-[8px] uppercase ${preset.mode === 'light' ? 'text-amber-500' : 'text-blue-400'}`}>
                    {preset.mode}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <ColorField id="primaryColor" label={t('theme.primary_color')} value={primaryColor} onChange={setPrimaryColor} placeholder="198 100% 65%" />
          <ColorField id="backgroundColor" label={t('theme.background_color')} value={backgroundColor} onChange={setBackgroundColor} placeholder="0 0% 13%" />
          <ColorField id="cardColor" label={t('theme.card_color')} value={cardColor} onChange={setCardColor} placeholder="0 0% 15%" />
          <ColorField id="sidebarColor" label={t('theme.sidebar_color')} value={sidebarColor} onChange={setSidebarColor} placeholder="0 0% 13.3%" />
          <ColorField id="accentColor" label={t('theme.accent_color')} value={accentColor} onChange={setAccentColor} placeholder="0 100% 65%" />
          <p className="text-xs text-muted-foreground">
            {t.rich('theme.hsl_format_hint', { code: (chunks) => <code>{chunks}</code> })}
          </p>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="layout" title={t('layout.title')} description={t('layout.description')} storageKey="layout">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('layout.sidebar_width')}</Label>
            <div className="flex gap-2">
              {([{ v: 'narrow', l: t('layout.sidebar_width_narrow') }, { v: 'normal', l: t('layout.sidebar_width_normal') }, { v: 'wide', l: t('layout.sidebar_width_wide') }] as const).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setSidebarWidth(opt.v)}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    sidebarWidth === opt.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('layout.header_style')}</Label>
            <div className="flex gap-2">
              {([{ v: 'compact', l: t('layout.header_style_compact') }, { v: 'expanded', l: t('layout.header_style_expanded') }, { v: 'minimal', l: t('layout.header_style_minimal') }] as const).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setHeaderStyle(opt.v)}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    headerStyle === opt.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
          <ElasticSlider3D
            label={t('layout.articles_per_row')}
            defaultValue={articlesPerRow}
            startingValue={1}
            maxValue={6}
            showValue
            onValueChange={setArticlesPerRow}
          />
          <div className="space-y-2">
            <Select3D label={t('layout.border_radius')} value={borderRadius} options={[
              {value: '', label: t('layout.border_radius_default')},
              {value: '0.25rem', label: t('layout.border_radius_small')},
              {value: '0.5rem', label: t('layout.border_radius_medium')},
              {value: '0.75rem', label: t('layout.border_radius_large')},
              {value: '1rem', label: t('layout.border_radius_extra')},
            ]} onChange={(v) => setBorderRadius(v)} />
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              {t('layout.game_cards_title')}
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              {t('layout.game_cards_description')}
            </p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{t('layout.format_label')}</Label>
                <SelectCard
                  options={[
                    { value: 'grid', label: t('layout.format_grid'), icon: <LayoutGrid /> },
                    { value: 'list', label: t('layout.format_list'), icon: <List /> },
                    { value: 'carousel', label: t('layout.format_carousel'), icon: <Layers /> },
                    { value: 'carousel_infinite', label: t('layout.format_carousel_infinite'), icon: <Layers /> },
                  ]}
                  value={gameTableDisplayFormat}
                  onChange={(v) => setGameTableDisplayFormat(v as string)}
                  layout="grid"
                  columns={4}
                  size="sm"
                />
              </div>

              <ElasticSlider3D
                label={t('layout.columns_label')}
                defaultValue={gameTableColumnsCount}
                startingValue={2}
                maxValue={5}
                showValue
                onValueChange={setGameTableColumnsCount}
              />

              <div className="flex items-center gap-3">
                <Label htmlFor="gameTableTabs" className="shrink-0">{t('layout.tabs_mode')}</Label>
                <Switch
                  id="gameTableTabs"
                  checked={gameTableTabsEnabled}
                  onCheckedChange={setGameTableTabsEnabled}
                />
              </div>

              {gameTableTabsEnabled && (
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  <Label>{t('layout.tabs_subformat')}</Label>
                  <div className="flex gap-2">
                    {[
                      { v: 'list', l: t('layout.tabs_subformat_list') },
                      { v: 'carousel', l: t('layout.tabs_subformat_carousel') },
                      { v: 'grid', l: t('layout.tabs_subformat_grid') },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setGameTableTabsSubFormat(opt.v)}
                        className={`flex-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                          gameTableTabsSubFormat === opt.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                        }`}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              {t('layout.game_tables_title')}
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              {t('layout.game_tables_description')}
            </p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{t('layout.format_label')}</Label>
                <SelectCard
                  options={[
                    { value: 'grid', label: t('layout.format_grid'), icon: <LayoutGrid /> },
                    { value: 'list', label: t('layout.format_list'), icon: <List /> },
                    { value: 'carousel', label: t('layout.format_carousel'), icon: <Layers /> },
                    { value: 'table', label: t('layout.format_table'), icon: <Database /> },
                  ]}
                  value={listingDisplayFormat}
                  onChange={(v) => setListingDisplayFormat(v as string)}
                  layout="grid"
                  columns={4}
                  size="sm"
                />
              </div>

              <ElasticSlider3D
                label={t('layout.columns_label')}
                defaultValue={listingColumnsCount}
                startingValue={1}
                maxValue={5}
                showValue
                onValueChange={setListingColumnsCount}
              />

              <ElasticSlider3D
                label={t('layout.items_per_page')}
                defaultValue={listingItemsPerPage}
                startingValue={5}
                maxValue={100}
                isStepped
                stepSize={5}
                showValue
                onValueChange={setListingItemsPerPage}
              />

              <div className="space-y-2">
                <Label>{t('layout.pagination')}</Label>
                <div className="flex gap-2">
                  {[
                    { v: 'paginated', l: t('layout.pagination_paginated') },
                    { v: 'infinite-scroll', l: t('layout.pagination_infinite_scroll') },
                    { v: 'none', l: t('layout.pagination_none') },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setListingPagination(opt.v)}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        listingPagination === opt.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="listingSearch" className="text-xs">{t('layout.show_search')}</Label>
                <Switch id="listingSearch" checked={listingShowSearch} onCheckedChange={setListingShowSearch} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="listingFilters" className="text-xs">{t('layout.show_filters')}</Label>
                <Switch id="listingFilters" checked={listingShowFilters} onCheckedChange={setListingShowFilters} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="listingHeader" className="text-xs">{t('layout.show_header')}</Label>
                <Switch id="listingHeader" checked={listingShowHeader} onCheckedChange={setListingShowHeader} />
              </div>

              <div className="space-y-2">
                <Label>Layout dos cards</Label>
                <div className="flex gap-2">
                  {[
                    { v: 'card', l: 'Card' },
                    { v: 'accordion', l: 'Acordeão' },
                    { v: 'list', l: 'Lista' },
                    { v: 'table', l: 'Tabela' },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setListingCardLayout(opt.v)}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        listingCardLayout === opt.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('layout.card_style')}</Label>
                <div className="flex gap-2">
                  {[
                    { v: 'default', l: t('layout.card_style_default') },
                    { v: 'compact', l: t('layout.card_style_compact') },
                    { v: 'detailed', l: t('layout.card_style_detailed') },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setListingCardStyle(opt.v)}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        listingCardStyle === opt.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('layout.hover_effect')}</Label>
                <div className="flex gap-2">
                  {[
                    { v: 'scale', l: t('layout.hover_effect_scale') },
                    { v: 'glow', l: t('layout.hover_effect_glow') },
                    { v: 'shadow', l: t('layout.hover_effect_shadow') },
                    { v: 'none', l: t('layout.hover_effect_none') },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setListingHoverEffect(opt.v)}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        listingHoverEffect === opt.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              {t('layout.articles_title')}
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              {t('layout.articles_description')}
            </p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{t('layout.format_label')}</Label>
                <SelectCard
                  options={[
                    { value: 'grid', label: t('layout.article_format_grid'), icon: <LayoutGrid /> },
                    { value: 'list', label: t('layout.article_format_list'), icon: <List /> },
                    { value: 'carousel', label: t('layout.article_format_carousel'), icon: <Layers /> },
                    { value: 'carousel_infinite', label: t('layout.article_format_carousel_infinite'), icon: <Layers /> },
                  ]}
                  value={articleDisplayFormat}
                  onChange={(v) => setArticleDisplayFormat(v as string)}
                  layout="grid"
                  columns={4}
                  size="sm"
                />
              </div>

              <ElasticSlider3D
                label={t('layout.columns_label')}
                defaultValue={articleColumnsCount}
                startingValue={1}
                maxValue={6}
                showValue
                onValueChange={setArticleColumnsCount}
              />

              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="articleImages" className="text-xs">{t('layout.show_images')}</Label>
                <Switch id="articleImages" checked={articleShowImages} onCheckedChange={setArticleShowImages} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="articleSummaries" className="text-xs">{t('layout.show_summaries')}</Label>
                <Switch id="articleSummaries" checked={articleShowSummaries} onCheckedChange={setArticleShowSummaries} />
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="fonts" title={t('fonts.title')} description={t('fonts.description')} storageKey="fonts">
        <div className="space-y-4">
          <div className="space-y-2">
            <Select3D label={t('fonts.primary')} value={fontFamily} options={[
              {value: '', label: t('fonts.primary_default_option')},
              {value: 'Inter, ui-sans-serif, system-ui, sans-serif', label: t('fonts.options.inter')},
              {value: 'ui-serif, Georgia, serif', label: t('fonts.options.serif')},
              {value: 'ui-monospace, SFMono-Regular, monospace', label: t('fonts.options.mono')},
              {value: "'Poppins', sans-serif", label: t('fonts.options.poppins')},
              {value: "'Open Sans', sans-serif", label: t('fonts.options.open_sans')},
              {value: "'Roboto', sans-serif", label: t('fonts.options.roboto')},
            ]} onChange={(v) => setFontFamily(v)} />
          </div>
          <div className="space-y-2">
            <Select3D label={t('fonts.heading')} value={headingFont} options={[
              {value: '', label: t('fonts.heading_default_option')},
              {value: 'Inter, ui-sans-serif, system-ui, sans-serif', label: t('fonts.options.inter')},
              {value: 'ui-serif, Georgia, serif', label: t('fonts.options.serif')},
              {value: "'Poppins', sans-serif", label: t('fonts.options.poppins')},
              {value: "'Roboto', sans-serif", label: t('fonts.options.roboto')},
              {value: "'Montserrat', sans-serif", label: t('fonts.options.montserrat')},
            ]} onChange={(v) => setHeadingFont(v)} />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="pages" title={t('pages.title')} description={t('pages.description')} storageKey="pages">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {t('pages.editor_hint')}
          </p>
          <div className="flex flex-col gap-2">
            <a href={`/dashboard/${slug}/page-builder?type=footer`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Image className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{t('pages.footer')}</p>
                <p className="text-xs text-muted-foreground">{t('pages.footer_desc')}</p>
              </div>
            </a>
            <a href={`/dashboard/${slug}/page-builder?type=404`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{t('pages.page_404')}</p>
                <p className="text-xs text-muted-foreground">{t('pages.page_404_desc')}</p>
              </div>
            </a>
            <a href={`/dashboard/${slug}/page-builder?type=landing`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{t('pages.landing')}</p>
                <p className="text-xs text-muted-foreground">{t('pages.landing_desc')}</p>
              </div>
            </a>
            <a href={`/dashboard/${slug}/page-builder?type=landing`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{t('pages.floating_islands')}</p>
                <p className="text-xs text-muted-foreground">{t('pages.floating_islands_desc')}</p>
              </div>
            </a>
            <a href={`/dashboard/${slug}/page-builder?type=game-tables`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{t('pages.tables')}</p>
                <p className="text-xs text-muted-foreground">{t('pages.tables_desc')}</p>
              </div>
            </a>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="links" title={t('links.title')} description={t('links.description')} storageKey="links">
        <div className="space-y-4">
          <FloatingLabelInput
            label={t('links.discord')}
            type="url"
            info={t('links.discord_info')}
            value={discordUrl}
            onChange={(e) => setDiscordUrl(e.target.value)}
          />
          <FloatingLabelInput
            label={t('links.game')}
            type="url"
            info={t('links.game_info')}
            value={gameUrl}
            onChange={(e) => setGameUrl(e.target.value)}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="danger-zone" title={t('danger_zone.title')} description={t('danger_zone.description')} className="border-destructive/50" storageKey="danger-zone">
        <DeleteWikiSection slug={slug} tenantName={name} />
      </CollapsibleSection>

    </div>

      <MediaLibrary
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        tenantId={tenantState?.id}
        onSelect={(url) => {
          mediaLibrarySetter.current?.(url);
          setMediaLibraryOpen(false);
        }}
        bucket="wiki-images"
        pathPrefix={mediaLibraryPathPrefix.current}
      />
    </>
  );
}

function hslToHex(hsl: string): string {
  if (!hsl) return '#000000';
  const parts = hsl.split(' ');
  if (parts.length < 3) return '#000000';
  const h = parseInt(parts[0]) || 0;
  const s = parseInt(parts[1]) || 0;
  const l = parseInt(parts[2]) || 0;
  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function DeleteWikiSection({ slug, tenantName }: { slug: string; tenantName: string }) {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();
  const { isOwner, isLoading: roleLoading } = useTenantRole(slug);
  const [step, setStep] = useState<'hidden' | 'warning' | 'backup' | 'confirm'>('hidden');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [backupData, setBackupData] = useState<any>(null);

  const handleBackup = async () => {
    try {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('*, custom_collections(*, collection_items(*)), wiki_articles(*), page_layouts(*)')
        .eq('slug', slug)
        .single();

      if (tenant) {
        setBackupData(tenant);
        const blob = new Blob([JSON.stringify(tenant, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${slug}-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      toast({ variant: 'destructive', title: tc('error'), description: t('danger_zone.backup_failed') });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/tenants/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ variant: 'destructive', title: tc('error'), description: data.error || t('danger_zone.delete_failed') });
        setDeleting(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      toast({ variant: 'destructive', title: tc('error'), description: t('danger_zone.delete_failed') });
      setDeleting(false);
    }
  };

  if (roleLoading) return null;
  if (!isOwner) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4" />
        {t('danger_zone.owner_only')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {step === 'hidden' && (
        <Button variant="destructive" onClick={() => setStep('warning')}>
          <Trash2 className="h-4 w-4 mr-2" />
          {t('danger_zone.delete_button')}
        </Button>
      )}

      {step === 'warning' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t.rich('danger_zone.warning_text', { name: tenantName, strong: (chunks) => <strong>{chunks}</strong> })}
            {t('danger_zone.irreversible')}
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>{t('danger_zone.consequence_articles')}</li>
            <li>{t('danger_zone.consequence_collections')}</li>
            <li>{t('danger_zone.consequence_domain')}</li>
            <li>{t('danger_zone.consequence_members')}</li>
          </ul>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep('hidden')}>{tc('cancel')}</Button>
            <Button variant="destructive" onClick={() => setStep('backup')}>{tc('continue')}</Button>
          </div>
        </div>
      )}

      {step === 'backup' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('danger_zone.backup_hint')}
          </p>
          <Button variant="outline" onClick={handleBackup}>
            <Download className="h-4 w-4 mr-2" />
            {backupData ? t('danger_zone.download_again') : t('danger_zone.download_backup')}
          </Button>
          {backupData && (
            <p className="text-xs text-green-500">{t('danger_zone.backup_downloaded')}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep('warning')}>{tc('back')}</Button>
            <Button
              variant="destructive"
              onClick={() => setStep('confirm')}
            >
              {backupData ? t('danger_zone.proceed_to_delete') : t('danger_zone.skip_backup_and_delete')}
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-destructive">
            {t.rich('danger_zone.confirm_instruction', { slug, strong: (chunks) => <strong>{chunks}</strong> })}
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={slug}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setStep('hidden'); setConfirmText(''); }}>
              {tc('cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== slug || deleting}
              onClick={handleDelete}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {deleting ? t('danger_zone.deleting') : t('danger_zone.confirm_delete')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const PRESET_COLORS: { key: string; hsl: string }[] = [
  { key: 'cyan', hsl: '198 100% 65%' },
  { key: 'blue', hsl: '217 100% 65%' },
  { key: 'purple', hsl: '270 100% 65%' },
  { key: 'pink', hsl: '330 100% 65%' },
  { key: 'red', hsl: '0 100% 65%' },
  { key: 'orange', hsl: '25 100% 60%' },
  { key: 'yellow', hsl: '50 100% 55%' },
  { key: 'green', hsl: '140 100% 50%' },
  { key: 'lime', hsl: '80 100% 50%' },
  { key: 'gray', hsl: '0 0% 60%' },
];

function ColorField({
  id, label, value, onChange, placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const t = useTranslations('settings');
  const hexValue = hslToHex(value || '');
  void id;

  return (
    <div>
      <div className="flex gap-2 items-center">
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="h-9 w-9 rounded-md border shrink-0 flex items-center justify-center hover:ring-2 hover:ring-primary/50 transition-shadow"
              style={{ backgroundColor: value ? `hsl(${value})` : 'transparent' }}
            >
              {!value && <Pipette className="h-4 w-4 text-muted-foreground" />}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="bottom"
              align="start"
              sideOffset={4}
              className="z-50 w-64 rounded-lg border bg-card p-3 shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hexValue}
                    onChange={(e) => onChange(hexToHsl(e.target.value))}
                    className="h-8 w-8 rounded cursor-pointer border bg-transparent p-0.5"
                  />
                  <span className="text-xs text-muted-foreground">{t('theme.color_picker')}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('theme.preset_colors')}</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.hsl}
                        type="button"
                        onClick={() => onChange(preset.hsl)}
                        className="h-7 w-full rounded border hover:ring-2 hover:ring-primary/50 transition-shadow"
                        style={{ backgroundColor: `hsl(${preset.hsl})` }}
                        title={t(`theme.presets.${preset.key}`)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <div className="flex-1">
          <FloatingLabelInput
            label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || '198 100% 65%'}
            containerClassName="flex-1"
            className="font-mono text-xs"
          />
        </div>
        {value && (
          <div
            className="h-8 w-8 rounded-full border shrink-0"
            style={{ backgroundColor: `hsl(${value})` }}
          />
        )}
      </div>
    </div>
  );
}
