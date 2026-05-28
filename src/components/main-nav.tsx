'use client';

import Link from 'next/link';
import { useUser } from '@/supabase';
import { Button } from '@/components/ui/button';
import { LogIn, LayoutDashboard, Trophy, Medal, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface MainNavProps {
  onLogin?: () => void;
}

export default function MainNav({ onLogin }: MainNavProps) {
  const { user, isLoading } = useUser();
  const pathname = usePathname();

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
          {user && (
            <Link
              href={`/profile/${user.id}`}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                pathname === `/profile/${user.id}` ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <User className="h-3.5 w-3.5 inline mr-1" />
              Perfil
            </Link>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isLoading ? null : user ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4 mr-1.5" />
              Dashboard
            </Link>
          </Button>
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
