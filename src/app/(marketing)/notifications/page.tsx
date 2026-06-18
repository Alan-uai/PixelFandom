'use client';

import { useNotifications, type Notification } from '@/hooks/use-notifications';
import { useUserPreferences } from '@/context/user-preferences-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { CheckCheck, Loader2, Bell, BellRing, Trash2, Settings2 } from 'lucide-react';
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

function NotificationsPageInner() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const { preferences, updatePreference } = useUserPreferences();

  const handleDelete = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
  };

  const recentNotifications = notifications.filter((n) => !n.read_at);
  const oldNotifications = notifications.filter((n) => n.read_at);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
              : 'Todas lidas'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <BellRing className="h-4 w-4" />
            <span className="hidden sm:inline">Recentes</span>
          </TabsTrigger>
          <TabsTrigger value="old" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Antigas</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Configurações</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="mt-6 space-y-4">
          {recentNotifications.length > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas lidas
              </Button>
            </div>
          )}

          {recentNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <BellRing className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">Nenhuma notificação recente</p>
                <p className="text-sm">Você está em dia!</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-2 pr-4">
                {recentNotifications.map((notif) => (
                  <NotifCard key={notif.id} notif={notif} onRead={markAsRead} onDelete={handleDelete} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="old" className="mt-6 space-y-4">
          {oldNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bell className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">Nenhuma notificação antiga</p>
                <p className="text-sm">As notificações lidas aparecerão aqui.</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-2 pr-4">
                {oldNotifications.map((notif) => (
                  <NotifCard key={notif.id} notif={notif} onRead={markAsRead} onDelete={handleDelete} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Controle quais notificações você recebe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'mentions', label: 'Menções', desc: 'Quando alguém mencionar você' },
                { key: 'comments', label: 'Comentários', desc: 'Novos comentários nas suas páginas' },
                { key: 'updates', label: 'Atualizações', desc: 'Mudanças nas wikis que você participa' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={preferences.notification_preferences[key] ?? true}
                    onCheckedChange={(checked) => {
                      updatePreference('notification_preferences', {
                        ...preferences.notification_preferences,
                        [key]: checked,
                      });
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ErrorBoundary>
      <NotificationsPageInner />
    </ErrorBoundary>
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
