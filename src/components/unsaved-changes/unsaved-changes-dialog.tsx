'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnsavedChangesDialogProps {
  open: boolean;
  onContinue: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({ open, onContinue, onCancel }: UnsavedChangesDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: -15, z: -200 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0, z: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: -15, z: -200 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                transformStyle: 'preserve-3d',
                perspective: '1200px',
              }}
              className="pointer-events-auto w-full max-w-md"
            >
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
                  className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 origin-left"
                />

                <div className="p-6 space-y-4">
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                    className="flex items-start gap-4"
                  >
                    <div className="rounded-full bg-amber-500/10 p-2.5 shrink-0">
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground">
                        Configurações não salvas
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Você tem alterações não salvas. Deseja descartá-las e continuar?
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-end gap-2 pt-2"
                  >
                    <Button
                      variant="outline"
                      onClick={onCancel}
                      className="text-xs"
                    >
                      Ficar na página
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={onContinue}
                      className="text-xs gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Descartar e sair
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
