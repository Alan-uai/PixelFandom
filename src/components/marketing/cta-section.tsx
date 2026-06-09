'use client';

import { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/components/marketing/use-scroll-reveal';
import { playHoverSound, playSuccessSound } from '@/lib/feedback-sounds';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

export default function CTASection() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const btnRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const handleExplode = useCallback(() => {
    playSuccessSound();
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ['#4BC5FF', '#7C3AED', '#F43F5E', '#F59E0B', '#10B981'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40 + (Math.random() - 0.5) * 0.3;
      const speed = 80 + Math.random() * 160;
      newParticles.push({
        id: idRef.current++,
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1200);
  }, []);

  return (
    <motion.section
      ref={ref}
      className="py-28 px-4 relative overflow-hidden min-h-[400px]"
      initial={{ opacity: 0 }}
      animate={isVisible ? { opacity: 1 } : {}}
      transition={{ duration: 0.6 }}
    >
      {/* Dense mesh gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.03] via-purple-500/[0.02] via-pink-500/[0.02] to-background pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] rounded-full bg-pink-500/5 blur-[80px] pointer-events-none" />

      {/* Explosion particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none z-20"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            x: p.x,
            y: p.y,
            boxShadow: `0 0 6px ${p.color}`,
          }}
          animate={{
            x: p.x + p.vx,
            y: p.y + p.vy,
            opacity: [1, 0.8, 0],
            scale: [1, 0.5, 0],
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      ))}

      <div className="relative text-center max-w-lg mx-auto">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold font-display mb-4"
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={isVisible ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Pronto para criar sua wiki?
        </motion.h2>
        <motion.p
          className="text-muted-foreground mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Leva menos de um minuto. Sem cartão de crédito.
        </motion.p>
        <motion.div
          ref={btnRef}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            size="lg"
            asChild
            className="relative overflow-hidden group"
            onMouseEnter={playHoverSound}
            onClick={handleExplode}
          >
            <Link href="/dashboard/new">
              <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/15 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              <span className="relative flex items-center">
                Criar Wiki Grátis
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
}
