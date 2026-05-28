'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/supabase';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Settings, ExternalLink, Loader2, BookOpen, Users, Globe, FileText } from 'lucide-react';
import type { Tenant } from '@/supabase/client';

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [tenants, setTenants] = useState<(Tenant & { role: string })[]>([]);
  const [stats, setStats] = useState<Record<string, { articles: number; members: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('tenant_members')
        .select('role, tenant:tenants(*)')
        .eq('user_id', user.id);

      const userTenants = data
        ? data
            .filter((d: any) => d.tenant)
            .map((d: any) => ({ ...d.tenant, role: d.role }))
        : [];

      setTenants(userTenants);

      if (userTenants.length === 0) {
        router.push('/dashboard/new');
        return;
      }

      // Fetch stats for each tenant
      const statsMap: Record<string, { articles: number; members: number }> = {};
      await Promise.all(
        userTenants.map(async (t) => {
          const [articles, members] = await Promise.all([
            supabase.from('wiki_articles').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id),
            supabase.from('tenant_members').select('user_id', { count: 'exact', head: true }).eq('tenant_id', t.id),
          ]);
          statsMap[t.id] = {
            articles: articles.count || 0,
            members: members.count || 0,
          };
        })
      );
      setStats(statsMap);
      setLoading(false);
    })();
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minhas Wikis</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas wikis ou crie uma nova.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Wiki
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tenants.map((tenant) => {
          const s = stats[tenant.id];
          return (
            <Card
              key={tenant.id}
              className="relative overflow-hidden"
              style={tenant.cover_image ? {
                backgroundImage: `url(${tenant.cover_image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : undefined}
            >
              {tenant.cover_image && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
              )}
              <div className="relative z-10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {tenant.logo_url && (
                        <img src={tenant.logo_url} alt="" className="h-6 w-6 rounded" />
                      )}
                      <div>
                        <CardTitle className="text-base text-white">{tenant.name}</CardTitle>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary mt-1">
                          {tenant.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/80 line-clamp-2 mb-4 min-h-[2.5rem]">
                    {tenant.description || 'Sem descrição'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
                    {s && (
                      <>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {s.articles} artigos
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {s.members} membros
                        </span>
                      </>
                    )}
                    {tenant.custom_domain && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" />
                        Domínio
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/${tenant.slug}/settings`}>
                        <Settings className="h-3.5 w-3.5 mr-1.5" />
                        Configurar
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/${tenant.slug}/editor/new`}>
                        <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                        Novo Artigo
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={tenant.custom_domain ? `https://${tenant.custom_domain}` : `/w/${tenant.slug}`} target={tenant.custom_domain ? '_blank' : undefined}>
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Ver
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
