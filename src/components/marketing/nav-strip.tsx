'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Trophy, LayoutDashboard, LogOut, LogIn, Info, Sparkles } from 'lucide-react';
import { useUser, useSupabase } from '@/supabase';
import { playHoverSound, playClickSound, playRevealSound } from '@/lib/feedback-sounds';

interface NavItemProps {
  href?: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  glowColor?: string;
}

function NavItem({ href, icon, label, onClick, glowColor = 'hsl(198,100%,65%)' }: NavItemProps) {
  const [hovered, setHovered] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const soundRef = useRef(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = itemRef.current;
    if (!el) return;
    if (!soundRef.current) { soundRef.current = true; playHoverSound(); }
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -y * 8, y: x * 8 });
  };

  const content = (
    <div
      ref={itemRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); soundRef.current = false; }}
      onClick={() => { playClickSound(); onClick?.(); }}
      className="relative cursor-pointer"
      style={{ perspective: 600, transformStyle: 'preserve-3d' }}
    >
      <motion.div
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`relative flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-300 ${
          hovered ? 'bg-white/[0.06]' : 'bg-transparent'
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
          {hovered && (
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
      </motion.div>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

const NAV_ITEMS_LEFT = [
  { href: '/about', icon: <Info className="h-4 w-4" />, label: 'Sobre', glowColor: 'hsl(198,100%,65%)' },
  { href: '/leaderboard', icon: <Trophy className="h-4 w-4" />, label: 'Explorar', glowColor: 'hsl(270,80%,60%)' },
];

export default function NavStrip({ onLogin }: { onLogin?: () => void }) {
  const { user, isLoading } = useUser();
  const { signOut } = useSupabase();
  const router = useRouter();
  const [clickWave, setClickWave] = useState<'left' | 'right' | null>(null);
  const pulseRef = useRef(0);

  const handleLogout = useCallback(async () => {
    playClickSound();
    await signOut();
    router.push('/');
  }, [signOut, router]);

  const triggerWave = useCallback((side: 'left' | 'right') => {
    setClickWave(side);
    setTimeout(() => setClickWave(null), 600);
  }, []);

  return (
    <section className="relative w-full py-8 overflow-visible">
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative flex items-center justify-center" style={{ perspective: 800 }}>
          {/* ── Energy Wave Background ── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
            {/* Center glow */}
            <motion.div
              className="absolute w-32 h-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, hsl(270 80% 60% / 0.15) 0%, hsl(350 90% 60% / 0.08) 40%, transparent 70%)',
                filter: 'blur(20px)',
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Left energy wave */}
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

            {/* Right energy wave */}
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

            {/* Subtle connecting beam */}
            <div className="absolute w-3/4 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent blur-[2px]" />
          </div>

          {/* ── Content ── */}
          <div className="relative flex items-center justify-center gap-3 sm:gap-6 z-10">
            {/* Left nav items */}
            <div className="flex items-center gap-1">
              {NAV_ITEMS_LEFT.map((item) => (
                <div key={item.href} onClick={() => triggerWave('left')}>
                  <NavItem {...item} />
                </div>
              ))}
            </div>

            {/* ── Center Avatar + Trophy ── */}
            <div className="relative mx-4" style={{ transformStyle: 'preserve-3d' }}>
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
                      {/* Hover ring shimmer */}
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

                {/* Energy dots orbiting */}
                <motion.div
                  className="absolute -top-2 -right-2 w-2.5 h-2.5 rounded-full bg-purple-400 blur-[2px]"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                />
                <motion.div
                  className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-pink-400 blur-[2px]"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
                />
              </motion.div>

              {/* Trophy overlapping below */}
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

            {/* Right nav items */}
            <div className="flex items-center gap-1">
              {user ? (
                <>
                  <div onClick={() => triggerWave('right')}>
                    <NavItem
                      href="/dashboard"
                      icon={<LayoutDashboard className="h-4 w-4" />}
                      label="Dashboard"
                      glowColor="hsl(198,100%,65%)"
                    />
                  </div>
                  <div onClick={() => { handleLogout(); triggerWave('right'); }}>
                    <NavItem
                      icon={<LogOut className="h-4 w-4" />}
                      label="Sair"
                      glowColor="hsl(350,90%,60%)"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div onClick={() => triggerWave('right')}>
                    <button
                      onClick={() => { playClickSound(); onLogin?.(); triggerWave('right'); }}
                      className="relative flex items-center gap-2 rounded-xl px-4 py-2 bg-primary/15 border border-primary/20 hover:bg-primary/25 hover:border-primary/40 transition-all duration-300 group"
                    >
                      <LogIn className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-primary">Entrar</span>
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100"
                        animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
