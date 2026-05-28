'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Clock, Shield, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '@/supabase';

type InviteData = {
  id: string;
  email: string;
  role: string;
  expires_at: string | null;
  tenant: { name: string; slug: string; logo_url: string | null; description: string | null };
  invited_by_profile?: { display_name: string; avatar_url: string | null };
};

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/invitations/${token}`);
        if (!res.ok) {
          const err = await res.json();
          if (res.status === 410) setError('Este convite expirou ou já foi usado.');
          else setError(err.error || 'Convite inválido.');
          return;
        }
        const data = await res.json();
        setInvite(data);
      } catch {
        setError('Erro ao carregar convite.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      if (!user) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/invite/${token}` },
        });
        if (error) throw error;
        return;
      }

      const res = await fetch(`/api/invitations/${token}/accept`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao aceitar convite.');
      }

      setAccepted(true);
      setTimeout(() => router.push(`/w/${invite?.tenant.slug}`), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle>Convite Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <CardTitle>Convite Aceito!</CardTitle>
            <CardDescription>
              Você agora é membro de <strong>{invite?.tenant.name}</strong> como <Badge>{invite?.role}</Badge>.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isExpired = invite?.expires_at && new Date(invite.expires_at) < new Date();

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {invite?.tenant.logo_url ? (
            <img src={invite.tenant.logo_url} alt="" className="h-20 w-20 rounded-xl mx-auto mb-4 border" />
          ) : (
            <div className="h-20 w-20 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-10 w-10 text-primary" />
            </div>
          )}
          <CardTitle className="text-2xl">Convite para {invite?.tenant.name}</CardTitle>
          <CardDescription className="mt-2">
            {invite?.tenant.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Seu papel</span>
            <Badge variant="secondary">{invite?.role}</Badge>
          </div>
          {invite?.expires_at && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Expira em</span>
              <span className="text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
          {!isExpired && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Para</span>
              <span className="text-sm">{invite?.email}</span>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={handleAccept}
            disabled={accepting || !!isExpired}
          >
            {accepting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : user ? (
              <UserPlus className="h-4 w-4 mr-2" />
            ) : (
              <LogIn className="h-4 w-4 mr-2" />
            )}
            {accepting ? 'Aceitando...' : user ? (isExpired ? 'Convite Expirado' : 'Aceitar Convite') : 'Fazer login para aceitar'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
