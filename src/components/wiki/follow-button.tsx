'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { cn } from '@/lib/utils';

type FollowButtonProps = {
  tenantId: string;
};

export function FollowButton({ tenantId }: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    fetchState();
    setLoaded(true);
  }, [tenantId]);

  const fetchState = async () => {
    const res = await fetch(`/api/follows?tenant_id=${tenantId}`);
    if (res.ok) {
      const data = await res.json();
      setFollowing(data.following);
      setFollowerCount(data.follower_count);
    }
  };

  const handleToggle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.following);
        setFollowerCount((p) => data.following ? p + 1 : Math.max(0, p - 1));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-xs font-medium shadow-sm transition-colors',
        following
          ? 'text-amber-400 border-amber-400/40 hover:text-amber-500 hover:border-amber-500/60'
          : 'text-muted-foreground hover:text-foreground hover:border-foreground/30'
      )}
      title={following ? 'Deixar de seguir' : 'Seguir'}
    >
      <span className="text-sm leading-none">{following ? '★' : '☆'}</span>
      {followerCount > 0 && (
        <span className="tabular-nums font-semibold">{followerCount}</span>
      )}
    </button>
  );
}
