'use client';

import { useRef, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface SwitchSceneProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const TRACK_W = 2.4;
const TRACK_H = 0.9;
const TRACK_D = 0.6;
const KNOB_R = 0.35;
const KNOB_OFF = -0.7;
const KNOB_ON = 0.7;
const KNOB_Z = 0.35;

function Switch3DModel({ checked, onChange, disabled }: SwitchSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const knobRef = useRef<THREE.Mesh>(null);
  const trackMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const knobMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const knobX = useRef(checked ? KNOB_ON : KNOB_OFF);
  const knobTarget = useRef(checked ? KNOB_ON : KNOB_OFF);
  const glowOpacity = useRef(checked ? 0.15 : 0);
  const clock = useRef(0);
  const checkedRef = useRef(checked);

  useEffect(() => {
    checkedRef.current = checked;
    knobTarget.current = checked ? KNOB_ON : KNOB_OFF;
  }, [checked]);

  const colors = useMemo(() => {
    const primary = new THREE.Color('#4BC5FF');
    if (typeof window !== 'undefined') {
      const style = getComputedStyle(document.documentElement);
      const val = style.getPropertyValue('--primary').trim();
      if (val) {
        const parts = val.split(/\s+/);
        if (parts.length === 3) {
          primary.setHSL(parseInt(parts[0]) / 360, parseInt(parts[1]) / 100, parseInt(parts[2]) / 100);
        }
      }
    }
    return { primary, white: new THREE.Color('#ffffff'), dark: new THREE.Color('#333333') };
  }, []);

  useFrame((_, delta) => {
    clock.current += delta;

    knobX.current = lerp(knobX.current, knobTarget.current, Math.min(1, delta * 14));
    if (knobRef.current) {
      knobRef.current.position.x = knobX.current;
    }

    const isChecked = checkedRef.current;
    const targetGlow = isChecked ? 0.3 : 0;
    glowOpacity.current = lerp(glowOpacity.current, targetGlow, Math.min(1, delta * 10));

    if (trackMatRef.current) {
      const t = glowOpacity.current / 0.3;
      trackMatRef.current.color.lerp(
        isChecked ? colors.primary : colors.dark,
        delta * 10,
      );
      trackMatRef.current.emissiveIntensity = t * 0.2;
    }
    if (knobMatRef.current) {
      const pulse = 1 + Math.sin(clock.current * 3) * 0.04 * (isChecked ? 1 : 0);
      knobMatRef.current.emissiveIntensity = glowOpacity.current * pulse;
    }
    if (glowMatRef.current) {
      glowMatRef.current.opacity = glowOpacity.current * 0.5;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.current * 0.25) * 0.06;
      groupRef.current.rotation.x = Math.sin(clock.current * 0.15) * 0.025;
    }
  });

  const handleClick = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (disabled) return;
      e.stopPropagation();
      onChange(!checked);
    },
    [disabled, checked, onChange],
  );

  return (
    <group ref={groupRef}>
      <group onPointerDown={handleClick}>
        {/* Track pill */}
        <RoundedBox args={[TRACK_W, TRACK_H, TRACK_D]} radius={0.3} bevelSegments={4}>
          <meshPhysicalMaterial
            ref={trackMatRef}
            color={colors.dark}
            metalness={0.15}
            roughness={0.45}
            emissive={colors.primary}
            emissiveIntensity={0}
          />
        </RoundedBox>

        {/* Glow aura behind knob */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[TRACK_W * 1.2, TRACK_H * 1.2]} />
          <meshBasicMaterial
            ref={glowMatRef}
            color={colors.primary}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>

        {/* Knob sphere */}
        <mesh ref={knobRef} position={[KNOB_OFF, 0, KNOB_Z]}>
          <sphereGeometry args={[KNOB_R, 32, 32]} />
          <meshPhysicalMaterial
            ref={knobMatRef}
            color={colors.white}
            metalness={0.1}
            roughness={0.2}
            emissive={colors.primary}
            emissiveIntensity={0}
            envMapIntensity={0.4}
          />
        </mesh>
      </group>
    </group>
  );
}

export function SwitchScene(props: SwitchSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 2.6], fov: 28 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 3]} intensity={1.0} />
      <directionalLight position={[-2, 1, -3]} intensity={0.35} />
      <hemisphereLight args={['#8888ff', '#444422', 0.2]} />
      <Switch3DModel {...props} />
    </Canvas>
  );
}
