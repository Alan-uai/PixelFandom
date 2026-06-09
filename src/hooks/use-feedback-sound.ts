'use client';

import { useCallback } from 'react';
import { playHoverSound, playClickSound, playRevealSound, playSuccessSound } from '@/lib/feedback-sounds';

export function useFeedbackSound() {
  const playHover = useCallback(() => playHoverSound(), []);
  const playClick = useCallback(() => playClickSound(), []);
  const playReveal = useCallback(() => playRevealSound(), []);
  const playSuccess = useCallback(() => playSuccessSound(), []);

  return { playHover, playClick, playReveal, playSuccess };
}
