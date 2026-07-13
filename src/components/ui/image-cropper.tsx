'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Area = { width: number; height: number; x: number; y: number };

type AspectPreset = { label: string; ratio: number | null };

type Corner = 'tl' | 'tr' | 'bl' | 'br';

const ASPECT_PRESETS: AspectPreset[] = [
  { label: 'Livre', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '3:2', ratio: 3 / 2 },
  { label: '21:9', ratio: 21 / 9 },
];

const MIN_CROP = 50;
const MAX_CROP = 800;

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onCropConfirm: (croppedBlob: Blob) => void;
  onCropSkip?: () => void;
  fileName?: string;
}

export function ImageCropper({ open, onOpenChange, imageUrl, onCropConfirm, onCropSkip, fileName }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | null>(null);
  const [cropSize, setCropSize] = useState({ width: 300, height: 300 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);
  const [draggingCorner, setDraggingCorner] = useState<Corner | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startCrop: { x: number; y: number };
    startSize: { width: number; height: number };
  } | null>(null);

  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const size = Math.min(rect.width - 20, rect.height - 20, 400);
      setCropSize({ width: size, height: size });
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setAspect(null);
    }
  }, [open]);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const blob = await getCroppedImg(imageUrl, croppedAreaPixels);
      onCropConfirm(blob);
      onOpenChange(false);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspect(null);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const size = Math.min(rect.width - 20, rect.height - 20, 400);
      setCropSize({ width: size, height: size });
    }
  };

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const handleCornerPointerDown = useCallback((corner: Corner, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
      startSize: { ...cropSize },
    };
    setDraggingCorner(corner);
  }, [crop, cropSize]);

  const handleCornerPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingCorner || !dragRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const { startX, startY, startCrop, startSize } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let w = startSize.width;
    let h = startSize.height;
    let cx = startCrop.x;
    let cy = startCrop.y;

    switch (draggingCorner) {
      case 'br':
        w = clamp(startSize.width + dx, MIN_CROP, MAX_CROP);
        h = clamp(startSize.height + dy, MIN_CROP, MAX_CROP);
        cx = startCrop.x + (w - startSize.width) / 2;
        cy = startCrop.y + (h - startSize.height) / 2;
        break;
      case 'bl':
        w = clamp(startSize.width - dx, MIN_CROP, MAX_CROP);
        h = clamp(startSize.height + dy, MIN_CROP, MAX_CROP);
        cx = startCrop.x - (w - startSize.width) / 2;
        cy = startCrop.y + (h - startSize.height) / 2;
        break;
      case 'tl':
        w = clamp(startSize.width - dx, MIN_CROP, MAX_CROP);
        h = clamp(startSize.height - dy, MIN_CROP, MAX_CROP);
        cx = startCrop.x - (w - startSize.width) / 2;
        cy = startCrop.y - (h - startSize.height) / 2;
        break;
      case 'tr':
        w = clamp(startSize.width + dx, MIN_CROP, MAX_CROP);
        h = clamp(startSize.height - dy, MIN_CROP, MAX_CROP);
        cx = startCrop.x + (w - startSize.width) / 2;
        cy = startCrop.y - (h - startSize.height) / 2;
        break;
    }

    setCropSize({ width: w, height: h });
    setCrop({ x: cx, y: cy });
  }, [draggingCorner]);

  const handleCornerPointerUp = useCallback((e: React.PointerEvent) => {
    if (!draggingCorner) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingCorner(null);
    dragRef.current = null;
  }, [draggingCorner]);

  const isFree = aspect === null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Cortar imagem{fileName ? ` — ${fileName}` : ''}</DialogTitle>
        </DialogHeader>

        <div
          ref={containerRef}
          className="relative w-full flex-1 min-h-[360px] bg-black/80 rounded-lg overflow-hidden"
        >
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect ?? undefined}
            cropSize={isFree ? cropSize : undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />

          {isFree && (
            <>
              {(['tl', 'tr', 'bl', 'br'] as Corner[]).map((corner) => {
                const isLeft = corner === 'tl' || corner === 'bl';
                const isTop = corner === 'tl' || corner === 'tr';
                const x = isLeft ? crop.x - cropSize.width / 2 : crop.x + cropSize.width / 2;
                const y = isTop ? crop.y - cropSize.height / 2 : crop.y + cropSize.height / 2;
                return (
                  <div
                    key={corner}
                    onPointerDown={(e) => handleCornerPointerDown(corner, e)}
                    onPointerMove={handleCornerPointerMove}
                    onPointerUp={handleCornerPointerUp}
                    style={{
                      position: 'absolute',
                      left: x - 10,
                      top: y - 10,
                      width: 20,
                      height: 20,
                      cursor: (isLeft === isTop) ? 'nwse-resize' : 'nesw-resize',
                      touchAction: 'none',
                      zIndex: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        margin: 3,
                        border: '2px solid #fff',
                        borderRadius: 2,
                        background: 'rgba(0,0,0,0.35)',
                        boxShadow: '0 0 6px rgba(0,0,0,0.6)',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none bg-muted-foreground/20 cursor-pointer accent-primary
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow"
            />
            <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">{zoom.toFixed(1)}x</span>
          </div>

          {isFree && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-10 shrink-0">Largura</span>
              <input
                type="range"
                min={MIN_CROP}
                max={MAX_CROP}
                step={1}
                value={cropSize.width}
                onChange={(e) => setCropSize((prev) => ({ ...prev, width: Number(e.target.value) }))}
                className="flex-1 h-1.5 rounded-full appearance-none bg-muted-foreground/20 cursor-pointer accent-primary
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow"
              />
              <span className="text-xs text-muted-foreground w-12 text-right tabular-nums">{cropSize.width}px</span>
            </div>
          )}

          {isFree && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-10 shrink-0">Altura</span>
              <input
                type="range"
                min={MIN_CROP}
                max={MAX_CROP}
                step={1}
                value={cropSize.height}
                onChange={(e) => setCropSize((prev) => ({ ...prev, height: Number(e.target.value) }))}
                className="flex-1 h-1.5 rounded-full appearance-none bg-muted-foreground/20 cursor-pointer accent-primary
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow"
              />
              <span className="text-xs text-muted-foreground w-12 text-right tabular-nums">{cropSize.height}px</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground leading-7 mr-1">Proporção:</span>
            {ASPECT_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setAspect(p.ratio)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  aspect === p.ratio
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Redefinir
          </button>
          <div className="flex items-center gap-2">
            {onCropSkip && (
              <button
                type="button"
                onClick={() => { onCropSkip(); onOpenChange(false); }}
                className="px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Pular corte
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              ref={confirmBtnRef}
              type="button"
              onClick={handleConfirm}
              disabled={!croppedAreaPixels || loading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {loading ? 'Cortando...' : 'Aplicar corte'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

async function getCroppedImg(imageUrl: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}
