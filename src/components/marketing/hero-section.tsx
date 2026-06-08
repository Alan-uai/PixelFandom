'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const letters = 'PixelFandom'.split('');

export default function HeroSection() {
  return (
    <motion.section
      className="relative flex flex-col items-center justify-center py-28 md:py-36 text-center px-4 overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Glow orbs */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      <motion.div className="relative" variants={itemVariants}>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>wikis inteligentes com IA</span>
        </div>
      </motion.div>

      <motion.h1
        className="text-4xl md:text-7xl font-bold tracking-tight mb-6 relative"
        variants={itemVariants}
      >
        <span className="inline-flex flex-wrap justify-center gap-x-3">
          {letters.map((letter, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 40, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.8 + i * 0.04,
                ease: [0.175, 0.885, 0.32, 1.275],
              }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          ))}
        </span>
        <br />
        <span className="text-primary">Sua wiki, do seu jeito</span>
      </motion.h1>

      <motion.p
        className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10"
        variants={itemVariants}
      >
        Crie wikis para seus jogos, comunidades, projetos ou qualquer assunto.
        Com assistente IA, domínio personalizado e integração com Discord.
      </motion.p>

      <motion.div
        className="flex gap-4 flex-wrap justify-center"
        variants={itemVariants}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Button size="lg" asChild className="relative overflow-hidden group">
            <Link href="/dashboard/new">
              <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <span className="relative flex items-center">
                Criar Wiki Grátis
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Button size="lg" variant="outline" asChild>
            <Link href="/about">
              Saiba Mais
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Floating tech indicators */}
      <motion.div
        className="absolute right-[10%] top-[20%] hidden lg:block"
        animate={{ y: [0, -10, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="h-16 w-16 rounded-xl border border-primary/20 bg-background/40 backdrop-blur-sm flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
        </div>
      </motion.div>

      <motion.div
        className="absolute left-[8%] top-[35%] hidden lg:block"
        animate={{ y: [0, 8, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <div className="h-12 w-12 rounded-full border border-primary/10 bg-background/30 backdrop-blur-sm flex items-center justify-center">
          <motion.div
            className="h-6 w-6 rounded-full border-2 border-primary/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </motion.section>
  );
}
