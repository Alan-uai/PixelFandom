'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import AuthDialog from '@/components/auth-dialog';

interface AuthDialogContextType {
  openAuth: () => void;
}

const AuthDialogContext = createContext<AuthDialogContextType>({ openAuth: () => {} });

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const openAuth = useCallback(() => setAuthOpen(true), []);
  return (
    <AuthDialogContext.Provider value={{ openAuth }}>
      {children}
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog() {
  return useContext(AuthDialogContext);
}
