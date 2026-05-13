'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const tips = [
  { id: '1', title: 'Level Up Fast', content: 'Complete daily quests for 2x XP bonus and join a party for additional 15% boost.', category: 'Leveling' },
  { id: '2', title: 'Raid Strategy', content: 'Always bring a healer to Forgotten Temple and assign roles before starting.', category: 'Raids' },
  { id: '3', title: 'Earn Gold Quickly', content: 'Sell unused gear at the Marketplace and complete weekly quests.', category: 'Economy' },
];

export default function Tips() {
  return (
    <div className="max-w-4xl mx-auto p-4 pt-20">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold mb-6"
      >
        Game Tips & Strategies
      </motion.h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tips.map((tip, index) => (
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="p-4 h-full">
              <div className="text-xs text-primary font-semibold mb-2">{tip.category}</div>
              <h3 className="font-semibold mb-2">{tip.title}</h3>
              <p className="text-sm text-muted-foreground">{tip.content}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
