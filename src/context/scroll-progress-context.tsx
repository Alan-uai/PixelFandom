'use client';

import { createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

const ScrollProgressContext = createContext<MotionValue<number> | null>(null);

export function useScrollProgress() {
  return useContext(ScrollProgressContext);
}

export const ScrollProgressProvider = ScrollProgressContext.Provider;
