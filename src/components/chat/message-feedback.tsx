'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FeedbackType = 'positive' | 'negative';

interface MessageFeedbackProps {
  messageId: string;
  currentFeedback?: FeedbackType;
  onFeedback: (messageId: string, type: FeedbackType, category?: string) => void;
}

const feedbackCategories = ['Inaccurate', 'Not relevant', 'Incomplete', 'Harmful'];

function useParticleBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const burst = useCallback((x: number, y: number, color: string) => {
    const el = canvasRef.current!;
    const cx = el.getContext('2d')!;

    const particles: { x: number; y: number; vx: number; vy: number; life: number; hue: number; size: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        hue: Math.random() * 60 - 30,
        size: Math.random() * 4 + 2,
      });
    }

    let animating = true;
    function animate() {
      if (!animating) return;
      cx.clearRect(0, 0, el.width, el.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= 0.025;
        if (p.life <= 0) { particles.splice(i, 1); continue; }

        cx.beginPath();
        cx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        cx.fillStyle = `hsla(${p.hue + (color === 'positive' ? 120 : 0)}, 80%, 60%, ${p.life * 0.8})`;
        cx.fill();
      }

      if (particles.length > 0) requestAnimationFrame(animate);
    }
    animate();
    return () => { animating = false; };
  }, []);

  return { canvasRef, burst };
}

export function MessageFeedback({
  messageId,
  currentFeedback,
  onFeedback,
}: MessageFeedbackProps) {
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const positiveRef = useRef<HTMLButtonElement>(null);
  const negativeRef = useRef<HTMLButtonElement>(null);
  const { canvasRef: burstCanvasRef, burst } = useParticleBurst();

  const handleFeedback = (type: FeedbackType) => {
    const btn = type === 'positive' ? positiveRef.current : negativeRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, type);
      setBurstKey(k => k + 1);
    }
    if (currentFeedback === type) {
      onFeedback(messageId, type);
    } else {
      onFeedback(messageId, type);
      if (type === 'negative') setShowCategories(true);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    onFeedback(messageId, 'negative', category);
    setShowCategories(false);
  };

  return (
    <div className="relative flex items-center gap-2 mt-1">
      <canvas
        ref={burstCanvasRef}
        key={burstKey}
        width={200}
        height={200}
        className="absolute pointer-events-none -top-16 -left-16 z-50"
      />
      <Button
        ref={positiveRef}
        variant="ghost"
        size="icon"
        className={cn('h-6 w-6', currentFeedback === 'positive' && 'text-green-500 bg-green-500/10')}
        onClick={() => handleFeedback('positive')}
      >
        <ThumbsUp className="h-3 w-3" />
      </Button>
      <Button
        ref={negativeRef}
        variant="ghost"
        size="icon"
        className={cn('h-6 w-6', currentFeedback === 'negative' && 'text-red-500 bg-red-500/10')}
        onClick={() => handleFeedback('negative')}
      >
        <ThumbsDown className="h-3 w-3" />
      </Button>
      <AnimatePresence>
        {showCategories && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex gap-1"
          >
            {feedbackCategories.map((category) => (
              <Button
                key={category}
                variant="outline"
                size="sm"
                className={cn('h-6 text-xs', selectedCategory === category && 'bg-muted')}
                onClick={() => handleCategorySelect(category)}
              >
                {category}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowCategories(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
