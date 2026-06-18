'use client';

import { useEffect, useRef, useState } from 'react';
import { RealtimeClient } from '@supabase/realtime-js';
import { useUser } from '@/supabase';

interface Cursor {
  userId: string;
  username: string;
  color: string;
  y: number;
}

const CURSOR_COLORS = ['#4BC5FF', '#FF4B4B', '#4BFF4B', '#FFBB4B', '#BB4BFF', '#FF4BBB'];

export function RealtimeCursors({ articleId, tenantId: _tenantId }: { articleId: string; tenantId: string }) {
  const { user } = useUser();
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const channelRef = useRef<any>(null);
  const colorRef = useRef(CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]);

  useEffect(() => {
    if (!user) return;
    const channelName = `article:${articleId}`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const realtime = new RealtimeClient(`${supabaseUrl}/realtime/v1`, {
      params: { apikey: supabaseKey },
    });

    const channel = realtime.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: Cursor[] = [];
        Object.entries(state).forEach(([_key, presence]: [string, any]) => {
          presence.forEach((p: any) => {
            if (p.userId !== user.id) {
              users.push({ userId: p.userId, username: p.username || 'Anônimo', color: p.color || '#4BC5FF', y: p.y || 0 });
            }
          });
        });
        setCursors(users);
        setActiveUsers(users.length + 1);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: user.id,
            username: user.email?.split('@')[0] || 'User',
            color: colorRef.current,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      realtime.disconnect();
    };
  }, [articleId, user]);

  if (!user || activeUsers <= 1) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-md bg-muted/50">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      {activeUsers} {activeUsers === 1 ? 'pessoa' : 'pessoas'} editando
      {cursors.length > 0 && (
        <div className="flex -space-x-1 ml-1">
          {cursors.slice(0, 3).map((c, _i) => (
            <div
              key={c.userId}
              className="w-5 h-5 rounded-full border-2 border-background flex items-center justify-center text-[8px] font-bold"
              style={{ backgroundColor: c.color, color: '#fff' }}
              title={c.username}
            >
              {c.username.charAt(0).toUpperCase()}
            </div>
          ))}
          {cursors.length > 3 && <span className="text-[10px] ml-1">+{cursors.length - 3}</span>}
        </div>
      )}
    </div>
  );
}
