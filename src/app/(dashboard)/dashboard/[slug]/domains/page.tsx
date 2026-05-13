'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Globe, CheckCircle2, XCircle } from 'lucide-react';
import type { Tenant } from '@/supabase/client';

export default function WikiDomainsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [domain, setDomain] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data }) => setTenant(data));
  }, [slug]);

  const handleAddDomain = async () => {
    if (!domain || !tenant) return;
    setSaving(true);

    const { error } = await supabase
      .from('tenants')
      .update({ custom_domain: domain })
      .eq('id', tenant.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Domínio adicionado!', description: 'Configure o DNS apontando para a Vercel.' });
      setTenant({ ...tenant, custom_domain: domain });
    }
    setSaving(false);
  };

  const handleRemoveDomain = async () => {
    if (!tenant) return;
    setSaving(true);

    const { error } = await supabase
      .from('tenants')
      .update({ custom_domain: null })
      .eq('id', tenant.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Domínio removido.' });
      setTenant({ ...tenant, custom_domain: null });
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Domínios</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os domínios da sua wiki.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>URL da Wiki</CardTitle>
          <CardDescription>Acesse sua wiki pelo hub PixelFandom.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono">pixelfandom.vercel.app/w/{slug}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domínio Personalizado</CardTitle>
          <CardDescription>
            Adicione seu próprio domínio (ex: minhawiki.com).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tenant?.custom_domain ? (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-mono text-sm">{tenant.custom_domain}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleRemoveDomain} disabled={saving}>
                Remover
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="meudominio.com"
                />
              </div>
              <Button onClick={handleAddDomain} disabled={saving || !domain}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar'}
              </Button>
            </div>
          )}

          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Instruções de DNS:</p>
            <p>Adicione um registro CNAME apontando seu domínio para <span className="font-mono">cname.vercel-dns.com</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
