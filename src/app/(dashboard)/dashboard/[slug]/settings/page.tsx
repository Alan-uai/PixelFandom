'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Upload, ImageIcon } from 'lucide-react';
import type { Tenant } from '@/supabase/client';
import { ensureStorageBuckets } from '@/lib/storage';

export default function WikiSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { toast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        if (data) {
          setTenant(data);
          setName(data.name);
          setDescription(data.description || '');
          setLogoUrl(data.logo_url || '');
          setCoverImageUrl((data as any).cover_image || '');
        }
        setLoading(false);
      });
  }, [slug]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      await ensureStorageBuckets();
      const filePath = `wiki-logos/${slug}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('wiki-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('wiki-images')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      toast({ title: 'Logo enviado!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro no upload', description: error.message });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      await ensureStorageBuckets();
      const filePath = `wiki-covers/${slug}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('wiki-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('wiki-images')
        .getPublicUrl(filePath);

      setCoverImageUrl(publicUrl);
      toast({ title: 'Capa enviada!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro no upload', description: error.message });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('tenants')
      .update({ name, description, logo_url: logoUrl || null, cover_image: coverImageUrl || null })
      .eq('slug', slug);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Salvo!', description: 'Configurações atualizadas.' });
    }
    setSaving(false);
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Configure o nome, descrição e identidade visual da wiki.
        </p>
      </div>

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
          <div className="space-y-2">
            <Label>Logo da Wiki</Label>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-lg border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="object-cover w-full h-full" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {uploadingLogo ? 'Enviando...' : 'Enviar Logo'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG ou GIF. Tamanho recomendado: 256x256.
                </p>
              </div>
            </div>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">URL do Logo</Label>
              <Input
                id="logo"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://exemplo.com/logo.png"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Capa da Wiki</Label>
            <div className="flex items-start gap-4">
              <div className="w-40 h-24 rounded-lg border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                {coverImageUrl ? (
                  <img src={coverImageUrl} alt="Capa" className="object-cover w-full h-full" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverUpload}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                >
                  {uploadingCover ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {uploadingCover ? 'Enviando...' : 'Enviar Capa'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG ou GIF. Tamanho recomendado: 1200x300.
                </p>
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
