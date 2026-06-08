'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Footer() {
  return (
    <motion.footer
      className="border-t border-border/30 py-10 px-4 relative"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <motion.p
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0, y: 5 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
        >
          &copy; {new Date().getFullYear()} PixelFandom
        </motion.p>
        <motion.div
          className="flex gap-6"
          initial={{ opacity: 0, y: 5 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <motion.div whileHover={{ y: -1 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sobre
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
