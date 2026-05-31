'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { cn } from '@/lib/utils';

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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    fetchVotes();
    setLoaded(true);
  }, [targetId]);

  const fetchVotes = async () => {
    const res = await fetch(`/api/${targetType}s/${targetId}/vote`);
    if (res.ok) {
      const data = await res.json();
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);
      setUserVote(data.user_vote);
    }
  };

  const handleVote = useCallback(async (voteType: 'up' | 'down') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
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
        const newVote = data.vote_type;

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
  }, [targetType, targetId, userVote, router]);

  const score = upvotes - downvotes;

  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border bg-background px-1.5 py-0.5 text-xs font-medium shadow-sm">
      <button
        onClick={() => handleVote('up')}
        disabled={loading}
        className={cn(
          'p-0.5 rounded transition-colors hover:text-primary',
          userVote === 'up' ? 'text-primary' : 'text-muted-foreground'
        )}
        title="Gostei"
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <span className={cn(
        'tabular-nums min-w-[1.2ch] text-center font-semibold text-xs',
        score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : 'text-muted-foreground'
      )}>
        {score}
      </span>
      <button
        onClick={() => handleVote('down')}
        disabled={loading}
        className={cn(
          'p-0.5 rounded transition-colors hover:text-destructive',
          userVote === 'down' ? 'text-destructive' : 'text-muted-foreground'
        )}
        title="Não gostei"
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
