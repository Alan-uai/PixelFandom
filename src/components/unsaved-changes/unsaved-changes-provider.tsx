'use client';

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { UnsavedChangesBar } from './unsaved-changes-bar';
import { UnsavedChangesDialog } from './unsaved-changes-dialog';
import { SaveNotification } from './save-notification';

interface Registration {
  onSave: () => Promise<boolean | void>;
  onDiscard: () => void;
}

interface UnsavedChangesContextValue {
  register: (reg: Registration) => void;
  unregister: () => void;
  setIsDirty: (dirty: boolean) => void;
}

export const UnsavedChangesCtx = createContext<UnsavedChangesContextValue>(
  null as unknown as UnsavedChangesContextValue
);

/** @deprecated Use `UnsavedChangesCtx` instead. Kept for backward compat with use-unsaved-changes. */
export const UnsavedChangesContext = UnsavedChangesCtx;

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const regRef = useRef<Registration>({ onSave: async () => {}, onDiscard: () => {} });
  const pendingUrl = useRef<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirtyState] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const isDirtyRef = useRef(false);

  const register = useCallback((reg: Registration) => {
    regRef.current = reg;
  }, []);

  const unregister = useCallback(() => {
    regRef.current = { onSave: async () => {}, onDiscard: () => {} };
  }, []);

  const setIsDirty = useCallback((dirty: boolean) => {
    isDirtyRef.current = dirty;
    setIsDirtyState(dirty);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const ok = await regRef.current.onSave();
      setSaveStatus(ok !== false ? 'success' : 'error');
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, []);

  const clearSaveStatus = useCallback(() => setSaveStatus(null), []);

  const handleDiscard = useCallback(() => {
    regRef.current.onDiscard();
    setIsDirtyState(false);
    isDirtyRef.current = false;
  }, []);

  const confirmNavigation = useCallback((url: string) => {
    pendingUrl.current = url;
    setShowExitDialog(true);
  }, []);

  const cancelExit = useCallback(() => {
    pendingUrl.current = null;
    setShowExitDialog(false);
  }, []);

  const continueNavigation = useCallback(() => {
    const url = pendingUrl.current;
    pendingUrl.current = null;
    setShowExitDialog(false);
    regRef.current.onDiscard();
    setIsDirtyState(false);
    isDirtyRef.current = false;
    if (url) window.location.href = url;
  }, []);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isDirtyRef.current) return;

      const target = e.target as HTMLElement;
      const link = target.closest<HTMLAnchorElement>('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      if (
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#')
      ) return;

      if (link.target === '_blank') return;

      e.preventDefault();
      e.stopPropagation();
      confirmNavigation(href);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [confirmNavigation]);

  return (
    <UnsavedChangesCtx.Provider value={{ register, unregister, setIsDirty }}>
      {children}
      <UnsavedChangesBar show={isDirty} saving={saving} onSave={handleSave} onDiscard={handleDiscard} />
      <UnsavedChangesDialog open={showExitDialog} onContinue={continueNavigation} onCancel={cancelExit} />
      <SaveNotification status={saveStatus} onComplete={clearSaveStatus} />
    </UnsavedChangesCtx.Provider>
  );
}
