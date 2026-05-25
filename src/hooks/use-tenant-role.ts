'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/supabase';
import { supabase } from '@/supabase';

export interface TenantRoleState {
  role: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  canManage: boolean;
  canEdit: boolean;
  isLoading: boolean;
}

export function useTenantRole(slug: string | undefined): TenantRoleState {
  const { user, isLoading: isUserLoading } = useUser();
  const [state, setState] = useState<TenantRoleState>({
    role: null,
    isOwner: false,
    isAdmin: false,
    isEditor: false,
    isViewer: false,
    canManage: false,
    canEdit: false,
    isLoading: true,
  });

  useEffect(() => {
    if (isUserLoading) return;

    if (!user || !slug) {
      setState({
        role: null,
        isOwner: false,
        isAdmin: false,
        isEditor: false,
        isViewer: false,
        canManage: false,
        canEdit: false,
        isLoading: false,
      });
      return;
    }

    (async () => {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!tenant) {
        setState({
          role: null,
          isOwner: false,
          isAdmin: false,
          isEditor: false,
          isViewer: false,
          canManage: false,
          canEdit: false,
          isLoading: false,
        });
        return;
      }

      const { data: member } = await supabase
        .from('tenant_members')
        .select('role')
        .eq('tenant_id', tenant.id)
        .eq('user_id', user.id)
        .single();

      const role = (member?.role as string) || null;

      setState({
        role,
        isOwner: role === 'owner',
        isAdmin: role === 'admin',
        isEditor: role === 'editor',
        isViewer: role === 'viewer',
        canManage: role === 'owner' || role === 'admin',
        canEdit: role === 'owner' || role === 'admin' || role === 'editor',
        isLoading: false,
      });
    })();
  }, [user, isUserLoading, slug]);

  return state;
}
