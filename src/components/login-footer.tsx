'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSupabase } from '@/supabase';
import { useUser } from '@/supabase';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DISMISS_KEY = 'pixelfandom-login-footer-dismissed';
const DISMISS_TTL_DAYS = 3;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 127.14 96.36" className="h-5 w-5">
      <path fill="#5865F2" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,56.6,124.42,32.65,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
    </svg>
  );
}

export function LoginFooter() {
  const { user, isLoading } = useUser();
  const { signInWithGoogle, signInWithDiscord } = useSupabase();
  const { toast } = useToast();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (isLoading || user) return;
    if (pathname?.startsWith('/login') || pathname?.startsWith('/auth/')) return;

    let dismissed = false;
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const dismissedAt = new Date(raw).getTime();
        const ageDays = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
        dismissed = ageDays < DISMISS_TTL_DAYS;
      }
    } catch {
      dismissed = false;
    }
    if (dismissed) return;

    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [isLoading, user, pathname]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
  };

  const handleOAuth = async (provider: () => Promise<{ error: Error | null }>) => {
    setLoading(true);
    const { error } = await provider();
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      setLoading(false);
    }
  };

  if (!mounted || isLoading || user || !visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 translate-y-0 opacity-100 transition-all duration-500 ease-out"
      role="region"
      aria-label="Acesso rápido"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent" />
      <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col items-center gap-3 border-t border-white/[0.06] bg-card/95 px-4 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:flex-row sm:justify-between sm:gap-4">
        <p className="text-center text-sm text-muted-foreground sm:text-left">
          Entre para salvar respostas, personalizar sua wiki e acompanhar seus jogos.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => handleOAuth(signInWithGoogle)}
            disabled={loading}
          >
            <GoogleIcon />
            Entrar com Google
          </Button>
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => handleOAuth(signInWithDiscord)}
            disabled={loading}
          >
            <DiscordIcon />
            Discord
          </Button>
          <button
            onClick={dismiss}
            aria-label="Fechar"
            className="ml-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
