'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CardContent } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
import { Loader2, History, FileText, Users, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { useCachedData } from '@/hooks/use-cached-data';
import { supabase } from '@/supabase';

type ActivityItem = {
  id: string;
  type: string;
  actor_name: string | null;
  description: string;
  metadata: Record<string, unknown>;
  link: string | null;
  created_at: string;
};

const TYPE_ICONS: Record<string, typeof FileText> = {
  article_created: FileText,
  article_updated: FileText,
  article_deleted: FileText,
  member_invited: Users,
  member_joined: Users,
  suggestion_submitted: MessageSquare,
  suggestion_approved: CheckCircle,
  suggestion_rejected: XCircle,
};

export default function ActivityPage() {
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations('activity');
  const { data: tenantData } = useCachedData<{ id: string }>(
    `tenant-id:${slug}`,
    async () => {
      const { data } = await supabase.from('tenants').select('id').eq('slug', slug).single();
      return data!;
    }
  );
  const tenantId = tenantData?.id ?? null;

  const { data: items, loading } = useCachedData<ActivityItem[]>(
    tenantId ? `activity:${tenantId}:100` : null,
    async () => {
      const r = await fetch(`/api/activity?tenant_id=${tenantId}&limit=100`);
      return r.json();
    }
  );

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('time.now');
    if (mins < 60) return `${mins}${t('time.minutes_ago')}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}${t('time.hours_ago')}`;
    const days = Math.floor(hours / 24);
    return `${days}${t('time.days_ago')}`;
  };

  const itemList = items ?? [];
  const grouped = itemList.reduce<Record<string, ActivityItem[]>>((acc, item) => {
    const date = new Date(item.created_at).toLocaleDateString('pt-BR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('description')}
        </p>
      </div>

      {itemList.length === 0 ? (
        <WeldingCard>
          <CardContent className="text-center py-12">
            <History className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
            <p className="text-muted-foreground">{t('empty')}</p>
          </CardContent>
        </WeldingCard>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, dayItems]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
              <div className="space-y-2">
                {dayItems.map((item) => {
                  const Icon = TYPE_ICONS[item.type] || History;
                  return (
                    <div key={item.id} className="flex gap-3 items-start py-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{item.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.actor_name && (
                            <span className="text-xs text-muted-foreground">{item.actor_name}</span>
                          )}
                          <span className="text-xs text-muted-foreground">{timeAgo(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
