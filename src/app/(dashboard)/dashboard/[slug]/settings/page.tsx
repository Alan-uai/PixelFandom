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
import { Loader2, Save, Check, Info, Image, ImageUp, MessageCircle, Gamepad2 } from 'lucide-react';
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
  const initialRef = useRef({ name: '', description: '', logoUrl: '', coverImageUrl: '', discordUrl: '', gameUrl: '' });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [gameUrl, setGameUrl] = useState('');

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
          initialRef.current = {
            name: data.name,
            description: data.description || '',
            logoUrl: data.logo_url || '',
            coverImageUrl: data.cover_image || '',
            discordUrl: data.discord_url || '',
            gameUrl: data.game_url || '',
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
        .update({ name, description, logo_url: logoUrl || null, cover_image: coverImageUrl || null, discord_url: discordUrl || null, game_url: gameUrl || null })
        .eq('slug', slug);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
      } else {
        initialRef.current = { name, description, logoUrl, coverImageUrl, discordUrl, gameUrl };
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
    gameUrl !== initialRef.current.gameUrl;

  const sections = [
    { id: 'basic-info', label: 'Informações Básicas', icon: Info },
    { id: 'logo', label: 'Logo', icon: Image },
    { id: 'cover', label: 'Capa', icon: ImageUp },
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
