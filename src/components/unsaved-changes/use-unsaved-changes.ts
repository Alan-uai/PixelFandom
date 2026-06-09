'use client';

import { useRegisterUnsavedChanges } from './use-register-unsaved-changes';

export interface UseUnsavedChangesOptions {
  isDirty: boolean;
  onSave: () => Promise<void>;
  onDiscard: () => void;
}

export function useUnsavedChanges(options: UseUnsavedChangesOptions) {
  useRegisterUnsavedChanges(options);
}
