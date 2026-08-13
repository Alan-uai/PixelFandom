'use client';

import { useRef, useState, useMemo, useCallback, type ComponentType, type CSSProperties } from 'react';
import { motion, useScroll, useTransform, useVelocity, useMotionValueEvent, type MotionValue } from 'framer-motion';
import { Sparkles, Cpu, LayoutGrid, Globe, Layout } from 'lucide-react';
import HeroSection from './hero-section';
import NavStrip from './nav-strip';
import Hyperspeed from './Hyperspeed';

const PILL_START = 0.12;
const PILL_STEP = 0.06;
const PILL_SPAN = 0.05;
const NAV_START = 0.55;
const NAV_END = 0.68;

function DiscordSvgMini({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.59 5.81a14.6 14.6 0 00-3.67-1.14c-.16.28-.35.67-.48 1a13.59 13.59 0 00-4.06 0c-.13-.33-.32-.72-.48-1a14.6 14.6 0 00-3.68 1.14C3.12 10.24 2.3 14.48 2.7 18.66c1.57 1.14 3.1 1.84 4.6 2.3.37-.5.7-1.03.99-1.6a9.3 9.3 0 01-1.56-.76c.13-.1.26-.2.38-.3a11.14 11.14 0 009.78 0c.13.1.26.2.38.3-.5.3-1.02.55-1.57.75.28.57.62 1.1.98 1.6 1.5-.46 3.04-1.16 4.6-2.3.48-4.78-.74-8.99-3.1-12.85zM8.68 15.88c-.9 0-1.64-.82-1.64-1.82s.72-1.83 1.64-1.83c.93 0 1.66.83 1.64 1.83 0 1-.73 1.82-1.64 1.82zm6.64 0c-.9 0-1.64-.82-1.64-1.82s.72-1.83 1.64-1.83c.93 0 1.66.83 1.64 1.83 0 1-.73 1.82-1.64 1.82z" fill="currentColor" />
    </svg>
  );
}

interface PillDef {
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  label: string;
  color: string;
  dir: -1 | 1;
}

const featurePills: PillDef[] = [
  { icon: Sparkles, label: 'Editor Poderoso', color: 'hsl(198,100%,65%)', dir: -1 },
  { icon: Cpu, label: 'Assistente IA', color: 'hsl(270,80%,60%)', dir: 1 },
  { icon: LayoutGrid, label: 'Múltiplas Wikis', color: 'hsl(160,80%,55%)', dir: -1 },
  { icon: Globe, label: 'Domínio Próprio', color: 'hsl(30,80%,55%)', dir: 1 },
  { icon: Layout, label: 'Coleções', color: 'hsl(350,90%,60%)', dir: -1 },
  { icon: DiscordSvgMini, label: 'Discord', color: 'hsl(235,86%,65%)', dir: 1 },
];

function PillItem({ pill, index, progress }: { pill: PillDef; index: number; progress: MotionValue<number> }) {
  const start = PILL_START + index * PILL_STEP;
  const end = start + PILL_SPAN;

  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end + PILL_SPAN * 0.6], [42, 0]);
  const x = useTransform(progress, [start, end], [pill.dir * 56, pill.dir * 7]);
  const rotate = useTransform(progress, [start, end], [pill.dir * 9, pill.dir * 1.5]);
  const scale = useTransform(progress, [start, end], [0.55, 1]);

  return (
    <motion.div
      className={`relative ${index > 0 ? '-mt-3' : ''}`}
      style={{ opacity, y, x, rotate, scale, zIndex: index + 1 }}
    >
      <div
        className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 backdrop-blur-md transition-colors duration-300 hover:border-white/[0.18] hover:bg-white/[0.05]"
        style={{ boxShadow: `0 6px 28px ${pill.color}1f` }}
      >
        <pill.icon className="h-4 w-4" style={{ color: pill.color }} />
        <span className="text-xs font-medium text-foreground/90 sm:text-sm">{pill.label}</span>
      </div>
    </motion.div>
  );
}

function PillsStack({ progress }: { progress: MotionValue<number> }) {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center">
      {featurePills.map((pill, i) => (
        <PillItem key={pill.label} pill={pill} index={i} progress={progress} />
      ))}
    </div>
  );
}

function NavStripReveal({
  progress,
  onLogin,
}: {
  progress: MotionValue<number>;
  onLogin?: () => void;
}) {
  const opacity = useTransform(progress, [NAV_START, NAV_END], [0, 1]);
  const y = useTransform(progress, [NAV_START, NAV_END], [48, 0]);
  const scale = useTransform(progress, [NAV_START, NAV_END], [0.85, 1]);
  const pointerEvents = useTransform(opacity, (v) => (v > 0.5 ? 'auto' : 'none'));

  return (
    <motion.div
      className="relative z-20 origin-top scale-90 sm:scale-100"
      style={{ opacity, y, scale, pointerEvents }}
    >
      <NavStrip onLogin={onLogin} />
    </motion.div>
  );
}

export default function HeroPillsStory({ onLogin }: { onLogin?: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const hyperspeedApi = useRef<{ setSpeed: (v: number) => void } | null>(null);

  const hyperspeedOpacity = useTransform(scrollYProgress, [0, 0.08, 0.85, 1], [0, 0.9, 0.9, 0]);

  const hyperspeedOptions = useMemo(
    () => ({
      distortion: 'turbulentDistortion',
      totalSideLightSticks: 40,
      lightPairsPerRoadWay: 60,
      colors: {
        sticks: 0x4bc5ff,
        leftCars: [0x4bc5ff, 0x7c3aed, 0xf43f5e],
        rightCars: [0x4bc5ff, 0x7c3aed, 0xf43f5e],
      },
    }),
    []
  );

  const handleHyperspeedReady = useCallback((api: { setSpeed: (v: number) => void }) => {
    hyperspeedApi.current = api;
  }, []);

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const v = videoRef.current;
    if (v && videoDuration > 0) {
      const target = Math.min(videoDuration - 0.05, Math.max(0, p * videoDuration));
      if (Math.abs(v.currentTime - target) > 0.04) {
        v.currentTime = target;
      }
    }
  });

  useMotionValueEvent(scrollVelocity, 'change', (vel) => {
    const target = Math.min(6, Math.abs(vel) / 250);
    hyperspeedApi.current?.setSpeed(target);
  });

  return (
    <section ref={sectionRef} className="relative h-[350vh]">
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden px-4">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            ref={videoRef}
            src="/Parallax.mp4"
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <motion.div
            className="absolute inset-0 mix-blend-screen"
            style={{ opacity: hyperspeedOpacity, pointerEvents: 'none' }}
          >
            <Hyperspeed
              onReady={handleHyperspeedReady}
              effectOptions={hyperspeedOptions}
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/85 pointer-events-none" />
        </div>

        <HeroSection pillsProgress={scrollYProgress} />
        <PillsStack progress={scrollYProgress} />
        <div className="h-2 sm:h-4" />
        <NavStripReveal progress={scrollYProgress} onLogin={onLogin} />
      </div>
    </section>
  );
}