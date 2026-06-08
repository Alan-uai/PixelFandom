'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { BookOpen, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { CardSymbols } from '@/components/wiki/card-symbols';
import type { Tenant } from '@/supabase/client';
import type { CardPosition } from '@/components/page-builder/types';

export interface WikiCardProps {
  wiki: Tenant;
  voteData?: {
    upvotes: number;
    downvotes: number;
    score: number;
    user_vote: string | null;
  } | null;
  showFollow?: boolean;
  cardWidth?: string;
  cardHeight?: string;
  votePosition?: CardPosition;
  followPosition?: CardPosition;
}

function RobloxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#FF451B"/>
      <path d="M6.5 17.5V6.5h5.5a3 3 0 013 3V10a3 3 0 01-3 3H9.5m0 0v4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.59 5.81a14.6 14.6 0 00-3.67-1.14c-.16.28-.35.67-.48 1a13.59 13.59 0 00-4.06 0c-.13-.33-.32-.72-.48-1a14.6 14.6 0 00-3.68 1.14C3.12 10.24 2.3 14.48 2.7 18.66c1.57 1.14 3.1 1.84 4.6 2.3.37-.5.7-1.03.99-1.6a9.3 9.3 0 01-1.56-.76c.13-.1.26-.2.38-.3a11.14 11.14 0 009.78 0c.13.1.26.2.38.3-.5.3-1.02.55-1.57.75.28.57.62 1.1.98 1.6 1.5-.46 3.04-1.16 4.6-2.3.48-4.78-.74-8.99-3.1-12.85zM8.68 15.88c-.9 0-1.64-.82-1.64-1.82s.72-1.83 1.64-1.83c.93 0 1.66.83 1.64 1.83 0 1-.73 1.82-1.64 1.82zm6.64 0c-.9 0-1.64-.82-1.64-1.82s.72-1.83 1.64-1.83c.93 0 1.66.83 1.64 1.83 0 1-.73 1.82-1.64 1.82z" fill="#5865F2"/>
    </svg>
  );
}

function CollapsibleDescription({ text }: { text: string | null }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      setOverflows(el.scrollHeight > el.clientHeight);
    }
  }, [text]);

  if (!text) {
    return <p className="text-xs text-white/40 italic leading-relaxed">Sem descrição</p>;
  }

  return (
    <div>
      <p
        ref={ref}
        className={`text-xs text-white/70 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}
      >
        {text}
      </p>
      {overflows && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(!expanded); }}
          className="mt-0.5 text-white/40 hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

function LinkSection({ gameUrl, discordUrl, slug, customDomain }: {
  gameUrl: string | null;
  discordUrl: string | null;
  slug: string;
  customDomain: string | null;
}) {
  const openLink = (url: string) => (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener');
  };

  const gameLink = gameUrl ? (
    <span
      onClick={openLink(gameUrl)}
      onKeyDown={(e) => { if (e.key === 'Enter') openLink(gameUrl)(e); }}
      tabIndex={0}
      role="link"
      className="flex items-center gap-1.5 text-white/50 hover:text-[#FF451B] transition-colors cursor-pointer"
    >
      <RobloxIcon className="h-4 w-4" />
      <span className="text-[10px] font-medium">Roblox</span>
    </span>
  ) : null;

  const discordLink = discordUrl ? (
    <span
      onClick={openLink(discordUrl)}
      onKeyDown={(e) => { if (e.key === 'Enter') openLink(discordUrl)(e); }}
      tabIndex={0}
      role="link"
      className="flex items-center gap-1.5 text-white/50 hover:text-[#5865F2] transition-colors cursor-pointer"
    >
      <DiscordIcon className="h-4 w-4" />
      <span className="text-[10px] font-medium">Discord</span>
    </span>
  ) : null;

  if (gameLink && discordLink) {
    return (
      <div className="flex items-center justify-between text-xs">
        {gameLink}
        {discordLink}
      </div>
    );
  }

  if (gameLink) {
    return <div className="flex items-center justify-center text-xs">{gameLink}</div>;
  }

  if (discordLink) {
    return <div className="flex items-center justify-center text-xs">{discordLink}</div>;
  }

  return (
    <div className="flex items-center justify-center text-xs text-white/50">
      <Globe className="h-3 w-3 mr-1 shrink-0" />
      <span className="truncate">{customDomain || `/w/${slug}`}</span>
    </div>
  );
}

export function WikiCard({
  wiki,
  voteData,
  showFollow = true,
  cardWidth = 'w-[280px]',
  cardHeight = 'h-[360px]',
  votePosition,
  followPosition,
}: WikiCardProps) {
  return (
    <div className={`snap-start shrink-0 ${cardWidth} ${cardHeight} relative pb-2`}>
      <Link href={`/w/${wiki.slug}`} className="block group h-full">
        <Card className="h-full relative">
          {/* Background — clipped to rounded corners */}
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
              style={wiki.cover_image ? { backgroundImage: `url(${wiki.cover_image})` } : undefined}
            />
            <div
              className={`absolute inset-0 ${
                wiki.cover_image
                  ? 'bg-gradient-to-t from-black/85 via-black/50 to-black/30'
                  : 'bg-gradient-to-br from-primary/20 to-primary/5'
              }`}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full p-5">
            {/* Logo + Name */}
            <div className="flex items-center gap-3 mb-auto min-h-[4rem]">
              <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-white/10 flex items-center justify-center ring-1 ring-white/20">
                {wiki.logo_url ? (
                  <img src={wiki.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <BookOpen className="h-8 w-8 text-white/60" />
                )}
              </div>
              <h3 className="font-semibold text-sm text-white truncate leading-tight">
                {wiki.name}
              </h3>
            </div>

            {/* Description */}
            <CollapsibleDescription text={wiki.description} />

            {/* Links: Roblox / Discord / URL */}
            <div className="mt-auto pt-3 border-t border-white/10">
              <LinkSection
                gameUrl={wiki.game_url}
                discordUrl={wiki.discord_url}
                slug={wiki.slug}
                customDomain={wiki.custom_domain}
              />
            </div>
          </div>

          {/* Floating overlay symbols */}
          <CardSymbols
            targetType="tenant"
            targetId={wiki.id}
            tenantId={showFollow ? wiki.id : undefined}
            initialUpvotes={voteData?.upvotes ?? 0}
            initialDownvotes={voteData?.downvotes ?? 0}
            initialUserVote={voteData?.user_vote ?? null}
            votePosition={votePosition}
            followPosition={followPosition}
          />
        </Card>
      </Link>
    </div>
  );
}
