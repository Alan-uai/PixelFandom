'use client';

import { MediaUpload } from '@/components/ui/media-upload';

interface MediaEditorProps {
  value: string;
  onChange: (value: string) => void;
  mediaType: 'image' | 'file' | 'video' | 'audio';
  bucket?: string;
  pathPrefix?: string;
  tenantId?: string;
}

export function MediaEditor({ value, onChange, mediaType, bucket, pathPrefix }: MediaEditorProps) {
  const labelMap: Record<string, string> = {
    image: 'Imagem',
    file: 'Arquivo',
    video: 'Vídeo',
    audio: 'Áudio',
  };

  return (
    <div className="space-y-1">
      <label className="text-[10px] text-muted-foreground">{labelMap[mediaType]}</label>
      <MediaUpload
        bucket={bucket || 'game-items'}
        pathPrefix={pathPrefix || 'uploads'}
        value={value}
        onChange={onChange}
        mediaType={mediaType as 'image' | 'video' | 'audio' | 'file'}
        label={labelMap[mediaType]}
      />
    </div>
  );
}
