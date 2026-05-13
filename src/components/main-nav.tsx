'use client';

import Link from 'next/link';
import { useUser } from '@/supabase';
import { Button } from '@/components/ui/button';
import { LogIn, LayoutDashboard } from 'lucide-react';

interface MainNavProps {
  onLogin?: () => void;
}

export default function MainNav({ onLogin }: MainNavProps) {
  const { user, isLoading } = useUser();

  return (
    <nav className="flex h-14 items-center justify-between w-full">
      <div className="flex-shrink-0">
        <Link href="/">
          <span className="text-xl font-bold">PixelFandom</span>
        </Link>
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
