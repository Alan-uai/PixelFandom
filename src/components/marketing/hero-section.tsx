'use client';

import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { playHoverSound, playClickSound, playRevealSound, playSuccessSound } from '@/lib/feedback-sounds';
import { useScrollReveal } from '@/components/marketing/use-scroll-reveal';

const title = 'PixelFandom';

const letterVariants = {
  hidden: { opacity: 0, y: 60, rotateX: -90, scale: 0.5 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 14,
      delay: 0.6 + i * 0.05,
    },
  }),
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const chevronVariants = {
  animate: {
    y: [0, 10, 0],
    opacity: [0.4, 1, 0.4],
    transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
  },
};

export default function HeroSection() {
  const onFirstLetter = useCallback(() => { playRevealSound(); }, []);
  const { ref: scrollRef, isVisible } = useScrollReveal({ threshold: 0.2 });

  return (
    <section
      ref={scrollRef}
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden"
    >
      {/* Gradient orb background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute -top-32 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      <motion.div
        className="relative z-10 flex flex-col items-center"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
      >
        {/* Badge */}
        <motion.div variants={fadeUpVariants}>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>wikis inteligentes com IA</span>
          </div>
        </motion.div>

        {/* Title with staggered letter animation */}
        <motion.h1
          className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-4 relative"
          variants={fadeUpVariants}
        >
          <span className="inline-flex flex-wrap justify-center gap-x-2 md:gap-x-4 text-gradient-cyan font-display">
            {title.split('').map((letter, i) => (
              <motion.span
                key={i}
                className="inline-block"
                variants={letterVariants}
                custom={i}
                onAnimationComplete={i === 0 ? onFirstLetter : undefined}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </motion.span>
            ))}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-xl md:text-3xl font-semibold text-gradient-primary mb-6"
          variants={fadeUpVariants}
        >
          Sua wiki, do seu jeito.
        </motion.p>

        {/* Description */}
        <motion.p
          className="text-base md:text-lg text-gray-400 max-w-2xl mb-10 leading-relaxed"
          variants={fadeUpVariants}
        >
          Crie wikis poderosas para seus jogos, comunidades e projetos.
          Com assistente IA integrado, domínio personalizado, temas customizáveis e integração
          com Discord — tudo que sua comunidade precisa em um só lugar.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex gap-4 flex-wrap justify-center"
          variants={fadeUpVariants}
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
            onClick={playClickSound}
          >
            <Button size="lg" variant="outline" asChild>
              <Link href="/about">
                Explorar
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500"
        variants={chevronVariants}
        animate="animate"
      >
        <ChevronDown className="h-8 w-8" />
      </motion.div>
    </section>
  );
}
