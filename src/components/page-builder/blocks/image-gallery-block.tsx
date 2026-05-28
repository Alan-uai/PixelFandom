'use client';

import { Image } from 'lucide-react';

export function ImageGalleryBlock({ config }: { config: Record<string, unknown> }) {
  const title = (config.title as string) || 'Galeria';
  const images = (config.images as { src: string; alt?: string }[]) || [];

  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold">{title}</h2>}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.length > 0 ? (
          images.map((img, i) => (
            <div key={i} className="aspect-video rounded-lg overflow-hidden border bg-muted">
              {img.src ? (
                <img src={img.src} alt={img.alt || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Image className="h-8 w-8 mb-2" />
            <p className="text-sm">Adicione imagens nas configurações do bloco</p>
          </div>
        )}
      </div>
    </div>
  );
}
