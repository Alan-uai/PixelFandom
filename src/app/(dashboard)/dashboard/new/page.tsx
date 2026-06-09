'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function NewWikiPage() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9-]/g, '-')) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !slug) return;

    setSaving(true);
    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({ name, slug, description, ai_enabled: true })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      setSaving(false);
      return;
    }

    // Add creator as owner
    await supabase
      .from('tenant_members')
      .insert({ tenant_id: tenant.id, user_id: user.id, role: 'owner' });

    // Auto-criar domínio .vercel.app (não bloqueante)
    try {
      const domainRes = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto', tenantSlug: slug }),
      });
      const domainData = await domainRes.json();
      if (!domainData.error && domainData.domain) {
        toast({ title: 'Domínio criado', description: `${domainData.domain} configurado para sua wiki.` });
      }
    } catch {
      // Falha na criação do domínio não bloqueia a wiki
    }

    toast({ title: 'Wiki criada!', description: 'Sua wiki foi criada com sucesso.' });
    router.push(`/dashboard/${slug}/settings`);
  };

  return (
    <div className="max-w-lg mx-auto">
      <WeldingCard>
        <CardHeader>
          <CardTitle>Criar Nova Wiki</CardTitle>
          <CardDescription>
            Dê um nome à sua wiki e defina um identificador único.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FloatingLabelInput
              label="Nome da Wiki"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
            <div>
              <FloatingLabelInput
                label="Identificador (slug)"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Será usado na URL: pixelfandom.vercel.app/w/{slug || '...'}
              </p>
            </div>
            <FloatingLabelTextarea
              label="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
            <Button type="submit" disabled={saving || !name || !slug} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar Wiki
            </Button>
          </form>
        </CardContent>
      </WeldingCard>
    </div>
  );
}
