'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Check, Info, Image, ImageUp, MessageCircle, Gamepad2, LayoutGrid, Type, FileText } from 'lucide-react';
import { PageSubNav } from '@/components/dashboard/page-subnav';

export default function WikiSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { toast } = useToast();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const initialRef = useRef({ name: '', description: '', logoUrl: '', coverImageUrl: '', discordUrl: '', gameUrl: '', faviconUrl: '', ogImage: '', primaryColor: '198 100% 65%' });
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
  const [footerContent, setFooterContent] = useState('');
  const [custom404Enabled, setCustom404Enabled] = useState(false);
  const [custom404Content, setCustom404Content] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) {
          console.error('Load error:', error);
          toast({ variant: 'destructive', title: 'Erro ao carregar', description: error.message });
          setLoading(false);
          return;
        }

        if (data) {
          setTenant(data);
          setName(data.name);
          setDescription(data.description || '');
          setLogoUrl(data.logo_url || '');
          setCoverImageUrl(data.cover_image || '');
          setDiscordUrl(data.discord_url || '');
          setGameUrl(data.game_url || '');
          setFaviconUrl(data.favicon_url || '');
          setOgImage(data.og_image || '');
          const theme = (data.theme as Record<string, any>) || {};
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
          setFooterContent(theme.footer_content || '');
          setCustom404Enabled(theme.custom_404_enabled || false);
          setCustom404Content(theme.custom_404_content || '');
          initialRef.current = {
            name: data.name,
            description: data.description || '',
            logoUrl: data.logo_url || '',
            coverImageUrl: data.cover_image || '',
            discordUrl: data.discord_url || '',
            gameUrl: data.game_url || '',
            faviconUrl: data.favicon_url || '',
            ogImage: data.og_image || '',
            primaryColor: theme.primary_color || '198 100% 65%',
          };
        }
        setLoading(false);
      } catch (err) {
        console.error('Unexpected load error:', err);
        toast({ variant: 'destructive', title: 'Erro de rede', description: 'Não foi possível carregar as configurações.' });
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
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
            footer_content: footerContent || null,
            custom_404_enabled: custom404Enabled,
            custom_404_content: custom404Content || null,
          },
        })
        .eq('slug', slug);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
      } else {
        const savedTheme = { primary_color: primaryColor };
        initialRef.current = { name, description, logoUrl, coverImageUrl, discordUrl, gameUrl, faviconUrl, ogImage, primaryColor };
        setSavedFeedback(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setSavedFeedback(false), 3000);
      }
    } catch (err) {
      console.error('Save error:', err);
      toast({ variant: 'destructive', title: 'Erro inesperado', description: 'Não foi possível salvar. Verifique sua conexão e tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return <p className="text-muted-foreground">Wiki não encontrada.</p>;
  }

  const isDirty =
    name !== initialRef.current.name ||
    description !== initialRef.current.description ||
    logoUrl !== initialRef.current.logoUrl ||
    coverImageUrl !== initialRef.current.coverImageUrl ||
    discordUrl !== initialRef.current.discordUrl ||
    gameUrl !== initialRef.current.gameUrl ||
    faviconUrl !== initialRef.current.faviconUrl ||
    ogImage !== initialRef.current.ogImage ||
    primaryColor !== initialRef.current.primaryColor;

  const sections = [
    { id: 'basic-info', label: 'Informações Básicas', icon: Info },
    { id: 'logo', label: 'Logo', icon: Image },
    { id: 'cover', label: 'Capa', icon: ImageUp },
    { id: 'favicon', label: 'Favicon', icon: Image },
    { id: 'og-image', label: 'OG Image', icon: ImageUp },
    { id: 'theme', label: 'Tema', icon: Image },
    { id: 'layout', label: 'Layout', icon: LayoutGrid },
    { id: 'fonts', label: 'Fontes', icon: Type },
    { id: 'branding', label: 'Branding', icon: Image },
    { id: 'custom-404', label: 'Página 404', icon: FileText },
    { id: 'links', label: 'Links', icon: MessageCircle },
  ];

  return (
    <div className="flex">
      <PageSubNav sections={sections} />
      <div className="flex-1 min-w-0 p-6 max-w-2xl mx-auto space-y-6">

      <section id="basic-info">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Nome e descrição da sua wiki.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Identificador (slug)</Label>
            <Input id="slug" value={slug} disabled />
            <p className="text-xs text-muted-foreground">O slug não pode ser alterado.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Descrição</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
      </section>

      <section id="logo">
      <Card>
        <CardHeader>
          <CardTitle>Logo da Wiki</CardTitle>
          <CardDescription>Imagem de perfil da sua wiki.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload
            bucket="wiki-images"
            pathPrefix={`wiki-logos/${slug}`}
            value={logoUrl}
            onChange={setLogoUrl}
            previewSize="w-20 h-20"
          />
          <p className="text-xs text-muted-foreground mt-2">JPEG, PNG ou GIF. Tamanho recomendado: 256x256.</p>
        </CardContent>
      </Card>
      </section>

      <section id="cover">
      <Card>
        <CardHeader>
          <CardTitle>Capa da Wiki</CardTitle>
          <CardDescription>Imagem de capa da sua wiki.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload
            bucket="wiki-images"
            pathPrefix={`wiki-covers/${slug}`}
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            previewSize="w-40 h-24"
          />
          <p className="text-xs text-muted-foreground mt-2">JPEG, PNG ou GIF. Tamanho recomendado: 1200x300.</p>
        </CardContent>
      </Card>
      </section>

      <section id="favicon">
      <Card>
        <CardHeader>
          <CardTitle>Favicon</CardTitle>
          <CardDescription>Ícone de aba do navegador para sua wiki.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload
            bucket="wiki-images"
            pathPrefix={`wiki-favicons/${slug}`}
            value={faviconUrl}
            onChange={setFaviconUrl}
            previewSize="w-10 h-10"
          />
          <p className="text-xs text-muted-foreground mt-2">PNG ou SVG. Tamanho recomendado: 32x32.</p>
        </CardContent>
      </Card>
      </section>

      <section id="og-image">
      <Card>
        <CardHeader>
          <CardTitle>OG Image</CardTitle>
          <CardDescription>Imagem de preview para compartilhamento em redes sociais.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload
            bucket="wiki-images"
            pathPrefix={`wiki-og/${slug}`}
            value={ogImage}
            onChange={setOgImage}
            previewSize="w-40 h-24"
          />
          <p className="text-xs text-muted-foreground mt-2">Tamanho recomendado: 1200x630.</p>
        </CardContent>
      </Card>
      </section>

      <section id="theme">
      <Card>
        <CardHeader>
          <CardTitle>Cores do Tema</CardTitle>
          <CardDescription>Personalize as cores da sua wiki (formato HSL).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ColorField id="primaryColor" label="Cor Primária" value={primaryColor} onChange={setPrimaryColor} placeholder="198 100% 65%" />
          <ColorField id="backgroundColor" label="Cor de Fundo" value={backgroundColor} onChange={setBackgroundColor} placeholder="0 0% 13%" />
          <ColorField id="cardColor" label="Cor dos Cards" value={cardColor} onChange={setCardColor} placeholder="0 0% 15%" />
          <ColorField id="sidebarColor" label="Cor da Sidebar" value={sidebarColor} onChange={setSidebarColor} placeholder="0 0% 13.3%" />
          <ColorField id="accentColor" label="Cor de Destaque" value={accentColor} onChange={setAccentColor} placeholder="0 100% 65%" />
          <p className="text-xs text-muted-foreground">
            Formato: <code>hue saturation% lightness%</code>. Deixe vazio para usar o valor padrão.
          </p>
        </CardContent>
      </Card>
      </section>

      <section id="layout">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Layout da Wiki
          </CardTitle>
          <CardDescription>Configure a aparência estrutural da sua wiki.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
      </section>

      <section id="fonts">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Fontes
          </CardTitle>
          <CardDescription>Escolha as fontes da sua wiki.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
      </section>

      <section id="branding">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Branding
          </CardTitle>
          <CardDescription>Personalize elementos extras de marca.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="footerContent">Footer Customizado (HTML)</Label>
            <textarea
              id="footerContent"
              value={footerContent}
              onChange={(e) => setFooterContent(e.target.value)}
              rows={3}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="<p>© 2024 Minha Wiki. Todos os direitos reservados.</p>"
            />
            <p className="text-xs text-muted-foreground">HTML simples exibido no rodapé de todas as páginas da wiki.</p>
          </div>
        </CardContent>
      </Card>
      </section>

      <section id="custom-404">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Página 404 Personalizada
          </CardTitle>
          <CardDescription>Substitua a página de erro padrão.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Ativar Página 404 Personalizada</p>
              <p className="text-xs text-muted-foreground">Quando desativado, usa a página padrão do sistema.</p>
            </div>
            <input
              type="checkbox"
              checked={custom404Enabled}
              onChange={(e) => setCustom404Enabled(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300"
            />
          </div>
          {custom404Enabled && (
            <div className="space-y-2">
              <Label htmlFor="custom404Content">Conteúdo da Página 404 (HTML)</Label>
              <textarea
                id="custom404Content"
                value={custom404Content}
                onChange={(e) => setCustom404Content(e.target.value)}
                rows={4}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="<h2>Oops! Página não encontrada</h2><p>O conteúdo que você procura não existe.</p>"
              />
            </div>
          )}
        </CardContent>
      </Card>
      </section>

      <section id="links">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Links Sociais
          </CardTitle>
          <CardDescription>Links para o Discord e página do jogo (Roblox).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discordUrl">Link do Discord</Label>
            <Input
              id="discordUrl"
              type="url"
              value={discordUrl}
              onChange={(e) => setDiscordUrl(e.target.value)}
              placeholder="https://discord.gg/seu-convite"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gameUrl">Link do Jogo (Roblox)</Label>
            <Input
              id="gameUrl"
              type="url"
              value={gameUrl}
              onChange={(e) => setGameUrl(e.target.value)}
              placeholder="https://www.roblox.com/games/..."
            />
          </div>
        </CardContent>
      </Card>
      </section>

      {savedFeedback ? (
        <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
          <Check className="h-4 w-4" />
          Configurações salvas!
        </div>
      ) : isDirty ? (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
      ) : null}
      </div>
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
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-3 items-center">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '198 100% 65%'}
        />
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
