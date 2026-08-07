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
 *  superfície explicitamente informada). Obedece à preferência do usuário: a
 *  superfície anima quando o seu próprio toggle está ligado. O master é apenas
 *  um atalho que liga/desliga todas as superfícies juntas — se uma superfície
 *  ficou ligada e o master caiu (por outra superfície ter sido desligada), essa
 *  superfície continua animando. */
export function useAnimationsEnabled(surface?: AnimationSurface): boolean {
  const providerSurface = useContext(AnimationSurfaceContext);
  const target = surface ?? providerSurface;
  const { preferences } = useUserPreferences();
  const anims = preferences?.animations;
  if (!anims) return false;
  return anims[target] !== false;
}
