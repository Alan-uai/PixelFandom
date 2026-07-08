'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MAIN_DOMAIN } from '@/lib/constants';
import { useUser, supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function NewWikiPage() {
  const t = useTranslations('wiki_new');
  const tc = useTranslations('common');
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
      toast({ variant: 'destructive', title: tc('error'), description: error.message });
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
        toast({ title: t('domain_created'), description: `${domainData.domain} ${t('domain_created_desc')}` });
      }
    } catch {
      // Falha na criação do domínio não bloqueia a wiki
    }

    toast({ title: t('created'), description: t('created_desc') });
    router.push(`/dashboard/${slug}/settings`);
  };

  return (
    <div className="max-w-lg mx-auto">
      <WeldingCard>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FloatingLabelInput
              label={t('name_label')}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
            <div>
              <FloatingLabelInput
                label={t('slug_label')}
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('slug_hint')} {MAIN_DOMAIN}/w/{slug || '...'}
              </p>
            </div>
            <FloatingLabelTextarea
              label={t('description_label')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
            <Button type="submit" disabled={saving || !name || !slug} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('submit')}
            </Button>
          </form>
        </CardContent>
      </WeldingCard>
    </div>
  );
}
