'use client';

import { useContext, useEffect } from 'react';
import { UnsavedChangesCtx } from './unsaved-changes-provider';

export interface UseRegisterUnsavedChangesOptions {
  isDirty: boolean;
  onSave: () => Promise<boolean | void>;
  onDiscard: () => void;
}

export function useRegisterUnsavedChanges(options: UseRegisterUnsavedChangesOptions) {
  const { isDirty, onSave, onDiscard } = options;
  const ctx = useContext(UnsavedChangesCtx);

  useEffect(() => {
    ctx.register({ onSave, onDiscard });
    return () => ctx.unregister();
  }, [onSave, onDiscard, ctx]);

  useEffect(() => {
    ctx.setIsDirty(isDirty);
  }, [isDirty, ctx]);
}
