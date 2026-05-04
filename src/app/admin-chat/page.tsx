'use client';

import { motion } from 'framer-motion';
import Home from '@/app/page';
import { Badge } from '@/components/ui/badge';

export default function AdminChat() {
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-16 right-4 z-50"
      >
        <Badge variant="destructive" className="px-3 py-1">
          Admin Mode
        </Badge>
      </motion.div>
      <Home />
    </div>
  );
}
