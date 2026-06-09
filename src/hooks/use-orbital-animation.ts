'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

interface OrbitParams {
  radius: number;
  speed: number;
  inclination: number;
  phaseOffset: number;
}

function createParams(): OrbitParams {
  return {
    radius: 42 + Math.random() * 48,
    speed: 0.35 + Math.random() * 0.7,
    inclination: (Math.random() - 0.5) * (Math.PI / 1.5),
    phaseOffset: Math.random() * Math.PI * 2,
  };
}

const SPRING_TRANSITION = 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0.3s';
const COLLAPSE_TRANSITION = 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0.25s';

export function useOrbitalAnimation(count: number) {
  const paramsRef = useRef<OrbitParams[]>([]);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [phase, setPhase] = useState<'orbiting' | 'expanded'>('orbiting');
  const phaseRef = useRef(phase);
  const transitioningRef = useRef(false);
  phaseRef.current = phase;

  if (paramsRef.current.length !== count || iconRefs.current.length !== count) {
    paramsRef.current = Array.from({ length: count }, createParams);
    iconRefs.current = Array.from({ length: count }, () => null);
  }

  useEffect(() => {
    if (phase !== 'orbiting') return;

    transitioningRef.current = false;
    let start = 0;
    let raf = 0;
    const params = paramsRef.current;

    function loop(ts: number) {
      if (phaseRef.current !== 'orbiting' || transitioningRef.current) return;
      if (!start) start = ts;
      const elapsed = (ts - start) / 1000;

      for (let i = 0; i < count; i++) {
        const el = iconRefs.current[i];
        if (!el) continue;
        const p = params[i];
        const angle = p.phaseOffset + p.speed * elapsed;
        const x = p.radius * Math.cos(angle);
        const y = p.radius * Math.sin(angle) * Math.cos(p.inclination);
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.zIndex = String(Math.sin(angle) > 0 ? 1 : 15);
      }

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, count]);

  const setIconRef = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      iconRefs.current[i] = el;
    },
    [],
  );

  const expand = useCallback(
    (targets: { x: number; y: number }[]) => {
      transitioningRef.current = true;
      setPhase('expanded');

      for (let i = 0; i < count; i++) {
        const el = iconRefs.current[i];
        if (!el || !targets[i]) continue;
        el.style.transition = SPRING_TRANSITION;
        el.style.transform = `translate(${targets[i].x}px, ${targets[i].y}px)`;
        el.style.zIndex = '15';
      }
    },
    [count],
  );

  const collapse = useCallback(() => {
    transitioningRef.current = true;

    const params = paramsRef.current;
    for (let i = 0; i < count; i++) {
      const el = iconRefs.current[i];
      if (!el) continue;
      const p = params[i];
      const startX = p.radius * Math.cos(p.phaseOffset);
      const startY = p.radius * Math.sin(p.phaseOffset) * Math.cos(p.inclination);
      el.style.transition = COLLAPSE_TRANSITION;
      el.style.transform = `translate(${startX}px, ${startY}px)`;
      el.style.zIndex = '1';
    }

    setTimeout(() => {
      transitioningRef.current = false;
      setPhase('orbiting');
    }, 500);
  }, [count]);

  const setOrbitTransition = useCallback(() => {
    for (let i = 0; i < count; i++) {
      const el = iconRefs.current[i];
      if (!el) continue;
      el.style.transition = 'none';
    }
  }, [count]);

  return { phase, setIconRef, expand, collapse, setOrbitTransition };
}
