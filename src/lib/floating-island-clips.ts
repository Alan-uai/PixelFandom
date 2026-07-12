import type { CSSProperties } from 'react';
import type { ClipStyleId, FloatingIslandPosition } from '@/components/page-builder/types';

export interface ClipStyleDef {
  id: ClipStyleId;
  label: string;
  description: string;
  getClipPath(pos: FloatingIslandPosition): string;
}

function trapezoidPath(clipPx: number) {
  return (pos: FloatingIslandPosition) => {
    switch (pos) {
      case 'left':
        return `polygon(0 0, 100% 0, calc(100% - ${clipPx}px) 100%, 0 100%)`;
      case 'center':
        return `polygon(0 0, 100% 0, calc(100% - ${clipPx}px) 100%, ${clipPx}px 100%)`;
      case 'right':
        return `polygon(0 0, 100% 0, 100% 100%, ${clipPx}px 100%)`;
    }
  };
}

function invertedTrapezoidPath(clipPx: number) {
  return (pos: FloatingIslandPosition) => {
    switch (pos) {
      case 'left':
        return `polygon(0 ${clipPx}px, 100% 0, 100% 100%, 0 100%)`;
      case 'center':
        return `polygon(${clipPx}px 0, 100% 0, 100% 100%, 0 ${clipPx}px)`;
      case 'right':
        return `polygon(0 0, 100% ${clipPx}px, 100% 100%, 0 100%)`;
    }
  };
}

function pentagonPath(pos: FloatingIslandPosition) {
  const pct = '20%';
  switch (pos) {
    case 'left':
      return `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0)`;
    case 'center':
      return `polygon(${pct} 0, calc(100% - ${pct}) 0, 100% 100%, 0 100%)`;
    case 'right':
      return `polygon(0 0, 100% 0, 100% 100%, 0 100%, 100% 0)`;
  }
}

function pentagonInvertedPath(pos: FloatingIslandPosition) {
  switch (pos) {
    case 'left':
      return `polygon(0 0, 100% 0, 100% calc(100% - 20%), 50% 100%, 0 calc(100% - 20%))`;
    case 'center':
      return `polygon(0 0, 100% 0, 100% calc(100% - 20%), 50% 100%, 0 calc(100% - 20%))`;
    case 'right':
      return `polygon(0 0, 100% 0, 100% calc(100% - 20%), 50% 100%, 0 calc(100% - 20%))`;
  }
}

function chevronPath(pos: FloatingIslandPosition) {
  switch (pos) {
    case 'left':
      return `polygon(0 0, calc(100% - 28px) 0, 100% 50%, calc(100% - 28px) 100%, 0 100%)`;
    case 'center':
      return `polygon(28px 0, calc(100% - 28px) 0, 100% 50%, calc(100% - 28px) 100%, 28px 100%, 0 50%)`;
    case 'right':
      return `polygon(28px 0, 100% 0, 100% 100%, 28px 100%, 0 50%)`;
  }
}

export const CLIP_STYLES: ClipStyleDef[] = [
  {
    id: 'trapezoid-subtle',
    label: 'Trapézio Suave',
    description: 'Corte diagonal sutil (14px)',
    getClipPath: trapezoidPath(14),
  },
  {
    id: 'trapezoid',
    label: 'Trapézio',
    description: 'Corte diagonal padrão (28px)',
    getClipPath: trapezoidPath(28),
  },
  {
    id: 'trapezoid-sharp',
    label: 'Trapézio Agressivo',
    description: 'Corte diagonal acentuado (48px)',
    getClipPath: trapezoidPath(48),
  },
  {
    id: 'trapezoid-extreme',
    label: 'Trapézio Extremo',
    description: 'Corte diagonal dramático (64px)',
    getClipPath: trapezoidPath(64),
  },
  {
    id: 'rectangle',
    label: 'Retângulo',
    description: 'Sem corte, bordas retas',
    getClipPath: () => 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
  },
  {
    id: 'inverted-subtle',
    label: 'Invertido Suave',
    description: 'Base > topo, sutil (14px)',
    getClipPath: invertedTrapezoidPath(14),
  },
  {
    id: 'inverted',
    label: 'Invertido',
    description: 'Base > topo, padrão (28px)',
    getClipPath: invertedTrapezoidPath(28),
  },
  {
    id: 'inverted-sharp',
    label: 'Invertido Agressivo',
    description: 'Base > topo, acentuado (48px)',
    getClipPath: invertedTrapezoidPath(48),
  },
  {
    id: 'pentagon',
    label: 'Pentágono',
    description: 'Topo em telhado, fundo reto',
    getClipPath: pentagonPath,
  },
  {
    id: 'pentagon-inverted',
    label: 'Pentágono Invertido',
    description: 'Topo reto, fundo em V',
    getClipPath: pentagonInvertedPath,
  },
  {
    id: 'chevron',
    label: 'Chevron',
    description: 'Pontas duplas com vinco central',
    getClipPath: chevronPath,
  },
];

export function getClipStyleDef(id: ClipStyleId): ClipStyleDef {
  return CLIP_STYLES.find((c) => c.id === id) || CLIP_STYLES[1];
}

export function getClipPath(id: ClipStyleId, pos: FloatingIslandPosition): string {
  return getClipStyleDef(id).getClipPath(pos);
}

function getTrapezoidPx(id: ClipStyleId): number | null {
  if (id === 'trapezoid-subtle') return 14;
  if (id === 'trapezoid') return 28;
  if (id === 'trapezoid-sharp') return 48;
  if (id === 'trapezoid-extreme') return 64;
  return null;
}

export function getContentPadding(id: ClipStyleId, pos: FloatingIslandPosition): CSSProperties {
  const clipPx = getTrapezoidPx(id);
  if (clipPx !== null) {
    switch (pos) {
      case 'left': return { paddingRight: clipPx };
      case 'center': return { paddingLeft: clipPx, paddingRight: clipPx };
      case 'right': return { paddingLeft: clipPx };
    }
  }

  if (id === 'chevron') {
    switch (pos) {
      case 'left': return { paddingRight: 28 };
      case 'center': return { paddingLeft: 28, paddingRight: 28 };
      case 'right': return { paddingLeft: 28 };
    }
  }

  if (id === 'pentagon' && pos === 'center') {
    return { paddingLeft: '20%', paddingRight: '20%' };
  }

  return {};
}
