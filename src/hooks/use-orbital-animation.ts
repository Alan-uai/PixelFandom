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
    speed: (0.25 + Math.random() * 0.5) * (Math.random() < 0.5 ? 1 : -1),
    inclination: (Math.random() - 0.5) * (Math.PI / 1.5),
    phaseOffset: Math.random() * Math.PI * 2,
  };
}

type OrbitMode = 'shared' | 'individual' | 'random';

interface TrailPoint {
  x: number;
  y: number;
}

const MORPH_RATE = 0.02;
const MORPH_EPSILON = 0.005;

export function useOrbitalAnimation(count: number, options?: { orbitMode?: OrbitMode }) {
  const paramsRef = useRef<OrbitParams[]>([]);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trailRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const [phase, setPhase] = useState<'orbiting' | 'expanded'>('orbiting');
  const phaseRef = useRef(phase);
  const expandedRef = useRef(false);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const speedMult = useRef(1);
  const radiusMult = useRef(1);
  const targetSpeedMult = useRef(1);
  const targetRadiusMult = useRef(1);

  const trailPositions = useRef<TrailPoint[][]>([]);
  const trailFrameSkip = useRef(0);

  const morphProgress = useRef(1);
  const morphTarget = useRef(1);
  const horizontalTargets = useRef<{ x: number; y: number }[]>([]);

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
    for (let i = 0; i < count; i++) {
      const el = iconRefs.current[i];
      if (el) el.style.transition = 'none';
    }

    let start = 0;
    let raf = 0;
    const params = paramsRef.current;

    function loop(ts: number) {
      if (!start) start = ts;
      const elapsed = (ts - start) / 1000;

      speedMult.current += (targetSpeedMult.current - speedMult.current) * 0.04;
      radiusMult.current += (targetRadiusMult.current - radiusMult.current) * 0.04;

      const curr = morphProgress.current;
      const tgt = morphTarget.current;
      const diff = tgt - curr;
      if (Math.abs(diff) > MORPH_EPSILON) {
        morphProgress.current += diff * MORPH_RATE;
      } else if (diff !== 0) {
        morphProgress.current = tgt;
        if (tgt === 0) {
          for (let i = 0; i < count; i++) {
            const el = iconRefs.current[i];
            if (!el) continue;
            const hTarget = horizontalTargets.current[i];
            el.style.transform = `translate(${hTarget?.x ?? 0}px, ${hTarget?.y ?? 0}px)`;
            el.style.zIndex = '15';
          }
          if (phaseRef.current === 'orbiting') {
            setPhase('expanded');
          }
        } else if (tgt === 1 && phaseRef.current === 'expanded') {
          setPhase('orbiting');
        }
      }

      const morph = morphProgress.current;
      const skip = trailFrameSkip.current;

      for (let i = 0; i < count; i++) {
        const el = iconRefs.current[i];
        if (!el) continue;
        const p = params[i];
        const currentRadius = p.radius * radiusMult.current;
        const currentSpeed = p.speed * speedMult.current;
        const angle = p.phaseOffset + currentSpeed * elapsed;

        const orbitX = currentRadius * Math.cos(angle);
        const orbitY = currentRadius * Math.sin(angle) * Math.cos(p.inclination);

        const hTarget = horizontalTargets.current[i];
        const hx = hTarget?.x ?? 0;
        const hy = hTarget?.y ?? 0;

        const orbWeight = Math.pow(morph, 0.2);
        const hWeight = Math.pow(1 - morph, 2);
        const fx = orbitX * orbWeight + hx * hWeight;
        const fy = orbitY * orbWeight + hy * hWeight;

        el.style.transform = `translate(${fx}px, ${fy}px)`;
        el.style.zIndex = String(Math.sin(angle) > 0 ? 11 : 15);

        if (skip % 2 === 0) {
          const trail = trailPositions.current[i];
          if (trail) {
            trail.push({ x: fx, y: fy });
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

      if (morph < 0.05) {
        for (let i = 0; i < count; i++) {
          const trailEls = trailRefs.current[i];
          if (trailEls) {
            for (let t = 0; t < trailEls.length; t++) {
              const tEl = trailEls[t];
              if (tEl) tEl.style.opacity = '0';
            }
          }
        }
      }

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [count]);

  const expand = useCallback(
    (targets: { x: number; y: number }[]) => {
      horizontalTargets.current = targets;
      expandedRef.current = true;
      morphTarget.current = 0;
    },
    [count],
  );

  const collapse = useCallback(() => {
    expandedRef.current = false;
    morphTarget.current = 1;
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
    setHoverSpeedMultiplier,
    setHoverRadiusMultiplier,
  };
}
