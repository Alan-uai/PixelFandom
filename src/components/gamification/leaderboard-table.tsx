'use client';

import Image from 'next/image';
import { Trophy, Medal, Award, Flame, FileText, MessageSquare, Heart } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type LeaderboardUser = {
  rank: number;
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  reputation_points: number;
  articles_count: number;
  comments_count: number;
  streak_days: number;
  reactions_received: number;
  is_current_user: boolean;
};

type Props = {
  users: LeaderboardUser[];
  metric: string;
};

const metricLabels: Record<string, string> = {
  reputation_points: 'Reputação',
  articles_count: 'Artigos',
  comments_count: 'Comentários',
  streak_days: 'Streak',
  reactions_received: 'Reações',
};

const metricIcons: Record<string, React.ElementType> = {
  reputation_points: Trophy,
  articles_count: FileText,
  comments_count: MessageSquare,
  streak_days: Flame,
  reactions_received: Heart,
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-amber-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm text-muted-foreground w-5 text-center">{rank}</span>;
}

export function LeaderboardTable({ users, metric }: Props) {
  const MetricIcon = metricIcons[metric] || Trophy;

  return (
    <div className="space-y-1">
      {users.map((u) => (
        <Link
          key={u.id}
          href={`/profile/${u.id}`}
          className={cn(
            'flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-muted/50',
            u.is_current_user && 'bg-primary/5 border border-primary/20'
          )}
        >
          <div className="w-8 flex justify-center">
            <RankBadge rank={u.rank} />
          </div>

          <div className="relative h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden shrink-0">
            {u.avatar_url ? (
              <Image src={u.avatar_url} alt="" fill className="object-cover" />
            ) : (
              (u.display_name || u.username || '?')[0].toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {u.display_name || u.username || 'Usuário'}
              {u.is_current_user && <span className="text-[10px] text-primary ml-2">(você)</span>}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {u.articles_count} artigos · {u.comments_count} comentários · streak {u.streak_days} dias
            </p>
          </div>

          <div className="flex items-center gap-2">
            <MetricIcon className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm tabular-nums">
              {u[metric as keyof typeof u] as number}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
