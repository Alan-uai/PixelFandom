import type { AnimationType } from '@/components/page-builder/types';

export interface AnimationCategory {
  id: string;
  label: string;
  types: AnimationType[];
  description: string;
}

export const ANIMATION_CATEGORIES: AnimationCategory[] = [
  {
    id: 'fade',
    label: 'Fade',
    description: 'Aparece suavemente',
    types: ['fade-in', 'fade-in-left', 'fade-in-right', 'fade-in-up', 'fade-in-down', 'fade-in-scale'],
  },
  {
    id: 'slide',
    label: 'Slide',
    description: 'Desliza para dentro',
    types: ['slide-up', 'slide-down', 'slide-left', 'slide-right'],
  },
  {
    id: 'zoom',
    label: 'Zoom',
    description: 'Escala ao aparecer',
    types: ['zoom-in', 'zoom-out', 'zoom-in-down', 'zoom-in-up', 'zoom-in-left', 'zoom-in-right'],
  },
  {
    id: 'bounce',
    label: 'Bounce',
    description: 'Efeito elástico',
    types: ['bounce-in', 'bounce-in-up', 'bounce-in-down', 'bounce-in-left', 'bounce-in-right'],
  },
  {
    id: 'flip-3d',
    label: 'Flip / 3D',
    description: 'Rotações e perspectiva 3D',
    types: ['flip-x', 'flip-y', 'flip-x-in', 'flip-y-in', 'perspective-up', 'perspective-down', 'three-d-tilt', 'card-flip'],
  },
  {
    id: 'attention',
    label: 'Atenção',
    description: 'Chama atenção continuamente',
    types: ['pulse', 'pulse-soft', 'shake', 'shake-x', 'swing', 'wobble', 'jello', 'glow', 'float', 'bounce-loop', 'ping-soft', 'heartbeat'],
  },
  {
    id: 'motion',
    label: 'Motion',
    description: 'Animações suaves com Framer Motion',
    types: ['spring-up', 'spring-down', 'spring-in', 'reveal', 'blur-in', 'mask-in'],
  },
  {
    id: 'emphasis',
    label: 'Ênfase',
    description: 'Destaca o elemento',
    types: ['scale-up', 'scale-down'],
  },
];

export function getAnimationCategory(type: AnimationType): AnimationCategory | undefined {
  return ANIMATION_CATEGORIES.find((cat) => cat.types.includes(type));
}
