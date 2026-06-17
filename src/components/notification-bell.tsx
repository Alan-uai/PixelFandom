'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, Check, X, Loader2 } from 'lucide-react';
import { useUser } from '@/supabase';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

const TYPE_ICONS: Record<string, string> = {
  article_created: '📝',
  article_updated: '✏️',
  article_deleted: '🗑️',
  member_invited: '👋',
  member_joined: '🎉',
  suggestion_submitted: '💡',
  suggestion_approved: '✅',
  suggestion_rejected: '❌',
  domain_verified: '🌐',
  domain_failed: '⚠️',
  import_completed: '📥',
  ai_feedback_reviewed: '🤖',
  badge_earned: '🏆',
};

export default function NotificationBell() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications?limit=20&unread=true');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.length);
      }
    } catch {/* noop */}
  }

  async function markRead(id?: string) {
    const body = id ? { ids: [id] } : { markAllRead: true };
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    fetchNotifications();
  }

  if (!user) return null;

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Notificações"
      >
        {unreadCount > 0 ? (
          <>
            <BellRing className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <Bell className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-background border rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="text-sm font-medium">Notificações</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markRead()}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Marcar todas lidas
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex gap-3 px-4 py-3 hover:bg-muted/50 border-b border-border/50 last:border-0 group"
                >
                  <span className="text-lg shrink-0 mt-0.5">
                    {TYPE_ICONS[n.type] || '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  <button
                    onClick={() => markRead(n.id)}
                    className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-foreground transition-all"
                    title="Marcar como lida"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
