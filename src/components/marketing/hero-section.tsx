'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useTransform, useAnimationControls, useMotionValue } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown, Sparkles, Cpu, Users, Globe, Layout } from 'lucide-react';
import { playHoverSound, playClickSound, playRevealSound, playSuccessSound } from '@/lib/feedback-sounds';
import { useScrollProgress } from '@/context/scroll-progress-context';
import AnimatedGradientText from '@/components/ui/animated-gradient-text';
import CreditCardWallet from '@/components/marketing/credit-card-wallet';

function DiscordSvgMini({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.59 5.81a14.6 14.6 0 00-3.67-1.14c-.16.28-.35.67-.48 1a13.59 13.59 0 00-4.06 0c-.13-.33-.32-.72-.48-1a14.6 14.6 0 00-3.68 1.14C3.12 10.24 2.3 14.48 2.7 18.66c1.57 1.14 3.1 1.84 4.6 2.3.37-.5.7-1.03.99-1.6a9.3 9.3 0 01-1.56-.76c.13-.1.26-.2.38-.3a11.14 11.14 0 009.78 0c.13.1.26.2.38.3-.5.3-1.02.55-1.57.75.28.57.62 1.1.98 1.6 1.5-.46 3.04-1.16 4.6-2.3.48-4.78-.74-8.99-3.1-12.85zM8.68 15.88c-.9 0-1.64-.82-1.64-1.82s.72-1.83 1.64-1.83c.93 0 1.66.83 1.64 1.83 0 1-.73 1.82-1.64 1.82zm6.64 0c-.9 0-1.64-.82-1.64-1.82s.72-1.83 1.64-1.83c.93 0 1.66.83 1.64 1.83 0 1-.73 1.82-1.64 1.82z" fill="currentColor"/>
    </svg>
  );
}

const miniFeatures = [
  { icon: Sparkles, label: 'Editor Poderoso', color: 'hsl(198,100%,65%)' },
  { icon: Cpu, label: 'Assistente IA', color: 'hsl(270,80%,60%)' },
  { icon: Users, label: 'Equipe', color: 'hsl(160,80%,55%)' },
  { icon: Globe, label: 'Domínio Próprio', color: 'hsl(30,80%,55%)' },
  { icon: Layout, label: 'Coleções', color: 'hsl(350,90%,60%)' },
  { icon: DiscordSvgMini, label: 'Discord', color: 'hsl(235,86%,65%)' },
];

const fadeUpVariants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function HeroSection() {
  const scrollProgress = useScrollProgress();
  const [phase, setPhase] = useState<'entry' | 'loop' | 'exit'>('entry');
  const controls = useAnimationControls();
  const onFirstLetter = useCallback(() => { playRevealSound(); }, []);

  const containerClass = 'relative flex-1 flex flex-col items-center justify-center text-center px-4 overflow-hidden py-16 md:py-20';

  useEffect(() => {
    controls.start('visible');
  }, [controls]);

  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    if (!scrollProgress) return;
    const unsub = scrollProgress.on('change', (v) => {
      if (v > 0.5 && phaseRef.current === 'entry') {
        setPhase('exit');
      }
    });
    return unsub;
  }, [scrollProgress]);

  useEffect(() => {
    if (!scrollProgress || phase !== 'exit') return;
    const unsub = scrollProgress.on('change', (v) => {
      if (v < 0.3 && phaseRef.current === 'exit') {
        setPhase('loop');
      }
    });
    return unsub;
  }, [scrollProgress, phase]);

  const fallbackMV = useMotionValue(0);
  const subtitleOpacity = useTransform(scrollProgress || fallbackMV, [0.5, 0.8], [1, 0]);
  const featuresOpacity = useTransform(scrollProgress || fallbackMV, [0.5, 0.8], [1, 0]);
  const ctaOpacity = useTransform(scrollProgress || fallbackMV, [0.5, 0.8], [1, 0]);
  const ctaY = useTransform(scrollProgress || fallbackMV, [0.5, 0.8], [0, -30]);

  return (
    <section className={containerClass}>
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
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>wikis inteligentes com IA</span>
          </div>
        </motion.div>

        <motion.div variants={fadeUpVariants}>
          <AnimatedGradientText
            text="PixelFandom"
            as="h1"
            className="text-5xl sm:text-6xl md:text-8xl font-bold mb-4 relative"
            scrollProgress={null}
            onFirstLetterAnimated={onFirstLetter}
          />
        </motion.div>

        <motion.div
          className="text-xl md:text-3xl font-semibold text-gradient-primary mb-6"
          variants={fadeUpVariants}
          style={phase === 'exit' && subtitleOpacity ? { opacity: subtitleOpacity } : {}}
        >
          <span className="animate-typing-glow">Sua wiki, do seu jeito.</span>
        </motion.div>

        <motion.div
          className="text-base md:text-lg text-gray-400 leading-relaxed mb-8"
          variants={fadeUpVariants}
        >
          Crie sua Wiki em minutos sem usar{' '}
          <span className="inline-flex items-center align-middle">
            <CreditCardWallet size={16} />
          </span>{' '}
          cartão de crédito
        </motion.div>

        <motion.div
          className="w-full max-w-3xl mb-10"
          variants={fadeUpVariants}
          style={phase === 'exit' && featuresOpacity ? { opacity: featuresOpacity } : {}}
        >
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {miniFeatures.map((feature) => (
              <motion.div
                key={feature.label}
                className="group relative"
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={playHoverSound}
                style={{ perspective: 400 }}
              >
                <motion.div
                  className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04]"
                  whileHover={{ rotateX: -5, rotateY: 5 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="relative">
                    <feature.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: feature.color }} />
                    <motion.div
                      className="absolute inset-0 blur-sm opacity-0 group-hover:opacity-60 transition-opacity duration-300"
                      style={{ color: feature.color, backgroundColor: feature.color, borderRadius: '50%', width: '100%', height: '100%' }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300" style={{ transform: 'translateZ(8px)' }}>
                    {feature.label}
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="flex gap-4 flex-wrap justify-center mb-12"
          variants={fadeUpVariants}
          style={
            phase === 'exit' && ctaOpacity && ctaY
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

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500"
        animate={{ y: [0, 10, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="h-8 w-8" />
      </motion.div>
    </section>
  );
}
