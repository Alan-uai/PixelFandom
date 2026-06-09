'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'hsl(222.2 84% 4.9%)',
          border: '1px solid hsl(217.2 32.6% 17.5%)',
          color: 'hsl(210 40% 98%)',
        },
      }}
      closeButton
      richColors
    />
  );
}
