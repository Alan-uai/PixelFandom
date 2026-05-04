'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const savedAnswers = [
  { id: '1', question: 'How to get Legendary Sword?', answer: 'Complete the Forgotten Temple raid and collect 10 Ancient Shards from elite mobs.', date: '2026-05-01' },
  { id: '2', question: 'Best armor for tanking?', answer: 'Phantom Armor set provides highest defense and threat generation.', date: '2026-04-28' },
];

export default function Saved() {
  return (
    <div className="max-w-4xl mx-auto p-4 pt-20">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold mb-6"
      >
        Saved Answers
      </motion.h1>
      <div className="space-y-4">
        {savedAnswers.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{item.question}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.answer}</p>
                  <p className="text-xs text-muted-foreground mt-2">{item.date}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
