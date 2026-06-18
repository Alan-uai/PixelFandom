'use client';

import Image from 'next/image';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/supabase';
import { ensureStorageBuckets } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface MediaItem {
  id: string;
  file_name: string;
  file_size: number | null;
  mime_type: string;
  public_url: string;
  alt_text: string;
  width: number | null;
  height: number | null;
  created_at: string;
  uploaded_by: string | null;
}

interface MediaLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  onSelect: (url: string) => void;
  bucket?: string;
  pathPrefix?: string;
}

export function MediaLibrary({
  open,
  onOpenChange,
  tenantId,
  onSelect,
  bucket = 'wiki-images',
  pathPrefix = 'uploads',
}: MediaLibraryProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('limit', '50');

      const res = await fetch(`/api/tenants/${tenantId}/media?${params}`);
      const data = await res.json();
      setMedia(data.media || []);
      setTotal(data.total || 0);
    } catch {
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, search]);

  useEffect(() => {
    if (open) fetchMedia();
  }, [open, fetchMedia]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 10MB.',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Formato inválido',
        description: 'Apenas arquivos de imagem são permitidos.',
      });
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

      const img = new window.Image();
      img.onload = async () => {
        await fetch(`/api/tenants/${tenantId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            storage_path: filePath,
            public_url: publicUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
          }),
        });
        setUploading(false);
        fetchMedia();
        toast({ title: 'Imagem enviada', description: 'Adicionada à biblioteca.' });
      };
      img.src = publicUrl;
    } catch {
      setUploading(false);
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: 'Não foi possível enviar a imagem.',
      });
    }
  };

  const handleDelete = async (mediaId: string) => {
    try {
      await fetch(`/api/tenants/${tenantId}/media`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: mediaId }),
      });
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
      setTotal((prev) => prev - 1);
      toast({ title: 'Imagem removida' });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível remover a imagem.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Biblioteca de Mídia</DialogTitle>
          <DialogDescription>
            Selecione uma imagem ou faça upload de uma nova.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar imagens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <input
            type="file"
            ref={inputRef}
            onChange={handleUpload}
            style={{ display: 'none' }}
            accept="image/*"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent/50 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">Nenhuma imagem encontrada.</p>
              <p className="text-xs mt-1">Faça upload ou ajuste a busca.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-lg border overflow-hidden bg-muted/30 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => {
                    onSelect(item.public_url);
                    onOpenChange(false);
                  }}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={item.public_url}
                      alt={item.alt_text || item.file_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] truncate text-muted-foreground">
                      {item.file_name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex items-center justify-center h-6 w-6 rounded-full bg-background/80 border text-muted-foreground hover:text-destructive transition-all"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t mt-4">
          {total} imagem{total !== 1 ? 'ns' : ''} na biblioteca
        </div>
      </DialogContent>
    </Dialog>
  );
}
