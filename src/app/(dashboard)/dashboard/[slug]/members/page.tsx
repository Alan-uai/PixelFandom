'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/supabase';
import { useUser } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { useToast } from '@/hooks/use-toast';
import { Loader2, UserMinus, Shield, ShieldCheck } from 'lucide-react';
import type { TenantMember } from '@/supabase/client';

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Leitor',
};

export default function WikiMembersPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useUser();
  const { toast } = useToast();
  const [members, setMembers] = useState<(TenantMember & { email?: string })[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!tenant) { setLoading(false); return; }
      setTenantId(tenant.id);

      const { data: membersData } = await supabase
        .from('tenant_members')
        .select('*')
        .eq('tenant_id', tenant.id);

      if (membersData) setMembers(membersData);
      setLoading(false);
    })();
  }, [slug]);

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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <section id="members">
      <Card>
        <CardHeader>
          <CardTitle>Membros ({members.length})</CardTitle>
          <CardDescription>Usuários com acesso a esta wiki.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.map((member) => {
            const isOwner = member.role === 'owner';
            const isSelf = member.user_id === user?.id;
            return (
              <div
                key={member.user_id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  {isOwner ? (
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  ) : (
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {isSelf ? 'Você' : member.user_id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {roleLabels[member.role] || member.role}
                    </p>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(member.user_id)}
                      disabled={updating === member.user_id}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      </section>
    </div>
  );
}
