'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

interface OrbitParams {
  radius: number;
  inclination: number;
  orbitDuration: number;
  phaseDelay: number;
  direction: 'normal' | 'reverse';
}

const DEG = Math.PI / 180;

function createParams(): OrbitParams {
  const speed = (0.25 + Math.random() * 0.5) * (Math.random() < 0.5 ? 1 : -1);
  const phaseOffset = Math.random() * Math.PI * 2;
  const absSpeed = Math.abs(speed);
  const duration = (2 * Math.PI) / absSpeed;
  const isReverse = speed < 0;

  const delay = isReverse
    ? -(duration * (1 - phaseOffset / (2 * Math.PI)))
    : -(duration * (phaseOffset / (2 * Math.PI)));

  return {
    radius: 65 + Math.random() * 55,
    inclination: (Math.random() - 0.5) * (Math.PI / 1.5),
    orbitDuration: duration,
    phaseDelay: delay,
    direction: isReverse ? 'reverse' : 'normal',
  };
}

export function useOrbitalAnimation(count: number) {
  const [phase, setPhase] = useState<'orbiting' | 'expanded'>('orbiting');
  const paramsRef = useRef<OrbitParams[]>([]);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const morphRef = useRef<HTMLDivElement | null>(null);
  const [overallMorph, setOverallMorph] = useState(1);

  useEffect(() => {
    if (paramsRef.current.length !== count) {
      paramsRef.current = Array.from({ length: count }, createParams);
      iconRefs.current = Array.from({ length: count }, () => null);
    }
  }, [count]);

  // Lightweight RAF to read --morph-progress from CSS transition (throttled to ~15fps)
  useEffect(() => {
    const el = morphRef.current;
    if (!el) return;
    let running = true;
    let frame = 0;

    const read = () => {
      if (!running) return;
      frame++;
      if (frame % 4 === 0) {
        const val = parseFloat(getComputedStyle(el).getPropertyValue('--morph-progress'));
        if (!isNaN(val)) setOverallMorph(val);
      }
      requestAnimationFrame(read);
    };

    requestAnimationFrame(read);
    return () => { running = false; };
  }, []);

  const setIconRef = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      iconRefs.current[i] = el;
    },
    [],
  );

  const setMorphRef = useCallback((el: HTMLDivElement | null) => {
    morphRef.current = el;
  }, []);

  const applyParams = useCallback((i: number) => {
    const el = iconRefs.current[i];
    const p = paramsRef.current[i];
    if (!el || !p) return;
    el.style.setProperty('--radius', String(p.radius));
    el.style.setProperty('--inclination', String(p.inclination));
    el.style.setProperty('--orbit-duration', `${p.orbitDuration}s`);
    el.style.setProperty('--phase-delay', String(p.phaseDelay));
    el.style.setProperty('--direction', p.direction);
  }, []);

  const orbitalPositionAtAngle = useCallback((i: number, angleDeg: number) => {
    const p = paramsRef.current[i];
    if (!p) return { x: 0, y: 0 };
    const a = angleDeg * DEG;
    return {
      x: p.radius * Math.cos(a),
      y: p.radius * Math.sin(a) * Math.cos(p.inclination),
    };
  }, []);

  const findClosestOrbitAngle = useCallback(
    (i: number, tx: number, ty: number): number => {
      const p = paramsRef.current[i];
      if (!p) return 0;
      let bestAngle = 0;
      let bestDist = Infinity;
      for (let deg = 0; deg < 360; deg++) {
        const a = deg * DEG;
        const x = p.radius * Math.cos(a);
        const y = p.radius * Math.sin(a) * Math.cos(p.inclination);
        const d = (x - tx) ** 2 + (y - ty) ** 2;
        if (d < bestDist) {
          bestDist = d;
          bestAngle = deg;
        }
      }
      return bestAngle;
    },
    [],
  );

  const expand = useCallback(
    (targets: { x: number; y: number }[]) => {
      for (let i = 0; i < count; i++) {
        const el = iconRefs.current[i];
        const t = targets[i];
        if (!el || !t) continue;

        el.classList.remove('orbital-running');
        el.classList.add('orbital-paused');

        const cs = getComputedStyle(el);
        const cx = parseFloat(cs.getPropertyValue('--x'));
        const cy = parseFloat(cs.getPropertyValue('--y'));

        el.style.translate = `${cx || 0}px ${cy || 0}px`;

        requestAnimationFrame(() => {
          el.classList.add('orbital-expand');
          el.style.translate = `${t.x}px ${t.y}px`;
        });
      }

      const morph = morphRef.current;
      if (morph) {
        morph.classList.remove('morph-ring');
        morph.classList.add('morph-star');
      }

      setPhase('expanded');
    },
    [count],
  );

  const collapse = useCallback(() => {
    for (let i = 0; i < count; i++) {
      const el = iconRefs.current[i];
      if (!el) continue;

      const cs = getComputedStyle(el);
      const translateParts = cs.translate.split(' ');
      const curX = parseFloat(translateParts[0] || '0');
      const curY = parseFloat(translateParts[1] || '0');

      const entryAngle = findClosestOrbitAngle(i, curX, curY);
      const entry = orbitalPositionAtAngle(i, entryAngle);

      el.classList.remove('orbital-expand');
      el.classList.add('orbital-collapse');

      const onEnd = () => {
        el.removeEventListener('transitionend', onEnd);
        el.classList.remove('orbital-collapse', 'orbital-paused');

        const p = paramsRef.current[i];
        if (p) {
          const syncDelay = (entryAngle / 360) * p.orbitDuration;
          el.style.setProperty('--phase-delay', String(-syncDelay));
        }

        el.style.removeProperty('translate');
        el.classList.add('orbital-running');
      };

      el.addEventListener('transitionend', onEnd, { once: true });
      el.style.translate = `${entry.x}px ${entry.y}px`;
    }

    const morph = morphRef.current;
    if (morph) {
      morph.classList.remove('morph-star');
      morph.classList.add('morph-ring');
    }

    setPhase('orbiting');
  }, [count, findClosestOrbitAngle, orbitalPositionAtAngle]);

  return {
    phase,
    overallMorph,
    setIconRef,
    setMorphRef,
    applyParams,
    expand,
    collapse,
  };
}
