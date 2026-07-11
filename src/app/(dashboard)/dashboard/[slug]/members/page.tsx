'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePageState } from '@/hooks/use-page-state';
import { supabase } from '@/supabase';
import { useUser } from '@/supabase';
import { useCachedData } from '@/hooks/use-cached-data';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { SliderTabs, SliderTabsList, SliderTabsTrigger, SliderTabsContent, SliderTabsContentGroup } from '@/components/ui/slider-tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserMinus, Shield, ShieldCheck, UserPlus, Copy, Download, Clock, X } from 'lucide-react';
import { Select3D } from '@/components/ui/select3d';
import type { TenantMember } from '@/supabase/client';

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
  const t = useTranslations('members');

  const roleLabels: Record<string, string> = {
    owner: t('roles.owner'),
    admin: t('roles.admin'),
    editor: t('roles.editor'),
    viewer: t('roles.viewer'),
  };

  const [members, setMembers] = useState<(TenantMember & { display_name?: string; email?: string; avatar_url?: string })[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteExpiry, setInviteExpiry] = useState('never');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [membersTab, setMembersTab] = usePageState('tab', 'members');

  const { data: tenantData, error: tenantError } = useCachedData<{ id: string }>(
    `tenant-id:${slug}`,
    async () => {
      const { data } = await supabase.from('tenants').select('id').eq('slug', slug).single();
      return data!;
    }
  );
  const tenantId = tenantData?.id ?? null;

  const cacheKey = tenantId ? `members:${tenantId}` : null;
  const { data: cacheData, loading, error: membersError } = useCachedData<{
    members: (TenantMember & { display_name?: string; email?: string; avatar_url?: string })[];
    invites: InviteRow[];
  }>(
    cacheKey,
    async () => {
      const [membersRes, invitesRes] = await Promise.all([
        supabase.from('tenant_members').select('*').eq('tenant_id', tenantId!),
        fetch(`/api/invitations?tenant_id=${tenantId!}`),
      ]);
      const invitesData = invitesRes.ok ? await invitesRes.json() : [];
      const rawMembers: (TenantMember & { display_name?: string; email?: string; avatar_url?: string })[] = membersRes.data || [];
      const userIds = rawMembers.map((m) => m.user_id).filter(Boolean);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, email, avatar_url')
          .in('id', userIds);
        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
        for (const m of rawMembers) {
          const p = profileMap.get(m.user_id);
          if (p) {
            m.display_name = p.display_name || undefined;
            m.email = p.email || undefined;
            m.avatar_url = p.avatar_url || undefined;
          }
        }
      }
      return {
        members: rawMembers,
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
      toast({ variant: 'destructive', title: t('toast.error.title'), description: error.message });
    } else {
      setMembers((prev) => prev.map((m) => (m.user_id === userId ? { ...m, role } as TenantMember & { email?: string } : m)));
      toast({ title: t('toast.role_updated') });
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
      toast({ variant: 'destructive', title: t('toast.error.title'), description: error.message });
    } else {
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      toast({ title: t('toast.member_removed') });
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
      toast({ title: t('toast.invite_created'), description: `${t('toast.invite_link_prefix')}${data.invite_url}` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('toast.error.title'), description: err.message });
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
      toast({ title: t('toast.invite_revoked') });
    } else {
      toast({ variant: 'destructive', title: t('toast.revoke_error') });
    }
  };

  const copyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    toast({ title: t('toast.link_copied') });
  };

  const downloadQR = async (token: string) => {
    try {
      const res = await fetch(`/api/invitations/${token}/qrcode`);
      if (!res.ok) throw new Error('Failed to generate QR');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${t('invites.pending_list.qr_filename_prefix')}${token.slice(0, 8)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: 'destructive', title: t('toast.qr_error') });
    }
  };

  const displayLoading = loading || (tenantId !== null && cacheKey !== null && !cacheData);
  const displayError = tenantError || membersError;

  if (displayError) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center text-muted-foreground py-12">
        <p className="text-destructive font-medium">{t('error.title')}</p>
        <p className="text-sm mt-1">{displayError.message}</p>
      </div>
    );
  }

  if (displayLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <SliderTabs value={membersTab} onValueChange={setMembersTab} defaultValue="members">
        <SliderTabsList>
          <SliderTabsTrigger value="members" icon={Shield}>
            {t('tabs.members')} ({members.length})
          </SliderTabsTrigger>
          <SliderTabsTrigger value="invites" icon={UserPlus}>
            {t('tabs.invites')} ({invites.length})
          </SliderTabsTrigger>
        </SliderTabsList>

        <SliderTabsContentGroup>
          <SliderTabsContent value="members">
            <WeldingCard>
            <CardHeader>
              <CardTitle>{t('members_list.card_title')}</CardTitle>
              <CardDescription>{t('members_list.card_description')}</CardDescription>
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
                        <p className="text-sm font-medium">{isSelf ? t('members_list.self_label') : member.display_name || member.email || member.user_id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{roleLabels[member.role] || member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isOwner && (
                        <Select3D value={member.role} options={[
                          {value: 'admin', label: t('roles.admin')},
                          {value: 'editor', label: t('roles.editor')},
                          {value: 'viewer', label: t('roles.viewer')},
                        ]} onChange={(v) => handleRoleChange(member.user_id, v)} disabled={updating === member.user_id} className="w-28" />
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
              <CardTitle>{t('invites.create_card.title')}</CardTitle>
              <CardDescription>{t('invites.create_card.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FloatingLabelInput
                  label={t('invites.create_card.email_label')}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  type="email"
                />
<div>
                    <Select3D label={t('invites.create_card.role_label')} value={inviteRole} options={[
                      {value: 'admin', label: t('roles.admin')},
                      {value: 'editor', label: t('roles.editor')},
                      {value: 'viewer', label: t('roles.viewer')},
                    ]} onChange={(v) => setInviteRole(v)} />
                  </div>
              </div>
<div>
                  <Select3D label={t('invites.create_card.expiry_label')} value={inviteExpiry} options={[
                    {value: '3600000', label: t('invites.create_card.expiry_1hour')},
                    {value: '86400000', label: t('invites.create_card.expiry_24hours')},
                    {value: '604800000', label: t('invites.create_card.expiry_7days')},
                    {value: '2592000000', label: t('invites.create_card.expiry_30days')},
                    {value: 'never', label: t('invites.create_card.expiry_never')},
                  ]} onChange={(v) => setInviteExpiry(v)} />
                </div>
              <Button onClick={handleSendInvite} disabled={sendingInvite || !inviteEmail} className="w-full">
                {sendingInvite ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                {sendingInvite ? t('invites.create_card.sending') : t('invites.create_card.submit')}
              </Button>
            </CardContent>
          </WeldingCard>

          {invites.length > 0 && (
            <WeldingCard>
              <CardHeader>
                <CardTitle>{t('invites.pending_list.card_title')} ({invites.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{inv.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{roleLabels[inv.role] || inv.role}</span>
                        {inv.expires_at ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {t('invites.pending_list.expires_prefix')}{new Date(inv.expires_at).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t('invites.pending_list.no_expiry')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => copyInviteLink(inv.token)} title={t('invites.pending_list.copy_link')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => downloadQR(inv.token)} title={t('invites.pending_list.qr_code')}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleRevokeInvite(inv.id)} title={t('invites.pending_list.revoke')}>
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
