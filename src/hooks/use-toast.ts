'use client';

import { toast as sonnerToast } from 'sonner';

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
};

function toast(opts: ToastOptions) {
  const { title, description, variant, duration } = opts;
  if (variant === 'destructive') {
    sonnerToast.error(title ?? 'Erro', {
      description,
      duration: duration ?? 4000,
    });
  } else {
    sonnerToast(title ?? '', {
      description,
      duration: duration ?? 4000,
    });
  }
  return { id: '', dismiss: () => {}, update: () => {} };
}

function useToast() {
  return {
    toasts: [] as { id: string; title?: string; description?: string; variant?: string }[],
    toast,
    dismiss: () => {},
  };
}

export { useToast, toast };
