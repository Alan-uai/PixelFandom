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

interface TrailPoint {
  x: number;
  y: number;
}

export function useOrbitalAnimation(count: number, options?: { orbitMode?: OrbitMode }) {
  const paramsRef = useRef<OrbitParams[]>([]);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trailRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const [phase, setPhase] = useState<'orbiting' | 'expanded'>('orbiting');
  const phaseRef = useRef(phase);
  const transitioningRef = useRef(false);
  const expandedRef = useRef(false);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const speedMult = useRef(1);
  const radiusMult = useRef(1);
  const targetSpeedMult = useRef(1);
  const targetRadiusMult = useRef(1);

  const trailPositions = useRef<TrailPoint[][]>([]);
  const trailFrameSkip = useRef(0);
  const collapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (paramsRef.current.length !== count || iconRefs.current.length !== count) {
    const mode = options?.orbitMode ?? 'random';
    const actualMode = mode === 'random'
      ? (Math.random() < 0.5 ? 'shared' : 'individual')
      : mode;

    if (actualMode === 'shared' && count > 0) {
      const shared = createParams();
      paramsRef.current = Array.from({ length: count }, (_, i) => ({
        ...shared,
        phaseOffset: Math.random() * Math.PI * 2,
      }));
    } else {
      paramsRef.current = Array.from({ length: count }, createParams);
    }
    iconRefs.current = Array.from({ length: count }, () => null);
    trailRefs.current = Array.from({ length: count }, () => Array.from({ length: 8 }, () => null));
    trailPositions.current = Array.from({ length: count }, () => []);
  }

  useEffect(() => {
    if (phase !== 'orbiting') return;

    transitioningRef.current = false;
    let start = 0;
    let raf = 0;
    const params = paramsRef.current;

    for (let i = 0; i < count; i++) {
      const el = iconRefs.current[i];
      if (el) el.style.transition = 'none';
    }

    function loop(ts: number) {
      if (phaseRef.current !== 'orbiting' || transitioningRef.current) return;
      if (!start) start = ts;
      const elapsed = (ts - start) / 1000;

      speedMult.current += (targetSpeedMult.current - speedMult.current) * 0.04;
      radiusMult.current += (targetRadiusMult.current - radiusMult.current) * 0.04;

      const skip = trailFrameSkip.current;

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
        el.style.zIndex = String(Math.sin(angle) > 0 ? 11 : 15);

        if (skip % 2 === 0) {
          const trail = trailPositions.current[i];
          if (trail) {
            trail.push({ x, y });
            if (trail.length > 8) trail.shift();
          }
        }

        const trailEls = trailRefs.current[i];
        if (trailEls) {
          const trail = trailPositions.current[i];
          if (trail) {
            for (let t = 0; t < Math.min(trailEls.length, trail.length); t++) {
              const trailEl = trailEls[t];
              if (!trailEl) continue;
              const pos = trail[trail.length - 1 - t];
              if (!pos) continue;
              trailEl.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
              const alpha = 0.35 * (1 - t / trail.length);
              const size = 5 * (1 - t / trail.length * 0.4);
              trailEl.style.width = `${size}px`;
              trailEl.style.height = `${size}px`;
              trailEl.style.opacity = String(alpha);
            }
          }
        }
      }

      trailFrameSkip.current = skip + 1;
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

  const setIconRef = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      iconRefs.current[i] = el;
    },
    [],
  );

  const setTrailRef = useCallback(
    (iconIndex: number, trailIndex: number) => (el: HTMLDivElement | null) => {
      if (trailRefs.current[iconIndex]) {
        trailRefs.current[iconIndex][trailIndex] = el;
      }
    },
    [],
  );

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
    setIconRef,
    setTrailRef,
    expand,
    collapse,
    setOrbitTransition,
    setHoverSpeedMultiplier,
    setHoverRadiusMultiplier,
  };
}
