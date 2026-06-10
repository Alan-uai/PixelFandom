'use client';

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';

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

interface ParamOverride {
  radius: number;
  speed: number;
  inclination: number;
}

export function useOrbitalAnimation(count: number, options?: { orbitMode?: OrbitMode; paramOverrides?: (ParamOverride | null)[] }) {
  const paramsRef = useRef<OrbitParams[]>([]);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [phase, setPhase] = useState<'orbiting' | 'expanded'>('orbiting');
  const phaseRef = useRef(phase);
  const transitioningRef = useRef(false);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const speedMult = useRef(1);
  const radiusMult = useRef(1);
  const targetSpeedMult = useRef(1);
  const targetRadiusMult = useRef(1);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prevPositions = useRef<{ x: number; y: number }[]>([]);
  const expandedRef = useRef(false);

  const iconRefCallbacks = useMemo(() =>
    Array.from({ length: count }, (_, i) => (el: HTMLDivElement | null) => {
      iconRefs.current[i] = el;
    }),
  [count]);

  const trailRefCallbacks = useMemo(() =>
    Array.from({ length: count }, (_, i) => (el: HTMLDivElement | null) => {
      trailRefs.current[i] = el;
    }),
  [count]);

  useEffect(() => {
    const mode = options?.orbitMode ?? 'random';
    const actualMode = mode === 'random'
      ? (Math.random() < 0.5 ? 'shared' : 'individual')
      : mode;
    const overrides = options?.paramOverrides ?? [];

    if (actualMode === 'shared' && count > 0) {
      const shared = createParams();
      paramsRef.current = Array.from({ length: count }, (_, i) => {
        const ov = overrides[i];
        if (ov) return { ...ov, phaseOffset: Math.random() * Math.PI * 2 };
        return { ...shared, phaseOffset: Math.random() * Math.PI * 2 };
      });
    } else {
      paramsRef.current = Array.from({ length: count }, (_, i) => {
        const ov = overrides[i];
        if (ov) return { ...ov, phaseOffset: Math.random() * Math.PI * 2 };
        return createParams();
      });
    }
  }, [count, options?.orbitMode, options?.paramOverrides]);

  useEffect(() => {
    if (phase !== 'orbiting') return;

    transitioningRef.current = false;
    let start = 0;
    let raf = 0;
    let frameCount = 0;

    for (let i = 0; i < count; i++) {
      const el = iconRefs.current[i];
      if (el) el.style.transition = 'none';
    }

    function loop(ts: number) {
      if (phaseRef.current !== 'orbiting' || transitioningRef.current) return;
      if (!start) start = ts;
      const elapsed = (ts - start) / 1000;

      if (prevPositions.current.length !== count) {
        prevPositions.current = Array.from({ length: count }, () => ({ x: 0, y: 0 }));
      }

      speedMult.current += (targetSpeedMult.current - speedMult.current) * 0.015;
      radiusMult.current += (targetRadiusMult.current - radiusMult.current) * 0.015;

      frameCount++;

      for (let i = 0; i < count; i++) {
        const el = iconRefs.current[i];
        if (!el) continue;
        const p = paramsRef.current[i];
        if (!p) continue;
        const currentRadius = p.radius * radiusMult.current;
        const currentSpeed = p.speed * speedMult.current;
        const angle = p.phaseOffset + currentSpeed * elapsed;
        const x = currentRadius * Math.cos(angle);
        const y = currentRadius * Math.sin(angle) * Math.cos(p.inclination);
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.zIndex = String(Math.sin(angle) > 0 ? 11 : 15);

        const trailEl = trailRefs.current[i];
        if (trailEl) {
          const prev = prevPositions.current[i];
          if (prev) {
            const dx = x - prev.x;
            const dy = y - prev.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (frameCount > 1) {
              if (dist > 0.3) {
                const trailAngle = Math.atan2(dy, dx);
                trailEl.style.transform = `rotate(${trailAngle}rad)`;
                trailEl.style.width = `${Math.min(48, Math.max(16, dist * 4))}px`;
                trailEl.style.opacity = '0.5';
              } else {
                trailEl.style.opacity = '0';
              }
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

  const expand = useCallback(
    (targets: { x: number; y: number }[]) => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
        collapseTimeoutRef.current = null;
      }
      transitioningRef.current = true;
      expandedRef.current = true;

      for (let i = 0; i < count; i++) {
        const el = iconRefs.current[i];
        if (!el || !targets[i]) continue;
        el.style.transition = EXPAND_TRANSITION;
        el.style.transform = `translate(${targets[i].x}px, ${targets[i].y}px)`;
        el.style.zIndex = '15';
      }

      requestAnimationFrame(() => requestAnimationFrame(() => {
        setPhase('expanded');
      }));
    },
    [count],
  );

  const collapse = useCallback(() => {
    transitioningRef.current = true;
    expandedRef.current = false;

    for (let i = 0; i < count; i++) {
      const el = iconRefs.current[i];
      if (!el) continue;
      const p = paramsRef.current[i];
      if (!p) continue;
      const r = p.radius * radiusMult.current;
      const startX = r * Math.cos(p.phaseOffset);
      const startY = r * Math.sin(p.phaseOffset) * Math.cos(p.inclination);
      el.style.transition = COLLAPSE_TRANSITION;
      el.style.transform = `translate(${startX}px, ${startY}px)`;
      el.style.zIndex = '11';
    }

    collapseTimeoutRef.current = setTimeout(() => {
      for (let i = 0; i < count; i++) {
        const el = iconRefs.current[i];
        if (el) el.style.transition = 'none';
      }
      transitioningRef.current = false;
      collapseTimeoutRef.current = null;
      setPhase('orbiting');
    }, 1250);
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
    expandedRef,
    setIconRef: (i: number) => iconRefCallbacks[i],
    setTrailRef: (i: number) => trailRefCallbacks[i],
    expand,
    collapse,
    setOrbitTransition,
    setHoverSpeedMultiplier,
    setHoverRadiusMultiplier,
  };
}
