'use client';

import { useState } from 'react';
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

export function MessageFeedback({
  messageId,
  currentFeedback,
  onFeedback,
}: MessageFeedbackProps) {
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleFeedback = (type: FeedbackType) => {
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
    <div className="flex items-center gap-2 mt-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-6 w-6', currentFeedback === 'positive' && 'text-green-500 bg-green-500/10')}
        onClick={() => handleFeedback('positive')}
      >
        <ThumbsUp className="h-3 w-3" />
      </Button>
      <Button
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
