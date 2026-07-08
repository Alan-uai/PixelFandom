'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { supabase } from '@/supabase';
import { ensureStorageBuckets } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';

type MediaType = 'image' | 'video' | 'audio' | 'file';

interface MediaUploadProps {
  bucket?: string;
  pathPrefix?: string;
  value: string;
  onChange: (url: string) => void;
  mediaType: MediaType;
  tenantId?: string;
  label?: string;
}

export function MediaUpload({
  bucket = 'wiki-images',
  pathPrefix = 'uploads',
  value,
  onChange,
  mediaType,
  label,
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const acceptMap: Record<MediaType, string> = {
    image: 'image/*',
    video: 'video/*',
    audio: 'audio/*',
    file: '*/*',
  };

  const labelMap: Record<MediaType, string> = {
    image: 'Imagem',
    video: 'Vídeo',
    audio: 'Áudio',
    file: 'Arquivo',
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 50MB.',
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
      toast({ title: 'Arquivo enviado', description: 'O arquivo foi enviado com sucesso.' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: 'Não foi possível enviar o arquivo.',
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const labelText = label || labelMap[mediaType];

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={inputRef}
        onChange={handleFile}
        style={{ display: 'none' }}
        accept={acceptMap[mediaType]}
      />

      {value ? (
        mediaType === 'image' ? (
          <div className="relative w-full aspect-video max-h-48 rounded-lg overflow-hidden border bg-muted/30">
            <Image src={value} alt="Preview" fill className="object-contain" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-1 right-1 h-5 w-5 rounded-full border bg-background text-muted-foreground hover:text-foreground transition-colors z-10 flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : mediaType === 'video' ? (
          <div className="relative rounded-lg overflow-hidden border bg-muted/30 aspect-video">
            {value.includes('youtube') || value.includes('youtu.be') ? (
              <iframe
                src={`https://www.youtube.com/embed/${extractYoutubeId(value)}`}
                className="w-full h-full"
                allowFullScreen
                title="Video preview"
                sandbox="allow-same-origin allow-scripts allow-presentation"
              />
            ) : (
              <video src={value} controls className="w-full h-full" />
            )}
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-1 right-1 h-5 w-5 rounded-full border bg-background text-muted-foreground hover:text-foreground transition-colors z-10 flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : mediaType === 'audio' ? (
          <div className="relative rounded-lg overflow-hidden border bg-muted/30 p-3">
            <audio src={value} controls className="w-full h-8" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-1 right-1 h-5 w-5 rounded-full border bg-background text-muted-foreground hover:text-foreground transition-colors z-10 flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="relative rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground truncate">{value}</p>
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-1 right-1 h-5 w-5 rounded-full border bg-background text-muted-foreground hover:text-foreground transition-colors z-10 flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed border-muted-foreground/25 cursor-pointer transition-colors hover:border-muted-foreground/50 hover:bg-accent/30"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-[11px] font-medium text-muted-foreground text-center px-4">
            {uploading ? 'Enviando...' : `Clique para fazer upload de ${labelText.toLowerCase()}`}
          </span>
        </div>
      )}

      <FloatingLabelInput
        label={`URL da ${labelText.toLowerCase()}`}
        info={mediaType === 'video' ? 'YouTube, Vimeo ou URL direta' : 'Cole o link direto'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs"
      />
    </div>
  );
}

function extractYoutubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || '';
}
