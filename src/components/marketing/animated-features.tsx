'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/components/marketing/use-scroll-reveal';
import { Sparkles, Cpu, Users, Globe, Layout } from 'lucide-react';
import { playHoverSound } from '@/lib/feedback-sounds';
import type { LucideIcon } from 'lucide-react';

function DiscordSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.59 5.81a14.6 14.6 0 00-3.67-1.14c-.16.28-.35.67-.48 1a13.59 13.59 0 00-4.06 0c-.13-.33-.32-.72-.48-1a14.6 14.6 0 00-3.68 1.14C3.12 10.24 2.3 14.48 2.7 18.66c1.57 1.14 3.1 1.84 4.6 2.3.37-.5.7-1.03.99-1.6a9.3 9.3 0 01-1.56-.76c.13-.1.26-.2.38-.3a11.14 11.14 0 009.78 0c.13.1.26.2.38.3-.5.3-1.02.55-1.57.75.28.57.62 1.1.98 1.6 1.5-.46 3.04-1.16 4.6-2.3.48-4.78-.74-8.99-3.1-12.85zM8.68 15.88c-.9 0-1.64-.82-1.64-1.82s.72-1.83 1.64-1.83c.93 0 1.66.83 1.64 1.83 0 1-.73 1.82-1.64 1.82zm6.64 0c-.9 0-1.64-.82-1.64-1.82s.72-1.83 1.64-1.83c.93 0 1.66.83 1.64 1.83 0 1-.73 1.82-1.64 1.82z" fill="currentColor"/>
    </svg>
  );
}

type IconComponent = LucideIcon | typeof DiscordSvg;

const features: { icon: IconComponent; title: string; description: string }[] = [
  {
    icon: Sparkles,
    title: 'Editor Poderoso',
    description: 'Edite wikis com um editor visual intuitivo e suporte a Markdown.',
  },
  {
    icon: Cpu,
    title: 'Assistente IA',
    description: 'Crie e edite conteúdo com ajuda de inteligência artificial integrada.',
  },
  {
    icon: Users,
    title: 'Equipe e Permissões',
    description: 'Gerencie sua equipe com níveis de acesso personalizados.',
  },
  {
    icon: Globe,
    title: 'Domínio Próprio',
    description: 'Use seu próprio domínio para uma experiência totalmente personalizada.',
  },
  {
    icon: Layout,
    title: 'Coleções Customizadas',
    description: 'Organize conteúdo em coleções e tabelas dinâmicas.',
  },
  {
    icon: DiscordSvg,
    title: 'Integração Discord',
    description: 'Conecte sua wiki ao Discord e automatize seu servidor.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

interface TiltCardProps {
  icon: IconComponent;
  title: string;
  description: string;
}

function TiltCard({ icon: Icon, title, description }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const soundPlayed = useRef(false);

  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    if (!soundPlayed.current) {
      soundPlayed.current = true;
      playHoverSound();
    }
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -y * 12, y: x * 12 });
  }

  function onMouseEnter() {
    setHovered(true);
  }

  function onMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
    soundPlayed.current = false;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      style={{ perspective: 800, transformStyle: 'preserve-3d' }}
    >
      <div
        className={`rounded-2xl p-8 backdrop-blur-sm transition-all duration-300 ${
          hovered
            ? 'bg-white/[0.04] animate-border-glow-rotate'
            : 'bg-white/[0.02] border border-white/5'
        }`}
      >
        <div className="relative z-10" style={{ transformStyle: 'preserve-3d' }}>
          <motion.div
            className="mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
            animate={hovered ? { scale: 1.1, boxShadow: '0 0 20px hsl(198 100% 65% / 0.25)' } : {}}
            transition={{ duration: 0.3 }}
          >
            <Icon className="h-6 w-6 text-primary" />
          </motion.div>
          <h3 className="font-display text-lg font-semibold mb-2" style={{ transform: 'translateZ(20px)' }}>
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed" style={{ transform: 'translateZ(15px)' }}>
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function AnimatedFeatures() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.05 });

  return (
    <motion.section
      ref={ref}
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32"
      initial={{ opacity: 0 }}
      animate={isVisible ? { opacity: 1 } : {}}
      transition={{ duration: 0.6 }}
    >
      {/* Section divider */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-16 flex items-center justify-center">
        <svg
          className="animate-shape-float"
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="0" y1="40" x2="28" y2="40" stroke="white" strokeOpacity="0.08" strokeWidth="1" />
          <line x1="52" y1="40" x2="80" y2="40" stroke="white" strokeOpacity="0.08" strokeWidth="1" />
          <rect x="34" y="34" width="12" height="12" rx="3" fill="white" fillOpacity="0.06" stroke="white" strokeOpacity="0.15" strokeWidth="1" />
          <circle cx="40" cy="40" r="4" fill="white" fillOpacity="0.1" />
        </svg>
      </div>

      {/* Header */}
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        <h2 className="font-display text-3xl sm:text-4xl mb-4">
          Tudo que você precisa
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
          Ferramentas completas para criar e gerenciar a wiki da sua comunidade.
        </p>
      </motion.div>

      {/* Feature cards grid */}
      <motion.div
        className="grid md:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
      >
        {features.map((f) => (
          <motion.div key={f.title} variants={cardVariants}>
            <TiltCard icon={f.icon} title={f.title} description={f.description} />
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
