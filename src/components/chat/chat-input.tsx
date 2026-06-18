'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  placeholder?: string;
  maxChars?: number;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = 'Type a message...',
  maxChars = 4000,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setCharCount(value.length);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) onSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4">
      <div className="max-w-4xl mx-auto relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-12 resize-none min-h-[48px] max-h-[200px] rounded-xl"
          disabled={isLoading}
        />
        <AnimatePresence>
          {value.trim() && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-2 bottom-2"
            >
              <Button
                size="icon"
                onClick={onSubmit}
                disabled={isLoading || !value.trim()}
                className="rounded-lg h-8 w-8"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 border-2 border-t-transparent border-current rounded-full"
                  />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {maxChars && (
          <div className="text-xs text-muted-foreground text-right mt-1">
            {charCount}/{maxChars}
          </div>
        )}
      </div>
    </div>
  );
}
