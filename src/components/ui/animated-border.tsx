'use client';

import type { ReactNode } from 'react';

interface AnimatedBorderProps {
  children: ReactNode;
  className?: string;
}

export default function AnimatedBorder({ children, className = '' }: AnimatedBorderProps) {
  return (
    <div className={`search-uiverse-wrapper flex items-center justify-center relative ${className}`}>
      <div className="grid" />
      <div id="poda">
        <div className="glow" />
        <div className="darkBorderBg" />
        <div className="darkBorderBg" />
        <div className="darkBorderBg" />
        <div className="white" />
        <div className="border" />
        {children}
      </div>
    </div>
  );
}
