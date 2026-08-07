'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useUserPreferences } from '@/context/user-preferences-context';

export type AnimationSurface = 'dashboard' | 'wiki';

const AnimationSurfaceContext = createContext<AnimationSurface>('wiki');

/** Marca qual superfície está renderizando o conteúdo abaixo, para que os
 *  componentes animados saibam qual preferência de animação consultar. */
export function AnimationSurfaceProvider({
  surface,
  children,
}: {
  surface: AnimationSurface;
  children: ReactNode;
}) {
  return <AnimationSurfaceContext.Provider value={surface}>{children}</AnimationSurfaceContext.Provider>;
}

/** Retorna se animações estão habilitadas para a superfície atual (ou para a
 *  superfície explicitamente informada). Obedece à preferência do usuário:
 *  `animations.enabled` (master) e o toggle por superfície. */
export function useAnimationsEnabled(surface?: AnimationSurface): boolean {
  const providerSurface = useContext(AnimationSurfaceContext);
  const target = surface ?? providerSurface;
  const { preferences } = useUserPreferences();
  const anims = preferences?.animations;
  if (!anims?.enabled) return false;
  return anims[target] !== false;
}
