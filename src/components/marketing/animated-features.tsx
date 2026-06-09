'use client';

import { useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/components/marketing/use-scroll-reveal';
import { BookOpen, Cpu, Users, Globe } from 'lucide-react';
import { playHoverSound } from '@/lib/feedback-sounds';

const features = [
  {
    icon: BookOpen,
    title: 'Editor Poderoso',
    description: 'Editor rich text com TipTap, markdown e upload de imagens.',
    gradient: 'from-primary/20 via-primary/5 to-transparent',
  },
  {
    icon: Cpu,
    title: 'Assistente IA',
    description: 'IA configurável por wiki que responde sobre seu conteúdo.',
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
  },
  {
    icon: Users,
    title: 'Equipe e Permissões',
    description: 'Controle de acesso por roles: owner, admin, editor, viewer.',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
  },
  {
    icon: Globe,
    title: 'Domínio Próprio',
    description: 'Use seu próprio domínio ou um subdomínio personalizado.',
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
  },
  {
    icon: BookOpen,
    title: 'Coleções Customizadas',
    description: 'Dados estruturados com schemas flexíveis por coleção.',
    gradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
  },
  {
    icon: BookOpen,
    title: 'Integração Discord',
    description: 'Bot do Discord para buscar e criar páginas da wiki.',
    gradient: 'from-sky-500/20 via-sky-500/5 to-transparent',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

function TiltCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const hovered = useRef(false);

  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    if (!hovered.current) { hovered.current = true; playHoverSound(); }
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -y * 12, y: x * 12 });
  }

  function onMouseLeave() {
    setTilt({ x: 0, y: 0 });
    hovered.current = false;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      style={{ perspective: 800, transformStyle: 'preserve-3d' }}
    >
      {children}
    </motion.div>
  );
}

export default function AnimatedFeatures() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.05 });

  return (
    <motion.section
      ref={ref}
      className="py-20 px-4 relative"
      initial={{ opacity: 0 }}
      animate={isVisible ? { opacity: 1 } : {}}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="text-2xl font-bold text-center mb-14"
          initial={{ opacity: 0, y: 15 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          Tudo que você precisa
        </motion.h2>

        <motion.div
          className="grid md:grid-cols-3 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={cardVariants}>
              <TiltCard>
                <div className="relative h-full rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm p-6 hover:border-primary/20 transition-colors group overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <motion.div
                      className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
                      whileHover={{ rotate: [0, -10, 10, -5, 0], scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <f.icon className="h-5 w-5 text-primary" />
                    </motion.div>
                    <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
