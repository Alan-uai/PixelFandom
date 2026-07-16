'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MAIN_DOMAIN } from '@/lib/constants';
import { useUser } from '@/supabase';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default function NewWikiPage() {
  const t = useTranslations('wiki_new');
  const tc = useTranslations('common');
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [domainPrefix, setDomainPrefix] = useState('');
  const [domainManuallyEdited, setDomainManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [domainStatus, setDomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const slugCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const domainCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkSlugAvailability = useCallback(async (value: string) => {
    if (!value || value.length < 2) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    try {
      const res = await fetch(`/api/tenants?checkSlug=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (data.available) {
        setSlugStatus('available');
      } else {
        setSlugStatus('taken');
      }
      return data;
    } catch {
      setSlugStatus('idle');
      return null;
    }
  }, []);

  const syncSlugFromName = useCallback(async (newName: string) => {
    if (slugManuallyEdited) return;
    const baseSlug = slugify(newName);
    if (!baseSlug) { setSlug(''); setSlugStatus('idle'); return; }
    setSlug(baseSlug);
    setSlugStatus('checking');
    try {
      const res = await fetch(`/api/tenants?checkSlug=${encodeURIComponent(baseSlug)}`);
      const data = await res.json();
      if (data.available) {
        setSlug(baseSlug);
        setSlugStatus('available');
      } else if (data.suggested) {
        setSlug(data.suggested);
        setSlugStatus('available');
      } else {
        setSlugStatus('taken');
      }
    } catch {
      setSlugStatus('idle');
    }
  }, [slugManuallyEdited]);

  const syncDomainFromName = useCallback((newName: string) => {
    if (!domainManuallyEdited) {
      const slugged = slugify(newName);
      setDomainPrefix(slugged);
      setDomainStatus('idle');
    }
  }, [domainManuallyEdited]);

  const handleNameChange = (value: string) => {
    setName(value);
    syncSlugFromName(value);
    syncDomainFromName(value);
  };

  const handleSlugChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(clean);
    setSlugManuallyEdited(true);
    setSlugStatus('idle');
  };

  const handleDomainChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setDomainPrefix(clean);
    setDomainManuallyEdited(true);
    setDomainStatus('idle');
  };

  useEffect(() => {
    if (!slugManuallyEdited) return;
    if (slugCheckTimeoutRef.current) clearTimeout(slugCheckTimeoutRef.current);
    slugCheckTimeoutRef.current = setTimeout(() => {
      checkSlugAvailability(slug);
    }, 500);
    return () => {
      if (slugCheckTimeoutRef.current) clearTimeout(slugCheckTimeoutRef.current);
    };
  }, [slug, slugManuallyEdited, checkSlugAvailability]);

  useEffect(() => {
    if (!domainPrefix || domainPrefix.length < 2) {
      setDomainStatus('idle');
      return;
    }
    if (domainCheckTimeoutRef.current) clearTimeout(domainCheckTimeoutRef.current);
    domainCheckTimeoutRef.current = setTimeout(async () => {
      setDomainStatus('checking');
      try {
        const res = await fetch(`/api/tenants?checkDomain=${encodeURIComponent(domainPrefix)}`);
        const data = await res.json();
        setDomainStatus(data.available ? 'available' : 'taken');
      } catch {
        setDomainStatus('idle');
      }
    }, 500);
    return () => {
      if (domainCheckTimeoutRef.current) clearTimeout(domainCheckTimeoutRef.current);
    };
  }, [domainPrefix]);

  const reSyncSlug = () => {
    setSlugManuallyEdited(false);
    syncSlugFromName(name);
  };

  const reSyncDomain = () => {
    setDomainManuallyEdited(false);
    const slugged = slugify(name);
    setDomainPrefix(slugged);
    setDomainStatus('idle');
  };

  const slugColor = slugStatus === 'available' ? 'text-green-500' : slugStatus === 'taken' ? 'text-red-500' : 'text-muted-foreground';
  const domainColor = domainStatus === 'available' ? 'text-green-500' : domainStatus === 'taken' ? 'text-red-500' : 'text-muted-foreground';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) return;

    setSaving(true);
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          slug: slug || undefined,
          domainPrefix: domainPrefix || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast({ variant: 'destructive', title: tc('error'), description: data.error || 'Erro ao criar wiki' });
        setSaving(false);
        return;
      }

      toast({ title: t('created'), description: t('created_desc') });
      router.push(`/dashboard/${data.slug}/settings`);
    } catch {
      toast({ variant: 'destructive', title: tc('error'), description: 'Erro de conexão ao criar wiki' });
      setSaving(false);
    }
  };

  const slugHint = slug || '...';
  const domainHint = domainPrefix ? `${domainPrefix}.vercel.app` : '...';

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

            <div className="space-y-2">
              <div className="relative">
                <FloatingLabelInput
                  label="Slug"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder={slugify(name) || 'seu-slug'}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {slugStatus === 'checking' && (
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {slugStatus === 'available' && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                  {slugStatus === 'taken' && (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-xs ${slugColor}`}>
                  {MAIN_DOMAIN}/w/{slugHint}
                  {slugStatus === 'available' && ' — Disponível'}
                  {slugStatus === 'taken' && ' — Indisponível'}
                </p>
                {slugManuallyEdited && (
                  <button
                    type="button"
                    onClick={reSyncSlug}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Sincronizar com o nome
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <FloatingLabelInput
                  label="Domínio"
                  value={domainPrefix}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  placeholder={slugify(name) || 'seu-dominio'}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {domainStatus === 'checking' && (
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {domainStatus === 'available' && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                  {domainStatus === 'taken' && (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-xs ${domainColor}`}>
                  {domainHint}
                  {domainStatus === 'available' && ' — Disponível'}
                  {domainStatus === 'taken' && ' — Indisponível'}
                </p>
                {domainManuallyEdited && (
                  <button
                    type="button"
                    onClick={reSyncDomain}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Sincronizar com o nome
                  </button>
                )}
              </div>
            </div>

            <FloatingLabelTextarea
              label={t('description_label')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
            <Button type="submit" disabled={saving || !name || slugStatus === 'taken'} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('submit')}
            </Button>
          </form>
        </CardContent>
      </WeldingCard>
    </div>
  );
}
