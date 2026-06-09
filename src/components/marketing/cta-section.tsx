'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/components/marketing/use-scroll-reveal';
import { playHoverSound, playSuccessSound } from '@/lib/feedback-sounds';

export default function CTASection() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });

  return (
    <motion.section
      ref={ref}
      className="py-28 px-4 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={isVisible ? { opacity: 1 } : {}}
      transition={{ duration: 0.6 }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      <div className="relative text-center max-w-lg mx-auto">
        <motion.h2
          className="text-3xl font-bold mb-4"
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
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button size="lg" asChild className="relative overflow-hidden group" onMouseEnter={playHoverSound} onClick={playSuccessSound}>
            <Link href="/dashboard/new">
              <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/15 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
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
