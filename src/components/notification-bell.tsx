'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, BellRing, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNotifications, type Notification } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

export default function NotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        {unreadCount > 0 ? (
          <>
            <BellRing className="h-5 w-5 text-primary" />
            <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <Bell className="h-5 w-5" />
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-popover border rounded-lg shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                Marcar todas lidas
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma notificação
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              {notifications.slice(0, 5).map((notif) => (
                <NotifItem key={notif.id} notif={notif} onRead={markAsRead} />
              ))}
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}

function NotifItem({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  const inner = (
    <div
      className={cn(
        'flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 cursor-pointer',
        !notif.read_at && 'bg-primary/5'
      )}
      onClick={() => onRead(notif.id)}
    >
      <span className="text-lg mt-0.5">{typeIcons[notif.type] || '🔔'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{notif.title}</p>
        {notif.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
      {!notif.read_at && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
    </div>
  );

  if (notif.link) {
    return <Link href={notif.link}>{inner}</Link>;
  }
  return inner;
}
