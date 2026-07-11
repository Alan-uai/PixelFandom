'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type PickerMode = 'date' | 'time' | 'datetime';

interface DateTimeScene3DProps {
  mode: PickerMode;
  selectedValue: string;
}

function SceneContent({ mode, selectedValue: _selectedValue }: DateTimeScene3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const clock = useRef(0);

  const sphereCount = mode === 'time' ? 24 : 31;

  const spherePositions = useMemo(() => {
    return Array.from({ length: sphereCount }, (_, i) => {
      const angle = (i / sphereCount) * Math.PI * 2;
      const radius = 2.2;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle * 2) * 0.15,
        Math.sin(angle) * radius,
      );
    });
  }, [sphereCount]);

  const ringPositions = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => {
      const angle = (i / 48) * Math.PI * 2;
      const radius = 2.6;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle * 3) * 0.08,
        Math.sin(angle) * radius,
      );
    });
  }, []);

  useFrame((state, delta) => {
    clock.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(clock.current * 0.15) * 0.08;
      groupRef.current.rotation.y += delta * 0.12;
      groupRef.current.rotation.z = Math.sin(clock.current * 0.1) * 0.04;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 4]} intensity={1.0} />
      <directionalLight position={[-3, -2, -4]} intensity={0.3} />
      <hemisphereLight args={['#4466ff', '#442244', 0.25]} />

      {spherePositions.map((pos, i) => {
        const hue = (i / sphereCount) * 360;
        const color = new THREE.Color(`hsl(${hue}, 80%, 60%)`);
        return (
          <mesh key={i} position={pos} scale={0.8}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshPhysicalMaterial
              color={color}
              metalness={0.2}
              roughness={0.3}
              emissive={color}
              emissiveIntensity={0.1}
              transparent
              opacity={0.6}
            />
          </mesh>
        );
      })}

      {ringPositions.map((pos, i) => (
        <mesh key={`ring-${i}`} position={pos}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial
            color={new THREE.Color(`hsl(${(i / ringPositions.length) * 360}, 60%, 50%)`)}
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}

      <mesh ref={ringRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.8, 0.015, 8, 64]} />
        <meshBasicMaterial
          color="#4466ff"
          transparent
          opacity={0.15}
        />
      </mesh>

      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 3]}>
        <torusGeometry args={[2.4, 0.01, 8, 48]} />
        <meshBasicMaterial
          color="#ff4488"
          transparent
          opacity={0.1}
        />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshPhysicalMaterial
          color={new THREE.Color(`hsl(198, 100%, 65%)`)}
          metalness={0.4}
          roughness={0.2}
          emissive={new THREE.Color(`hsl(198, 100%, 65%)`)}
          emissiveIntensity={0.06}
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  );
}

export function DateTimeScene3D(props: DateTimeScene3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
}
