'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useSupabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { LogIn, LayoutDashboard, Trophy, Medal, User, Settings, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { NotificationBell } from '@/components/notifications/notification-bell';

interface MainNavProps {
  onLogin?: () => void;
}

export default function MainNav({ onLogin }: MainNavProps) {
  const { user, isLoading } = useUser();
  const { signOut } = useSupabase();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav className="flex h-14 items-center justify-between w-full">
      <div className="flex items-center gap-6">
        <Link href="/">
          <span className="text-xl font-bold">PixelFandom</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/leaderboard"
            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
              pathname === '/leaderboard' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Trophy className="h-3.5 w-3.5 inline mr-1" />
            Leaderboard
          </Link>
          <Link
            href="/badges"
            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
              pathname === '/badges' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Medal className="h-3.5 w-3.5 inline mr-1" />
            Conquistas
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {isLoading ? null : user ? (
          <>
            <Link
              href="/dashboard/profile"
              className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Perfil"
            >
              <User className="h-4 w-4" />
            </Link>
            <Link
              href="/settings"
              className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Configurações"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <NotificationBell />
            <div className="mx-1 h-5 w-px bg-border" />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                Dashboard
              </Link>
            </Button>
          </>
        ) : (
          <Button variant="default" size="sm" onClick={onLogin}>
            <LogIn className="h-4 w-4 mr-1.5" />
            Entrar
          </Button>
        )}
      </div>
    </nav>
  );
}
