'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/supabase';
import { useCachedData } from '@/hooks/use-cached-data';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Globe,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Clock,
  Check,
  Copy,
} from 'lucide-react';
import type { Tenant } from '@/supabase/client';

type DomainInfo = {
  verified: boolean;
  configured: boolean;
  cname: string | null;
  cnameResolves: boolean;
  pending: boolean;
  nameservers: string[];
  instructions?: string[];
};

export default function WikiDomainsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [vercelPrefix, setVercelPrefix] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingVercel, setSavingVercel] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verifying] = useState(false);
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const dataLoadedRef = useRef(false);

  const { data: cachedTenant } = useCachedData<any>(
    `domains:${slug}`,
    async () => {
      const { data } = await supabase.from('tenants').select('*').eq('slug', slug).single();
      return data!;
    }
  );

  const checkDomain = useCallback(async (d: string, type: 'vercel' | 'custom' = 'custom') => {
    setChecking(true);
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', tenantSlug: slug, domain: d, type }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDomainInfo(data);
    } catch {
      setDomainInfo({
        verified: false,
        configured: false,
        cname: null,
        cnameResolves: false,
        pending: true,
        nameservers: [],
      });
    }
    setChecking(false);
  }, [slug]);

  useEffect(() => {
    if (!cachedTenant || dataLoadedRef.current) return;
    dataLoadedRef.current = true;
    setTenant(cachedTenant);
    if (cachedTenant.vercel_domain) {
      const prefix = cachedTenant.vercel_domain.replace('.vercel.app', '');
      setVercelPrefix(prefix);
      setDomainInfo({
        verified: true,
        configured: true,
        cname: null,
        cnameResolves: true,
        pending: false,
        nameservers: [],
      });
    }
    if (cachedTenant.custom_domain && !cachedTenant.vercel_domain) {
      if (cachedTenant.domain_verified) {
        setDomainInfo({
          verified: true,
          configured: true,
          cname: null,
          cnameResolves: true,
          pending: false,
          nameservers: [],
        });
      }
      checkDomain(cachedTenant.custom_domain);
    }
  }, [cachedTenant, checkDomain]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (!tenant?.custom_domain) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => {
      checkDomain(tenant.custom_domain!);
    }, 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [tenant?.custom_domain, checkDomain]);

  const handleProvisionVercel = async () => {
    if (!tenant || !vercelPrefix) return;
    setSavingVercel(true);
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto',
          tenantSlug: slug,
          prefix: vercelPrefix.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const fullDomain = `${vercelPrefix.toLowerCase().replace(/[^a-z0-9-]/g, '')}.vercel.app`;
      setTenant({ ...tenant, vercel_domain: fullDomain } as Tenant);
      setDomainInfo({
        verified: true,
        configured: true,
        cname: null,
        cnameResolves: true,
        pending: false,
        nameservers: [],
      });
      toast({ title: 'Domínio Vercel ativado!', description: `${fullDomain} está pronto para uso.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    }
    setSavingVercel(false);
  };

  const handleUpdateVercel = async () => {
    if (!tenant || !vercelPrefix) return;
    setSavingVercel(true);
    try {
      const newDomain = `${vercelPrefix.toLowerCase().replace(/[^a-z0-9-]/g, '')}.vercel.app`;

      if (tenant.vercel_domain) {
        const removeRes = await fetch('/api/domains', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'remove', tenantSlug: slug, domain: tenant.vercel_domain, type: 'vercel' }),
        });
        const removeData = await removeRes.json();
        if (removeData.error) throw new Error(removeData.error);
      }

      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto',
          tenantSlug: slug,
          prefix: vercelPrefix.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setTenant({ ...tenant, vercel_domain: newDomain } as Tenant);
      toast({ title: 'Domínio Vercel atualizado!', description: `${newDomain} está pronto para uso.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    }
    setSavingVercel(false);
  };

  const handleAddDomain = async () => {
    if (!customDomain || !tenant) return;
    setSaving(true);
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', tenantSlug: slug, domain: customDomain.toLowerCase() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const addedDomain = customDomain.toLowerCase();
      setTenant({ ...tenant, custom_domain: addedDomain } as Tenant);
      setDomainInfo(data);
      toast({ title: 'Domínio adicionado!', description: 'Verifique as instruções de DNS abaixo.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    }
    setSaving(false);
  };

  const handleRemoveDomain = async () => {
    if (!tenant?.custom_domain) return;
    setSaving(true);
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', tenantSlug: slug, domain: tenant.custom_domain }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setTenant({ ...tenant, custom_domain: null } as Tenant);
      setDomainInfo(null);
      toast({ title: 'Domínio removido.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    }
    setSaving(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const statusBadge = () => {
    if (verifying) return { label: 'Verificando...', icon: Loader2, color: 'text-primary', spin: true };
    if (!domainInfo || !tenant?.custom_domain) return null;
    if (domainInfo.verified && domainInfo.configured)
      return { label: 'Ativo', icon: CheckCircle2, color: 'text-green-500' };
    if (domainInfo.verified && !domainInfo.configured)
      return { label: 'Verificado, aguardando DNS', icon: AlertTriangle, color: 'text-yellow-500' };
    return { label: 'Pendente', icon: XCircle, color: 'text-muted-foreground' };
  };

  const badge = statusBadge();

  const formatLastCheck = (date: string | null | undefined) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    return d.toLocaleString('pt-BR');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* Section 1: Vercel Domain */}
      <section id="vercel-domain">
      <WeldingCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Domínio Vercel
          </CardTitle>
          <CardDescription>
            Endereço automático da sua wiki. Escolha um prefixo — o final <span className="font-mono text-foreground">.vercel.app</span> é fixo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <FloatingLabelInput
                label="Prefixo"
                value={vercelPrefix}
                onChange={(e) => setVercelPrefix(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono pointer-events-none select-none">
                .vercel.app
              </span>
            </div>
            {tenant?.vercel_domain ? (
              <Button
                onClick={handleUpdateVercel}
                disabled={savingVercel || !vercelPrefix}
                className="shrink-0"
              >
                {savingVercel ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            ) : (
              <Button
                onClick={handleProvisionVercel}
                disabled={savingVercel || !vercelPrefix}
                className="shrink-0"
              >
                {savingVercel ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Provisionar'}
              </Button>
            )}
          </div>

          {tenant?.vercel_domain && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-mono text-sm font-medium">{tenant.vercel_domain}</p>
                  <p className="text-xs text-green-500">Ativo</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(tenant.vercel_domain!)}
                >
                  {copied ? (
                    <><Check className="h-3.5 w-3.5 mr-1" />Copiado</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5 mr-1" />Copiar</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {!tenant?.vercel_domain && (
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Sobre o domínio Vercel:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Escolha um prefixo para sua wiki</li>
                <li>Clique em Provisionar para verificar disponibilidade</li>
                <li>O domínio fica ativo automaticamente, sem configuração de DNS</li>
                <li>Você pode mudar o prefixo a qualquer momento</li>
              </ol>
            </div>
          )}
        </CardContent>
      </WeldingCard>
      </section>

      {/* Section 2: Custom Domain */}
      <section id="custom-domain">
      <WeldingCard>
        <CardHeader>
          <CardTitle>Domínio Personalizado</CardTitle>
          <CardDescription>
            Use seu próprio domínio (ex: minhawiki.com).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tenant?.custom_domain ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  {badge && (
                    <badge.icon className={`h-5 w-5 ${badge.color} ${verifying ? 'animate-spin' : ''}`} />
                  )}
                  <div>
                    <p className="font-mono text-sm font-medium">{tenant.custom_domain}</p>
                    {badge && (
                      <p className="text-xs text-muted-foreground">{badge.label}</p>
                    )}
                    {(tenant as any).domain_last_checked_at && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        Última verificação: {formatLastCheck((tenant as any).domain_last_checked_at)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => checkDomain(tenant.custom_domain!)}
                    disabled={checking}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${checking ? 'animate-spin' : ''}`} />
                    Verificar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRemoveDomain} disabled={saving}>
                    Remover
                  </Button>
                </div>
              </div>

              {/* DNS Instructions */}
              {domainInfo && (
                <div className="rounded-lg bg-muted p-4 space-y-3">
                  <h4 className="text-sm font-medium">Configuração de DNS</h4>

                  {domainInfo.verified && domainInfo.configured && (
                    <div className="flex items-center gap-2 text-sm text-green-500">
                      <CheckCircle2 className="h-4 w-4" />
                      Domínio configurado e ativo!
                    </div>
                  )}

                  {domainInfo.cname && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">Registro CNAME:</p>
                      <div className="font-mono bg-background rounded p-2">
                        <p>
                          <span className="text-muted-foreground">Tipo:</span> CNAME
                        </p>
                        <p>
                          <span className="text-muted-foreground">Nome:</span> @
                        </p>
                        <p>
                          <span className="text-muted-foreground">Valor:</span> {domainInfo.cname}
                        </p>
                        <p>
                          <span className="text-muted-foreground">TTL:</span> 3600 (padrão)
                        </p>
                      </div>
                    </div>
                  )}

                  {domainInfo.nameservers.length > 0 && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">Nameservers:</p>
                      {domainInfo.nameservers.map((ns) => (
                        <p key={ns} className="font-mono">{ns}</p>
                      ))}
                    </div>
                  )}

                  {!domainInfo.verified && !domainInfo.configured && !domainInfo.cname && (
                    <p className="text-xs text-muted-foreground">
                      Crie um registro CNAME apontando seu domínio para{' '}
                      <span className="font-mono">cname.vercel-dns.com</span>
                    </p>
                  )}

                  {domainInfo.verified && !domainInfo.configured && (
                    <p className="text-xs text-yellow-500">
                      Domínio verificado, mas o DNS ainda não está apontando para a Vercel.
                      Pode levar alguns minutos após a configuração do DNS.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <FloatingLabelInput
                    label="Domínio"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddDomain} disabled={saving || !customDomain}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar'}
                </Button>
              </div>

              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Como configurar:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Digite seu domínio e clique em Adicionar</li>
                  <li>Acesse o painel DNS do seu domínio</li>
                  <li>Crie um registro CNAME apontando para <span className="font-mono">cname.vercel-dns.com</span></li>
                  <li>Clique em Verificar após configurar o DNS</li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </WeldingCard>
      </section>
    </div>
  );
}
