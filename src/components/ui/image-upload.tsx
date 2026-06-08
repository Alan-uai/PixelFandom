'use client';

import { useRef, useState } from 'react';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Loader2, Upload, X } from 'lucide-react';
import { supabase } from '@/supabase';
import { ensureStorageBuckets } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

type Props = {
  bucket?: string;
  pathPrefix?: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  previewSize?: string;
  label?: string;
};

type Mode = 'upload' | 'url';

const spring = { type: 'spring' as const, stiffness: 350, damping: 28, mass: 0.6 };

export function ImageUpload({
  bucket = 'wiki-images',
  pathPrefix = 'uploads',
  value,
  onChange,
  accept = 'image/*',
  previewSize = 'w-32 h-32',
  label = 'Imagem',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<Mode>('upload');
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
    try {
      await ensureStorageBuckets();
      const filePath = `${pathPrefix}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast({ title: 'Imagem enviada', description: 'A imagem foi enviada com sucesso.' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: 'Não foi possível enviar a imagem. Verifique se está logado e tente novamente.',
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
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

      {/* Card (upload mode) */}
      <div className={showUpload ? 'border rounded-lg relative' : 'border-b'}>
        <motion.div
          initial={false}
          animate={{
            height: showUpload ? 'auto' : 0,
            opacity: showUpload ? 1 : 0,
            scaleY: showUpload ? 1 : 0,
            rotateX: showUpload ? 0 : 90,
          }}
          transition={spring}
          style={{ transformStyle: 'preserve-3d', perspective: 800, transformOrigin: 'bottom' }}
          className="overflow-hidden"
        >
          {value ? (
            <div className={`${previewSize} flex items-center justify-center`}>
              <img src={value} alt={label} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div
              className={`${previewSize} flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-accent/50`}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight px-2">
                {uploading ? 'Enviando...' : label}
              </span>
            </div>
          )}
        </motion.div>

        {/* X button - only when image present */}
        {value && showUpload && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 z-10 flex items-center justify-center h-5 w-5 rounded-full border-2 bg-background text-muted-foreground hover:text-foreground transition-colors shadow-sm"
            aria-label="Remover imagem"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* "ou" toggle */}
      <div className="flex justify-center -my-2.5 relative z-20">
        <button
          type="button"
          onClick={() => setMode(mode === 'upload' ? 'url' : 'upload')}
          className="flex items-center justify-center h-5 w-5 rounded-full border-2 bg-background text-[9px] font-bold leading-none text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Alternar para URL"
        >
          ou
        </button>
      </div>

      {/* URL input (URL mode) */}
      <div className={showUrl ? 'border rounded-lg' : 'border-t'}>
        <motion.div
          initial={false}
          animate={{
            height: showUrl ? 'auto' : 0,
            opacity: showUrl ? 1 : 0,
            scaleY: showUrl ? 1 : 0,
            rotateX: showUrl ? 0 : -90,
          }}
          transition={spring}
          style={{ transformStyle: 'preserve-3d', perspective: 800, transformOrigin: 'top' }}
          className="overflow-hidden"
        >
          <div className="p-3">
            <FloatingLabelInput
              label={`URL da ${label.toLowerCase()}`}
              info="Cole o link direto da imagem"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="text-xs"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
