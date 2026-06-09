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
    radius: 65 + Math.random() * 55,
    speed: 0.25 + Math.random() * 0.5,
    inclination: (Math.random() - 0.5) * (Math.PI / 1.5),
    phaseOffset: Math.random() * Math.PI * 2,
  };
}

const EXPAND_TRANSITION = 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0.3s';
const COLLAPSE_TRANSITION = 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1), z-index 0.25s';

type OrbitMode = 'shared' | 'individual' | 'random';

export function useOrbitalAnimation(count: number, options?: { orbitMode?: OrbitMode; centerIndices?: number[] }) {
  const paramsRef = useRef<OrbitParams[]>([]);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [phase, setPhase] = useState<'orbiting' | 'expanded'>('orbiting');
  const phaseRef = useRef(phase);
  const transitioningRef = useRef(false);
  phaseRef.current = phase;

  const speedMult = useRef(1);
  const radiusMult = useRef(1);
  const targetSpeedMult = useRef(1);
  const targetRadiusMult = useRef(1);

  const prevPositions = useRef<{ x: number; y: number }[]>([]);

  if (paramsRef.current.length !== count || iconRefs.current.length !== count) {
    const mode = options?.orbitMode ?? 'random';
    const actualMode = mode === 'random'
      ? (Math.random() < 0.5 ? 'shared' : 'individual')
      : mode;
    const centerSet = new Set(options?.centerIndices ?? []);

    if (actualMode === 'shared' && count > 0) {
      const shared = createParams();
      paramsRef.current = Array.from({ length: count }, (_, i) =>
        centerSet.has(i)
          ? { radius: 0, speed: 0, inclination: 0, phaseOffset: 0 }
          : { ...shared, phaseOffset: Math.random() * Math.PI * 2 },
      );
    } else {
      paramsRef.current = Array.from({ length: count }, (_, i) =>
        centerSet.has(i)
          ? { radius: 0, speed: 0, inclination: 0, phaseOffset: 0 }
          : createParams(),
      );
    }
    iconRefs.current = Array.from({ length: count }, () => null);
    trailRefs.current = Array.from({ length: count }, () => null);
    prevPositions.current = Array.from({ length: count }, () => ({ x: 0, y: 0 }));
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

      speedMult.current += (targetSpeedMult.current - speedMult.current) * 0.04;
      radiusMult.current += (targetRadiusMult.current - radiusMult.current) * 0.04;

      for (let i = 0; i < count; i++) {
        const el = iconRefs.current[i];
        if (!el) continue;
        const p = params[i];
        const currentRadius = p.radius * radiusMult.current;
        const currentSpeed = p.speed * speedMult.current;
        const angle = p.phaseOffset + currentSpeed * elapsed;
        const x = currentRadius * Math.cos(angle);
        const y = currentRadius * Math.sin(angle) * Math.cos(p.inclination);
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.zIndex = String(Math.sin(angle) > 0 ? 1 : 15);

        const trailEl = trailRefs.current[i];
        if (trailEl) {
          const prev = prevPositions.current[i];
          if (prev) {
            const dx = x - prev.x;
            const dy = y - prev.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0.3) {
              const trailAngle = Math.atan2(-dy, -dx);
              trailEl.style.transform = `translate(${x}px, ${y}px) rotate(${trailAngle}rad)`;
              trailEl.style.width = '32px';
              trailEl.style.opacity = '0.5';
            } else {
              trailEl.style.opacity = '0';
            }
          }
          prevPositions.current[i] = { x, y };
        }
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

  const setTrailRef = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      trailRefs.current[i] = el;
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
        el.style.transition = EXPAND_TRANSITION;
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
      const r = p.radius * radiusMult.current;
      const startX = r * Math.cos(p.phaseOffset);
      const startY = r * Math.sin(p.phaseOffset) * Math.cos(p.inclination);
      el.style.transition = COLLAPSE_TRANSITION;
      el.style.transform = `translate(${startX}px, ${startY}px)`;
      el.style.zIndex = '1';
    }

    setTimeout(() => {
      transitioningRef.current = false;
      setPhase('orbiting');
    }, 600);
  }, [count]);

  const setOrbitTransition = useCallback(() => {
    for (let i = 0; i < count; i++) {
      const el = iconRefs.current[i];
      if (!el) continue;
      el.style.transition = 'none';
    }
  }, [count]);

  const setHoverSpeedMultiplier = useCallback((mult: number) => {
    targetSpeedMult.current = mult;
  }, []);

  const setHoverRadiusMultiplier = useCallback((mult: number) => {
    targetRadiusMult.current = mult;
  }, []);

  return {
    phase,
    setIconRef,
    setTrailRef,
    expand,
    collapse,
    setOrbitTransition,
    setHoverSpeedMultiplier,
    setHoverRadiusMultiplier,
  };
}
