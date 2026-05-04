'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface QuickSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  isVisible: boolean;
}

export function QuickSuggestions({
  suggestions,
  onSelect,
  isVisible,
}: QuickSuggestionsProps) {
  if (!isVisible || suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ staggerChildren: 0.1 }}
      className="flex flex-wrap gap-2 p-4"
    >
      {suggestions.map((suggestion, index) => (
        <motion.div
          key={suggestion}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
}
