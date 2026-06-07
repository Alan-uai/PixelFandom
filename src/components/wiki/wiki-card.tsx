'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { BookOpen, Globe } from 'lucide-react';
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
            <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
              {wiki.description || (
                <span className="italic text-white/40">Sem descrição</span>
              )}
            </p>

            {/* URL */}
            <div className="flex items-center text-xs text-white/50 mt-3 pt-3 border-t border-white/10">
              <Globe className="h-3 w-3 mr-1 shrink-0" />
              <span className="truncate">{wiki.custom_domain || `/w/${wiki.slug}`}</span>
            </div>
          </div>
        </Card>

        {/* Floating overlay symbols — outside Card to avoid rounded-lg clipping */}
        <div className="absolute inset-0 pointer-events-none" style={{ top: '1px', bottom: '1px' }}>
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
        </div>
      </Link>
    </div>
  );
}
