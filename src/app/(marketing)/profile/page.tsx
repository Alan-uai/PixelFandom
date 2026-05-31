'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Check, User } from 'lucide-react';

export default function ProfileEditPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [coverImage, setCoverImage] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return router.push('/');

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (data) {
        setUser(data);
        setDisplayName(data.display_name || '');
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url || '');
        setBio(data.bio || '');
        setCoverImage(data.cover_image || '');
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          username,
          avatar_url: avatarUrl || null,
          bio,
          cover_image: coverImage || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: 'Perfil atualizado!' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o perfil.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Perfil
          </CardTitle>
          <CardDescription>Atualize suas informações públicas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Foto do Perfil</Label>
            <ImageUpload
              bucket="wiki-images"
              pathPrefix={`avatars/${user?.id || 'new'}`}
              value={avatarUrl}
              onChange={setAvatarUrl}
              previewSize="w-20 h-20 rounded-full"
            />
          </div>
          <FloatingLabelInput
            label="Nome de Exibição"
            info="Seu nome público na plataforma"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <FloatingLabelInput
            label="Nome de Usuário"
            info="Slug único para seu perfil"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <FloatingLabelTextarea
            label="Bio"
            info="Conte um pouco sobre você"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
          />
          <div className="space-y-2">
            <Label>Imagem de Capa</Label>
            <ImageUpload
              bucket="wiki-images"
              pathPrefix={`profile-covers/${user?.id || 'new'}`}
              value={coverImage}
              onChange={setCoverImage}
              previewSize="w-full h-24"
            />
          </div>
        </CardContent>
      </Card>

      {saved ? (
        <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
          <Check className="h-4 w-4" /> Perfil salvo!
        </div>
      ) : (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Perfil
        </Button>
      )}
    </div>
  );
}
