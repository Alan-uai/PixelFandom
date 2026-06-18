'use client';

import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trophy, Flame, FileText, MessageSquare, Heart, Calendar, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BadgeGrid } from '@/components/gamification/badge-display';
import { supabase } from '@/supabase';

type BadgeData = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  image_url: string | null;
  category: string;
  rarity: number;
  rarity_color: string | null;
  rarity_icon: string | null;
  earned: boolean;
  earned_at: string | null;
};

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
  badges: { badge: BadgeData; earned_at: string }[];
  recent_comments: { id: string; content: string; created_at: string; article: { title: string; slug: string } }[];
};

const badgeCategories = [
  { key: 'all', label: 'Todas' },
  { key: 'content', label: 'Conteúdo' },
  { key: 'community', label: 'Comunidade' },
  { key: 'streak', label: 'Streak' },
  { key: 'general', label: 'Geral' },
];

export default function ProfileView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [badgeCategory, setBadgeCategory] = useState('all');
  const profileCache = useRef<ProfileData | null>(null);
  const badgesCache = useRef<BadgeData[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (profileCache.current) {
          setProfile(profileCache.current);
          setLoading(false);
          return;
        }
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const res = await fetch(`/api/profile?user_id=${authUser.id}`);
        if (res.ok) {
          const data = await res.json();
          profileCache.current = data;
          setProfile(data);
        }
      } catch {/* noop */} finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (badgesCache.current) {
          setBadges(badgesCache.current);
          setBadgesLoading(false);
          return;
        }
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const suffix = authUser ? `?user_id=${authUser.id}` : '';
        const res = await fetch(`/api/badges${suffix}`);
        if (res.ok) {
          const data = await res.json();
          badgesCache.current = data;
          setBadges(data);
        }
      } catch {/* noop */} finally {
        setBadgesLoading(false);
      }
    })();
  }, []);

  if (loading || badgesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <p className="text-center text-muted-foreground py-12">Perfil não encontrado.</p>
    );
  }

  const stats = [
    { label: 'Reputação', value: profile.reputation_points, icon: Trophy, color: 'text-amber-500' },
    { label: 'Streak', value: `${profile.streak_days} dias`, icon: Flame, color: 'text-orange-500' },
    { label: 'Artigos', value: profile.articles_count, icon: FileText, color: 'text-blue-500' },
    { label: 'Comentários', value: profile.comments_count, icon: MessageSquare, color: 'text-green-500' },
    { label: 'Reações', value: profile.reactions_received, icon: Heart, color: 'text-red-500' },
  ];

  const filtered = badgeCategory === 'all' ? badges : badges.filter((b) => b.category === badgeCategory);
  const earned = filtered.filter((b) => b.earned);
  const locked = filtered.filter((b) => !b.earned);

  return (
    <div className="space-y-6">
      <Card>
        {profile.cover_image && (
          <div className="relative h-24 md:h-32 rounded-t-xl overflow-hidden">
            <Image src={profile.cover_image} alt="" fill className="object-cover" />
          </div>
        )}
        <CardHeader className={profile.cover_image ? 'pb-2' : ''}>
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary overflow-hidden shrink-0">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="" fill className="object-cover" />
              ) : (
                (profile.display_name || profile.username || 'U')[0].toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold truncate">{profile.display_name || profile.username}</h2>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conquistas ({badges.filter((b) => b.earned).length} / {badges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conquista disponível.</p>
          ) : (
            <Tabs value={badgeCategory} onValueChange={setBadgeCategory}>
              <TabsList className="grid grid-cols-5 w-full">
                {badgeCategories.map((c) => (
                  <TabsTrigger key={c.key} value={c.key} className="text-xs">
                    {c.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {badgeCategories.map((c) => (
                <TabsContent key={c.key} value={c.key} className="mt-4 space-y-4">
                  {earned.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Desbloqueadas ({earned.length})
                      </h3>
                      <BadgeGrid badges={earned} />
                    </div>
                  )}

                  {locked.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        Bloqueadas ({locked.length})
                      </h3>
                      <BadgeGrid badges={locked} />
                    </div>
                  )}

                  {filtered.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Nenhuma conquista nesta categoria.</p>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {profile.recent_comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comentários Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.recent_comments.map((c) => (
              <div key={c.id} className="text-sm border-l-2 border-muted pl-3">
                <p className="line-clamp-2 text-muted-foreground">{c.content}</p>
                {c.article && (
                  <p className="text-xs text-primary mt-1">{c.article.title}</p>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
