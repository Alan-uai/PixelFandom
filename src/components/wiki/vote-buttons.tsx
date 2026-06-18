'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { cn } from '@/lib/utils';
import { MAIN_URL } from '@/lib/constants';

type VoteButtonsProps = {
  targetType: 'article' | 'tenant';
  targetId: string;
  initialUpvotes?: number;
  initialDownvotes?: number;
  initialUserVote?: string | null;
};

export function VoteButtons({ targetType, targetId, initialUpvotes = 0, initialDownvotes = 0, initialUserVote = null }: VoteButtonsProps) {
  const router = useRouter();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<string | null>(initialUserVote);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const fetchVotes = useCallback(async () => {
    const res = await fetch(`/api/${targetType}s/${targetId}/vote`);
    if (res.ok) {
      const data = await res.json();
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);
      setUserVote(data.user_vote);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchVotes();
  }, [targetId, fetchVotes]);

  const handleVote = useCallback(async (voteType: 'up' | 'down') => {
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
      const res = await fetch(`/api/${targetType}s/${targetId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType }),
      });

      if (res.ok) {
        const data = await res.json();

        if (userVote === voteType) {
          setUpvotes((p) => voteType === 'up' ? p - 1 : p);
          setDownvotes((p) => voteType === 'down' ? p - 1 : p);
          setUserVote(null);
        } else if (userVote === null) {
          setUpvotes((p) => voteType === 'up' ? p + 1 : p);
          setDownvotes((p) => voteType === 'down' ? p + 1 : p);
          setUserVote(voteType);
        } else {
          setUpvotes((p) => userVote === 'up' ? p - 1 : p);
          setDownvotes((p) => userVote === 'down' ? p - 1 : p);
          setUpvotes((p) => voteType === 'up' ? p + 1 : p);
          setDownvotes((p) => voteType === 'down' ? p + 1 : p);
          setUserVote(voteType);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId, userVote]);

  const score = upvotes - downvotes;

  return (
    <div className="inline-flex items-center gap-0.5 px-1 text-xs">
      <button
        onClick={() => handleVote('up')}
        disabled={loading}
        className={cn(
          'p-0.5 rounded transition-colors hover:text-primary leading-none',
          userVote === 'up' ? 'text-primary' : 'text-muted-foreground'
        )}
        title="Gostei"
      >
        ▲
      </button>
      <span className={cn(
        'tabular-nums min-w-[1.2ch] text-center font-semibold text-xs leading-none',
        score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : 'text-muted-foreground'
      )}>
        {score}
      </span>
      <button
        onClick={() => handleVote('down')}
        disabled={loading}
        className={cn(
          'p-0.5 rounded transition-colors hover:text-destructive leading-none',
          userVote === 'down' ? 'text-destructive' : 'text-muted-foreground'
        )}
        title="Não gostei"
      >
        ▼
      </button>
    </div>
  );
}
