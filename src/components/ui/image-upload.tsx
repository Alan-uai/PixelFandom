'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Loader2, Upload, X, ShieldAlert } from 'lucide-react';
import { sanitizeUrl } from '@/lib/sanitize';
import { useToast } from '@/hooks/use-toast';

type Props = {
  bucket?: string;
  pathPrefix?: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  previewSize?: string;
  label?: string;
  tenantId?: string;
  onOpenLibrary?: () => void;
};

type Mode = 'upload' | 'url';

export function ImageUpload({
  bucket = 'wiki-images',
  pathPrefix = 'uploads',
  value,
  onChange,
  accept = 'image/*',
  previewSize = 'w-32 h-32',
  label = 'Imagem',
  onOpenLibrary,
  tenantId,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<Mode>('upload');
  const [scanError, setScanError] = useState<string | null>(null);
  const { toast } = useToast();

  const showUpload = mode === 'upload';
  const showUrl = mode === 'url';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 10MB.',
      });
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Formato inválido',
        description: 'Apenas arquivos de imagem são permitidos.',
      });
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    setScanError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('path_prefix', pathPrefix);
      if (tenantId) formData.append('tenant_id', tenantId);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        if (res.status === 422 && err.virusName) {
          setScanError(`Malware detectado: ${err.virusName}`);
        }
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      onChange(data.url);
      toast({ title: 'Imagem enviada', description: 'Verificada e aprovada pelo sistema de segurança.' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro no upload';
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: msg,
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleUrlChange = (url: string) => {
    onChange(sanitizeUrl(url));
  };

  return (
    <div className="relative">
      <input
        type="file"
        ref={inputRef}
        onChange={handleFile}
        style={{ display: 'none' }}
        accept={accept}
      />

      <div className={showUpload ? 'border rounded-lg relative' : 'border-b'}>
        <div className="overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            {showUpload && (
              <motion.div
                key="upload"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -24, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {value ? (
                  <div className={`relative ${previewSize} flex items-center justify-center`}>
                    <Image src={value} alt={label} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => onChange('')}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 bg-background text-muted-foreground hover:text-foreground transition-colors shadow-sm inset-embed z-10 flex items-center justify-center"
                      aria-label="Remover imagem"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`${previewSize} flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-accent/50 inset-embed`}
                    onClick={() => {
                      if (onOpenLibrary) {
                        onOpenLibrary();
                      } else {
                        inputRef.current?.click();
                      }
                    }}
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : scanError ? (
                      <ShieldAlert className="h-5 w-5 text-destructive" />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight px-2">
                      {uploading ? 'Verificando...' : scanError ? 'Arquivo rejeitado' : label}
                    </span>
                    {scanError && (
                      <span className="text-[10px] text-destructive text-center px-2">{scanError}</span>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex justify-center -my-2.5 relative z-20">
        <button
          type="button"
          onClick={() => setMode(mode === 'upload' ? 'url' : 'upload')}
          className="flex items-center justify-center h-5 w-5 rounded-full border-2 bg-background text-[9px] font-bold leading-none text-muted-foreground hover:text-foreground transition-colors inset-embed"
          aria-label="Alternar para URL"
        >
          ou
        </button>
      </div>

      <div className={showUrl ? 'border rounded-lg' : 'border-t'}>
        <div className="overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            {showUrl && (
              <motion.div
                key="url"
                initial={{ y: -24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="p-3">
                  <FloatingLabelInput
                    label={`URL da ${label.toLowerCase()}`}
                    info="Cole o link direto da imagem"
                    value={value}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
