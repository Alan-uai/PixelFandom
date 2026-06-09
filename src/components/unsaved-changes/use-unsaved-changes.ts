'use client';

import { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { UnsavedChangesContext } from './unsaved-changes-provider';

export interface UseUnsavedChangesOptions {
  isDirty: boolean;
  onSave: () => Promise<void>;
  onDiscard: () => void;
}

export function useUnsavedChanges(options: UseUnsavedChangesOptions) {
  const { isDirty, onSave, onDiscard } = options;
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const pendingUrl = useRef<string | null>(null);
  const ctx = useContext(UnsavedChangesContext);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave();
      setShow(false);
    } finally {
      setSaving(false);
    }
  }, [onSave]);

  const handleDiscard = useCallback(() => {
    onDiscard();
    setShow(false);
  }, [onDiscard]);

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
    onDiscard();
    setShow(false);
    if (url) {
      window.location.href = url;
    }
  }, [onDiscard]);

  useEffect(() => {
    if (isDirty) {
      setShow(true);
    }
  }, [isDirty]);

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
    ctx.current = { isDirty, confirmNavigation };
    return () => {
      ctx.current = { isDirty: false, confirmNavigation: () => {} };
    };
  }, [isDirty, confirmNavigation, ctx]);

  return {
    show,
    saving,
    showExitDialog,
    handleSave,
    handleDiscard,
    confirmNavigation,
    cancelExit,
    continueNavigation,
  };
}
