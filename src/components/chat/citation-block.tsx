'use client';

import { motion } from 'framer-motion';
import type { Citation } from '@/lib/types';

interface CitationBlockProps {
  citations: Citation[];
  isVisible: boolean;
}

export function CitationBlock({ citations, isVisible }: CitationBlockProps) {
  if (!isVisible || citations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 space-y-2"
    >
      <p className="text-xs font-semibold text-muted-foreground">Sources:</p>
      {citations.map((citation) => (
        <motion.div
          key={citation.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-2 bg-muted/50 rounded-lg border border-border"
        >
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline"
          >
            {citation.title}
          </a>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {citation.excerpt}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}
