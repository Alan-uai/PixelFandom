'use client';

import { useState } from 'react';
import { ImageUpload } from '@/components/ui/image-upload';
import { MediaLibrary } from '@/components/ui/media-library';

type Props = {
  bucket?: string;
  pathPrefix?: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  previewSize?: string;
  label?: string;
  tenantId?: string;
};

export function ImagePicker({
  bucket,
  pathPrefix,
  value,
  onChange,
  accept,
  previewSize,
  label,
  tenantId,
}: Props) {
  const [libraryOpen, setLibraryOpen] = useState(false);

  return (
    <>
      <ImageUpload
        bucket={bucket}
        pathPrefix={pathPrefix}
        value={value}
        onChange={onChange}
        accept={accept}
        previewSize={previewSize}
        label={label}
        onOpenLibrary={tenantId ? () => setLibraryOpen(true) : undefined}
      />
      {tenantId && (
        <MediaLibrary
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          tenantId={tenantId}
          onSelect={onChange}
          bucket={bucket}
          pathPrefix={pathPrefix}
        />
      )}
    </>
  );
}
