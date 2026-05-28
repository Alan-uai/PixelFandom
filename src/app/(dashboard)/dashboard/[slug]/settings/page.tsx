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
import { Loader2, Save, Check, Info, Image, ImageUp } from 'lucide-react';
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
  const initialRef = useRef({ name: '', description: '', logoUrl: '', coverImageUrl: '' });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

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
          initialRef.current = {
            name: data.name,
            description: data.description || '',
            logoUrl: data.logo_url || '',
            coverImageUrl: (data as any).cover_image || '',
          };
        }
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('tenants')
      .update({ name, description, logo_url: logoUrl || null, cover_image: coverImageUrl || null })
      .eq('slug', slug);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      initialRef.current = { name, description, logoUrl, coverImageUrl };
      setSavedFeedback(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSavedFeedback(false), 3000);
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

  const isDirty =
    name !== initialRef.current.name ||
    description !== initialRef.current.description ||
    logoUrl !== initialRef.current.logoUrl ||
    coverImageUrl !== initialRef.current.coverImageUrl;

  const sections = [
    { id: 'basic-info', label: 'Informações Básicas', icon: Info },
    { id: 'logo', label: 'Logo', icon: Image },
    { id: 'cover', label: 'Capa', icon: ImageUp },
  ];

  return (
    <div className="flex gap-6">
      <PageSubNav sections={sections} />
      <div className="flex-1 max-w-2xl mx-auto space-y-6">

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
