'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserMinus, Shield, ShieldCheck, UserPlus, Copy, Download, Clock, X, Search, ChevronLeft, ChevronRight, ExternalLink, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { Select3D } from '@/components/ui/select3d';
import type { TenantMember } from '@/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

type InviteRow = {
  id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
};

type MemberWithProfile = TenantMember & {
  display_name?: string;
  email?: string;
  avatar_url?: string;
  username?: string;
};

const ROLE_SORT: Record<string, number> = { owner: 0, admin: 1, editor: 2, viewer: 3 };
const PAGE_SIZE = 20;

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

  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteExpiry, setInviteExpiry] = useState('never');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [membersTab, setMembersTab] = usePageState('tab', 'members');

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const [page, setPage] = useState(0);

  const [selectedMember, setSelectedMember] = useState<MemberWithProfile | null>(null);

  
  const [mentionResults, setMentionResults] = useState<{ id: string; display_name: string; email: string; avatar_url: string | null }[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const mentionCache = useRef<{ id: string; display_name: string; email: string; avatar_url: string | null; username?: string }[]>([]);
  const mentionFetching = useRef(false);

  const { data: tenantData, error: tenantError } = useCachedData<{ id: string }>(
    `tenant-id:${slug}`,
    async () => {
      const { data } = await supabase.from('tenants').select('id').eq('slug', slug).single();
      return data!;
    }
  );
  const tenantId = tenantData?.id ?? null;

  const cacheKey = tenantId ? `members:${tenantId}` : null;
  const { data: cacheData, loading, error: membersError, mutate: refreshCache } = useCachedData<{
    members: MemberWithProfile[];
    invites: InviteRow[];
  }>(
    cacheKey,
    async () => {
      const [membersRes, invitesRes] = await Promise.all([
        supabase.from('tenant_members').select('*').eq('tenant_id', tenantId!),
        fetch(`/api/invitations?tenant_id=${tenantId!}`),
      ]);
      const invitesData = invitesRes.ok ? await invitesRes.json() : [];
      const rawMembers: MemberWithProfile[] = membersRes.data || [];
      const userIds = rawMembers.map((m) => m.user_id).filter(Boolean);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, email, avatar_url, username')
          .in('id', userIds);
        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
        for (const m of rawMembers) {
          const p = profileMap.get(m.user_id);
          if (p) {
            m.display_name = p.display_name || undefined;
            m.email = p.email || undefined;
            m.avatar_url = p.avatar_url || undefined;
            m.username = p.username || undefined;
          }
        }
      }
      return { members: rawMembers, invites: invitesData || [] };
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

  const sortedFilteredMembers = useMemo(() => {
    let filtered = [...members];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          (m.display_name || '').toLowerCase().includes(q) ||
          (m.email || '').toLowerCase().includes(q) ||
          (m.username || '').toLowerCase().includes(q)
      );
    }
    if (roleFilter) {
      filtered = filtered.filter((m) => m.role === roleFilter);
    }
    filtered.sort((a, b) => {
      const roleDiff = ROLE_SORT[a.role] - ROLE_SORT[b.role];
      if (roleDiff !== 0) return roleDiff;
      return (a.display_name || a.email || '').localeCompare(b.display_name || b.email || '');
    });
    return filtered;
  }, [members, searchQuery, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(sortedFilteredMembers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedMembers = sortedFilteredMembers.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const loadMentionUsers = useCallback(async () => {
    if (mentionCache.current.length > 0 || mentionFetching.current) return;
    mentionFetching.current = true;
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, email, avatar_url, username')
      .order('display_name');
    if (data) mentionCache.current = data as any;
    mentionFetching.current = false;
  }, []);

  const handleInviteEmailChange = (value: string) => {
    setInviteEmail(value);
    if (value.startsWith('@')) {
      const q = value.slice(1).toLowerCase();
      loadMentionUsers();
      const results = mentionCache.current.filter(
        (p) =>
          (p.display_name || '').toLowerCase().includes(q) ||
          (p.username || '').toLowerCase().includes(q) ||
          (p.email || '').toLowerCase().includes(q)
      );
      setMentionResults(results);
      setShowMentions(results.length > 0);
    } else {
      setShowMentions(false);
    }
  };

  const selectMention = (p: { id: string; display_name: string; email: string }) => {
    setInviteEmail(p.email);
    setShowMentions(false);
  };

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
      setMembers((prev) => prev.map((m) => (m.user_id === userId ? { ...m, role } as MemberWithProfile : m)));
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

    const isAlreadyMember = members.some(
      (m) => m.email?.toLowerCase() === inviteEmail.toLowerCase()
    );
    if (isAlreadyMember) {
      toast({ variant: 'destructive', title: t('toast.error.title'), description: t('invites.create_card.already_member') });
      return;
    }

    const isAlreadyInvited = invites.some(
      (i) => i.email.toLowerCase() === inviteEmail.toLowerCase() && !i.accepted_at
    );
    if (isAlreadyInvited) {
      toast({ variant: 'destructive', title: t('toast.error.title'), description: t('invites.create_card.already_invited') });
      return;
    }

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

  const handleResendInvite = async (inv: InviteRow) => {
    if (!tenantId) return;
    setSendingInvite(true);
    try {
      await handleRevokeInvite(inv.id);
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          email: inv.email,
          role: inv.role,
          expires_in: '604800000',
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setInvites((prev) => [data, ...prev]);
      toast({ title: t('toast.invite_created') });
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('toast.error.title'), description: err.message });
    } finally {
      setSendingInvite(false);
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

  const isInviteExpired = (inv: InviteRow) =>
    inv.expires_at && new Date(inv.expires_at) < new Date();

  const displayLoading = loading || (tenantId !== null && cacheKey !== null && !cacheData);
  const displayError = tenantError || membersError;

  if (displayError) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center text-muted-foreground py-12">
        <p className="text-destructive font-medium">{t('error.title')}</p>
        <p className="text-sm mt-1">{displayError.message}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refreshCache()}>
          {t('common.retry') || 'Tentar novamente'}
        </Button>
      </div>
    );
  }

  if (displayLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="h-9 w-28 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <SliderTabs value={membersTab} onValueChange={(v) => { setMembersTab(v); setPage(0); }} defaultValue="members">
        <SliderTabsList>
          <SliderTabsTrigger value="members" icon={Shield}>
            {t('tabs.members')} ({members.length})
          </SliderTabsTrigger>
          <SliderTabsTrigger value="invites" icon={UserPlus}>
            {t('tabs.invites')} ({invites.filter((i) => !i.accepted_at && !isInviteExpired(i)).length})
          </SliderTabsTrigger>
        </SliderTabsList>

        <SliderTabsContentGroup>
          <SliderTabsContent value="members">
            <WeldingCard>
            <CardHeader>
              <CardTitle>{t('members_list.card_title')}</CardTitle>
              <CardDescription>{t('members_list.card_description')}</CardDescription>

              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('members_list.search_placeholder') || 'Buscar por nome, email...'}
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {['admin', 'editor', 'viewer'].map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRoleFilter(roleFilter === r ? null : r); setPage(0); }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                        roleFilter === r
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {roleLabels[r]}
                    </button>
                  ))}
                  {roleFilter && (
                    <button
                      onClick={() => setRoleFilter(null)}
                      className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedFilteredMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {searchQuery || roleFilter ? (t('members_list.no_results') || 'Nenhum membro encontrado') : (t('members_list.no_members') || 'Nenhum membro')}
                </p>
              ) : (
                <>
                  {paginatedMembers.map((member) => {
                    const isOwner = member.role === 'owner';
                    const isSelf = member.user_id === user?.id;
                    return (
                      <div key={member.user_id} className="flex items-center justify-between rounded-lg border p-3">
                        <button
                          onClick={() => setSelectedMember(member)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden shrink-0">
                            {member.avatar_url ? (
                              <Image src={member.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                            ) : (
                              (member.display_name || member.email || '?')[0].toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate flex items-center gap-1.5">
                              {isOwner && <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                              {isSelf ? t('members_list.self_label') : member.display_name || member.email || member.user_id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{roleLabels[member.role] || member.role}{member.email && !isSelf ? ` · ${member.email}` : ''}</p>
                          </div>
                        </button>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {!isOwner && (
                            <Select3D value={member.role} options={[
                              {value: 'admin', label: t('roles.admin')},
                              {value: 'editor', label: t('roles.editor')},
                              {value: 'viewer', label: t('roles.viewer')},
                            ]} onChange={(v) => handleRoleChange(member.user_id, v)} disabled={updating === member.user_id} className="w-28" />
                          )}
                          {!isOwner && !isSelf && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={updating === member.user_id}>
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('remove_dialog.title')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('remove_dialog.description')} <strong>{member.display_name || member.email || member.user_id.slice(0, 8)}</strong>?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemove(member.user_id)}>
                                    {t('remove_dialog.confirm')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-muted-foreground">
                        {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, sortedFilteredMembers.length)} de {sortedFilteredMembers.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground min-w-[4rem] text-center">
                          {safePage + 1}/{totalPages}
                        </span>
                        <Button variant="ghost" size="icon" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
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
                <div className="relative">
                  <FloatingLabelInput
                    label={t('invites.create_card.email_label')}
                    value={inviteEmail}
                    onChange={(e) => handleInviteEmailChange(e.target.value)}
                    type="email"
                  />
                  {showMentions && (
                    <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-popover border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {mentionResults.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => selectMention(p)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left"
                        >
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary overflow-hidden shrink-0">
                            {p.avatar_url ? (
                              <Image src={p.avatar_url} alt="" width={24} height={24} className="object-cover w-full h-full" />
                            ) : (
                              (p.display_name || '?')[0].toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{p.display_name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                {invites.map((inv) => {
                  const expired = isInviteExpired(inv);
                  const accepted = !!inv.accepted_at;
                  return (
                    <div key={inv.id} className={`flex items-center justify-between rounded-lg border p-3 ${accepted ? 'opacity-60' : ''} ${expired ? 'border-destructive/30 bg-destructive/5' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${accepted ? 'line-through' : ''}`}>{inv.email}</p>
                          {accepted && (
                            <span className="text-xs bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                              <CheckCircle className="h-3 w-3" /> {t('invites.pending_list.accepted') || 'Aceito'}
                            </span>
                          )}
                          {expired && !accepted && (
                            <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                              <AlertCircle className="h-3 w-3" /> {t('invites.pending_list.expired') || 'Expirado'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{roleLabels[inv.role] || inv.role}</span>
                          {inv.expires_at && !accepted ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {t('invites.pending_list.expires_prefix')}{new Date(inv.expires_at).toLocaleDateString('pt-BR')}
                            </span>
                          ) : !accepted ? (
                            <span className="text-xs text-muted-foreground">{t('invites.pending_list.no_expiry')}</span>
                          ) : null}
                        </div>
                      </div>
                      {!accepted && (
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <Button variant="ghost" size="icon" onClick={() => copyInviteLink(inv.token)} title={t('invites.pending_list.copy_link')}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => downloadQR(inv.token)} title={t('invites.pending_list.qr_code')}>
                            <Download className="h-4 w-4" />
                          </Button>
                          {expired && (
                            <Button variant="ghost" size="icon" onClick={() => handleResendInvite(inv)} title={t('invites.pending_list.resend') || 'Reenviar'} disabled={sendingInvite}>
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleRevokeInvite(inv.id)} title={t('invites.pending_list.revoke')}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </WeldingCard>
          )}
          </SliderTabsContent>
        </SliderTabsContentGroup>
      </SliderTabs>

      <Dialog open={!!selectedMember} onOpenChange={(open) => { if (!open) setSelectedMember(null); }}>
        {selectedMember && <MemberProfileDialog member={selectedMember} roleLabels={roleLabels} viewProfileLabel={t('members_list.view_profile')} _onClose={() => setSelectedMember(null)} />}
      </Dialog>
    </div>
  );
}

function MemberProfileDialog({
  member,
  roleLabels,
  viewProfileLabel,
  _onClose,
}: {
  member: MemberWithProfile;
  roleLabels: Record<string, string>;
  viewProfileLabel: string;
  _onClose: () => void;
}) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/profile?user_id=${member.user_id}`);
        if (res.ok) setProfile(await res.json());
      } catch { /* noop */ } finally {
        setLoading(false);
      }
    })();
  }, [member.user_id]);

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary overflow-hidden shrink-0">
            {member.avatar_url ? (
              <Image src={member.avatar_url} alt="" width={56} height={56} className="object-cover w-full h-full" />
            ) : (
              (member.display_name || member.email || '?')[0].toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <DialogTitle className="truncate">{member.display_name || member.email || member.user_id.slice(0, 8)}</DialogTitle>
            <p className="text-sm text-muted-foreground">{roleLabels[member.role]}</p>
            {member.email && <p className="text-xs text-muted-foreground truncate">{member.email}</p>}
          </div>
        </div>
      </DialogHeader>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : profile ? (
        <div className="space-y-4">
          {profile.bio && (
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Reputação', value: profile.reputation_points ?? 0 },
              { label: 'Streak', value: `${profile.streak_days ?? 0}d` },
              { label: 'Artigos', value: profile.articles_count ?? 0 },
              { label: 'Comentários', value: profile.comments_count ?? 0 },
              { label: 'Edições', value: profile.edits_count ?? 0 },
              { label: 'Reações', value: profile.reactions_received ?? 0 },
            ].map((s) => (
              <div key={s.label} className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-sm font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          {profile.badges?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Conquistas ({profile.badges.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.badges.slice(0, 6).map((ub: any) => (
                  <span key={ub.badge?.id || ub.id} className="text-xs bg-primary/5 text-primary px-2 py-0.5 rounded-full">
                    {ub.badge?.name || 'Badge'}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="pt-2">
            <Link href={`/profile/${member.user_id}`} target="_blank">
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                {viewProfileLabel}
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Perfil não encontrado</p>
      )}
    </DialogContent>
  );
}
