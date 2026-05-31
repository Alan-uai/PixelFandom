'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Flame, FileText, MessageSquare, Heart, Calendar, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BadgeDisplay } from '@/components/gamification/badge-display';
import Link from 'next/link';

type ProfileData = {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  bio?: string | null;
  cover_image?: string | null;
  reputation_points: number;
  streak_days: number;
  articles_count: number;
  edits_count: number;
  comments_count: number;
  reactions_received: number;
  created_at: string;
  badges: { badge: any; earned_at: string }[];
  recent_comments: { id: string; content: string; created_at: string; article: { title: string; slug: string } }[];
};

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/profile?user_id=${id}`);
        if (res.ok) setProfile(await res.json());
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold">Perfil não encontrado</h1>
        <Link href="/" className="text-primary hover:underline mt-2">Voltar</Link>
      </div>
    );
  }

  const stats = [
    { label: 'Reputação', value: profile.reputation_points, icon: Trophy, color: 'text-amber-500' },
    { label: 'Streak', value: `${profile.streak_days} dias`, icon: Flame, color: 'text-orange-500' },
    { label: 'Artigos', value: profile.articles_count, icon: FileText, color: 'text-blue-500' },
    { label: 'Comentários', value: profile.comments_count, icon: MessageSquare, color: 'text-green-500' },
    { label: 'Reações', value: profile.reactions_received, icon: Heart, color: 'text-red-500' },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 pt-10 space-y-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      {profile.cover_image && (
        <div className="relative h-32 md:h-48 rounded-t-xl overflow-hidden -mt-6 -mx-6 mb-0">
          <img src={profile.cover_image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <Card className={profile.cover_image ? 'rounded-t-none' : ''}>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary overflow-hidden shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                (profile.display_name || profile.username || 'U')[0].toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">{profile.display_name || profile.username}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              {profile.bio && <p className="text-sm mt-1">{profile.bio}</p>}
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-3 rounded-lg bg-muted/30">
                <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conquistas ({profile.badges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conquista ainda. Comece a contribuir!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((ub) => (
                <BadgeDisplay key={ub.badge.id} badge={ub.badge} size="md" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Comments */}
      {profile.recent_comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comentários Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.recent_comments.map((c) => (
              <div key={c.id} className="text-sm border-l-2 border-muted pl-3">
                <p className="line-clamp-2 text-muted-foreground">{c.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  {c.article && (
                    <Link href={`/w/${c.article.slug}`} className="text-xs text-primary hover:underline">
                      {c.article.title}
                    </Link>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
