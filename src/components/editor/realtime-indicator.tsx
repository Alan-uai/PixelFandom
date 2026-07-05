'use client';

import { useEffect, useState } from 'react';
import { RealtimeClient } from '@supabase/realtime-js';
import { Wifi } from 'lucide-react';

export function RealtimeIndicator({ articleId }: { articleId: string }) {
  const [connected, setConnected] = useState(false);
  const [activeEditors, setActiveEditors] = useState(0);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const realtime = new RealtimeClient(`${supabaseUrl}/realtime/v1`, {
      params: { apikey: supabaseKey },
    });

    const channel = realtime.channel(`article:${articleId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setActiveEditors(count);
      })
      .on('presence', { event: 'join' }, () => {
        setConnected(true);
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState();
        setActiveEditors(Object.keys(state).length);
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      realtime.removeChannel(channel);
    };
  }, [articleId]);

  if (!connected) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Wifi className="h-3 w-3 text-green-500" />
      <span>{activeEditors} editor(es) ativo(s)</span>
    </div>
  );
}
