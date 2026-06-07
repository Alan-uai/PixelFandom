'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { cn } from '@/lib/utils';
import { MAIN_URL } from '@/lib/constants';

type FollowButtonProps = {
  tenantId: string;
};

export function FollowButton({ tenantId }: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchState();
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
      const origin = window.location.origin;
      const loginUrl = origin === MAIN_URL
        ? `/login?redirect_to=${encodeURIComponent(window.location.href)}`
        : `${MAIN_URL}/login?redirect_to=${encodeURIComponent(window.location.href)}`;
      window.location.href = loginUrl;
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
        'inline-flex items-center gap-0.5 px-1 text-xs leading-none transition-colors',
        following
          ? 'text-amber-400 hover:text-amber-500'
          : 'text-muted-foreground hover:text-foreground'
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
