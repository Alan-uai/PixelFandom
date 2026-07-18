'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@/supabase';
import { supabase } from '@/supabase';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
import { Plus, Settings, ExternalLink, Loader2, BookOpen, Users, Globe, FileText, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BrandIcon from '@/components/brand-icon';
import type { Tenant } from '@/supabase/client';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
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
    <div className="max-w-5xl mx-auto">
      <Tabs defaultValue="wikis" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="wikis" className="flex items-center gap-2">
            <BrandIcon size={16} />
            {t('my_wikis')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('analytics')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wikis" className="mt-6">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{t('my_wikis_title')}</h1>
                <p className="text-muted-foreground mt-1">
                  {t('my_wikis_description')}
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/new">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('new_wiki')}
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tenants.map((tenant) => {
                const s = stats[tenant.id];
                return (
                  <WeldingCard
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
                              <Image src={tenant.logo_url} alt="" width={24} height={24} className="h-6 w-6 rounded" />
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
                          {tenant.description || t('no_description')}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
                          {s && (
                            <>
                              <span className="flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5" />
                                {s.articles} {t('articles_count')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {s.members} {t('members_count')}
                              </span>
                            </>
                          )}
                          {tenant.custom_domain && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3.5 w-3.5" />
                              {t('domain')}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/${tenant.slug}/settings`}>
                              <Settings className="h-3.5 w-3.5 mr-1.5" />
                              {t('configure')}
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/${tenant.slug}/editor/new`}>
                              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                              {t('new_article')}
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={tenant.custom_domain ? `https://${tenant.custom_domain}` : tenant.vercel_domain ? `https://${tenant.vercel_domain}` : `/w/${tenant.slug}`} target={tenant.custom_domain || tenant.vercel_domain ? '_blank' : undefined}>
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                              {t('view')}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </WeldingCard>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard userId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnalyticsDashboard({ userId }: { userId?: string }) {
  const t = useTranslations('dashboard');
  const [stats, setStats] = useState<{
    totalWikis: number;
    totalArticles: number;
    totalMembers: number;
    totalViews30d: number;
    totalChats30d: number;
    topWikis: Array<{ name: string; slug: string; views: number; chats: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from('v_user_tenant_stats')
        .select('*')
        .eq('user_id', userId);

      if (data) {
        const totalWikis = data.length;
        const totalArticles = data.reduce((sum: number, t: any) => sum + (t.articles_count || 0), 0);
        const totalMembers = data.reduce((sum: number, t: any) => sum + (t.members_count || 0), 0);
        const totalViews30d = data.reduce((sum: number, t: any) => sum + (t.views_30d || 0), 0);
        const totalChats30d = data.reduce((sum: number, t: any) => sum + (t.chats_30d || 0), 0);
        const topWikis = data
          .sort((a: any, b: any) => (b.views_30d || 0) - (a.views_30d || 0))
          .slice(0, 5)
          .map((t: any) => ({
            name: t.tenant_name,
            slug: t.tenant_slug,
            views: t.views_30d || 0,
            chats: t.chats_30d || 0,
          }));

        setStats({ totalWikis, totalArticles, totalMembers, totalViews30d, totalChats30d, topWikis });
      }
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <p className="text-center text-muted-foreground py-12">
        {t('no_data')}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <WeldingCard>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">{t('stats.wikis')}</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{stats.totalWikis}</span>
          </CardContent>
        </WeldingCard>
        <WeldingCard>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">{t('stats.articles')}</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{stats.totalArticles}</span>
          </CardContent>
        </WeldingCard>
        <WeldingCard>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">{t('stats.views_30d')}</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{stats.totalViews30d}</span>
          </CardContent>
        </WeldingCard>
        <WeldingCard>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">{t('stats.chats_30d')}</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{stats.totalChats30d}</span>
          </CardContent>
        </WeldingCard>
      </div>

      {stats.topWikis.length > 0 && (
        <WeldingCard>
          <CardHeader>
            <CardTitle className="text-sm">{t('stats.top_wikis')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topWikis.map((wiki, i) => (
                <div key={wiki.slug} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                  <Link href={`/dashboard/${wiki.slug}/settings`} className="flex-1 text-sm font-medium hover:text-primary">
                    {wiki.name}
                  </Link>
                  <span className="text-sm text-muted-foreground">{wiki.views} visualizações</span>
                  <span className="text-sm text-muted-foreground">{wiki.chats} chats</span>
                </div>
              ))}
            </div>
          </CardContent>
        </WeldingCard>
      )}
    </div>
  );
}
