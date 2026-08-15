'use client'

/* eslint-disable react/no-unknown-property -- R3F intrinsic elements
   (<mesh>, <meshPhysicalMaterial>, etc.) use Three.js props that this rule
   does not recognise. Other R3F components in the repo use the same pattern. */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Canvas,
  useFrame,
} from '@react-three/fiber'
import * as THREE from 'three'
import {
  MeshDistortMaterial,
  Environment,
  Lightformer,
} from '@react-three/drei'
import { audioLevels } from '@/lib/voice/audioLevels'

export type OrbVisualStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'error'

type FerrofluidOrbProps = {
  className?: string
  /** Base status owned by the parent (connection lifecycle). */
  status: OrbVisualStatus
  /** True while the agent is searching/navigating — arc turns pink + spins. */
  searching?: boolean
  /** Emits the derived live status (speaking/listening…) for the parent UI. */
  onStatusChange?: (status: OrbVisualStatus) => void
}

/* ===========================================================================
   Ferrofluid Voice Agent — Next.js + TypeScript (Three.js / R3F)
   Implementação baseada em ferrofluid-voice-agent.md:
   - idle    → orb cinza, semi-anel desaparece
   - speaking→ semi-anel azul (∩, abertura p/ baixo) + espinhos magnéticos
   - tool    → rosa/magenta, gira, brilho aumenta, espinhos agressivos
   Adaptado para offline: Environment via Lightformers (sem HDR de rede) e
   halo aditivo (fresnel) no lugar de EffectComposer/Bloom.
   =========================================================================== */

export type FerrofluidState = 'idle' | 'speaking' | 'tool'

function clamp01(value: number) {
  return THREE.MathUtils.clamp(value, 0, 1)
}

function getColor(state: FerrofluidState) {
  if (state === 'tool') return new THREE.Color('#ff2fa8')
  if (state === 'speaking') return new THREE.Color('#008cff')
  return new THREE.Color('#73777d')
}

function getGlowColor(state: FerrofluidState) {
  if (state === 'tool') return new THREE.Color('#ff008c')
  if (state === 'speaking') return new THREE.Color('#008cff')
  return new THREE.Color('#4e545a')
}

/**
 * Curva em formato ∩ (abertura para baixo).
 */
class FerrofluidArcCurve extends THREE.Curve<THREE.Vector3> {
  radius: number
  constructor(radius: number) {
    super()
    this.radius = radius
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const angle = Math.PI * t
    const x = Math.cos(angle) * this.radius
    const y = Math.sin(angle) * this.radius
    target.set(x, y, 0)
    return target
  }
}

interface Spike {
  angle: number
  baseHeight: number
  width: number
  phase: number
  frequencyIndex: number
}

function FerrofluidArc({
  radius,
  state,
  audioLevel,
}: {
  radius: number
  state: FerrofluidState
  audioLevel: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const curve = useMemo(() => new FerrofluidArcCurve(radius), [radius])
  const geometry = useMemo(
    () =>
      new THREE.TubeGeometry(curve, 128, 0.34, 24, false),
    [curve],
  )
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const currentColor = getColor(state)
  const glowColor = getGlowColor(state)

  useFrame((_, delta) => {
    if (!meshRef.current || !materialRef.current) return

    materialRef.current.color.lerp(currentColor, 1 - Math.exp(-delta * 8))
    materialRef.current.emissive.lerp(glowColor, 1 - Math.exp(-delta * 8))
    materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
      materialRef.current.emissiveIntensity,
      state === 'idle' ? 0.08 : 0.45 + audioLevel * 1.3,
      1 - Math.exp(-delta * 8),
    )

    const arcScale =
      state === 'idle'
        ? 0
        : state === 'speaking'
          ? 1 + audioLevel * 0.025
          : 1

    meshRef.current.scale.lerp(
      new THREE.Vector3(arcScale, arcScale, arcScale),
      1 - Math.exp(-delta * 10),
    )
  })

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        ref={materialRef}
        color={currentColor}
        metalness={1}
        roughness={0.16}
        clearcoat={1}
        clearcoatRoughness={0.08}
        emissive={glowColor}
        emissiveIntensity={0.4}
        envMapIntensity={3}
      />
    </mesh>
  )
}

function FerrofluidSpikes({
  radius,
  count,
  state,
  audioLevel,
  frequencyData,
}: {
  radius: number
  count: number
  state: FerrofluidState
  audioLevel: number
  frequencyData: number[]
}) {
  const groupRef = useRef<THREE.Group>(null)
  const spikes = useMemo<Spike[]>(() => {
    return Array.from({ length: count }, (_, index) => {
      const t = index / (count - 1)
      const angle = Math.PI * t
      const centralWeight = Math.sin(angle)
      return {
        angle,
        baseHeight: 0.22 + centralWeight * 0.5 + Math.random() * 0.25,
        width: 0.055 + Math.random() * 0.08,
        phase: Math.random() * Math.PI * 2,
        frequencyIndex: Math.floor(
          t * Math.max(1, frequencyData.length - 1),
        ),
      }
    })
  }, [count, frequencyData.length])

  const spikeRefs = useRef<Array<THREE.Mesh | null>>([])

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return
    const time = clock.getElapsedTime()
    const isActive = state !== 'idle'
    const targetRotation = state === 'tool' ? time * 0.75 : 0

    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      targetRotation,
      state === 'tool' ? 3 : 5,
      delta,
    )

    spikes.forEach((spike, index) => {
      const mesh = spikeRefs.current[index]
      if (!mesh) return

      const frequency = frequencyData[spike.frequencyIndex] ?? 0
      const localAudio = Math.max(audioLevel, frequency)
      const wave = Math.sin(time * 5 + spike.phase) * 0.08
      const targetHeight = isActive
        ? spike.baseHeight + localAudio * 2.5 + wave * localAudio
        : 0.05

      mesh.scale.y = THREE.MathUtils.damp(
        mesh.scale.y,
        Math.max(0.08, targetHeight),
        12,
        delta,
      )

      const targetOpacity = state === 'idle' ? 0 : 0.55 + localAudio * 0.45
      const material = mesh.material as THREE.MeshPhysicalMaterial
      material.opacity = THREE.MathUtils.damp(
        material.opacity,
        targetOpacity,
        10,
        delta,
      )
      material.transparent = true

      const targetColor = getColor(state)
      material.color.lerp(targetColor, 1 - Math.exp(-delta * 8))
      material.emissive.lerp(targetColor, 1 - Math.exp(-delta * 8))
      material.emissiveIntensity =
        state === 'tool'
          ? 1.1 + localAudio * 1.8
          : 0.45 + localAudio * 1.5
    })
  })

  return (
    <group ref={groupRef}>
      {spikes.map((spike, index) => {
        const x = Math.cos(spike.angle) * radius
        const y = Math.sin(spike.angle) * radius
        const position = new THREE.Vector3(x, y, 0)
        const direction = new THREE.Vector3(
          Math.cos(spike.angle),
          Math.sin(spike.angle),
          0,
        ).normalize()
        const quaternion = new THREE.Quaternion()
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)

        return (
          <mesh
            key={index}
            ref={(node) => {
              spikeRefs.current[index] = node
            }}
            position={position}
            quaternion={quaternion}
            castShadow
          >
            <coneGeometry args={[spike.width, spike.baseHeight, 10, 1]} />
            <meshPhysicalMaterial
              color={getColor(state)}
              metalness={1}
              roughness={0.12}
              clearcoat={1}
              emissive={getGlowColor(state)}
              emissiveIntensity={0.8}
              transparent
              opacity={state === 'idle' ? 0 : 0.8}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function FerrofluidDroplets({
  radius,
  state,
}: {
  radius: number
  state: FerrofluidState
}) {
  const groupRef = useRef<THREE.Group>(null)
  const droplets = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => {
        const t = index / 29
        const angle = Math.PI * t
        const offset = 0.35 + Math.random() * 0.35
        return {
          angle,
          offset,
          size: 0.025 + Math.random() * 0.07,
          speed: 0.3 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2,
        }
      }),
    [],
  )

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return
    const time = clock.getElapsedTime()
    groupRef.current.children.forEach((child, index) => {
      const droplet = droplets[index]
      if (!droplet) return
      const active = state !== 'idle'
      const pulse = active
        ? 1 + Math.sin(time * droplet.speed + droplet.phase) * 0.25
        : 0
      const targetScale = active ? pulse : 0
      child.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        1 - Math.exp(-delta * 7),
      )
    })
  })

  return (
    <group ref={groupRef}>
      {droplets.map((droplet, index) => {
        const x = Math.cos(droplet.angle) * (radius + droplet.offset)
        const y = Math.sin(droplet.angle) * (radius + droplet.offset)
        const z = Math.sin(index * 13.7) * 0.35
        return (
          <mesh key={index} position={[x, y, z]} scale={0}>
            <sphereGeometry args={[droplet.size, 12, 12]} />
            <meshPhysicalMaterial
              color={getColor(state)}
              metalness={1}
              roughness={0.08}
              clearcoat={1}
              emissive={getGlowColor(state)}
              emissiveIntensity={1}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function FerrofluidOrbShape({
  state,
  audioLevel,
}: {
  state: FerrofluidState
  audioLevel: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)

  useFrame(({ clock }, delta) => {
    if (!meshRef.current) return
    const active = state === 'idle'
    const targetScale = active ? 1 + audioLevel * 0.04 : 0
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      1 - Math.exp(-delta * 5),
    )
    meshRef.current.rotation.y += delta * 0.25
    meshRef.current.rotation.x =
      Math.sin(clock.getElapsedTime() * 0.4) * 0.1

    if (materialRef.current) {
      materialRef.current.distort = THREE.MathUtils.damp(
        materialRef.current.distort,
        active ? 0.28 + audioLevel * 0.08 : 0,
        5,
        delta,
      )
    }
  })

  return (
    <mesh ref={meshRef} scale={0}>
      <icosahedronGeometry args={[1.05, 6]} />
      <MeshDistortMaterial
        ref={materialRef}
        color="#73777d"
        metalness={1}
        roughness={0.17}
        clearcoat={1}
        clearcoatRoughness={0.08}
        envMapIntensity={3}
        distort={0.3}
        speed={1.5}
      />
    </mesh>
  )
}

/* ---------------------------------------------------------------------------
   Halo aditivo (fresnel) — substitui o EffectComposer/Bloom (indisponível).
   O brilho cresce em speaking/tool conforme o áudio.
   --------------------------------------------------------------------------- */
const GLOW_VERTEX = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vViewDir;
void main(){
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

const GLOW_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uStrength;
uniform float uVolume;
varying vec3 vNormalW;
varying vec3 vViewDir;
void main(){
  float fres = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir))), 2.4);
  float a = fres * uStrength * (0.3 + uVolume * 1.6);
  vec3 c = uColor * fres * uStrength * (0.5 + uVolume * 1.3);
  gl_FragColor = vec4(c, a);
}
`

function FerrofluidGlow({
  state,
  audioLevel,
}: {
  state: FerrofluidState
  audioLevel: number
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const color = getGlowColor(state)

  useFrame((_, delta) => {
    if (!matRef.current) return
    matRef.current.uniforms.uColor.value.lerp(color, 1 - Math.exp(-delta * 6))
    matRef.current.uniforms.uVolume.value = THREE.MathUtils.damp(
      matRef.current.uniforms.uVolume.value,
      audioLevel,
      11,
      delta,
    )
    const target =
      state === 'tool' ? 1.1 : state === 'speaking' ? 0.65 : 0.3
    matRef.current.uniforms.uStrength.value = THREE.MathUtils.damp(
      matRef.current.uniforms.uStrength.value,
      target,
      6,
      delta,
    )
  })

  return (
    <mesh>
      <sphereGeometry args={[3.6, 48, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={GLOW_VERTEX}
        fragmentShader={GLOW_FRAGMENT}
        uniforms={{
          uColor: { value: new THREE.Color(color) },
          uStrength: { value: 0.3 },
          uVolume: { value: 0 },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  )
}

function FerrofluidCore({
  state,
  audioLevel,
  frequencyData,
  radius,
  spikeCount,
  particles,
}: {
  state: FerrofluidState
  audioLevel: number
  frequencyData: number[]
  radius: number
  spikeCount: number
  particles: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const targetY =
      state === 'speaking'
        ? Math.sin(performance.now() * 0.0015) * 0.025
        : 0
    groupRef.current.position.y = THREE.MathUtils.damp(
      groupRef.current.position.y,
      targetY,
      4,
      delta,
    )
  })

  return (
    <group ref={groupRef}>
      <FerrofluidArc radius={radius} state={state} audioLevel={audioLevel} />
      <FerrofluidSpikes
        radius={radius}
        count={spikeCount}
        state={state}
        audioLevel={audioLevel}
        frequencyData={frequencyData}
      />
      {particles && <FerrofluidDroplets radius={radius} state={state} />}
      <FerrofluidOrbShape state={state} audioLevel={audioLevel} />
    </group>
  )
}

/* ---------------------------------------------------------------------------
   Coleta de áudio real (audioLevels) → audioLevel + frequencyData por frame.
   --------------------------------------------------------------------------- */
function generateFrequencyData(level: number): number[] {
  return Array.from({ length: 64 }, (_, index) => {
    const position = index / 64
    const bass = Math.max(0, 1 - position * 2)
    const wave =
      Math.sin(position * Math.PI * 8 + performance.now() * 0.004) * 0.5 + 0.5
    return level * (bass * 0.65 + wave * 0.35)
  })
}

function AudioSampler({
  onFrame,
}: {
  onFrame: (audioLevel: number, frequencyData: number[]) => void
}) {
  useFrame(() => {
    const lv = audioLevels.sample()
    const audioLevel = clamp01(lv.volume * 4.5)
    onFrame(audioLevel, generateFrequencyData(audioLevel))
  })
  return null
}

function Scene({
  state,
  audioLevel,
  frequencyData,
  radius,
  spikeCount,
  particles,
}: {
  state: FerrofluidState
  audioLevel: number
  frequencyData: number[]
  radius: number
  spikeCount: number
  particles: boolean
}) {
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[3, 5, 6]} intensity={3} />
      <pointLight
        position={[0, 1, 3]}
        intensity={state === 'tool' ? 8 : state === 'speaking' ? 5 : 1}
        color={
          state === 'tool'
            ? '#ff008c'
            : state === 'speaking'
              ? '#008cff'
              : '#73777d'
        }
      />

      <FerrofluidCore
        state={state}
        audioLevel={audioLevel}
        frequencyData={frequencyData}
        radius={radius}
        spikeCount={spikeCount}
        particles={particles}
      />

      <FerrofluidGlow state={state} audioLevel={audioLevel} />

      <Environment resolution={256} frames={1}>
        <Lightformer
          intensity={2.2}
          position={[0, 3, 4]}
          scale={[8, 8, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={1.4}
          position={[-4, 1, 2]}
          scale={[4, 4, 1]}
          color="#9fd8ff"
        />
        <Lightformer
          intensity={1.2}
          position={[4, -1, 2]}
          scale={[4, 4, 1]}
          color="#ffb3e6"
        />
      </Environment>
    </>
  )
}

function FerrofluidVoiceAgent({
  state,
  radius = 2.35,
  spikeCount = 48,
  particles = true,
}: {
  state: FerrofluidState
  radius?: number
  spikeCount?: number
  particles?: boolean
}) {
  const [audioLevel, setAudioLevel] = useState(0)
  const [frequencyData, setFrequencyData] = useState<number[]>([])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 420,
        position: 'relative',
      }}
    >
      <Canvas
        camera={{ position: [0, 0.3, 7], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        <AudioSampler
          onFrame={(al, fd) => {
            setAudioLevel(al)
            setFrequencyData(fd)
          }}
        />
        <Scene
          state={state}
          audioLevel={audioLevel}
          frequencyData={frequencyData}
          radius={radius}
          spikeCount={spikeCount}
          particles={particles}
        />
      </Canvas>
    </div>
  )
}

/* ===========================================================================
   Boundary / fallback (mantém robustez do componente anterior).
   =========================================================================== */
class WebGLBoundary extends React.Component<
  { fallback: React.ReactNode; children?: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

function OrbFallback() {
  return (
    <div
      className="absolute inset-0 rounded-full"
      style={{
        background:
          'radial-gradient(circle at 30% 30%, rgba(120,200,255,0.35), rgba(20,40,70,0.6) 60%, rgba(5,10,20,0.9) 100%)',
      }}
    />
  )
}

/* ===========================================================================
   Componente público — mantém a API consumida por floating-voice-orb.tsx.
   =========================================================================== */
export default function FerrofluidOrb({
  className,
  status,
  searching = false,
  onStatusChange,
}: FerrofluidOrbProps) {
  const statusRef = useRef<OrbVisualStatus>(status)
  useEffect(() => {
    statusRef.current = status
  }, [status])

  const onStatusChangeRef = useRef(onStatusChange)
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange
  }, [onStatusChange])

  // Deriva speaking/listening a partir dos taps de áudio (igual ao anterior).
  useEffect(() => {
    if (!onStatusChange) return
    let last: OrbVisualStatus = status
    const id = setInterval(() => {
      const s = audioLevels.sample()
      const base = statusRef.current
      let next: OrbVisualStatus = base
      if (base !== 'error' && base !== 'connecting') {
        if (s.outputActivity > 0.28) next = 'speaking'
        else if (s.inputActivity > 0.2) next = 'listening'
        else if (base === 'idle') next = 'idle'
        else if (base === 'connected' || base === 'listening') next = 'connected'
        else next = s.live ? 'listening' : 'connected'
      }
      if (next !== last) {
        last = next
        onStatusChangeRef.current?.(next)
      }
    }, 160)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onStatusChange])

  const docState: FerrofluidState =
    searching
      ? 'tool'
      : status === 'idle' || status === 'error'
        ? 'idle'
        : 'speaking'

  return (
    <div className={className}>
      <WebGLBoundary fallback={<OrbFallback />}>
        <FerrofluidVoiceAgent state={docState} />
      </WebGLBoundary>
    </div>
  )
}
