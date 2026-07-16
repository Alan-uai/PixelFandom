'use client';

import Image from 'next/image';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { sanitizeUrl } from '@/lib/sanitize';
import { Loader2, Search, Trash2, Upload, ShieldAlert, FileVideo, CropIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageCropper } from '@/components/ui/image-cropper';

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
  const [scanError, setScanError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperUrl, setCropperUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [cropSourceItem, setCropSourceItem] = useState<MediaItem | null>(null);

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

  const uploadFile = useCallback(async (file: File): Promise<string | undefined> => {
    setUploading(true);
    setScanError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('path_prefix', pathPrefix);
      formData.append('tenant_id', tenantId);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        if (res.status === 422 && err.virusName) {
          setScanError(`Malware detectado: ${err.virusName}`);
        }
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();

      if (data.url) {
        if (data.media?.mime_type?.startsWith('video/')) {
          fetchMedia();
          toast({ title: 'Vídeo enviado', description: 'Verificado e adicionado à biblioteca.' });
          setUploading(false);
        } else {
          const img = new window.Image();
          img.onload = () => {
            fetchMedia();
            toast({ title: 'Imagem enviada', description: 'Verificada e adicionada à biblioteca.' });
            setUploading(false);
          };
          img.onerror = () => {
            setUploading(false);
            fetchMedia();
          };
          img.src = data.url;
        }
        return data.url;
      } else {
        setUploading(false);
        fetchMedia();
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro no upload';
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: msg,
      });
      setUploading(false);
    }
  }, [bucket, pathPrefix, tenantId, fetchMedia, toast]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast({
        variant: 'destructive',
        title: 'Formato inválido',
        description: 'Apenas imagens e vídeos curtos são permitidos.',
      });
      return;
    }

    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setPendingFile(file);
      setCropperUrl(objectUrl);
      setCropSourceItem(null);
      setCropperOpen(true);
    } else {
      uploadFile(file);
    }
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    const croppedFile = new File(
      [croppedBlob],
      cropSourceItem ? `cropped-${cropSourceItem.file_name}` : pendingFile?.name || 'cropped.png',
      { type: 'image/png' },
    );
    const isExisting = !!cropSourceItem;
    cleanupCropper();
    const url = await uploadFile(croppedFile);
    if (!isExisting && url) {
      handleSelect(url);
    }
  };

  const handleCropSkip = async () => {
    if (cropSourceItem) {
      handleSelect(cropSourceItem.public_url);
    } else if (pendingFile) {
      const file = pendingFile;
      cleanupCropper();
      const url = await uploadFile(file);
      if (url) {
        handleSelect(url);
      }
    }
  };

  const cleanupCropper = () => {
    if (cropperUrl) URL.revokeObjectURL(cropperUrl);
    setCropperUrl(null);
    setPendingFile(null);
    setCropSourceItem(null);
    setCropperOpen(false);
  };

  const handleItemClick = async (item: MediaItem) => {
    if (item.mime_type?.startsWith('video/')) {
      handleSelect(item.public_url);
      return;
    }

    try {
      const response = await fetch(item.public_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setCropperUrl(url);
      setPendingFile(new File([blob], item.file_name, { type: blob.type }));
      setCropSourceItem(item);
      setCropperOpen(true);
    } catch {
      handleSelect(item.public_url);
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

  const handleSelect = (url: string) => {
    onSelect(sanitizeUrl(url));
    onOpenChange(false);
  };

  const showLibrary = open && !cropperOpen;

  return (
    <>
      <Dialog open={showLibrary} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Biblioteca de Mídia</DialogTitle>
            <DialogDescription>
              Clique em uma imagem para cortá-la ou clique duas vezes para selecionar. Use o botão Upload para adicionar novas.
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
              ref={uploadInputRef}
              onChange={handleUpload}
              style={{ display: 'none' }}
              accept="image/*,video/mp4,video/webm"
            />
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent/50 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : scanError ? (
                <ShieldAlert className="h-4 w-4 text-destructive" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? 'Verificando...' : 'Upload'}
            </button>
          </div>

          {scanError && (
            <div className="text-xs text-destructive text-center mb-2">{scanError}</div>
          )}

          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : media.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p className="text-sm">Nenhuma mídia encontrada.</p>
                <p className="text-xs mt-1">Faça upload ou ajuste a busca.</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {media.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-lg border overflow-hidden bg-muted/30 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="relative aspect-square">
                      {item.mime_type?.startsWith('video/') ? (
                        <div className="w-full h-full flex items-center justify-center bg-muted/20">
                          <video
                            src={item.public_url}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-8 w-8 rounded-full bg-background/80 flex items-center justify-center">
                              <FileVideo className="h-4 w-4 text-foreground" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Image
                            src={item.public_url}
                            alt={item.alt_text || item.file_name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-medium text-white bg-black/60 px-2 py-0.5 rounded transition-opacity">
                              <CropIcon className="h-3 w-3" />
                              Cortar
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] truncate text-muted-foreground">
                        {item.file_name}
                      </p>
                      {item.mime_type?.startsWith('video/') && (
                        <span className="text-[9px] text-primary/70 font-medium uppercase">Vídeo</span>
                      )}
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
            {total} mídia{total !== 1 ? 's' : ''} na biblioteca
          </div>
        </DialogContent>
      </Dialog>

      {cropperOpen && cropperUrl && (
        <ImageCropper
          open={cropperOpen}
          onOpenChange={(open) => {
            if (!open) cleanupCropper();
          }}
          imageUrl={cropperUrl}
          onCropConfirm={handleCropConfirm}
          onCropSkip={handleCropSkip}
          fileName={pendingFile?.name}
        />
      )}
    </>
  );
}
