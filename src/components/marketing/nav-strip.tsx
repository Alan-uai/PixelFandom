'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
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
}

function generateWaveConfig() {
  const count = 1 + Math.floor(Math.random() * 6);
  return Array.from({ length: count }, (_, i) => ({
    height: 16 + Math.floor(Math.random() * 12),
    duration: 3 + Math.random() * 4,
    delay: i * (0.2 + Math.random() * 0.5),
    vOffset: -28 + Math.floor(Math.random() * 56),
  }));
}

interface WaveArc {
  height: number;
  duration: number;
  delay: number;
  vOffset: number;
}

function OrbitalNavItem({ href, icon, label, glowColor, onClick, isButton, compact, waveGlow }: OrbitalNavItemProps) {
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
        style={waveGlow ? { filter: `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 16px ${glowColor})` } : {}}
        animate={waveGlow ? { scale: 1.2, filter: ['brightness(1)', 'brightness(1.6)', 'brightness(1)'] } : {}}
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
          {waveGlow && compact && (
            <motion.div
              className="absolute inset-0 rounded-full blur-xl z-0"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.6, scale: 2.5 }}
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
    if (item.isBadge) return { x: 0, y: 12 };
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
  expandedPositions.current = getExpandedPositions(items);

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
    setHoverSpeedMultiplier(2.5);
    setHoverRadiusMultiplier(0.65);
  }, [isMobile, setHoverSpeedMultiplier, setHoverRadiusMultiplier]);

  const handleAvatarMouseLeave = useCallback(() => {
    if (isMobile) return;
    setHoverSpeedMultiplier(1.0);
    setHoverRadiusMultiplier(1.0);
  }, [isMobile, setHoverSpeedMultiplier, setHoverRadiusMultiplier]);

  const handleAvatarTouchStart = useCallback(() => {
    if (!isMobile) return;
    setHoverSpeedMultiplier(2.5);
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
    <section className="relative w-full py-8 overflow-visible">
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative flex items-center justify-center" style={{ perspective: 800 }}>
          {/* ── Gravitational Waves ── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
            {waveArcs.map((arc, aIdx) => {
              const rightSideDelay = arc.delay;
              const leftSideDelay = arc.delay + arc.duration * 0.5;
              return (
                <div key={`wave-${aIdx}`} className="absolute inset-0 flex items-center justify-center">
                  {/* Left arc `(` */}
                  <div
                    className="absolute"
                    style={{ right: '50%', top: `calc(50% + ${arc.vOffset}px)` }}
                  >
                    <motion.div
                      style={{
                        width: 0,
                        height: `${arc.height}px`,
                        background: 'linear-gradient(90deg, transparent 0%, hsl(198 100% 65% / 0.65) 25%, hsl(270 80% 60% / 0.5) 55%, hsl(350 90% 60% / 0.3) 100%)',
                        filter: 'blur(10px)',
                        borderTopLeftRadius: '50%',
                        borderBottomLeftRadius: '50%',
                        transformOrigin: 'right center',
                        transform: 'translateY(-50%)',
                      }}
                      animate={{ width: [0, 300, 300, 0], opacity: [0.6, 0.6, 0.2, 0] }}
                      transition={{
                        duration: arc.duration,
                        times: [0, 0.25, 0.55, 1],
                        delay: leftSideDelay,
                        repeatDelay: 1.5 + Math.random() * 0.5,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                    />
                  </div>

                  {/* Right arc `)` */}
                  <div
                    className="absolute"
                    style={{ left: '50%', top: `calc(50% + ${arc.vOffset}px)` }}
                  >
                    <motion.div
                      style={{
                        width: 0,
                        height: `${arc.height}px`,
                        background: 'linear-gradient(270deg, transparent 0%, hsl(198 100% 65% / 0.65) 25%, hsl(270 80% 60% / 0.5) 55%, hsl(350 90% 60% / 0.3) 100%)',
                        filter: 'blur(10px)',
                        borderTopRightRadius: '50%',
                        borderBottomRightRadius: '50%',
                        transformOrigin: 'left center',
                        transform: 'translateY(-50%)',
                      }}
                      animate={{ width: [0, 300, 300, 0], opacity: [0.6, 0.6, 0.2, 0] }}
                      transition={{
                        duration: arc.duration,
                        times: [0, 0.25, 0.55, 1],
                        delay: rightSideDelay,
                        repeatDelay: 1.5 + Math.random() * 0.5,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="absolute w-3/4 h-px bg-gradient-to-r from-transparent via-purple-500/15 to-transparent blur-[2px]" />
          </div>

          {/* ── Orbital Icons Container ── */}
          <div className="relative flex items-center justify-center z-10">
            <div
              className="relative flex items-center justify-center"
              style={{ width: 400, height: 400 }}
              onMouseEnter={() => { if (!isMobile) doExpand(); }}
              onMouseLeave={() => {
                if (!isMobile) {
                  doCollapse();
                  setMobileExpanded(false);
                }
              }}
            >
              {/* Single solid trail per icon */}
              {!isExpanded && items.map((item, i) => (
                <div
                  key={`trail-${i}`}
                  ref={setTrailRef(i)}
                  className="absolute left-1/2 top-1/2 pointer-events-none"
                  style={{
                    height: 3,
                    background: `linear-gradient(90deg, ${item.glowColor} 0%, transparent 100%)`,
                    borderRadius: 2,
                    transformOrigin: 'right center',
                    opacity: 0,
                    marginTop: -1.5,
                    willChange: 'transform, width, opacity',
                  }}
                />
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
