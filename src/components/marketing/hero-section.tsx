'use client';

import { useEffect, useCallback } from 'react';
import { motion, useTransform, useMotionValue, useAnimationControls, type MotionValue } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { playHoverSound, playClickSound, playRevealSound, playSuccessSound } from '@/lib/feedback-sounds';
import PixelTitle from './pixel-title';
import CreditCardWallet from '@/components/marketing/credit-card-wallet';

const fadeUpVariants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function HeroSection({
  pillsProgress = null,
}: {
  pillsProgress?: MotionValue<number> | null;
}) {
  const controls = useAnimationControls();
  const onFirstLetter = useCallback(() => {
    playRevealSound();
  }, []);

  const fallbackProgress = useMotionValue(0);
  const p = pillsProgress ?? fallbackProgress;
  const ctaOpacity = useTransform(p, [0.05, 0.11], [1, 0]);
  const ctaY = useTransform(p, [0.05, 0.11], [0, -24]);

  useEffect(() => {
    controls.start('visible');
  }, [controls]);

  return (
    <div className="relative flex flex-col items-center justify-center text-center px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute -top-32 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
        }}
      >
        <motion.div variants={fadeUpVariants}>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>wikis inteligentes com IA</span>
          </div>
        </motion.div>

        <motion.div variants={fadeUpVariants} onAnimationComplete={onFirstLetter}>
          <PixelTitle className="w-full max-w-[680px]" />
        </motion.div>

        <motion.div
          className="text-xl md:text-2xl font-semibold text-gradient-primary mb-4 mt-2"
          variants={fadeUpVariants}
        >
          <span className="animate-typing-glow">Sua wiki, do seu jeito.</span>
        </motion.div>

        <motion.div
          className="text-base md:text-lg text-gray-400 leading-relaxed mb-6"
          variants={fadeUpVariants}
        >
          Crie sua Wiki em minutos sem usar{' '}
          <span className="inline-flex items-center align-middle">
            <CreditCardWallet size={16} />
          </span>{' '}
          cartão de crédito
        </motion.div>

        <motion.div
          className="flex gap-4 flex-wrap justify-center mb-2"
          variants={fadeUpVariants}
          style={
            pillsProgress
              ? { opacity: ctaOpacity, y: ctaY }
              : {}
          }
        >
          <motion.div
            whileHover={{ scale: 1.06, boxShadow: '0 0 30px hsl(198 100% 65% / 0.4)' }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onMouseEnter={playHoverSound}
            onClick={() => { playSuccessSound(); playClickSound(); }}
          >
            <Button size="lg" asChild className="relative overflow-hidden group">
              <Link href="/dashboard/new">
                <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/15 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative flex items-center">
                  Criar Wiki Grátis
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.06, boxShadow: '0 0 30px hsl(198 100% 65% / 0.2)' }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onMouseEnter={playHoverSound}
            onClick={() => {
              playClickSound();
              document.getElementById('section-carousel')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Button size="lg" variant="outline">Explorar</Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}