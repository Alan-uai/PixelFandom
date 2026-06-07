'use client';

import type { CardPosition } from '@/components/page-builder/types';
import { VoteButtons } from './vote-buttons';
import { FollowButton } from './follow-button';

type Props = {
  votePosition?: CardPosition;
  followPosition?: CardPosition;
  targetType: 'article' | 'tenant';
  targetId: string;
  tenantId?: string;
  initialUpvotes?: number;
  initialDownvotes?: number;
  initialUserVote?: string | null;
};

function positionStyle(pos: CardPosition): React.CSSProperties {
  switch (pos.edge) {
    case 'top':
      return { top: 0, left: `${pos.offsetPct}%`, transform: 'translate(-50%, -50%)' };
    case 'bottom':
      return { bottom: 0, left: `${pos.offsetPct}%`, transform: 'translate(-50%, 50%)' };
    case 'left':
      return { left: 0, top: `${pos.offsetPct}%`, transform: 'translate(-50%, -50%)' };
    case 'right':
      return { right: 0, top: `${pos.offsetPct}%`, transform: 'translate(50%, -50%)' };
  }
}

const DEFAULT_VOTE: CardPosition = { edge: 'bottom', offsetPct: 95 };
const DEFAULT_FOLLOW: CardPosition = { edge: 'top', offsetPct: 95 };

function BorderCut({ edge }: { edge: 'top' | 'bottom' }) {
  return (
    <div
      className="absolute bg-background pointer-events-none"
      style={{
        left: '-8px',
        right: '-8px',
        height: '3px',
        top: edge === 'top' ? 0 : undefined,
        bottom: edge === 'bottom' ? 0 : undefined,
      }}
    />
  );
}

export function CardSymbols({
  votePosition,
  followPosition,
  targetType,
  targetId,
  tenantId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote,
}: Props) {
  return (
    <>
      <div style={positionStyle(votePosition ?? DEFAULT_VOTE)} className="absolute z-10">
        <BorderCut edge="bottom" />
        <VoteButtons
          targetType={targetType}
          targetId={targetId}
          initialUpvotes={initialUpvotes}
          initialDownvotes={initialDownvotes}
          initialUserVote={initialUserVote}
        />
      </div>
      {tenantId && (
        <div style={positionStyle(followPosition ?? DEFAULT_FOLLOW)} className="absolute z-10">
          <BorderCut edge="top" />
          <FollowButton tenantId={tenantId} />
        </div>
      )}
    </>
  );
}
