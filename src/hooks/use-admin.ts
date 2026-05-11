'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/supabase';
import { supabase } from '@/supabase';

interface AdminState {
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAdmin(): AdminState {
  const { user, isLoading: isUserLoading } = useUser();
  const [adminState, setAdminState] = useState<AdminState>({
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    if (isUserLoading) {
      setAdminState({ isAdmin: false, isLoading: true });
      return;
    }

    if (!user) {
      setAdminState({ isAdmin: false, isLoading: false });
      return;
    }

    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data?.role === 'admin') {
          setAdminState({ isAdmin: true, isLoading: false });
        } else {
          setAdminState({ isAdmin: false, isLoading: false });
        }
      })
      .catch(() => {
        setAdminState({ isAdmin: false, isLoading: false });
      });
  }, [user, isUserLoading]);

  return adminState;
}

    