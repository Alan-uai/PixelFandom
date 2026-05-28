'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, History, FileText, Users, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { useUser } from '@/supabase';

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
  const { user } = useUser();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    import('@/supabase').then(({ supabase }) => {
      supabase.from('tenants').select('id').eq('slug', slug).single().then(({ data }) => {
        if (data) setTenantId(data.id);
      });
    });
  }, [slug]);

  useEffect(() => {
    if (!tenantId) return;
    fetch(`/api/activity?tenant_id=${tenantId}&limit=100`)
      .then(r => r.json())
      .then(data => setItems(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora mesmo';
    if (mins < 60) return `${mins} min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  const grouped = items.reduce<Record<string, ActivityItem[]>>((acc, item) => {
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
          Activity Feed
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Histórico de alterações e eventos da wiki.
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <History className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
            <p className="text-muted-foreground">Nenhuma atividade registrada ainda.</p>
          </CardContent>
        </Card>
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
