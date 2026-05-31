'use client';

import { useState, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import type { AnimationType } from './types';
import { ANIMATION_CATEGORIES } from '@/lib/animation-categories';
import { buildAnimationClasses } from '@/lib/block-styles';

interface AnimationPreviewProps {
  type: AnimationType;
  size?: 'sm' | 'md' | 'lg';
}

export function AnimationPreview({ type, size = 'md' }: AnimationPreviewProps) {
  const [key, setKey] = useState(0);
  const [playing, setPlaying] = useState(false);

  const sizeClass = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';

  const handlePlay = useCallback(() => {
    setPlaying(true);
    setKey((k) => k + 1);
  }, []);

  const animClass = type !== 'none' ? buildAnimationClasses({ type }) : '';

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClass} rounded-lg bg-primary/20 flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors ${playing ? animClass : ''}`}
        key={key}
        onMouseEnter={handlePlay}
        onClick={handlePlay}
        title={`Preview: ${ANIMATION_CATEGORIES.find((c) => c.types.includes(type))?.label || type}`}
      >
        <div className={`rounded-full bg-primary ${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'}`} />
      </div>
      {playing && (
        <button onClick={() => setPlaying(false)} className="text-[9px] text-muted-foreground hover:text-foreground">
          <Pause className="w-3 h-3" />
        </button>
      )}
      {!playing && (
        <button onClick={handlePlay} className="text-[9px] text-muted-foreground hover:text-foreground">
          <Play className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
