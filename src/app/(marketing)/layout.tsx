'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useUser, useSupabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { LogIn, LayoutDashboard, Trophy, User, Settings, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import AuthDialog from '@/components/auth-dialog';
import ThreeBackground from '@/components/marketing/three-background';

function FloatingNav({ onLogin }: { onLogin: () => void }) {
  const { user, isLoading } = useUser();
  const { signOut } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(() => {
          setShow(window.scrollY > 60);
          ticking.current = false;
        });
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/[0.08] px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <Link
          href="/"
          className="rounded-full px-4 py-1.5 text-sm font-semibold font-display text-gradient-cyan"
        >
          PixelFandom
        </Link>

        <div className="h-4 w-px bg-white/10 mx-1" />

        <Link
          href="/about"
          className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
        >
          Sobre
        </Link>

        <div className="flex items-center gap-1">
          {isLoading ? null : user ? (
            <>
              <Link
                href="/profile"
                className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                title="Perfil"
              >
                <User className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full px-3 py-1.5 text-xs font-medium text-foreground bg-primary/20 hover:bg-primary/30 transition-all"
              >
                <LayoutDashboard className="h-3 w-3 inline mr-1" />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                title="Sair"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/leaderboard"
                className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                title="Explorar"
              >
                <Trophy className="h-3.5 w-3.5" />
              </Link>
              <Button
                size="sm"
                className="rounded-full h-8 px-4 text-xs"
                onClick={onLogin}
              >
                <LogIn className="h-3 w-3 mr-1" />
                Entrar
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col relative">
      <ThreeBackground />
      <FloatingNav onLogin={() => setAuthOpen(true)} />
      <main className="flex flex-1 flex-col relative z-10">
        {children}
      </main>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
