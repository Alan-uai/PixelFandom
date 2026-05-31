'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Loader2, Mail, Chrome, Code2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const rt = new URLSearchParams(window.location.search).get('redirect_to');
    setRedirectTo(rt);
  }, []);

  useEffect(() => {
    if (!redirectTo || hasRedirected.current) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !hasRedirected.current) {
        hasRedirected.current = true;
        redirectWithTokens(session, redirectTo);
      }
    });
  }, [redirectTo]);

  function redirectWithTokens(session: any, target: string) {
    const url = new URL(target);
    if (url.origin === window.location.origin) {
      router.push(target);
    } else {
      url.searchParams.set('sb_access_token', session.access_token);
      url.searchParams.set('sb_refresh_token', session.refresh_token);
      window.location.href = url.toString();
    }
  }

  const buildOAuthCallbackUrl = () => {
    const cb = `${window.location.origin}/auth/callback`;
    if (redirectTo) {
      return `${cb}?redirect_to=${encodeURIComponent(redirectTo)}`;
    }
    return `${cb}?next=/dashboard`;
  };

  const handleOAuth = async (provider: 'google' | 'discord' | 'github') => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: buildOAuthCallbackUrl() },
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        setLoading(false);
        return;
      }
      toast({ title: 'Login realizado!' });
      const { data: { session } } = await supabase.auth.getSession();
      if (session && redirectTo && !hasRedirected.current) {
        hasRedirected.current = true;
        redirectWithTokens(session, redirectTo);
      } else {
        router.push(redirectTo ? new URL(redirectTo).pathname : '/dashboard');
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        setLoading(false);
        return;
      }
      toast({ title: 'Conta criada!', description: 'Verifique seu email para confirmar.' });
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 py-12">
      <div className="bg-card border rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </h2>
          <button
            onClick={() => router.push(redirectTo ? new URL(redirectTo).pathname : '/')}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Voltar
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => handleOAuth('google')}
              disabled={loading}
            >
              <Chrome className="h-5 w-5" />
              Google
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => handleOAuth('discord')}
              disabled={loading}
            >
              <Code2 className="h-5 w-5 text-indigo-400" />
              Discord
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => handleOAuth('github')}
              disabled={loading}
            >
              <Code2 className="h-5 w-5" />
              GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                ou continue com email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === 'signup' && (
              <FloatingLabelInput
                label="Nome de usuário"
                info="Como você será identificado"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            )}
            <FloatingLabelInput
              label="Email"
              type="email"
              info="Usado para login e recuperação de senha"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FloatingLabelInput
              label="Senha"
              type="password"
              info="Mínimo de 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>
        </div>

        <div className="p-4 border-t text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-sm text-primary hover:underline"
          >
            {mode === 'login'
              ? 'Não tem conta? Cadastre-se'
              : 'Já tem conta? Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
}
