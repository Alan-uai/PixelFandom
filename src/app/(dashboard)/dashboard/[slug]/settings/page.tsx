'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { useCachedData } from '@/hooks/use-cached-data';
import { useSiteCache } from '@/lib/site-cache';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import * as Popover from '@radix-ui/react-popover';
import { useToast } from '@/hooks/use-toast';
import { SelectCard } from '@/components/ui/select-card';
import { Loader2, Info, Image, ImageUp, MessageCircle, Gamepad2, LayoutGrid, List, Type, FileText, Pipette, AlertTriangle, Trash2, Download, LayoutDashboard, Layers, Database, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTenantRole } from '@/hooks/use-tenant-role';
import { useRegisterUnsavedChanges } from '@/components/unsaved-changes';
import { THEME_PRESETS, applyThemePreset } from '@/lib/theme-presets';

export default function WikiSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
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
  }>({
    name: '', description: '', logoUrl: '', coverImageUrl: '',
    discordUrl: '', gameUrl: '', faviconUrl: '', ogImage: '',
    primaryColor: '198 100% 65%', backgroundColor: '', cardColor: '', sidebarColor: '', accentColor: '',
    fontFamily: '', headingFont: '', borderRadius: '',
    sidebarWidth: 'normal', headerStyle: 'compact', articlesPerRow: 3,
    gameTableDisplayFormat: 'grid', gameTableColumnsCount: 4,
    gameTableTabsEnabled: false, gameTableTabsSubFormat: 'list',
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
  const [gameTableCatalog, setGameTableCatalog] = useState<{ table_name: string; display_label: string; icon?: string | null }[]>([]);
  const [gameTableDisplayFormat, setGameTableDisplayFormat] = useState('grid');
  const [gameTableColumnsCount, setGameTableColumnsCount] = useState(4);
  const [gameTableTabsEnabled, setGameTableTabsEnabled] = useState(false);
  const [gameTableTabsSubFormat, setGameTableTabsSubFormat] = useState('list');

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
    supabase
      .from('tenant_game_tables')
      .select('table_name, display_label, icon')
      .eq('tenant_id', (tenant as any).id)
      .order('created_at')
      .then(({ data }) => {
        if (data) setGameTableCatalog(data);
      });
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
            widgets: {},
          },
        })
        .eq('slug', slug);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
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
          widgets: {},
        },
      });
    } catch (err) {
      if (!(err as any)?.message?.includes?.('supabase')) toast({ variant: 'destructive', title: 'Erro inesperado', description: 'Não foi possível salvar.' });
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
    gameTableTabsSubFormat !== savedConfig.gameTableTabsSubFormat;

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
    return <p className="text-muted-foreground">Wiki não encontrada.</p>;
  }

  const sections = [
    { id: 'basic-info', label: 'Informações Básicas', icon: Info },
    { id: 'media', label: 'Mídia', icon: Image },
    { id: 'theme', label: 'Cores do Tema', icon: Pipette },
    { id: 'layout', label: 'Layout', icon: LayoutGrid },
    { id: 'fonts', label: 'Fontes', icon: Type },
    { id: 'pages', label: 'Páginas', icon: FileText },
    { id: 'links', label: 'Links', icon: MessageCircle },
    { id: 'danger-zone', label: 'Zona Perigosa', icon: AlertTriangle },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      <CollapsibleSection id="basic-info" title="Informações Básicas" description="Nome e descrição da sua wiki.">
        <div className="space-y-4">
          <FloatingLabelInput
            label="Nome"
            info="Nome público da sua wiki"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <FloatingLabelTextarea
            label="Descrição"
            info="Uma breve descrição da sua wiki"
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

      <CollapsibleSection id="media" title="Mídia" description="Logo, capa, favicon e OG Image da sua wiki." defaultOpen={false}>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Logo da Wiki</h4>
            <p className="text-xs text-muted-foreground mb-2">Imagem de perfil da sua wiki.</p>
            <ImageUpload bucket="wiki-images" pathPrefix={`wiki-logos/${slug}`} value={logoUrl} onChange={setLogoUrl} label="Logo da Wiki" previewSize="w-20 h-20" />
            <p className="text-xs text-muted-foreground mt-2">JPEG, PNG ou GIF. Tamanho recomendado: 256x256.</p>
          </div>
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Capa da Wiki</h4>
            <p className="text-xs text-muted-foreground mb-2">Imagem de capa da sua wiki.</p>
            <ImageUpload bucket="wiki-images" pathPrefix={`wiki-covers/${slug}`} value={coverImageUrl} onChange={setCoverImageUrl} label="Capa da Wiki" previewSize="w-40 h-24" />
            <p className="text-xs text-muted-foreground mt-2">JPEG, PNG ou GIF. Tamanho recomendado: 1200x300.</p>
          </div>
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Favicon</h4>
            <p className="text-xs text-muted-foreground mb-2">Ícone de aba do navegador para sua wiki.</p>
            <ImageUpload bucket="wiki-images" pathPrefix={`wiki-favicons/${slug}`} value={faviconUrl} onChange={setFaviconUrl} label="Favicon" previewSize="w-10 h-10" />
            <p className="text-xs text-muted-foreground mt-2">PNG ou SVG. Tamanho recomendado: 32x32.</p>
          </div>
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">OG Image</h4>
            <p className="text-xs text-muted-foreground mb-2">Imagem de preview para compartilhamento em redes sociais.</p>
            <ImageUpload bucket="wiki-images" pathPrefix={`wiki-og/${slug}`} value={ogImage} onChange={setOgImage} label="OG Image" previewSize="w-40 h-24" />
            <p className="text-xs text-muted-foreground mt-2">Tamanho recomendado: 1200x630.</p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="theme" title="Cores do Tema" description="Personalize as cores da sua wiki (formato HSL).">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium mb-2">Presets de Tema</p>
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
          <ColorField id="primaryColor" label="Cor Primária" value={primaryColor} onChange={setPrimaryColor} placeholder="198 100% 65%" />
          <ColorField id="backgroundColor" label="Cor de Fundo" value={backgroundColor} onChange={setBackgroundColor} placeholder="0 0% 13%" />
          <ColorField id="cardColor" label="Cor dos Cards" value={cardColor} onChange={setCardColor} placeholder="0 0% 15%" />
          <ColorField id="sidebarColor" label="Cor da Sidebar" value={sidebarColor} onChange={setSidebarColor} placeholder="0 0% 13.3%" />
          <ColorField id="accentColor" label="Cor de Destaque" value={accentColor} onChange={setAccentColor} placeholder="0 100% 65%" />
          <p className="text-xs text-muted-foreground">
            Formato: <code>hue saturation% lightness%</code>. Deixe vazio para usar o valor padrão.
          </p>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="layout" title="Layout da Wiki" description="Configure a aparência estrutural da sua wiki.">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Largura da Sidebar</Label>
            <div className="flex gap-2">
              {([{ v: 'narrow', l: 'Estreita' }, { v: 'normal', l: 'Normal' }, { v: 'wide', l: 'Larga' }] as const).map((opt) => (
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
            <Label>Estilo do Header</Label>
            <div className="flex gap-2">
              {([{ v: 'compact', l: 'Compacto' }, { v: 'expanded', l: 'Expandido' }, { v: 'minimal', l: 'Mínimo' }] as const).map((opt) => (
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
          <div className="space-y-2">
            <Label htmlFor="articlesPerRow">Artigos por Linha ({articlesPerRow})</Label>
            <input
              id="articlesPerRow"
              type="range"
              min={1}
              max={6}
              value={articlesPerRow}
              onChange={(e) => setArticlesPerRow(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1</span>
              <span>6</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="borderRadius">Arredondamento (border-radius)</Label>
            <select
              id="borderRadius"
              value={borderRadius}
              onChange={(e) => setBorderRadius(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Padrão (0.5rem)</option>
              <option value="0.25rem">Pequeno (0.25rem)</option>
              <option value="0.5rem">Médio (0.5rem)</option>
              <option value="0.75rem">Grande (0.75rem)</option>
              <option value="1rem">Extra (1rem)</option>
            </select>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Game Tables
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Configuração padrão de exibição das game tables. Cada tabela pode sobrescrever no editor.
            </p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Formato de Exibição</Label>
                <SelectCard
                  options={[
                    { value: 'grid', label: 'Grid', icon: <LayoutGrid /> },
                    { value: 'list', label: 'Lista', icon: <List /> },
                    { value: 'carousel', label: 'Carrossel', icon: <Layers /> },
                    { value: 'carousel_infinite', label: 'Carrossel Infinito', icon: <Layers /> },
                  ]}
                  value={gameTableDisplayFormat}
                  onChange={(v) => setGameTableDisplayFormat(v as string)}
                  layout="grid"
                  columns={4}
                  size="sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gameTableColumns">Colunas ({gameTableColumnsCount})</Label>
                <input
                  id="gameTableColumns"
                  type="range"
                  min={2}
                  max={5}
                  value={gameTableColumnsCount}
                  onChange={(e) => setGameTableColumnsCount(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>2</span>
                  <span>5</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Label htmlFor="gameTableTabs" className="shrink-0">Modo Abas (Tabs)</Label>
                <Switch
                  id="gameTableTabs"
                  checked={gameTableTabsEnabled}
                  onCheckedChange={setGameTableTabsEnabled}
                />
              </div>

              {gameTableTabsEnabled && (
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  <Label>Sub-formato das Abas</Label>
                  <div className="flex gap-2">
                    {[
                      { v: 'list', l: 'Lista' },
                      { v: 'carousel', l: 'Carrossel' },
                      { v: 'grid', l: 'Grid' },
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
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="fonts" title="Fontes" description="Escolha as fontes da sua wiki.">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fontFamily">Fonte Principal</Label>
            <select
              id="fontFamily"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Inter (padrão)</option>
              <option value="Inter, ui-sans-serif, system-ui, sans-serif">Inter</option>
              <option value="ui-serif, Georgia, serif">Serif</option>
              <option value="ui-monospace, SFMono-Regular, monospace">Mono</option>
              <option value="'Poppins', sans-serif">Poppins</option>
              <option value="'Open Sans', sans-serif">Open Sans</option>
              <option value="'Roboto', sans-serif">Roboto</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="headingFont">Fonte de Títulos</Label>
            <select
              id="headingFont"
              value={headingFont}
              onChange={(e) => setHeadingFont(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Mesma da principal (padrão)</option>
              <option value="Inter, ui-sans-serif, system-ui, sans-serif">Inter</option>
              <option value="ui-serif, Georgia, serif">Serif</option>
              <option value="'Poppins', sans-serif">Poppins</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Montserrat', sans-serif">Montserrat</option>
            </select>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="pages" title="Páginas" description="Edite visualmente as páginas da sua wiki.">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Use o editor visual de blocos (drag & drop) para personalizar essas páginas.
          </p>
          <div className="flex flex-col gap-2">
            <a href={`/dashboard/${slug}/page-builder?type=footer`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Image className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Footer</p>
                <p className="text-xs text-muted-foreground">Rodapé da wiki</p>
              </div>
            </a>
            <a href={`/dashboard/${slug}/page-builder?type=404`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Página 404</p>
                <p className="text-xs text-muted-foreground">Página de erro personalizada</p>
              </div>
            </a>
            <a href={`/dashboard/${slug}/page-builder?type=landing`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Landing Page</p>
                <p className="text-xs text-muted-foreground">Página inicial da wiki</p>
              </div>
            </a>
            <a href={`/dashboard/${slug}/page-builder?type=landing`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Ilhas Flutuantes</p>
                <p className="text-xs text-muted-foreground">Cronômetros, listas, carrosséis e mais</p>
              </div>
            </a>
            {gameTableCatalog.length > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground pt-2 pb-1">Tabelas da Wiki</p>
                {gameTableCatalog.map((t) => (
                  <a
                    key={t.table_name}
                    href={`/dashboard/${slug}/editor?tab=${t.table_name}&view=viewer`}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.display_label}</p>
                      <p className="text-xs text-muted-foreground">Personalizar visualização da tabela</p>
                    </div>
                  </a>
                ))}
              </>
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="links" title="Links Sociais" description="Links para o Discord e página do jogo (Roblox).">
        <div className="space-y-4">
          <FloatingLabelInput
            label="Link do Discord"
            type="url"
            info="Convite do seu servidor Discord"
            value={discordUrl}
            onChange={(e) => setDiscordUrl(e.target.value)}
          />
          <FloatingLabelInput
            label="Link do Jogo (Roblox)"
            type="url"
            info="URL do seu jogo no Roblox"
            value={gameUrl}
            onChange={(e) => setGameUrl(e.target.value)}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="danger-zone" title="Zona Perigosa" description="Ações destrutivas que afetam toda a wiki." className="border-destructive/50">
        <DeleteWikiSection slug={slug} tenantName={name} />
      </CollapsibleSection>

    </div>
  );
}

const PRESET_COLORS = [
  { label: 'Ciano (padrão)', hsl: '198 100% 65%' },
  { label: 'Azul', hsl: '217 100% 65%' },
  { label: 'Roxo', hsl: '270 100% 65%' },
  { label: 'Rosa', hsl: '330 100% 65%' },
  { label: 'Vermelho', hsl: '0 100% 65%' },
  { label: 'Laranja', hsl: '25 100% 60%' },
  { label: 'Amarelo', hsl: '50 100% 55%' },
  { label: 'Verde', hsl: '140 100% 50%' },
  { label: 'Verde Limão', hsl: '80 100% 50%' },
  { label: 'Cinza', hsl: '0 0% 60%' },
];

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
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao gerar backup.' });
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
        toast({ variant: 'destructive', title: 'Erro', description: data.error || 'Falha ao excluir wiki.' });
        setDeleting(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir wiki.' });
      setDeleting(false);
    }
  };

  if (roleLoading) return null;
  if (!isOwner) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4" />
        Apenas o owner pode excluir a wiki.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {step === 'hidden' && (
        <Button variant="destructive" onClick={() => setStep('warning')}>
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir Wiki
        </Button>
      )}

      {step === 'warning' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Você está prestes a excluir permanentemente a wiki <strong>{tenantName}</strong>.
            Esta ação não pode ser desfeita.
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Todos os artigos serão removidos</li>
            <li>Todas as coleções e dados serão perdidos</li>
            <li>O domínio personalizado será desassociado</li>
            <li>Os membros perderão acesso à wiki</li>
          </ul>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep('hidden')}>Cancelar</Button>
            <Button variant="destructive" onClick={() => setStep('backup')}>Continuar</Button>
          </div>
        </div>
      )}

      {step === 'backup' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Faça um backup dos dados da wiki antes de excluir.
          </p>
          <Button variant="outline" onClick={handleBackup}>
            <Download className="h-4 w-4 mr-2" />
            {backupData ? 'Baixar novamente' : 'Baixar Backup (.json)'}
          </Button>
          {backupData && (
            <p className="text-xs text-green-500">Backup baixado!</p>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setStep('warning')}>Voltar</Button>
            <Button
              variant="destructive"
              onClick={() => setStep('confirm')}
            >
              {backupData ? 'Continuar para exclusão' : 'Pular backup e excluir'}
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-destructive">
            Digite o identificador da wiki (<strong>{slug}</strong>) para confirmar.
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
              Cancelar
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
              {deleting ? 'Excluindo...' : 'Excluir Wiki'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ColorField({
  id, label, value, onChange, placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const hexValue = hslToHex(value || '');

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
                  <span className="text-xs text-muted-foreground">Seletor de cor</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Predefinidas</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.hsl}
                        type="button"
                        onClick={() => onChange(preset.hsl)}
                        className="h-7 w-full rounded border hover:ring-2 hover:ring-primary/50 transition-shadow"
                        style={{ backgroundColor: `hsl(${preset.hsl})` }}
                        title={preset.label}
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
