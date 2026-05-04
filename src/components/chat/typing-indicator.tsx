'use client';

import { motion } from 'framer-motion';

const dotVariants = {
  initial: { y: 0 },
  animate: { y: [0, -8, 0] },
};

const dotTransition = {
  duration: 0.6,
  repeat: Infinity,
  ease: 'easeInOut',
};

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 p-4 max-w-[80%]">
      <div className="flex gap-1.5 px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-sm">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{ ...dotTransition, delay: i * 0.15 }}
            className="w-2 h-2 bg-muted-foreground rounded-full"
          />
        ))}
      </div>
    </div>
  );
}
