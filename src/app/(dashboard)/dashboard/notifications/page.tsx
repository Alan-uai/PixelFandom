'use client';

import { useNotifications, type Notification } from '@/hooks/use-notifications';
import { CardContent } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCheck, Loader2, Bell, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/supabase';
import Link from 'next/link';

const typeIcons: Record<string, string> = {
  article_created: '📝',
  article_updated: '✏️',
  member_invited: '👋',
  member_joined: '🎉',
  suggestion_approved: '✅',
  suggestion_rejected: '❌',
  invitation_created: '📨',
  invitation_accepted: '🤝',
  chat_message: '💬',
  mention: '@',
};

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  const handleDelete = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas lidas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <WeldingCard>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Nenhuma notificação</p>
            <p className="text-sm">Você receberá notificações sobre atividades da sua wiki.</p>
          </CardContent>
        </WeldingCard>
      ) : (
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-2 pr-4">
            {notifications.map((notif) => (
              <NotifCard key={notif.id} notif={notif} onRead={markAsRead} onDelete={handleDelete} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function NotifCard({ notif, onRead, onDelete }: { notif: Notification; onRead: (id: string) => void; onDelete: (id: string) => void }) {
  const inner = (
    <div
      className={cn(
        'flex gap-4 p-4 rounded-lg border transition-colors cursor-pointer',
        !notif.read_at ? 'bg-primary/5 border-primary/20' : 'bg-card hover:bg-muted/50'
      )}
      onClick={() => onRead(notif.id)}
    >
      <span className="text-2xl">{typeIcons[notif.type] || '🔔'}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{notif.title}</p>
        {notif.body && <p className="text-sm text-muted-foreground mt-1">{notif.body}</p>}
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
      <div className="flex flex-col items-center gap-2">
        {!notif.read_at && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  if (notif.link) return <Link href={notif.link}>{inner}</Link>;
  return inner;
}
