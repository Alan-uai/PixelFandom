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

type IconPhase = 'orbiting' | 'approaching-expand' | 'collided' | 'approaching-collapse';

interface IconTransitionState {
  phase: IconPhase;
  collisionAngle: number;
  entryAngle: number;
  triggerElapsed: number;
  collisionTime: number;
  bounceElapsed: number;
}

const TRANSITION_DURATION = 0.3;
const BOUNCE_FREQ = 22;
const BOUNCE_DECAY = 10;
const BOUNCE_AMP = 5;
const DEG2RAD = Math.PI / 180;

function findClosestOrbitAngle(R: number, inc: number, tx: number, ty: number): number {
  let bestAngle = 0;
  let bestDist = Infinity;
  for (let deg = 0; deg < 360; deg++) {
    const a = deg * DEG2RAD;
    const x = R * Math.cos(a);
    const y = R * Math.sin(a) * Math.cos(inc);
    const d = (x - tx) ** 2 + (y - ty) ** 2;
    if (d < bestDist) {
      bestDist = d;
      bestAngle = a;
    }
  }

  const sinInc2 = Math.sin(inc) ** 2;
  let theta = bestAngle;
  for (let iter = 0; iter < 2; iter++) {
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const g = tx * sinT - ty * Math.cos(inc) * cosT - R * sinT * cosT * sinInc2;
    const gp = tx * cosT + ty * Math.cos(inc) * sinT - R * Math.cos(2 * theta) * sinInc2;
    if (Math.abs(gp) < 1e-12) break;
    theta -= g / gp;
  }

  return theta;
}

function angularDistance(from: number, to: number, speed: number): number {
  let d = to - from;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  if (speed >= 0 && d < 0) d += 2 * Math.PI;
  if (speed < 0 && d > 0) d -= 2 * Math.PI;
  return d;
}

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

  const horizontalTargets = useRef<{ x: number; y: number }[]>([]);
  const rafElapsed = useRef(0);

  const iconStates = useRef<IconTransitionState[]>([]);
  const [overallMorph, setOverallMorph] = useState(1);

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
    iconStates.current = Array.from({ length: count }, () => ({
      phase: 'orbiting' as IconPhase,
      collisionAngle: 0,
      entryAngle: 0,
      triggerElapsed: 0,
      collisionTime: 0,
      bounceElapsed: 0,
    }));
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
      rafElapsed.current = elapsed;

      speedMult.current += (targetSpeedMult.current - speedMult.current) * 0.04;
      radiusMult.current += (targetRadiusMult.current - radiusMult.current) * 0.04;

      const skip = trailFrameSkip.current;
      let totalMorph = 0;
      let hasCollided = false;
      let allCollided = true;

      for (let i = 0; i < count; i++) {
        const el = iconRefs.current[i];
        if (!el) continue;
        const p = params[i];
        const st = iconStates.current[i];
        const currentRadius = p.radius * radiusMult.current;
        const currentSpeed = p.speed * speedMult.current;
        const angle = p.phaseOffset + currentSpeed * elapsed;

        const orbitX = currentRadius * Math.cos(angle);
        const orbitY = currentRadius * Math.sin(angle) * Math.cos(p.inclination);

        const hTarget = horizontalTargets.current[i];
        const hx = hTarget?.x ?? 0;
        const hy = hTarget?.y ?? 0;

        let iconMorph: number;
        let fx: number;
        let fy: number;

        switch (st.phase) {
          case 'orbiting': {
            iconMorph = 1;
            fx = orbitX;
            fy = orbitY;
            allCollided = false;
            break;
          }

          case 'approaching-expand': {
            const t = elapsed - st.triggerElapsed;
            const remaining = st.collisionTime - t;

            if (remaining > TRANSITION_DURATION) {
              iconMorph = 1;
              allCollided = false;
            } else if (remaining > 0) {
              const raw = remaining / TRANSITION_DURATION;
              iconMorph = raw * raw;
              allCollided = false;
            } else {
              st.phase = 'collided';
              st.bounceElapsed = elapsed;
              iconMorph = 0;
              hasCollided = true;
            }

            const orbWeight = Math.pow(iconMorph, 0.2);
            const hWeight = Math.pow(1 - iconMorph, 2);
            fx = orbitX * orbWeight + hx * hWeight;
            fy = orbitY * orbWeight + hy * hWeight;
            break;
          }

          case 'collided': {
            iconMorph = 0;
            const bt = elapsed - st.bounceElapsed;
            if (bt < 0.35) {
              const damping = Math.exp(-BOUNCE_DECAY * bt);
              const osc = Math.cos(BOUNCE_FREQ * bt);
              const bx = -BOUNCE_AMP * osc * damping;
              const dist = Math.sqrt(hx * hx + hy * hy) || 1;
              fx = hx + (hx / dist) * bx;
              fy = hy + (hy / dist) * bx;
            } else {
              fx = hx;
              fy = hy;
            }
            break;
          }

          case 'approaching-collapse': {
            const t = elapsed - st.triggerElapsed;
            const remaining = st.collisionTime - t;

            if (remaining > TRANSITION_DURATION) {
              iconMorph = 0;
              allCollided = false;
            } else if (remaining > 0) {
              const raw = 1 - remaining / TRANSITION_DURATION;
              iconMorph = raw * raw;
              allCollided = false;
            } else {
              p.phaseOffset = st.entryAngle - currentSpeed * elapsed;
              st.phase = 'orbiting';
              iconMorph = 1;
            }

            const eoX = currentRadius * Math.cos(st.entryAngle + currentSpeed * t);
            const eoY = currentRadius * Math.sin(st.entryAngle + currentSpeed * t) * Math.cos(p.inclination);

            const oWeight = Math.pow(iconMorph, 0.2);
            const eWeight = Math.pow(1 - iconMorph, 2);
            fx = eoX * oWeight + hx * eWeight;
            fy = eoY * oWeight + hy * eWeight;
            break;
          }

          default: {
            iconMorph = 1;
            fx = orbitX;
            fy = orbitY;
            allCollided = false;
          }
        }

        el.style.transform = `translate(${fx}px, ${fy}px)`;
        el.style.zIndex = String(Math.sin(angle) > 0 ? 11 : 15);

        totalMorph += iconMorph;

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

      const newOverall = count > 0 ? totalMorph / count : 1;

      if (skip % 4 === 0) {
        setOverallMorph(newOverall);
      }

      if (hasCollided && allCollided && phaseRef.current === 'orbiting') {
        setPhase('expanded');
      } else if (newOverall > 0.95 && phaseRef.current === 'expanded') {
        setPhase('orbiting');
      }

      if (newOverall < 0.05) {
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
      const currentElapsed = rafElapsed.current;

      for (let i = 0; i < count; i++) {
        const p = paramsRef.current[i];
        const st = iconStates.current[i];
        const hTarget = targets[i];
        if (!p || !hTarget) continue;

        const cAngle = findClosestOrbitAngle(p.radius, p.inclination, hTarget.x, hTarget.y);

        const currentAngle = p.phaseOffset + p.speed * currentElapsed;
        const dAngle = angularDistance(currentAngle, cAngle, p.speed);
        const absSpeed = Math.abs(p.speed);
        const cTime = absSpeed > 0.001 ? Math.abs(dAngle) / absSpeed : 0.3;

        st.collisionAngle = cAngle;
        st.entryAngle = cAngle;
        st.triggerElapsed = currentElapsed;
        st.collisionTime = Math.max(cTime, 0.1);
        st.bounceElapsed = 0;
        st.phase = 'approaching-expand';
      }
    },
    [count],
  );

  const collapse = useCallback(() => {
    expandedRef.current = false;
    const currentElapsed = rafElapsed.current;

    for (let i = 0; i < count; i++) {
      const p = paramsRef.current[i];
      const st = iconStates.current[i];
      const hTarget = horizontalTargets.current[i];
      if (!p || !hTarget) continue;

      const cAngle = findClosestOrbitAngle(p.radius, p.inclination, hTarget.x, hTarget.y);

      const currentAngle = p.phaseOffset + p.speed * currentElapsed;
      const dAngle = angularDistance(currentAngle, cAngle, p.speed);
      const absSpeed = Math.abs(p.speed);
      const cTime = absSpeed > 0.001 ? Math.abs(dAngle) / absSpeed : 0.3;

      st.collisionAngle = cAngle;
      st.entryAngle = cAngle;
      st.triggerElapsed = currentElapsed;
      st.collisionTime = Math.max(cTime, 0.1);
      st.bounceElapsed = 0;
      st.phase = 'approaching-collapse';
    }
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
    overallMorph,
  };
}
