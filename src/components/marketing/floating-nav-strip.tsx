'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Trophy, Bell, LayoutDashboard, LogOut, LogIn, Settings } from 'lucide-react';
import { useUser, useSupabase } from '@/supabase';
import { playClickSound } from '@/lib/feedback-sounds';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuthDialog } from '@/context/auth-dialog-context';

interface FloatingNavStripProps {
  show: boolean;
}

export default function FloatingNavStrip({ show }: FloatingNavStripProps) {
  const { user } = useUser();
  const { signOut } = useSupabase();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { openAuth } = useAuthDialog();

  const handleLogout = useCallback(async () => {
    playClickSound();
    await signOut();
    router.push('/');
  }, [signOut, router]);

  const handleLogin = useCallback(() => {
    playClickSound();
    openAuth();
  }, [openAuth]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
  }, []);

  return (
    <nav
      className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        show
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-center gap-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/[0.08] px-5 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {/* Left side icons */}
        <div className="flex items-center gap-1">
          <Link
            href="/leaderboard"
            onClick={handleClick}
            className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all duration-300"
          >
            <Trophy className="h-4 w-4" />
          </Link>
        </div>

        {/* Center avatar */}
        <div className="flex items-center justify-center">
          {user ? (
            <Link
              href="/profile"
              onClick={handleClick}
              className="block"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-[2px] shadow-[0_0_20px_rgba(75,197,255,0.2)] hover:shadow-[0_0_30px_rgba(75,197,255,0.4)] transition-shadow duration-300">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                  {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.user_metadata.avatar_url || user.user_metadata.picture}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <button
              onClick={handleLogin}
              className="block"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-[2px] shadow-[0_0_20px_rgba(75,197,255,0.2)] hover:shadow-[0_0_30px_rgba(75,197,255,0.4)] transition-shadow duration-300">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-1">
          {user && (
            <Link
              href="/notifications"
              onClick={handleClick}
              className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all duration-300 relative"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 rounded-full bg-red-500 text-[7px] font-bold text-white flex items-center justify-center px-[3px] leading-none shadow-[0_0_6px_rgba(239,68,68,0.6)]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )}
          {user && (
            <Link
              href="/dashboard"
              onClick={handleClick}
              className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all duration-300"
            >
              <LayoutDashboard className="h-4 w-4" />
            </Link>
          )}
          {user && (
            <Link
              href="/settings"
              onClick={handleClick}
              className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all duration-300"
            >
              <Settings className="h-4 w-4" />
            </Link>
          )}
          {user ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleLogout(); }}
              className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-muted-foreground hover:text-red-400 hover:bg-white/[0.06] transition-all duration-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-1 rounded-xl px-3 py-1.5 bg-primary/15 border border-primary/20 hover:bg-primary/25 hover:border-primary/40 text-primary transition-all duration-300"
            >
              <LogIn className="h-4 w-4" />
              <span className="text-xs font-medium">Entrar</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
