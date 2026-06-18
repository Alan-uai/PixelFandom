'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/supabase';
import { useUser } from '@/supabase';
import { useCachedData } from '@/hooks/use-cached-data';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { SliderTabs, SliderTabsList, SliderTabsTrigger, SliderTabsContent, SliderTabsContentGroup } from '@/components/ui/slider-tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserMinus, Shield, ShieldCheck, UserPlus, Copy, Download, Clock, X } from 'lucide-react';
import type { TenantMember } from '@/supabase/client';

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Leitor',
};

type InviteRow = {
  id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
};

export default function WikiMembersPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useUser();
  const { toast } = useToast();
  const [members, setMembers] = useState<(TenantMember & { email?: string })[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteExpiry, setInviteExpiry] = useState('never');
  const [sendingInvite, setSendingInvite] = useState(false);

  const { data: tenantData } = useCachedData<{ id: string }>(
    `tenant-id:${slug}`,
    async () => {
      const { data } = await supabase.from('tenants').select('id').eq('slug', slug).single();
      return data!;
    }
  );
  const tenantId = tenantData?.id ?? null;

  const cacheKey = tenantId ? `members:${tenantId}` : null;
  const { data: cacheData, loading } = useCachedData<{
    members: (TenantMember & { email?: string })[];
    invites: InviteRow[];
  }>(
    cacheKey,
    async () => {
      const [membersRes, invitesRes] = await Promise.all([
        supabase.from('tenant_members').select('*').eq('tenant_id', tenantId!),
        fetch(`/api/invitations?tenant_id=${tenantId!}`),
      ]);
      const invitesData = invitesRes.ok ? await invitesRes.json() : [];
      return {
        members: membersRes.data || [],
        invites: invitesData || [],
      };
    }
  );

  const dataRef = useRef(cacheData);
  useEffect(() => {
    if (!cacheData) return;
    if (dataRef.current === cacheData) return;
    dataRef.current = cacheData;
    setMembers(cacheData.members);
    setInvites(cacheData.invites);
  }, [cacheData]);

  const handleRoleChange = async (userId: string, role: string) => {
    if (!tenantId) return;
    setUpdating(userId);
    const { error } = await supabase
      .from('tenant_members')
      .update({ role })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      setMembers((prev) => prev.map((m) => (m.user_id === userId ? { ...m, role } as TenantMember & { email?: string } : m)));
      toast({ title: 'Permissão atualizada.' });
    }
    setUpdating(null);
  };

  const handleRemove = async (userId: string) => {
    if (!tenantId) return;
    setUpdating(userId);
    const { error } = await supabase
      .from('tenant_members')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      toast({ title: 'Membro removido.' });
    }
    setUpdating(null);
  };

  const handleSendInvite = async () => {
    if (!tenantId || !inviteEmail) return;
    setSendingInvite(true);

    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          email: inviteEmail,
          role: inviteRole,
          expires_in: inviteExpiry,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const data = await res.json();
      setInvites((prev) => [data, ...prev]);
      setInviteEmail('');
      toast({ title: 'Convite criado!', description: `Link: ${data.invite_url}` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRevokeInvite = async (id: string) => {
    const res = await fetch('/api/invitations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setInvites((prev) => prev.filter((i) => i.id !== id));
      toast({ title: 'Convite revogado.' });
    } else {
      toast({ variant: 'destructive', title: 'Erro ao revogar' });
    }
  };

  const copyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    toast({ title: 'Link copiado!' });
  };

  const downloadQR = async (token: string) => {
    try {
      const res = await fetch(`/api/invitations/${token}/qrcode`);
      if (!res.ok) throw new Error('Failed to generate QR');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `convite-${token.slice(0, 8)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao gerar QR Code' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <SliderTabs defaultValue="members">
        <SliderTabsList>
          <SliderTabsTrigger value="members" icon={Shield}>
            Membros ({members.length})
          </SliderTabsTrigger>
          <SliderTabsTrigger value="invites" icon={UserPlus}>
            Convites ({invites.length})
          </SliderTabsTrigger>
        </SliderTabsList>

        <SliderTabsContentGroup>
          <SliderTabsContent value="members">
            <WeldingCard>
            <CardHeader>
              <CardTitle>Membros</CardTitle>
              <CardDescription>Usuários com acesso a esta wiki.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {members.map((member) => {
                const isOwner = member.role === 'owner';
                const isSelf = member.user_id === user?.id;
                return (
                  <div key={member.user_id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      {isOwner ? <ShieldCheck className="h-5 w-5 text-primary" /> : <Shield className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <p className="text-sm font-medium">{isSelf ? 'Você' : member.user_id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{roleLabels[member.role] || member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isOwner && (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                          disabled={updating === member.user_id}
                          className="h-8 rounded-md border bg-background px-2 text-xs"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Leitor</option>
                        </select>
                      )}
                      {!isOwner && !isSelf && (
                        <Button variant="ghost" size="icon" onClick={() => handleRemove(member.user_id)} disabled={updating === member.user_id}>
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </WeldingCard>
          </SliderTabsContent>

          <SliderTabsContent value="invites">
          <WeldingCard>
            <CardHeader>
              <CardTitle>Convidar Membro</CardTitle>
              <CardDescription>Envie um convite para acessar esta wiki.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FloatingLabelInput
                  label="Email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  type="email"
                />
                <div>
                  <label className="text-xs font-medium mb-1 block">Papel</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Leitor</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Expiração</label>
                <select
                  value={inviteExpiry}
                  onChange={(e) => setInviteExpiry(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="3600000">1 hora</option>
                  <option value="86400000">24 horas</option>
                  <option value="604800000">7 dias</option>
                  <option value="2592000000">30 dias</option>
                  <option value="never">Nunca expira</option>
                </select>
              </div>
              <Button onClick={handleSendInvite} disabled={sendingInvite || !inviteEmail} className="w-full">
                {sendingInvite ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                {sendingInvite ? 'Enviando...' : 'Criar Convite'}
              </Button>
            </CardContent>
          </WeldingCard>

          {invites.length > 0 && (
            <WeldingCard>
              <CardHeader>
                <CardTitle>Convites Pendentes ({invites.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{inv.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{inv.role}</span>
                        {inv.expires_at ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expira {new Date(inv.expires_at).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem expiração</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => copyInviteLink(inv.token)} title="Copiar link">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => downloadQR(inv.token)} title="QR Code">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleRevokeInvite(inv.id)} title="Revogar">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </WeldingCard>
          )}
          </SliderTabsContent>
        </SliderTabsContentGroup>
      </SliderTabs>
    </div>
  );
}
