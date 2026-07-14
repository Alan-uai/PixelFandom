'use client';

import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

type PickerMode = 'date' | 'time' | 'datetime';

interface DateTimeScene3DProps {
  mode: PickerMode;
  value: string;
  onTimeChange?: (time: string) => void;
  onDateSelect?: (date: Date) => void;
  displayMonth?: Date;
  onMonthChange?: (date: Date) => void;
}

/* ─────────────── TIME: 3D Clock Face ─────────────── */

function parseTime(v: string): { h: number; m: number } {
  if (!v) return { h: 0, m: 0 };
  const [hh, mm] = v.split(':').map(Number);
  return { h: isNaN(hh) ? 0 : hh, m: isNaN(mm) ? 0 : mm };
}

function ClockFace({ value, onTimeChange }: { value: string; onTimeChange?: (t: string) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<{ type: 'h' | 'm'; idx: number } | null>(null);
  const drag = useRef({ active: false, prevX: 0, velocity: 0, moved: false });
  const pulse = useRef(0);

  const { h, m } = parseTime(value);
  const selH12 = h % 12;
  const selM = m;

  const hourPos = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return new THREE.Vector3(Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0);
      }),
    [],
  );

  const minPos = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return new THREE.Vector3(Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0);
      }),
    [],
  );

  const handleDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    drag.current = { active: true, prevX: e.clientX, velocity: 0, moved: false };
  }, []);

  const handleMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!drag.current.active || !groupRef.current) return;
    const dx = e.clientX - drag.current.prevX;
    if (Math.abs(dx) > 2) drag.current.moved = true;
    groupRef.current.rotation.y += dx * 0.008;
    drag.current.velocity = dx * 0.008;
    drag.current.prevX = e.clientX;
  }, []);

  const handleUp = useCallback(() => {
    drag.current.active = false;
  }, []);

  const pickHour = useCallback(
    (hour12: number) => {
      if (drag.current.moved) return;
      const isPM = h >= 12;
      const newH = hour12 === 12 ? (isPM ? 12 : 0) : isPM ? hour12 + 12 : hour12;
      onTimeChange?.(`${String(newH).padStart(2, '0')}:${String(selM).padStart(2, '0')}`);
    },
    [onTimeChange, h, selM],
  );

  const pickMin = useCallback(
    (group: number) => {
      if (drag.current.moved) return;
      onTimeChange?.(`${String(h).padStart(2, '0')}:${String(group * 5).padStart(2, '0')}`);
    },
    [onTimeChange, h],
  );

  useFrame((_, delta) => {
    pulse.current += delta;
    if (!drag.current.active && groupRef.current) {
      groupRef.current.rotation.y += drag.current.velocity * delta * 6;
      drag.current.velocity *= 0.92;
      if (Math.abs(drag.current.velocity) < 0.001) drag.current.velocity = 0;
    }
  });

  const handAngle = (selH12 / 12) * Math.PI * 2 - Math.PI / 2;

  return (
    <group
      ref={groupRef}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} />
      <directionalLight position={[-3, -2, -4]} intensity={0.4} />
      <hemisphereLight args={['#6688ff', '#442244', 0.3]} />

      {minPos.map((pos, i) => {
        const mVal = i * 5;
        const dist = Math.min(Math.abs(selM - mVal), Math.abs(selM - mVal - 60), Math.abs(selM - mVal + 60));
        const nearest = dist <= 2;
        const isHov = hovered?.type === 'm' && hovered.idx === i;
        const hue = (i / 12) * 360 + 120;
        const c = new THREE.Color(`hsl(${hue}, 65%, ${nearest ? 60 : 40}%)`);
        return (
          <mesh
            key={`m${i}`}
            position={pos}
            scale={nearest ? 1.6 : isHov ? 1.3 : 0.65}
            onClick={() => pickMin(i)}
            onPointerEnter={() => setHovered({ type: 'm', idx: i })}
            onPointerLeave={() => setHovered(null)}
          >
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshPhysicalMaterial
              color={c}
              metalness={0.1}
              roughness={0.3}
              emissive={c}
              emissiveIntensity={nearest ? 0.35 : 0.04}
              transparent
              opacity={nearest ? 0.95 : 0.3}
            />
          </mesh>
        );
      })}

      {hourPos.map((pos, i) => {
        const hourNum = i === 0 ? 12 : i;
        const isSel = selH12 === i;
        const isHov = hovered?.type === 'h' && hovered.idx === i;
        const hue = (i / 12) * 360;
        const c = new THREE.Color(`hsl(${hue}, 80%, ${isSel ? 68 : isHov ? 58 : 48}%)`);
        return (
          <group key={`h${i}`}>
            <mesh
              position={pos}
              scale={isSel ? 1.5 : isHov ? 1.25 : 0.85}
              onClick={() => pickHour(hourNum)}
              onPointerEnter={() => setHovered({ type: 'h', idx: i })}
              onPointerLeave={() => setHovered(null)}
            >
              <sphereGeometry args={[0.22, 32, 32]} />
              <meshPhysicalMaterial
                color={c}
                metalness={0.15}
                roughness={0.25}
                emissive={c}
                emissiveIntensity={isSel ? 0.5 : isHov ? 0.2 : 0.06}
                transparent
                opacity={isSel ? 1 : 0.6}
              />
              {isSel && (
                <mesh>
                  <sphereGeometry args={[0.34, 16, 16]} />
                  <meshBasicMaterial
                    color={c}
                    transparent
                    opacity={0.14}
                    depthWrite={false}
                  />
                </mesh>
              )}
            </mesh>

          </group>
        );
      })}

      {selH12 >= 0 && (
        <group rotation={[0, 0, handAngle]}>
          <mesh position={[0.95, 0, 0]}>
            <boxGeometry args={[1.9, 0.02, 0.02]} />
            <meshBasicMaterial
              color={new THREE.Color(`hsl(${(selH12 / 12) * 360}, 80%, 65%)`)}
              transparent
              opacity={0.25}
            />
          </mesh>
          <mesh position={[1.9, 0, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial
              color={new THREE.Color(`hsl(${(selH12 / 12) * 360}, 80%, 65%)`)}
              transparent
              opacity={0.4}
            />
          </mesh>
        </group>
      )}

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshPhysicalMaterial
          color={new THREE.Color('#4BC5FF')}
          metalness={0.3}
          roughness={0.15}
          emissive={new THREE.Color('#4BC5FF')}
          emissiveIntensity={0.12}
        />
      </mesh>
    </group>
  );
}

/* ─────────────── DATE: 3D Calendar Ring ─────────────── */

function CalendarRing({
  value,
  onDateSelect,
  displayMonth,
  onMonthChange,
}: {
  value: string;
  onDateSelect?: (date: Date) => void;
  displayMonth?: Date;
  onMonthChange?: (date: Date) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const drag = useRef({ active: false, prevX: 0, velocity: 0, moved: false });
  const pulse = useRef(0);

  let valMonth = new Date().getMonth();
  let valDay: number | null = null;
  let valYear = new Date().getFullYear();
  if (value) {
    const cleaned = value.split('T')[0];
    const parts = cleaned.split('-');
    if (parts.length >= 3) {
      valYear = parseInt(parts[0]) || valYear;
      valMonth = (parseInt(parts[1]) || valMonth + 1) - 1;
      valDay = parseInt(parts[2]) || null;
    }
  }

  const currentMonth = displayMonth?.getMonth() ?? valMonth;
  const currentYear = displayMonth?.getFullYear() ?? valYear;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthPositions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return new THREE.Vector3(Math.cos(a) * 2.1, Math.sin(a) * 2.1, 0);
      }),
    [],
  );

  const dayPositions = useMemo(
    () =>
      Array.from({ length: daysInMonth }, (_, i) => {
        const a = (i / daysInMonth) * Math.PI * 2 - Math.PI / 2;
        return new THREE.Vector3(Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0);
      }),
    [daysInMonth],
  );

  const handleDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    drag.current = { active: true, prevX: e.clientX, velocity: 0, moved: false };
  }, []);

  const handleMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!drag.current.active || !groupRef.current) return;
    const dx = e.clientX - drag.current.prevX;
    if (Math.abs(dx) > 2) drag.current.moved = true;
    groupRef.current.rotation.y += dx * 0.008;
    drag.current.velocity = dx * 0.008;
    drag.current.prevX = e.clientX;
  }, []);

  const handleUp = useCallback(() => {
    drag.current.active = false;
  }, []);

  const pickMonth = useCallback(
    (m: number) => {
      if (drag.current.moved) return;
      onMonthChange?.(new Date(currentYear, m));
    },
    [onMonthChange, currentYear],
  );

  const pickDay = useCallback(
    (d: number) => {
      if (drag.current.moved) return;
      onDateSelect?.(new Date(currentYear, currentMonth, d));
    },
    [onDateSelect, currentYear, currentMonth],
  );

  useFrame((_, delta) => {
    pulse.current += delta;
    if (!drag.current.active && groupRef.current) {
      groupRef.current.rotation.y += drag.current.velocity * delta * 6;
      drag.current.velocity *= 0.92;
      if (Math.abs(drag.current.velocity) < 0.001) drag.current.velocity = 0;
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} />
      <directionalLight position={[-3, -2, -4]} intensity={0.4} />
      <hemisphereLight args={['#6688ff', '#442244', 0.3]} />

      {monthPositions.map((pos, i) => {
        const isSel = currentMonth === i;
        const isHov = hoveredMonth === i;
        const hue = (i * 30 + 180) % 360;
        const c = new THREE.Color(
          `hsl(${hue}, ${isSel ? 85 : 60}%, ${isSel ? 65 : isHov ? 55 : 42}%)`,
        );
        return (
          <group key={`mo${i}`}>
            <mesh
              position={pos}
              scale={isSel ? 1.4 : isHov ? 1.2 : 0.85}
              onClick={() => pickMonth(i)}
              onPointerEnter={() => setHoveredMonth(i)}
              onPointerLeave={() => setHoveredMonth(null)}
            >
              <sphereGeometry args={[0.22, 24, 24]} />
              <meshPhysicalMaterial
                color={c}
                metalness={0.2}
                roughness={0.25}
                emissive={c}
                emissiveIntensity={isSel ? 0.4 : isHov ? 0.15 : 0.04}
                transparent
                opacity={isSel ? 1 : isHov ? 0.75 : 0.5}
              />
              {isSel && (
                <mesh>
                  <sphereGeometry args={[0.32, 16, 16]} />
                  <meshBasicMaterial
                    color={c}
                    transparent
                    opacity={0.12}
                    depthWrite={false}
                  />
                </mesh>
              )}
            </mesh>

          </group>
        );
      })}

      {dayPositions.map((pos, i) => {
        const d = i + 1;
        const isSel = valDay === d && currentMonth === valMonth;
        const isHov = hoveredDay === i;
        const c = new THREE.Color(
          isSel
            ? '#4BC5FF'
            : `hsl(${210 + (i / daysInMonth) * 60}, 55%, ${isHov ? 55 : 38}%)`,
        );
        return (
          <mesh
            key={`d${i}`}
            position={pos}
            scale={isSel ? 1.7 : isHov ? 1.3 : 0.65}
            onClick={() => pickDay(d)}
            onPointerEnter={() => setHoveredDay(i)}
            onPointerLeave={() => setHoveredDay(null)}
          >
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshPhysicalMaterial
              color={c}
              metalness={0.1}
              roughness={0.3}
              emissive={c}
              emissiveIntensity={isSel ? 0.4 : 0.04}
              transparent
              opacity={isSel ? 0.95 : 0.35}
            />
          </mesh>
        );
      })}

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshPhysicalMaterial
          color={new THREE.Color('#4BC5FF')}
          metalness={0.3}
          roughness={0.15}
          emissive={new THREE.Color('#4BC5FF')}
          emissiveIntensity={0.08}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

/* ─────────────── SCENE DISPATCH ─────────────── */

function SceneContent(props: DateTimeScene3DProps) {
  if (props.mode === 'time') {
    return <ClockFace value={props.value} onTimeChange={props.onTimeChange} />;
  }
  return (
    <CalendarRing
      value={props.value}
      onDateSelect={props.onDateSelect}
      displayMonth={props.displayMonth}
      onMonthChange={props.onMonthChange}
    />
  );
}

export function DateTimeScene3D(props: DateTimeScene3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 40 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
