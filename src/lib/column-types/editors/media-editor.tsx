'use client';

import { useState } from 'react';
import { ImageUpload } from '@/components/ui/image-upload';

interface MediaEditorProps {
  value: string;
  onChange: (value: string) => void;
  mediaType: 'image' | 'file' | 'video' | 'audio';
  bucket?: string;
  pathPrefix?: string;
  tenantId?: string;
}

export function MediaEditor({ value, onChange, mediaType, bucket, pathPrefix, tenantId }: MediaEditorProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');

  const acceptMap: Record<string, string> = {
    image: 'image/*',
    file: '*/*',
    video: 'video/*',
    audio: 'audio/*',
  };

  if (mediaType === 'video' && mode === 'url') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <button type="button" onClick={() => setMode('upload')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Upload</button>
          <span className="text-muted-foreground/40">·</span>
          <button type="button" onClick={() => setMode('url')} className="text-xs text-primary font-medium">URL</button>
        </div>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full h-8 rounded-lg border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {value && (
          <div className="rounded-lg overflow-hidden border bg-muted/30 aspect-video flex items-center justify-center">
            <iframe
              src={value.includes('youtube') || value.includes('youtu.be')
                ? `https://www.youtube.com/embed/${extractYoutubeId(value)}`
                : value}
              className="w-full h-full"
              allowFullScreen
              title="Video preview"
              sandbox="allow-same-origin allow-scripts allow-presentation"
            />
          </div>
        )}
      </div>
    );
  }

  if (mediaType === 'audio' && mode === 'url') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <button type="button" onClick={() => setMode('upload')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Upload</button>
          <span className="text-muted-foreground/40">·</span>
          <button type="button" onClick={() => setMode('url')} className="text-xs text-primary font-medium">URL</button>
        </div>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://exemplo.com/audio.mp3"
          className="w-full h-8 rounded-lg border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {value && <audio src={value} controls className="w-full h-8 mt-1" />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mb-1">
      <button
        type="button"
        onClick={() => setMode('upload')}
        className={`text-xs transition-colors ${mode === 'upload' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
      >
        Upload
      </button>
      <span className="text-muted-foreground/40">·</span>
      <button
        type="button"
        onClick={() => setMode('url')}
        className={`text-xs transition-colors ${mode === 'url' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
      >
        URL
      </button>
      <div className="flex-1">
        {mode === 'upload' ? (
          <ImageUpload
            bucket={bucket || 'game-items'}
            pathPrefix={pathPrefix || 'uploads'}
            value={value}
            onChange={onChange}
            accept={acceptMap[mediaType]}
            label={mediaType === 'image' ? 'Imagem' : mediaType === 'file' ? 'Arquivo' : mediaType === 'video' ? 'Vídeo' : 'Áudio'}
            previewSize={mediaType === 'image' ? 'w-16 h-16' : 'w-10 h-10'}
          />
        ) : (
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`URL da ${mediaType === 'image' ? 'imagem' : mediaType === 'file' ? 'arquivo' : mediaType === 'video' ? 'vídeo' : 'áudio'}`}
            className="w-full h-8 rounded-lg border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        )}
      </div>
    </div>
  );
}

function extractYoutubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || '';
}
