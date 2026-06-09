'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/components/marketing/use-scroll-reveal';

interface CounterProps {
  end: number;
  suffix?: string;
  label: string;
  delay: number;
}

function AnimatedCounter({ end, suffix = '', label, delay }: CounterProps) {
  const [count, setCount] = useState(0);
  const counted = useRef(false);
  const { ref, isVisible } = useScrollReveal({ threshold: 0.5 });

  useEffect(() => {
    if (!isVisible || counted.current) return;
    counted.current = true;
    const duration = 2000;
    const steps = 60;
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isVisible, end]);

  return (
    <div ref={ref} className="text-center">
      <motion.div
        className="text-3xl sm:text-4xl font-bold font-display text-gradient-cyan"
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.5, delay, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {count}{suffix}
      </motion.div>
      <motion.p
        className="text-sm text-muted-foreground mt-1"
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: delay + 0.2 }}
      >
        {label}
      </motion.p>
    </div>
  );
}

const stats = [
  { end: 150, suffix: '+', label: 'Wikis Criadas' },
  { end: 1200, suffix: '+', label: 'Membros' },
  { end: 5000, suffix: '+', label: 'Artigos' },
];

export default function StatBar() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <motion.section
      ref={ref}
      className="relative max-w-4xl mx-auto px-4 py-16"
      initial={{ opacity: 0 }}
      animate={isVisible ? { opacity: 1 } : {}}
      transition={{ duration: 0.6 }}
    >
      <div className="rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/5 px-8 py-10">
        <div className="grid grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <AnimatedCounter key={stat.label} {...stat} delay={i * 0.15} />
          ))}
        </div>
        <motion.div
          className="mt-6 pt-4 border-t border-white/5 text-center"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <p className="text-xs text-muted-foreground">
            e crescendo — junte-se a centenas de comunidades
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}
