'use client';

import { useState } from 'react';
import { MediaUpload } from '@/components/ui/media-upload';
import { MediaLibrary } from '@/components/ui/media-library';

interface MediaEditorProps {
  value: string;
  onChange: (value: string) => void;
  mediaType: 'image' | 'file' | 'video' | 'audio';
  bucket?: string;
  pathPrefix?: string;
  tenantId?: string;
}

export function MediaEditor({ value, onChange, mediaType, bucket, pathPrefix, tenantId }: MediaEditorProps) {
  const [libOpen, setLibOpen] = useState(false);

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
        tenantId={tenantId}
        onOpenLibrary={tenantId ? () => setLibOpen(true) : undefined}
      />
      {tenantId && (
        <MediaLibrary
          open={libOpen}
          onOpenChange={setLibOpen}
          tenantId={tenantId}
          onSelect={onChange}
        />
      )}
    </div>
  );
}
