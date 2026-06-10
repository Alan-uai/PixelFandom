'use client';

import { useRef, useState, useCallback, useEffect, useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Trophy, Bell, LayoutDashboard, LogOut, LogIn, Info } from 'lucide-react';
import { useUser, useSupabase } from '@/supabase';
import { playHoverSound, playClickSound, playRevealSound } from '@/lib/feedback-sounds';
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
  drawCircle?: boolean;
  glowFilterId: string;
}

function generateIrregularRingPath(outerRadius: number, innerRatio: number, wobble: number, phase: number): string {
  const steps = 48;
  const innerRadius = outerRadius * innerRatio;
  const cx = 200;
  const cy = 200;
  let d = '';

  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = outerRadius * (1 + wobble * Math.sin(a * 4 + phase) + wobble * 0.3 * Math.sin(a * 9 + phase * 1.3));
    d += `${i === 0 ? 'M' : 'L'} ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  }
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * -2;
    const r = innerRadius * (1 + wobble * Math.sin(a * 4 + phase + 1.5) + wobble * 0.3 * Math.sin(a * 9 + phase * 1.7));
    d += ` L ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  }

  return d + ' Z';
}

function generateWaveConfig() {
  const count = 3 + Math.floor(Math.random() * 2);
  return Array.from({ length: count }, (_, i) => ({
    outerRadius: 40 + Math.floor(Math.random() * 80),
    innerRatio: 0.3 + Math.random() * 0.25,
    wobble: 0.03 + Math.random() * 0.04,
    duration: 10 + Math.random() * 8,
    delay: i * (1.5 + Math.random() * 2),
    phaseSeed: Math.random() * Math.PI * 2,
  }));
}

interface WaveRing {
  outerRadius: number;
  innerRatio: number;
  wobble: number;
  duration: number;
  delay: number;
  phaseSeed: number;
}

const CIRC = 2 * Math.PI * 6;

function OrbitalNavItem({ href, icon, label, glowColor, onClick, isButton, compact, waveGlow, drawCircle, glowFilterId: gid }: OrbitalNavItemProps) {
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

  const clickHandler = () => { playClickSound(); onClick?.(); };

  if (compact) {
    const orbitContent = (
      <motion.div
        className="cursor-pointer"
        style={waveGlow ? { filter: `url(#${gid})` } : {}}
        animate={waveGlow ? { scale: 1.2 } : {}}
        transition={{ duration: 0.4 }}
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
          <div
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ bottom: -14, width: 16, height: 16, zIndex: 20 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <defs>
                <linearGradient id="bell-draw-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(198,100%,65%)" />
                  <stop offset="50%" stopColor="hsl(270,80%,60%)" />
                  <stop offset="100%" stopColor="hsl(350,90%,60%)" />
                </linearGradient>
              </defs>
              <motion.circle
                cx="8" cy="8" r="6"
                fill="none"
                stroke="url(#bell-draw-grad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                animate={{ strokeDashoffset: drawCircle ? 0 : CIRC }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </svg>
          </div>
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
    if (item.isBadge) return { x: 0, y: 38 };
    if (item.side === 'left') {
      const idx = leftIndices.indexOf(i);
      return { x: -(75 + idx * 70), y: 0 };
    }
    const idx = rightIndices.indexOf(i);
    return { x: 75 + idx * 70, y: 0 };
  });
}

export default function NavStrip({ onLogin }: { onLogin?: () => void }) {
  const { user, isLoading } = useUser();
  const { signOut } = useSupabase();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { unreadCount } = useNotifications();
  const [clickWave, setClickWave] = useState<'left' | 'right' | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const autoReturnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollCleanupRef = useRef<(() => void) | null>(null);

  const [waveArcs] = useState(() => generateWaveConfig());
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
        ), label: 'Notificações', side: 'right', glowColor: 'hsl(198,100%,65%)', isBadge: true },
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

  const items = navItems();
  const badgeIndices = items.reduce<number[]>((acc, item, i) => {
    if (item.isBadge) acc.push(i);
    return acc;
  }, []);
  const paramOverrides = useMemo(() =>
    items.map(item =>
      item.isBadge ? { radius: 30, speed: 0.4, inclination: 0 } : null,
    ),
    [items],
  );
  const { phase, setIconRef, setTrailRef, expand, collapse, setOrbitTransition, setHoverSpeedMultiplier, setHoverRadiusMultiplier } = useOrbitalAnimation(items.length, { paramOverrides });

  const expandedPositions = useRef(getExpandedPositions(items));
  useEffect(() => { expandedPositions.current = getExpandedPositions(items); }, [items]);

  const isExpanded = phase === 'expanded';

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
    if (!isMobile) {
      if (user) router.push('/profile');
      else onLogin?.();
      return;
    }

    playClickSound();
    if (mobileExpanded) {
      clearAutoReturn();
      doCollapse();
      setMobileExpanded(false);
      if (user) router.push('/profile');
      else onLogin?.();
    } else {
      doExpand();
      setMobileExpanded(true);
      startAutoReturn();
    }
  }, [isMobile, user, router, onLogin, mobileExpanded, doExpand, doCollapse, clearAutoReturn, startAutoReturn]);

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
    setHoverSpeedMultiplier(1.5);
    setHoverRadiusMultiplier(0.65);
  }, [isMobile, setHoverSpeedMultiplier, setHoverRadiusMultiplier]);

  const handleAvatarMouseLeave = useCallback(() => {
    if (isMobile) return;
    setHoverSpeedMultiplier(1.0);
    setHoverRadiusMultiplier(1.0);
  }, [isMobile, setHoverSpeedMultiplier, setHoverRadiusMultiplier]);

  const handleAvatarTouchStart = useCallback(() => {
    if (!isMobile) return;
    setHoverSpeedMultiplier(1.5);
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
      const cycle = 2000;
      const now = Date.now() % cycle / cycle;
      const active = now >= 0.05 && now <= 0.35;
      setGlowLeft(active);
      setGlowRight(active);
    }, 80);
    return () => clearInterval(interval);
  }, [isExpanded]);

  return (
    <section className="relative w-full pb-4 overflow-visible">
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

          {/* ── Gravitational Waves – Irregular Rings ── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
            <svg width="0" height="0" className="absolute">
              <defs>
                <radialGradient id="ring-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(198,100%,65%)" stopOpacity="0.9" />
                  <stop offset="25%" stopColor="hsl(198,100%,65%)" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="hsl(270,80%,60%)" stopOpacity="0.6" />
                  <stop offset="80%" stopColor="hsl(350,90%,60%)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(350,90%,60%)" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>

            {waveArcs.map((arc, i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute"
                style={{
                  width: 400,
                  height: 400,
                  left: '50%',
                  top: '50%',
                  marginLeft: -200,
                  marginTop: -200,
                }}
                animate={{
                  scale: [0.25, 1.15, 1.8],
                  opacity: [0.6, 0.5, 0],
                }}
                transition={{
                  duration: arc.duration,
                  times: [0, 0.2, 0.6],
                  delay: arc.delay,
                  repeat: Infinity,
                  repeatDelay: 0.8 + Math.random() * 0.6,
                  ease: 'easeOut',
                }}
              >
                <svg width="400" height="400" viewBox="0 0 400 400">
                  <path
                    d={generateIrregularRingPath(arc.outerRadius, arc.innerRatio, arc.wobble, arc.phaseSeed)}
                    fill="url(#ring-grad)"
                    fillRule="evenodd"
                  />
                </svg>
              </motion.div>
            ))}

            <div className="absolute w-3/4 h-px bg-gradient-to-r from-transparent via-purple-500/15 to-transparent blur-[2px]" />
          </div>

          {/* ── Orbital Icons Container ── */}
          <div className="relative flex items-center justify-center z-10">
            <div
              className="relative z-20 flex items-center justify-center"
              style={{ width: 400, height: 400 }}
              onMouseEnter={() => { if (!isMobile) doExpand(); }}
              onMouseLeave={() => {
                if (!isMobile) {
                  doCollapse();
                  setMobileExpanded(false);
                }
              }}
            >
              {/* Orbital Icons */}
              {items.map((item, i) => (
                <div
                  key={i}
                  ref={setIconRef(i)}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: 36,
                    height: 36,
                    marginLeft: -18,
                    marginTop: -18,
                    transition: 'none',
                  }}
                  onClick={() => handleIconClick(item)}
                >
                  {!isExpanded && (
                  <div
                    ref={setTrailRef(i)}
                    className="absolute pointer-events-none"
                    style={{
                      right: '50%',
                      top: '50%',
                      marginTop: -1.5,
                      height: 3,
                      background: `linear-gradient(90deg, ${item.glowColor} 0%, transparent 100%)`,
                      borderRadius: 2,
                      transformOrigin: 'right center',
                      opacity: 0,
                      width: 0,
                      willChange: 'transform, width, opacity',
                    }}
                  />
                  )}
                  <OrbitalNavItem
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    glowColor={item.glowColor}
                    onClick={item.onClick}
                    isButton={item.isButton}
                    compact={!isExpanded}
                    waveGlow={!isExpanded && ((item.side === 'left' && glowLeft) || (item.side === 'right' && glowRight))}
                    drawCircle={isExpanded && item.isBadge}
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
                style={{ cursor: isMobile ? 'pointer' : 'default' }}
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
