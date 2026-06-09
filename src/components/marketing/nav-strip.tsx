'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Trophy, LayoutDashboard, LogOut, LogIn, Info } from 'lucide-react';
import { useUser, useSupabase } from '@/supabase';
import { playHoverSound, playClickSound, playRevealSound } from '@/lib/feedback-sounds';
import { useOrbitalAnimation } from '@/hooks/use-orbital-animation';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItemDef {
  href?: string;
  icon: React.ReactNode;
  label: string;
  side: 'left' | 'right';
  glowColor: string;
  onClick?: () => void;
  isButton?: boolean;
}

interface OrbitalNavItemProps {
  href?: string;
  icon: React.ReactNode;
  label: string;
  glowColor: string;
  onClick?: () => void;
  isButton?: boolean;
  compact: boolean;
}

function OrbitalNavItem({ href, icon, label, glowColor, onClick, isButton, compact }: OrbitalNavItemProps) {
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
      <div
        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm cursor-pointer transition-colors duration-200 hover:bg-white/[0.08] hover:border-white/[0.15]"
        onClick={clickHandler}
      >
        {icon}
      </div>
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
    if (item.side === 'left') leftIndices.push(i);
    else rightIndices.push(i);
  });

  return items.map((item, i) => {
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
  const [clickWave, setClickWave] = useState<'left' | 'right' | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const autoReturnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollCleanupRef = useRef<(() => void) | null>(null);

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
  }, [user, handleLogout, onLogin]);

  const items = navItems();
  const { phase, setIconRef, expand, collapse } = useOrbitalAnimation(items.length);

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
    if (!isMobile) return;

    playClickSound();
    if (mobileExpanded) {
      doCollapse();
      setMobileExpanded(false);
      clearAutoReturn();
    } else {
      doExpand();
      setMobileExpanded(true);
      startAutoReturn();
    }
  }, [isMobile, mobileExpanded, doExpand, doCollapse, clearAutoReturn, startAutoReturn]);

  const handleIconClick = useCallback((item: NavItemDef) => {
    if (isMobile && mobileExpanded) {
      clearAutoReturn();
      doCollapse();
      setMobileExpanded(false);
    }
    triggerWave(item.side === 'left' ? 'left' : 'right');
  }, [isMobile, mobileExpanded, clearAutoReturn, doCollapse, triggerWave]);

  return (
    <section className="relative w-full py-8 overflow-visible">
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative flex items-center justify-center" style={{ perspective: 800 }}>
          {/* ── Energy Wave Background ── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
            <motion.div
              className="absolute w-32 h-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, hsl(270 80% 60% / 0.15) 0%, hsl(350 90% 60% / 0.08) 40%, transparent 70%)',
                filter: 'blur(20px)',
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.div
              className="absolute h-1 right-1/2"
              style={{
                width: 'calc(50% - 50px)',
                background: 'linear-gradient(90deg, transparent, hsl(270 80% 60% / 0.3), hsl(350 90% 60% / 0.15))',
                filter: 'blur(8px)',
              }}
              animate={{
                opacity: clickWave === 'left' ? [0, 0.8, 0.4] : [0.3, 0.5, 0.3],
                scaleX: clickWave === 'left' ? [1, 1.3, 1] : 1,
              }}
              transition={{ duration: clickWave === 'left' ? 0.6 : 3, repeat: clickWave === 'left' ? 0 : Infinity }}
            />

            <motion.div
              className="absolute h-1 left-1/2"
              style={{
                width: 'calc(50% - 50px)',
                background: 'linear-gradient(270deg, transparent, hsl(270 80% 60% / 0.3), hsl(350 90% 60% / 0.15))',
                filter: 'blur(8px)',
              }}
              animate={{
                opacity: clickWave === 'right' ? [0, 0.8, 0.4] : [0.3, 0.5, 0.3],
                scaleX: clickWave === 'right' ? [1, 1.3, 1] : 1,
              }}
              transition={{ duration: clickWave === 'right' ? 0.6 : 3, repeat: clickWave === 'right' ? 0 : Infinity }}
            />

            <div className="absolute w-3/4 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent blur-[2px]" />
          </div>

          {/* ── Orbital Icons Container ── */}
          <div className="relative flex items-center justify-center z-10">
            {/* Orbital / Expanded Nav Icons */}
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
                style={{ cursor: isMobile ? 'pointer' : 'default' }}
              >
                {/* Ring glow */}
                <motion.div
                  className="absolute -inset-3 rounded-full border border-purple-500/20"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute -inset-5 rounded-full border border-pink-500/10"
                  animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.4, 0.15] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                />

                {/* Avatar */}
                <motion.div
                  className="relative z-10"
                  style={{ transformStyle: 'preserve-3d' }}
                  whileHover={{ scale: 1.08, rotateZ: [0, -3, 3, 0] }}
                  transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                >
                  {user ? (
                    <Link href="/profile" onClick={() => { playClickSound(); triggerWave('right'); }}>
                      <div
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-[2.5px] shadow-[0_0_40px_rgba(75,197,255,0.25)] relative group cursor-pointer"
                        style={{ transform: 'translateZ(20px)' }}
                      >
                        <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                          {user.user_metadata?.avatar_url ? (
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
                    </Link>
                  ) : (
                    <button
                      onClick={() => { playClickSound(); onLogin?.(); triggerWave('right'); }}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-[2.5px] shadow-[0_0_40px_rgba(75,197,255,0.25)] relative group cursor-pointer"
                      style={{ transform: 'translateZ(20px)' }}
                    >
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                        <User className="h-8 w-8 text-primary" />
                      </div>
                      <motion.div
                        className="absolute -inset-1 rounded-full border-2 border-transparent group-hover:border-primary/40"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ opacity: 1, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      />
                    </button>
                  )}
                </motion.div>

                {/* Trophy */}
                <motion.div
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20"
                  style={{ transform: 'translateZ(30px)' }}
                  whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  onClick={() => { playClickSound(); triggerWave('left'); }}
                >
                  <Link href="/leaderboard" className="block">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-[2px] shadow-[0_0_20px_rgba(250,204,21,0.3)] group">
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center group-hover:bg-background/80 transition-colors">
                        <Trophy className="h-4.5 w-4.5 text-yellow-400" style={{ width: 18, height: 18 }} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
