'use client';

import { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { hexToHue, hueToHex } from '@/lib/color';

const NUM_SPHERES = 24;
const RING_RADIUS = 1.8;
const SPHERE_RADIUS = 0.2;
const CENTER_RADIUS = 0.4;

interface ColorPickerSceneProps {
  value?: string;
  onChange: (color: string) => void;
}

function ColorRing({ value, onChange }: ColorPickerSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const centerRef = useRef<THREE.Mesh>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const dragState = useRef({ active: false, prevX: 0, velocity: 0, moved: false });
  const clock = useRef(0);

  const selectedHue = value ? hexToHue(value) : -1;

  const colorHues = useMemo(
    () => Array.from({ length: NUM_SPHERES }, (_, i) => Math.round((i / NUM_SPHERES) * 360)),
    []
  );

  const spherePositions = useMemo(() => {
    return Array.from({ length: NUM_SPHERES }, (_, i) => {
      const angle = (i / NUM_SPHERES) * Math.PI * 2;
      return new THREE.Vector3(
        Math.cos(angle) * RING_RADIUS,
        (Math.sin(i * 3) * 0.05),
        Math.sin(angle) * RING_RADIUS
      );
    });
  }, []);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    dragState.current.active = true;
    dragState.current.prevX = e.clientX;
    dragState.current.moved = false;
  }, []);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (dragState.current.active && groupRef.current) {
      const dx = e.clientX - dragState.current.prevX;
      if (Math.abs(dx) > 2) dragState.current.moved = true;
      groupRef.current.rotation.y += dx * 0.008;
      dragState.current.velocity = dx * 0.008;
      dragState.current.prevX = e.clientX;
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    dragState.current.active = false;
  }, []);

  const handleSphereClick = useCallback((hue: number) => {
    if (dragState.current.moved) return;
    onChange(hueToHex(hue, 75, 58));
    setSelectedIdx(colorHues.indexOf(hue));
  }, [onChange, colorHues]);

  useFrame((state, delta) => {
    clock.current += delta;
    if (!dragState.current.active && groupRef.current) {
      groupRef.current.rotation.y += dragState.current.velocity * delta * 6;
      dragState.current.velocity *= 0.92;
      if (Math.abs(dragState.current.velocity) < 0.001) dragState.current.velocity = 0;
    }
    if (groupRef.current && !dragState.current.active && Math.abs(dragState.current.velocity) < 0.001) {
      groupRef.current.rotation.y += delta * 0.08;
    }
    if (centerRef.current) {
      const pulse = 1 + Math.sin(clock.current * 2) * 0.04;
      centerRef.current.scale.setScalar(pulse);
    }
  });

  const currentColor = value || '#888888';
  const centerColor = new THREE.Color(currentColor);

  return (
    <group
      ref={groupRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {spherePositions.map((pos, i) => {
        const hue = colorHues[i];
        const isHovered = hoveredIdx === i;
        const isSelected = selectedIdx === i || (selectedIdx === null && Math.abs(selectedHue - hue) < 8);
        const baseColor = new THREE.Color(`hsl(${hue}, 75%, ${isHovered ? 68 : 58}%)`);
        const scale = isSelected ? 1.35 : isHovered ? 1.25 : 0.9;

        return (
          <mesh
            key={i}
            position={pos}
            scale={scale}
            onPointerEnter={() => setHoveredIdx(i)}
            onPointerLeave={() => setHoveredIdx(null)}
            onClick={() => handleSphereClick(hue)}
          >
            <sphereGeometry args={[SPHERE_RADIUS, 32, 32]} />
            <meshPhysicalMaterial
              color={baseColor}
              metalness={0.1}
              roughness={0.3}
              emissive={isHovered || isSelected ? baseColor : new THREE.Color(0x000000)}
              emissiveIntensity={isHovered ? 0.2 : isSelected ? 0.15 : 0}
              envMapIntensity={0.6}
            />
            {isSelected && (
              <mesh>
                <sphereGeometry args={[SPHERE_RADIUS * 1.6, 16, 16]} />
                <meshBasicMaterial
                  color={baseColor}
                  transparent
                  opacity={0.12}
                  depthWrite={false}
                />
              </mesh>
            )}
          </mesh>
        );
      })}

      <mesh ref={centerRef} position={[0, 0, 0]}>
        <sphereGeometry args={[CENTER_RADIUS, 48, 48]} />
        <meshPhysicalMaterial
          color={centerColor}
          metalness={0.3}
          roughness={0.2}
          emissive={centerColor}
          emissiveIntensity={0.08}
          envMapIntensity={0.8}
        />
      </mesh>

      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-3, 2, -4]} intensity={0.4} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#8888ff', '#444422', 0.3]} />
    </group>
  );
}

export function ColorPickerScene(props: ColorPickerSceneProps) {
  return <ColorRing {...props} />;
}
