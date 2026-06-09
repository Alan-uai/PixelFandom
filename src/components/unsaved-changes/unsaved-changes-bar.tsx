'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnsavedChangesBarProps {
  show: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function UnsavedChangesBar({ show, saving, onSave, onDiscard }: UnsavedChangesBarProps) {
  return (
    <AnimatePresence>
      {show && (
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
          className="fixed top-0 left-0 right-0 z-50 overflow-hidden"
        >
          <div className="relative bg-card/95 backdrop-blur-md border-b shadow-lg">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500 origin-left"
            />
            <div className="mx-auto max-w-6xl px-4 py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <motion.div
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                </motion.div>
                <span className="text-sm font-medium text-foreground/90 truncate">
                  Não salvo
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDiscard}
                  disabled={saving}
                  className="text-xs h-8 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5" />
                  Descartar
                </Button>
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={saving}
                  className="text-xs h-8 gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
