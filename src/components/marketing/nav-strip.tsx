'use client';

import { useRef, useState, useCallback, useEffect, useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Trophy, Bell, LayoutDashboard, LogOut, LogIn, Info } from 'lucide-react';
import { useUser, useSupabase } from '@/supabase';
import { playHoverSound, playClickSound } from '@/lib/feedback-sounds';
import { useOrbitalAnimation } from '@/hooks/use-orbital-animation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNotifications } from '@/hooks/use-notifications';

interface NavItemDef {
  href?: string;
  icon: React.ReactNode;
  label: string;
  side: 'left' | 'right';
  glowColor: string;
  onClick?: () => void;
  isButton?: boolean;
  isBadge?: boolean;
}

interface OrbitalNavItemProps {
  href?: string;
  icon: React.ReactNode;
  label: string;
  glowColor: string;
  onClick?: () => void;
  isButton?: boolean;
  compact: boolean;
  waveGlow?: boolean;
  glowFilterId: string;
}

function generateIrregularRingPath(outerRadius: number, wobble: number, phase: number): string {
  const steps = 48;
  const cx = 200;
  const cy = 200;
  let d = '';

  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = outerRadius * (1 + wobble * Math.sin(a * 4 + phase) + wobble * 0.3 * Math.sin(a * 9 + phase * 1.3));
    d += `${i === 0 ? 'M' : 'L'} ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  }

  return d + ' Z';
}

function generateRingConfig() {
  return Array.from({ length: 6 }, (_, i) => ({
    outerRadius: 18 + i * 16 + Math.floor(Math.random() * 14),
    wobble: 0.025 + Math.random() * 0.04,
    duration: 3.5 + Math.random() * 2,
    delay: i * (0.3 + Math.random() * 0.8),
    repeatDelay: 2 + Math.random() * 3,
    phaseSeed: Math.random() * Math.PI * 2,
  }));
}

function generateStarPath(hr: number, vr: number): string {
  return `M 0,-${vr} C ${hr*0.06},-${vr*0.93} ${hr*0.5},-${vr*0.17} ${hr},0 C ${hr*0.5},${vr*0.17} ${hr*0.06},${vr*0.93} 0,${vr} C -${hr*0.06},${vr*0.93} -${hr*0.5},${vr*0.17} -${hr},0 C -${hr*0.5},-${vr*0.17} -${hr*0.06},-${vr*0.93} 0,-${vr} Z`;
}

function sampleStarPoints(hr: number, vr: number, total: number): { x: number; y: number }[] {
  const segs: { p0: { x: number; y: number }; p1: { x: number; y: number }; p2: { x: number; y: number }; p3: { x: number; y: number } }[] = [
    { p0: { x: 0, y: -vr }, p1: { x: hr * 0.06, y: -vr * 0.93 }, p2: { x: hr * 0.5, y: -vr * 0.17 }, p3: { x: hr, y: 0 } },
    { p0: { x: hr, y: 0 }, p1: { x: hr * 0.5, y: vr * 0.17 }, p2: { x: hr * 0.06, y: vr * 0.93 }, p3: { x: 0, y: vr } },
    { p0: { x: 0, y: vr }, p1: { x: -hr * 0.06, y: vr * 0.93 }, p2: { x: -hr * 0.5, y: vr * 0.17 }, p3: { x: -hr, y: 0 } },
    { p0: { x: -hr, y: 0 }, p1: { x: -hr * 0.5, y: -vr * 0.17 }, p2: { x: -hr * 0.06, y: -vr * 0.93 }, p3: { x: 0, y: -vr } },
  ];
  const points: { x: number; y: number }[] = [];
  const stepsPerSeg = Math.max(1, Math.floor(total / 4));
  for (const seg of segs) {
    for (let i = 0; i < stepsPerSeg; i++) {
      const t = i / stepsPerSeg;
      const u = 1 - t;
      points.push({
        x: u * u * u * seg.p0.x + 3 * u * u * t * seg.p1.x + 3 * u * t * t * seg.p2.x + t * t * t * seg.p3.x,
        y: u * u * u * seg.p0.y + 3 * u * u * t * seg.p1.y + 3 * u * t * t * seg.p2.y + t * t * t * seg.p3.y,
      });
    }
  }
  return points;
}

function generateMorphPath(
  progress: number,
  ringOuterRadius: number,
  ringWobble: number,
  ringPhase: number,
  starHr: number,
  starVr: number,
  pointCount: number = 60
): string {
  let d = '';

  const starPts = sampleStarPoints(starHr, starVr, pointCount);

  for (let i = 0; i < pointCount; i++) {
    const a = (i / pointCount) * Math.PI * 2;
    const ringR = ringOuterRadius * (1 + ringWobble * Math.sin(a * 4 + ringPhase) + ringWobble * 0.3 * Math.sin(a * 9 + ringPhase * 1.3));
    const ox = ringR * Math.cos(a) * (1 - progress) + starPts[i].x * progress;
    const oy = ringR * Math.sin(a) * (1 - progress) + starPts[i].y * progress;
    d += `${i === 0 ? 'M' : 'L'} ${ox} ${oy}`;
  }

  return d + ' Z';
}

const STAR_INSTANCES = [
  { hr: 180, vr: 55, delay: 0 },
  { hr: 140, vr: 42, delay: 1.2 },
  { hr: 220, vr: 68, delay: 2.4 },
];

function OrbitalNavItem({ href, icon, label, glowColor, onClick, isButton, compact, waveGlow, glowFilterId: gid }: OrbitalNavItemProps) {
  const [hovered, setHovered] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const soundRef = useRef(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (compact) return;
    const el = itemRef.current;
    if (!el) return;
    if (!soundRef.current) { soundRef.current = true; playHoverSound(); }
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -y * 8, y: x * 8 });
  };

  const clickHandler = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    onClick?.();
  };

  if (compact) {
    const orbitContent = (
      <motion.div
        className="cursor-pointer"
        style={
          waveGlow
            ? {
                filter: `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 20px ${glowColor})`,
              }
            : {}
        }
        animate={waveGlow ? { scale: 1.25 } : { scale: 1 }}
        transition={{ duration: 0.35 }}
        onClick={clickHandler}
      >
        {icon}
      </motion.div>
    );

    if (href) {
      return <Link href={href} onClick={clickHandler}>{orbitContent}</Link>;
    }
    return orbitContent;
  }

  const content = (
    <div
      ref={itemRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); soundRef.current = false; }}
      onClick={clickHandler}
      className="relative cursor-pointer"
      style={{ perspective: 600, transformStyle: 'preserve-3d' }}
    >
      <motion.div
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`relative flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-300 ${
          isButton
            ? 'bg-primary/15 border border-primary/20 hover:bg-primary/25 hover:border-primary/40'
            : hovered
              ? 'bg-white/[0.06]'
              : 'bg-transparent'
        }`}
      >
        <div className="relative">
          <motion.div
            animate={hovered ? { scale: 1.15 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="relative z-10"
          >
            {icon}
          </motion.div>
          {!isButton && hovered && (
            <motion.div
              className="absolute inset-0 rounded-full blur-md z-0"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.5, scale: 1.8 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{ backgroundColor: glowColor }}
              transition={{ duration: 0.3 }}
            />
          )}

        </div>
        <AnimatePresence>
          {hovered && (
            <motion.span
              initial={{ opacity: 0, x: -6, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: -6, width: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs font-medium text-foreground overflow-hidden whitespace-nowrap"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
        {isButton && !hovered && (
          <span className="text-xs font-medium text-primary">{label}</span>
        )}
        {isButton && hovered && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-100"
            animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>
    </div>
  );

  if (href) return <Link href={href} onClick={clickHandler}>{content}</Link>;
  return content;
}

function getExpandedPositions(items: NavItemDef[]): { x: number; y: number }[] {
  const leftIndices: number[] = [];
  const rightIndices: number[] = [];

  items.forEach((item, i) => {
    if (item.isBadge) return;
    if (item.side === 'left') leftIndices.push(i);
    else rightIndices.push(i);
  });

  return items.map((item, i) => {
    if (item.isBadge) return { x: 0, y: 0 };
    if (item.side === 'left') {
      const idx = leftIndices.indexOf(i);
      return { x: -(75 + idx * 70), y: 0 };
    }
    const idx = rightIndices.indexOf(i);
    return { x: 75 + idx * 70, y: 0 };
  });
}

export default function NavStrip({ onLogin }: { onLogin?: () => void }) {
  const { user } = useUser();
  const { signOut } = useSupabase();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { unreadCount } = useNotifications();
  const [clickWave, setClickWave] = useState<'left' | 'right' | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const autoReturnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollCleanupRef = useRef<(() => void) | null>(null);

  const manuallyExpanded = useRef(false);
  const [rings] = useState(() => generateRingConfig());
  const glowFilterId = useId();
  const [glowLeft, setGlowLeft] = useState(false);
  const [glowRight, setGlowRight] = useState(false);

  const handleLogout = useCallback(async () => {
    playClickSound();
    await signOut();
    router.push('/');
  }, [signOut, router]);

  const triggerWave = useCallback((side: 'left' | 'right') => {
    setClickWave(side);
    setTimeout(() => setClickWave(null), 600);
  }, []);

  const navItems = useCallback((): NavItemDef[] => {
    const items: NavItemDef[] = [
      { href: '/about', icon: <Info className="h-4 w-4" />, label: 'Sobre', side: 'left', glowColor: 'hsl(198,100%,65%)' },
      { href: '/leaderboard', icon: <Trophy className="h-4 w-4" />, label: 'Explorar', side: 'left', glowColor: 'hsl(270,80%,60%)' },
    ];

    if (user) {
      items.push(
        { href: '/notifications', icon: (
          <div className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 rounded-full bg-red-500 text-[7px] font-bold text-white flex items-center justify-center px-[3px] leading-none shadow-[0_0_6px_rgba(239,68,68,0.6)]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        ), label: 'Notificações', side: 'right', glowColor: 'hsl(35,100%,55%)', isBadge: true },
        { href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Dashboard', side: 'right', glowColor: 'hsl(198,100%,65%)' },
        { icon: <LogOut className="h-4 w-4" />, label: 'Sair', side: 'right', glowColor: 'hsl(350,90%,60%)', onClick: handleLogout },
      );
    } else {
      items.push({
        icon: <LogIn className="h-4 w-4" />, label: 'Entrar', side: 'right', glowColor: 'hsl(198,100%,65%)',
        onClick: () => onLogin?.(), isButton: true,
      });
    }

    return items;
  }, [user, handleLogout, onLogin, unreadCount]);

  const items = useMemo(() => navItems(), [navItems]);
  const { phase, expandedRef, setIconRef, setTrailRef, expand, collapse, setHoverSpeedMultiplier, setHoverRadiusMultiplier } = useOrbitalAnimation(items.length);

  const expandedPositions = useRef(getExpandedPositions(items));
  useEffect(() => { expandedPositions.current = getExpandedPositions(items); }, [items]);

  const isExpanded = phase === 'expanded';
  const [morphProgress, setMorphProgress] = useState(0);
  const morphRef = useRef(0);
  const morphTarget = useRef(0);

  useEffect(() => {
    morphTarget.current = isExpanded ? 1 : 0;
    if (morphRef.current === morphTarget.current) return;
    let raf: number;
    const loop = () => {
      const curr = morphRef.current;
      const tgt = morphTarget.current;
      const diff = tgt - curr;
      if (Math.abs(diff) < 0.0005) {
        morphRef.current = tgt;
        setMorphProgress(tgt);
        return;
      }
      morphRef.current += diff * 0.07;
      setMorphProgress(morphRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isExpanded]);

  const doExpand = useCallback(() => {
    expand(expandedPositions.current);
  }, [expand]);

  const doCollapse = useCallback(() => {
    collapse();
  }, [collapse]);

  const clearAutoReturn = useCallback(() => {
    if (autoReturnRef.current) {
      clearTimeout(autoReturnRef.current);
      autoReturnRef.current = null;
    }
  }, []);

  const startAutoReturn = useCallback(() => {
    clearAutoReturn();
    autoReturnRef.current = setTimeout(() => {
      doCollapse();
      setMobileExpanded(false);
    }, 5000);
  }, [clearAutoReturn, doCollapse]);

  useEffect(() => {
    if (!isMobile || !mobileExpanded) return;

    const onScroll = () => {
      doCollapse();
      setMobileExpanded(false);
      clearAutoReturn();
    };

    window.addEventListener('scroll', onScroll, { once: true });
    scrollCleanupRef.current = () => window.removeEventListener('scroll', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [isMobile, mobileExpanded, doCollapse, clearAutoReturn]);

  const handleAvatarClick = useCallback(() => {
    playClickSound();

    if (expandedRef.current) {
      doCollapse();
      manuallyExpanded.current = false;
      if (isMobile) {
        clearAutoReturn();
        setMobileExpanded(false);
      }
      if (user) router.push('/profile');
      else onLogin?.();
    } else {
      doExpand();
      manuallyExpanded.current = true;
      if (isMobile) {
        setMobileExpanded(true);
        startAutoReturn();
      }
    }
  }, [user, router, onLogin, isMobile, doExpand, doCollapse, clearAutoReturn, startAutoReturn]);

  const handleIconClick = useCallback((item: NavItemDef) => {
    if (isMobile && mobileExpanded) {
      clearAutoReturn();
      doCollapse();
      setMobileExpanded(false);
    }
    triggerWave(item.side === 'left' ? 'left' : 'right');
  }, [isMobile, mobileExpanded, clearAutoReturn, doCollapse, triggerWave]);

  const handleAvatarMouseEnter = useCallback(() => {
    if (isMobile) return;
    setHoverSpeedMultiplier(3.5);
    setHoverRadiusMultiplier(0.65);
  }, [isMobile, setHoverSpeedMultiplier, setHoverRadiusMultiplier]);

  const handleAvatarMouseLeave = useCallback(() => {
    if (isMobile) return;
    setHoverSpeedMultiplier(1.0);
    setHoverRadiusMultiplier(1.0);
  }, [isMobile, setHoverSpeedMultiplier, setHoverRadiusMultiplier]);

  const handleAvatarTouchStart = useCallback(() => {
    if (!isMobile) return;
    setHoverSpeedMultiplier(3.5);
    setHoverRadiusMultiplier(0.65);
  }, [isMobile, setHoverSpeedMultiplier, setHoverRadiusMultiplier]);

  const handleAvatarTouchEnd = useCallback(() => {
    if (!isMobile) return;
    setHoverSpeedMultiplier(1.0);
    setHoverRadiusMultiplier(1.0);
  }, [isMobile, setHoverSpeedMultiplier, setHoverRadiusMultiplier]);

  useEffect(() => {
    if (isExpanded) return;
    const interval = setInterval(() => {
      const cycle = 2500;
      const now = Date.now() % cycle / cycle;
      const stagger = [0, 0.32, 0.64];

      const isInZone = (delays: number[], start: number, end: number) =>
        delays.some(d => {
          const p = (now - d + 1) % 1;
          return p >= start && p <= end;
        });

      setGlowLeft(isInZone(stagger, 0.05, 0.42));
      setGlowRight(isInZone(stagger, 0.05, 0.42));
    }, 80);
    return () => clearInterval(interval);
  }, [isExpanded]);

  return (
    <section className="relative w-full py-8 overflow-visible">
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative flex items-center justify-center" style={{ perspective: 800 }}>
          {/* ── SVG Filter Definition ── */}
          <svg width="0" height="0" className="absolute">
            <defs>
              <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur"/>
                <feFlood floodColor="hsl(198,100%,65%)" floodOpacity="0.7" result="c1"/>
                <feFlood floodColor="hsl(270,80%,60%)" floodOpacity="0.5" result="c2"/>
                <feFlood floodColor="hsl(350,90%,60%)" floodOpacity="0.3" result="c3"/>
                <feComposite in="c1" in2="blur" operator="in" result="g1"/>
                <feComposite in="c2" in2="blur" operator="in" result="g2"/>
                <feComposite in="c3" in2="blur" operator="in" result="g3"/>
                <feBlend mode="screen" in="g2" in2="g1" result="m1"/>
                <feBlend mode="screen" in="g3" in2="m1" result="gradGlow"/>
                <feComponentTransfer in="SourceGraphic" result="bright">
                  <feFuncR type="linear" slope="1.4"/>
                  <feFuncG type="linear" slope="1.4"/>
                  <feFuncB type="linear" slope="1.4"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode in="gradGlow"/>
                  <feMergeNode in="bright"/>
                </feMerge>
              </filter>
            </defs>
          </svg>

          {/* ── Gradients ── */}
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="morph-stroke-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(198,100%,65%)" stopOpacity="0.9" />
                <stop offset="33%" stopColor="hsl(198,100%,65%)" stopOpacity="0.75" />
                <stop offset="50%" stopColor="hsl(270,80%,60%)" stopOpacity="0.6" />
                <stop offset="80%" stopColor="hsl(350,90%,60%)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(350,90%,60%)" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="wave-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(198,100%,65%)" stopOpacity="0.5" />
                <stop offset="50%" stopColor="hsl(270,80%,60%)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(350,90%,60%)" stopOpacity="0.15" />
              </linearGradient>
            </defs>
          </svg>

          {/* ── Gravitational Waves (collapsed) ── */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible"
            style={{ perspective: 800, transformStyle: 'preserve-3d' }}
            animate={{ opacity: isExpanded ? 0 : 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute" style={{ transform: 'rotateX(8deg)', transformStyle: 'preserve-3d' }}>
              {rings.map((arc, i) => (
                <motion.div
                  key={`wave-${i}`}
                  className="absolute"
                  style={{
                    width: 400,
                    height: 400,
                    left: '50%',
                    top: '50%',
                    marginLeft: -200,
                    marginTop: -200,
                    transform: `translateZ(${(i - 2.5) * 10}px)`,
                  }}
                  initial={{ scale: 0.05, opacity: 0 }}
                  animate={{
                    scale: [0.05, 1.0, 1.5 + i * 0.12],
                    opacity: [0, 0.5, 0],
                    rotate: [0, 4 + i * 2],
                  }}
                  transition={{
                    duration: arc.duration,
                    times: [0, 0.2, 1],
                    delay: arc.delay,
                    repeat: Infinity,
                    repeatDelay: arc.repeatDelay,
                    ease: 'easeOut',
                  }}
                >
                  <svg width="400" height="400" viewBox="0 0 400 400">
                    <path
                      d={generateIrregularRingPath(arc.outerRadius, arc.wobble, arc.phaseSeed)}
                      fill="none"
                      stroke="url(#wave-ring-grad)"
                      strokeWidth={Math.max(1.2, 2.5 - i * 0.15)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Morph Path (expanded) ── */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible"
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.6 }}
          >
            <svg width="400" height="400" viewBox="-200 -200 400 400">
              <path
                d={generateMorphPath(
                  morphProgress,
                  rings[0].outerRadius,
                  rings[0].wobble,
                  rings[0].phaseSeed,
                  STAR_INSTANCES[0].hr,
                  STAR_INSTANCES[0].vr,
                  60
                )}
                fill="none"
                stroke="url(#morph-stroke-grad)"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          {/* ── Orbital Icons Container ── */}
          <div className="relative flex items-center justify-center z-10">
            <div
              className="relative flex items-center justify-center"
              style={{ width: 400, height: 400, perspective: 600, transformStyle: 'preserve-3d' }}
              onMouseEnter={() => { if (!isMobile && !manuallyExpanded.current) doExpand(); }}
              onMouseLeave={() => {
                if (!isMobile && !manuallyExpanded.current) {
                  doCollapse();
                  setMobileExpanded(false);
                }
              }}
            >
              {/* Trail dots */}
              {!isExpanded && items.map((item, i) => (
                Array.from({ length: 8 }).map((_, t) => (
                  <div
                    key={`trail-${i}-${t}`}
                    ref={setTrailRef(i, t)}
                    className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
                    style={{
                      backgroundColor: item.glowColor,
                      width: 5,
                      height: 5,
                      marginLeft: -2.5,
                      marginTop: -2.5,
                      opacity: 0,
                      zIndex: 0,
                    }}
                  />
                ))
              ))}

              {/* Orbital Icons */}
              {items.map((item, i) => (
                <div
                  key={i}
                  ref={setIconRef(i)}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    marginLeft: -18,
                    marginTop: -18,
                    transition: 'none',
                    ...(isExpanded && item.isBadge ? { opacity: 0, pointerEvents: 'none' } : {}),
                  }}
                  onClick={() => handleIconClick(item)}
                >
                  <OrbitalNavItem
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    glowColor={item.glowColor}
                    onClick={item.onClick}
                    isButton={item.isButton}
                    compact={!isExpanded}
                    waveGlow={!isExpanded && ((item.side === 'left' && glowLeft) || (item.side === 'right' && glowRight))}
                    glowFilterId={glowFilterId}
                  />
                </div>
              ))}


            </div>

            {/* ── Center Avatar ── */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ transformStyle: 'preserve-3d', zIndex: 10 }}
            >
              <div
                className="relative"
                onClick={handleAvatarClick}
                onMouseEnter={handleAvatarMouseEnter}
                onMouseLeave={handleAvatarMouseLeave}
                onTouchStart={handleAvatarTouchStart}
                onTouchEnd={handleAvatarTouchEnd}
                style={{ cursor: 'pointer' }}
              >
                {/* Avatar */}
                <motion.div
                  className="relative z-10"
                  style={{ transformStyle: 'preserve-3d' }}
                  whileHover={{ scale: 1.08, rotateZ: [0, -3, 3, 0] }}
                  transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                >
                  <div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-[2.5px] shadow-[0_0_40px_rgba(75,197,255,0.25)] relative group cursor-pointer"
                    style={{ transform: 'translateZ(20px)' }}
                  >
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                      {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <motion.div
                      className="absolute -inset-1 rounded-full border-2 border-transparent group-hover:border-primary/40"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ opacity: 1, scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              </div>
            {/* ── Badge sobreposto ao avatar ── */}
            <AnimatePresence>
              {isExpanded && user && (() => {
                const badgeItem = items.find(i => i.isBadge);
                if (!badgeItem) return null;
                return (
                  <motion.div
                    key="expanded-badge"
                    className="absolute z-20 pointer-events-auto"
                    style={{ left: '50%', top: 'calc(50% + 28px)', transform: 'translateX(-50%) translateZ(30px)' }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                  >
                    <Link href="/notifications" className="block">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-[2px] shadow-[0_0_20px_rgba(250,204,21,0.3)] group relative">
                        <div className="w-full h-full rounded-full bg-background flex items-center justify-center group-hover:bg-background/80 transition-colors">
                          <Bell className="h-4 w-4 text-yellow-400" />
                        </div>
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 rounded-full bg-red-500 text-[7px] font-bold text-white flex items-center justify-center px-[3px] leading-none shadow-[0_0_6px_rgba(239,68,68,0.6)]">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


