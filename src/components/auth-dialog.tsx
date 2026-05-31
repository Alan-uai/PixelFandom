'use client';

import { useState } from 'react';
import { useSupabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Loader2, X, Mail, Chrome, Code2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'signup';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthDialog({ open, onClose }: AuthDialogProps) {
  const { signIn, signUp, signInWithGoogle, signInWithDiscord, signInWithGitHub } = useSupabase();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
      } else {
        toast({ title: 'Login realizado!' });
        onClose();
      }
    } else {
      const { error } = await signUp(email, password, username);
      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
      } else {
        toast({ title: 'Conta criada!', description: 'Verifique seu email para confirmar.' });
        onClose();
      }
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: () => Promise<{ error: Error | null }>) => {
    setLoading(true);
    const { error } = await provider();
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* OAuth providers */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => handleOAuth(signInWithGoogle)}
              disabled={loading}
            >
              <Chrome className="h-5 w-5" />
              Google
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => handleOAuth(signInWithDiscord)}
              disabled={loading}
            >
              <Code2 className="h-5 w-5 text-indigo-400" />
              Discord
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => handleOAuth(signInWithGitHub)}
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

          {/* Email form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === 'signup' && (
              <FloatingLabelInput
                label="Nome de usuário"
                info="Como você será identificado na plataforma"
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
