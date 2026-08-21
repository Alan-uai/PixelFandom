'use client';

import { useRef, useMemo, useCallback, useEffect, useState, type ComponentType, type CSSProperties } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, type MotionValue } from 'framer-motion';
import { Sparkles, Cpu, LayoutGrid, Globe, Layout } from 'lucide-react';
import HeroSection from './hero-section';
import NavStrip from './nav-strip';
import Hyperspeed from './Hyperspeed';

const TOTAL_FRAMES = 123;
const FRAME_BASE = '/parallax/frame_';
const frameUrl = (i: number) => `${FRAME_BASE}${String(i).padStart(3, '0')}.jpg`;

const PILL_START = 0.14;
const PILL_STEP = 0.13;
const PILL_SPAN = 0.05;

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

export default function HeroPillsStory({ onLogin }: { onLogin?: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ['start start', 'end end'],
  });
  const progress = scrollYProgress;

  const hyperspeedApi = useRef<{ setProgress: (v: number) => void; setStraighten: (v: number) => void } | null>(null);
  const drawRef = useRef<((p: number) => void) | null>(null);

  const canvasOpacity = useTransform(progress, [0, 0.05, 0.78, 0.9], [0, 0.9, 0.9, 0.05]);
  const hyperspeedOpacity = useTransform(progress, [0, 0.05, 0.9, 1], [0, 1, 1, 0]);

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

  const handleHyperspeedReady = useCallback((api: { setProgress: (v: number) => void; setStraighten: (v: number) => void }) => {
    hyperspeedApi.current = api;
  }, []);

  // Canvas parallax — RAF-throttled + frame deduplication + responsive DPR
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    const images: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);
    const displayedRef = { current: -1 };
    const targetRef = { current: 0 };
    let rafId = 0;

    const resize = () => {
      // Size the buffer to the canvas' own CSS box (the visible sticky 100vh
      // viewport), NOT the 350vh scroll parent — otherwise frames get squished
      // to ~1/3.5 of their height ("absurd zoom").
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      draw(targetRef.current);
    };

    // Desenha o frame inteiro (contain) para que ele caiba na largura da
    // seção mesmo em telas pequenas, sem ficar gigante.
    const drawContain = (img: HTMLImageElement) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = cw / ch;
      let dw: number;
      let dh: number;
      if (ir > cr) {
        dw = cw;
        dh = cw / ir;
      } else {
        dh = ch;
        dw = ch * ir;
      }
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    const draw = (index: number) => {
      const i = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));
      if (i === displayedRef.current) return;
      const img = images[i];
      if (img && img.complete && img.naturalWidth > 0) {
        drawContain(img);
        displayedRef.current = i;
        return;
      }
      for (let j = i; j >= 0; j--) {
        const fb = images[j];
        if (fb && fb.complete && fb.naturalWidth > 0) {
          drawContain(fb);
          displayedRef.current = j;
          return;
        }
      }
    };

    for (let k = 0; k < TOTAL_FRAMES; k++) {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => {
        if (k === targetRef.current) draw(k);
      };
      im.src = frameUrl(k);
      images[k] = im;
    }

    resize();
    window.addEventListener('resize', resize);
    drawRef.current = (p: number) => {
      const idx = Math.round(p * (TOTAL_FRAMES - 1));
      targetRef.current = idx;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => draw(idx));
    };

    return () => {
      window.removeEventListener('resize', resize);
      drawRef.current = null;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Scroll-driven updates — RAF-throttled
  let hyperspeedRaf = 0;
  useMotionValueEvent(progress, 'change', (p) => {
    drawRef.current?.(p);
    if (!hyperspeedRaf) {
      hyperspeedRaf = requestAnimationFrame(() => {
        hyperspeedRaf = 0;
        hyperspeedApi.current?.setProgress(p);
        // Lines become completely straight (vertical tunnel) right from the hero
        const straighten = p < 0.04 ? p / 0.04 : 1;
        hyperspeedApi.current?.setStraighten(straighten);
      });
    }
  });

  return (
    <div ref={rootRef} className="relative">
      {/* ── Hyperspeed: fixed background that persists from the hero through the nav-strip ── */}
      <motion.div
        className="fixed inset-0 z-[1] mix-blend-screen"
        style={{ opacity: hyperspeedOpacity, pointerEvents: 'none' }}
        aria-hidden
      >
        <Hyperspeed onReady={handleHyperspeedReady} effectOptions={hyperspeedOptions} />
      </motion.div>

      {/* ── Hero + Parallax + Pills (scroll-driven) ── */}
      <section ref={sectionRef} id="navstrip-origin" className="relative h-[350vh]">
        <div className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden px-4">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <motion.div
              className="absolute inset-0"
              style={{ opacity: canvasOpacity, pointerEvents: 'none' }}
            >
              <canvas ref={canvasRef} id="parallax-canvas" className="absolute inset-0 block h-full w-full" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/85 pointer-events-none" />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center">
            <HeroSection pillsProgress={progress} />
            <PillsStack progress={progress} />
          </div>
        </div>
      </section>

      {/* ── NavStrip (scrolls naturally after the hero, over the persistent hyperspeed) ── */}
      <NavStripSection onLogin={onLogin} />
    </div>
  );
}

function NavStripSection({ onLogin }: { onLogin?: () => void }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="relative z-10 min-h-[50vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-[min(92vw,560px)] overflow-hidden rounded-[28px] border border-primary/25 px-6 py-6"
        style={{
          background:
            'linear-gradient(180deg, rgba(75,197,255,0.05), rgba(124,58,237,0.05))',
          boxShadow: '0 0 90px rgba(75,197,255,0.14)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent 0 22px, rgba(75,197,255,0.22) 22px 23px)',
          }}
        />
        <NavStrip onLogin={onLogin} />
      </motion.div>
    </div>
  );
}
