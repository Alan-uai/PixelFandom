'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

interface SaveNotificationProps {
  status: 'success' | 'error' | null;
  onComplete: () => void;
}

export function SaveNotification({ status, onComplete }: SaveNotificationProps) {
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [status, onComplete]);

  return (
    <AnimatePresence>
      {status && (
        <motion.div
          initial={{ height: 0, opacity: 0, rotateX: -90 }}
          animate={{ height: 'auto', opacity: 1, rotateX: 0 }}
          exit={{ height: 0, opacity: 0, rotateX: -90 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          style={{
            transformStyle: 'preserve-3d',
            perspective: '800px',
            transformOrigin: 'top center',
          }}
          className="fixed top-0 left-0 right-0 z-[60] overflow-hidden"
        >
          <div
            className={`relative ${
              status === 'success'
                ? 'bg-emerald-950/95 border-emerald-800/50'
                : 'bg-red-950/95 border-red-800/50'
            } backdrop-blur-md border-b shadow-lg`}
          >
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4, ease: 'linear' }}
              className={`absolute top-0 left-0 right-0 h-0.5 origin-left ${
                status === 'success' ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            <div className="mx-auto max-w-6xl px-4 py-2.5 flex items-center gap-2.5">
              {status === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
              )}
              <span
                className={`text-sm font-medium ${
                  status === 'success' ? 'text-emerald-100' : 'text-red-100'
                }`}
              >
                {status === 'success'
                  ? 'Configurações salvas'
                  : 'Não foi possível salvar'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
