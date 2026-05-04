'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type AnimationMode = 'fade' | 'blur' | 'slide' | 'typewriter';

interface StreamingTextProps {
  content: string;
  mode?: AnimationMode;
  speed?: number;
  onComplete?: () => void;
}

export function StreamingText({
  content,
  mode = 'fade',
  speed = 30,
  onComplete,
}: StreamingTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!content) return;
    setDisplayed('');
    setIsComplete(false);
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setDisplayed(content.slice(0, index));
      if (index >= content.length) {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [content, speed, onComplete]);

  const getAnimationProps = () => {
    switch (mode) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.3 },
        };
      case 'blur':
        return {
          initial: { filter: 'blur(4px)', opacity: 0 },
          animate: { filter: 'blur(0px)', opacity: 1 },
          transition: { duration: 0.5 },
        };
      case 'slide':
        return {
          initial: { x: -20, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          transition: { type: 'spring', stiffness: 100, damping: 20 },
        };
      default:
        return {};
    }
  };

  if (mode === 'typewriter') {
    return (
      <div className="whitespace-pre-wrap">
        {displayed}
        {!isComplete && <span className="animate-pulse">|</span>}
      </div>
    );
  }

  return (
    <motion.div
      {...getAnimationProps()}
      className="whitespace-pre-wrap"
    >
      {displayed}
    </motion.div>
  );
}
