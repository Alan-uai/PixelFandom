# Ferrofluid Voice Agent — Next.js + TypeScript

Implementação completa de um visualizador 3D de ferrofluido reativo para um agente de voz usando Next.js, TypeScript, Three.js e React Three Fiber.

## Conceito

O componente possui três estados:

1. **Idle**
   - O semi-anel desaparece.
   - O ferrofluido se transforma em uma orb.
   - A orb fica cinza/chumbo.
   - A superfície continua levemente orgânica.

2. **Speaking**
   - O ferrofluido aparece como um semi-anel em formato `∩`.
   - A abertura fica para baixo.
   - A cor é azul.
   - Espinhos magnéticos surgem da superfície.
   - Altura e intensidade dos espinhos respondem ao volume e à frequência da voz.

3. **Tool / Search**
   - O semi-anel muda de azul para rosa/magenta.
   - O objeto gira.
   - O brilho aumenta.
   - Os espinhos ficam mais agressivos.
   - Ao terminar a Tool, pode voltar para `speaking` ou `idle`.

---

# 1. Instalação

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
```

Estrutura recomendada:

```text
app/
├── page.tsx
└── globals.css

components/
└── FerrofluidVoiceAgent.tsx
```

---

# 2. `components/FerrofluidVoiceAgent.tsx`

```tsx
"use client";

import * as THREE from "three";
import {
  Canvas,
  useFrame,
} from "@react-three/fiber";
import {
  MeshDistortMaterial,
  Environment,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
} from "@react-three/postprocessing";
import {
  useMemo,
  useRef,
} from "react";

export type FerrofluidState =
  | "idle"
  | "speaking"
  | "tool";

export interface FerrofluidVoiceAgentProps {
  state?: FerrofluidState;

  /**
   * Volume normalizado da voz.
   * 0 = silêncio
   * 1 = volume máximo
   */
  audioLevel?: number;

  /**
   * FFT do áudio.
   * Valores esperados entre 0 e 1.
   */
  frequencyData?: number[];

  /**
   * Tamanho do semi-anel.
   */
  radius?: number;

  /**
   * Quantidade de espinhos.
   */
  spikeCount?: number;

  /**
   * Mostrar partículas/gotas.
   */
  particles?: boolean;
}

interface Spike {
  angle: number;
  baseHeight: number;
  width: number;
  phase: number;
  frequencyIndex: number;
}

function clamp01(value: number) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function getColor(
  state: FerrofluidState,
) {
  if (state === "tool") {
    return new THREE.Color("#ff2fa8");
  }

  if (state === "speaking") {
    return new THREE.Color("#008cff");
  }

  return new THREE.Color("#73777d");
}

function getGlowColor(
  state: FerrofluidState,
) {
  if (state === "tool") {
    return new THREE.Color("#ff008c");
  }

  if (state === "speaking") {
    return new THREE.Color("#008cff");
  }

  return new THREE.Color("#4e545a");
}

/**
 * Cria uma curva em formato ∩.
 *
 * A abertura fica PARA BAIXO.
 *
 *       ______
 *     /        \
 *    /          \
 *   /            \
 */
class FerrofluidArcCurve extends THREE.Curve<THREE.Vector3> {
  radius: number;

  constructor(radius: number) {
    super();
    this.radius = radius;
  }

  getPoint(
    t: number,
    target = new THREE.Vector3(),
  ) {
    const angle = Math.PI * t;

    const x =
      Math.cos(angle) * this.radius;

    const y =
      Math.sin(angle) * this.radius;

    target.set(x, y, 0);

    return target;
  }
}

function FerrofluidArc({
  radius,
  state,
  audioLevel,
}: {
  radius: number;
  state: FerrofluidState;
  audioLevel: number;
}) {
  const meshRef =
    useRef<THREE.Mesh>(null);

  const curve = useMemo(
    () => new FerrofluidArcCurve(radius),
    [radius],
  );

  const geometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        curve,
        128,
        0.34,
        24,
        false,
      ),
    [curve],
  );

  const materialRef =
    useRef<THREE.MeshPhysicalMaterial>(null);

  const currentColor =
    getColor(state);

  const glowColor =
    getGlowColor(state);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (!materialRef.current) return;

    materialRef.current.color.lerp(
      currentColor,
      1 - Math.exp(-delta * 8),
    );

    materialRef.current.emissive.lerp(
      glowColor,
      1 - Math.exp(-delta * 8),
    );

    materialRef.current.emissiveIntensity =
      THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        state === "idle"
          ? 0.08
          : 0.45 + audioLevel * 1.3,
        1 - Math.exp(-delta * 8),
      );

    const arcScale =
      state === "idle"
        ? 0
        : state === "speaking"
          ? 1 + audioLevel * 0.025
          : 1;

    meshRef.current.scale.lerp(
      new THREE.Vector3(
        arcScale,
        arcScale,
        arcScale,
      ),
      1 - Math.exp(-delta * 10),
    );
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      castShadow
      receiveShadow
    >
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
  );
}

function FerrofluidSpikes({
  radius,
  count,
  state,
  audioLevel,
  frequencyData,
}: {
  radius: number;
  count: number;
  state: FerrofluidState;
  audioLevel: number;
  frequencyData: number[];
}) {
  const groupRef =
    useRef<THREE.Group>(null);

  const spikes = useMemo<Spike[]>(
    () => {
      return Array.from(
        { length: count },
        (_, index) => {
          const t =
            index / (count - 1);

          const angle =
            Math.PI * t;

          const centralWeight =
            Math.sin(angle);

          return {
            angle,
            baseHeight:
              0.22 +
              centralWeight * 0.5 +
              Math.random() * 0.25,
            width:
              0.055 +
              Math.random() * 0.08,
            phase:
              Math.random() * Math.PI * 2,
            frequencyIndex:
              Math.floor(
                t *
                  Math.max(
                    1,
                    frequencyData.length - 1,
                  ),
              ),
          };
        },
      );
    },
    [count, frequencyData.length],
  );

  const spikeRefs =
    useRef<
      Array<THREE.Mesh | null>
    >([]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    const time =
      clock.getElapsedTime();

    const isActive =
      state !== "idle";

    const targetRotation =
      state === "tool"
        ? time * 0.75
        : 0;

    groupRef.current.rotation.y =
      THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetRotation,
        state === "tool"
          ? 3
          : 5,
        delta,
      );

    spikes.forEach(
      (spike, index) => {
        const mesh =
          spikeRefs.current[index];

        if (!mesh) return;

        const frequency =
          frequencyData[
            spike.frequencyIndex
          ] ?? 0;

        const localAudio =
          Math.max(
            audioLevel,
            frequency,
          );

        const wave =
          Math.sin(
            time * 5 +
              spike.phase,
          ) * 0.08;

        const targetHeight =
          isActive
            ? spike.baseHeight +
              localAudio * 2.5 +
              wave * localAudio
            : 0.05;

        mesh.scale.y =
          THREE.MathUtils.damp(
            mesh.scale.y,
            Math.max(
              0.08,
              targetHeight,
            ),
            12,
            delta,
          );

        const targetOpacity =
          state === "idle"
            ? 0
            : 0.55 +
              localAudio * 0.45;

        const material =
          mesh.material as THREE.MeshPhysicalMaterial;

        material.opacity =
          THREE.MathUtils.damp(
            material.opacity,
            targetOpacity,
            10,
            delta,
          );

        material.transparent = true;

        const targetColor =
          getColor(state);

        material.color.lerp(
          targetColor,
          1 - Math.exp(-delta * 8),
        );

        material.emissive.lerp(
          targetColor,
          1 - Math.exp(-delta * 8),
        );

        material.emissiveIntensity =
          state === "tool"
            ? 1.1 +
              localAudio * 1.8
            : 0.45 +
              localAudio * 1.5;
      },
    );
  });

  return (
    <group ref={groupRef}>
      {spikes.map(
        (spike, index) => {
          const x =
            Math.cos(
              spike.angle,
            ) * radius;

          const y =
            Math.sin(
              spike.angle,
            ) * radius;

          const position =
            new THREE.Vector3(
              x,
              y,
              0,
            );

          const direction =
            new THREE.Vector3(
              Math.cos(
                spike.angle,
              ),
              Math.sin(
                spike.angle,
              ),
              0,
            ).normalize();

          const quaternion =
            new THREE.Quaternion();

          quaternion.setFromUnitVectors(
            new THREE.Vector3(
              0,
              1,
              0,
            ),
            direction,
          );

          return (
            <mesh
              key={index}
              ref={(node) => {
                spikeRefs.current[
                  index
                ] = node;
              }}
              position={position}
              quaternion={quaternion}
              castShadow
            >
              <coneGeometry
                args={[
                  spike.width,
                  spike.baseHeight,
                  10,
                  1,
                ]}
              />

              <meshPhysicalMaterial
                color={getColor(state)}
                metalness={1}
                roughness={0.12}
                clearcoat={1}
                emissive={getGlowColor(
                  state,
                )}
                emissiveIntensity={0.8}
                transparent
                opacity={
                  state === "idle"
                    ? 0
                    : 0.8
                }
              />
            </mesh>
          );
        },
      )}
    </group>
  );
}

function FerrofluidDroplets({
  radius,
  state,
}: {
  radius: number;
  state: FerrofluidState;
}) {
  const groupRef =
    useRef<THREE.Group>(null);

  const droplets = useMemo(() => {
    return Array.from(
      { length: 30 },
      (_, index) => {
        const t =
          index / 29;

        const angle =
          Math.PI * t;

        const offset =
          0.35 +
          Math.random() * 0.35;

        return {
          angle,
          offset,
          size:
            0.025 +
            Math.random() * 0.07,
          speed:
            0.3 +
            Math.random() * 0.8,
          phase:
            Math.random() *
            Math.PI *
            2,
        };
      },
    );
  }, []);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    const time =
      clock.getElapsedTime();

    groupRef.current.children.forEach(
      (child, index) => {
        const droplet =
          droplets[index];

        if (!droplet) return;

        const active =
          state !== "idle";

        const pulse =
          active
            ? 1 +
              Math.sin(
                time *
                  droplet.speed +
                  droplet.phase,
              ) *
                0.25
            : 0;

        const targetScale =
          active ? pulse : 0;

        child.scale.lerp(
          new THREE.Vector3(
            targetScale,
            targetScale,
            targetScale,
          ),
          1 -
            Math.exp(
              -delta * 7,
            ),
        );
      },
    );
  });

  return (
    <group ref={groupRef}>
      {droplets.map(
        (droplet, index) => {
          const x =
            Math.cos(
              droplet.angle,
            ) *
            (radius +
              droplet.offset);

          const y =
            Math.sin(
              droplet.angle,
            ) *
            (radius +
              droplet.offset);

          const z =
            Math.sin(
              index * 13.7,
            ) * 0.35;

          return (
            <mesh
              key={index}
              position={[
                x,
                y,
                z,
              ]}
              scale={0}
            >
              <sphereGeometry
                args={[
                  droplet.size,
                  12,
                  12,
                ]}
              />

              <meshPhysicalMaterial
                color={getColor(
                  state,
                )}
                metalness={1}
                roughness={0.08}
                clearcoat={1}
                emissive={getGlowColor(
                  state,
                )}
                emissiveIntensity={1}
              />
            </mesh>
          );
        },
      )}
    </group>
  );
}

function FerrofluidOrb({
  state,
  audioLevel,
}: {
  state: FerrofluidState;
  audioLevel: number;
}) {
  const meshRef =
    useRef<THREE.Mesh>(null);

  const materialRef =
    useRef<any>(null);

  useFrame(({ clock }, delta) => {
    if (!meshRef.current) return;

    const active =
      state === "idle";

    const targetScale =
      active
        ? 1 + audioLevel * 0.04
        : 0;

    meshRef.current.scale.lerp(
      new THREE.Vector3(
        targetScale,
        targetScale,
        targetScale,
      ),
      1 -
        Math.exp(
          -delta * 5,
        ),
    );

    meshRef.current.rotation.y +=
      delta * 0.25;

    meshRef.current.rotation.x =
      Math.sin(
        clock.getElapsedTime() *
          0.4,
      ) * 0.1;

    if (materialRef.current) {
      materialRef.current.distort =
        THREE.MathUtils.damp(
          materialRef.current.distort,
          active
            ? 0.28 +
              audioLevel * 0.08
            : 0,
          5,
          delta,
        );
    }
  });

  return (
    <mesh
      ref={meshRef}
      scale={0}
    >
      <icosahedronGeometry
        args={[1.05, 6]}
      />

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
  );
}

function FerrofluidCore({
  state,
  audioLevel,
  frequencyData,
  radius,
  spikeCount,
  particles,
}: Required<
  Pick<
    FerrofluidVoiceAgentProps,
    | "state"
    | "audioLevel"
    | "frequencyData"
    | "radius"
    | "spikeCount"
    | "particles"
  >
>) {
  const groupRef =
    useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current)
      return;

    const targetY =
      state === "speaking"
        ? Math.sin(
            performance.now() *
              0.0015,
          ) * 0.025
        : 0;

    groupRef.current.position.y =
      THREE.MathUtils.damp(
        groupRef.current.position.y,
        targetY,
        4,
        delta,
      );
  });

  return (
    <group ref={groupRef}>
      <FerrofluidArc
        radius={radius}
        state={state}
        audioLevel={audioLevel}
      />

      <FerrofluidSpikes
        radius={radius}
        count={spikeCount}
        state={state}
        audioLevel={audioLevel}
        frequencyData={frequencyData}
      />

      {particles && (
        <FerrofluidDroplets
          radius={radius}
          state={state}
        />
      )}

      <FerrofluidOrb
        state={state}
        audioLevel={audioLevel}
      />
    </group>
  );
}

function Scene({
  state,
  audioLevel,
  frequencyData,
  radius,
  spikeCount,
  particles,
}: FerrofluidVoiceAgentProps & {
  state: FerrofluidState;
  audioLevel: number;
  frequencyData: number[];
  radius: number;
  spikeCount: number;
  particles: boolean;
}) {
  return (
    <>
      <ambientLight
        intensity={0.12}
      />

      <directionalLight
        position={[
          3,
          5,
          6,
        ]}
        intensity={3}
      />

      <pointLight
        position={[
          0,
          1,
          3,
        ]}
        intensity={
          state === "tool"
            ? 8
            : state === "speaking"
              ? 5
              : 1
        }
        color={
          state === "tool"
            ? "#ff008c"
            : state === "speaking"
              ? "#008cff"
              : "#73777d"
        }
      />

      <FerrofluidCore
        state={state}
        audioLevel={audioLevel}
        frequencyData={
          frequencyData
        }
        radius={radius}
        spikeCount={
          spikeCount
        }
        particles={
          particles
        }
      />

      <Environment
        preset="studio"
      />

      <EffectComposer>
        <Bloom
          intensity={
            state === "idle"
              ? 0.15
              : state === "tool"
                ? 2.4
                : 1.7
          }
          luminanceThreshold={
            0.1
          }
          luminanceSmoothing={
            0.85
          }
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export default function FerrofluidVoiceAgent(
  props: FerrofluidVoiceAgentProps,
) {
  const state =
    props.state ?? "idle";

  const audioLevel =
    clamp01(
      props.audioLevel ?? 0,
    );

  const frequencyData =
    props.frequencyData ??
    [];

  const radius =
    props.radius ?? 2.35;

  const spikeCount =
    props.spikeCount ?? 48;

  const particles =
    props.particles ?? true;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 420,
        position: "relative",
      }}
    >
      <Canvas
        camera={{
          position: [
            0,
            0.3,
            7,
          ],
          fov: 42,
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
        }}
        shadows
      >
        <Scene
          state={state}
          audioLevel={
            audioLevel
          }
          frequencyData={
            frequencyData
          }
          radius={radius}
          spikeCount={
            spikeCount
          }
          particles={
            particles
          }
        />
      </Canvas>
    </div>
  );
}
```

---

# 3. `app/page.tsx`

Este exemplo cria controles para testar os três estados sem precisar conectar um agente de voz real.

```tsx
"use client";

import {
  useEffect,
  useState,
} from "react";

import FerrofluidVoiceAgent, {
  type FerrofluidState,
} from "@/components/FerrofluidVoiceAgent";

function generateFrequencyData(
  level: number,
) {
  return Array.from(
    { length: 64 },
    (_, index) => {
      const position =
        index / 64;

      const bass =
        Math.max(
          0,
          1 -
            position * 2,
        );

      const wave =
        Math.sin(
          position *
            Math.PI *
            8 +
            performance.now() *
              0.004,
        ) *
        0.5 +
        0.5;

      return (
        level *
        (bass * 0.65 +
          wave * 0.35)
      );
    },
  );
}

export default function Home() {
  const [state, setState] =
    useState<FerrofluidState>(
      "idle",
    );

  const [audioLevel, setAudioLevel] =
    useState(0);

  const [
    frequencyData,
    setFrequencyData,
  ] = useState<number[]>(
    Array(64).fill(0),
  );

  useEffect(() => {
    if (state !== "speaking") {
      setAudioLevel(0);
      setFrequencyData(
        Array(64).fill(0),
      );

      return;
    }

    let animationFrame: number;

    const animate = () => {
      const time =
        performance.now() /
        1000;

      const level =
        0.35 +
        Math.sin(
          time * 5,
        ) *
          0.25 +
        Math.sin(
          time * 11,
        ) *
          0.15;

      const normalized =
        Math.max(
          0,
          Math.min(
            1,
            level,
          ),
        );

      setAudioLevel(
        normalized,
      );

      setFrequencyData(
        generateFrequencyData(
          normalized,
        ),
      );

      animationFrame =
        requestAnimationFrame(
          animate,
        );
    };

    animate();

    return () =>
      cancelAnimationFrame(
        animationFrame,
      );
  }, [state]);

  return (
    <main className="page">
      <section className="agent-container">
        <div className="visual">
          <FerrofluidVoiceAgent
            state={state}
            audioLevel={
              audioLevel
            }
            frequencyData={
              frequencyData
            }
            radius={2.35}
            spikeCount={52}
            particles
          />
        </div>

        <div className="controls">
          <h1>
            Ferrofluid Voice Agent
          </h1>

          <p className="description">
            Visualização reativa do
            agente de voz.
          </p>

          <div className="buttons">
            <button
              className={
                state === "idle"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setState(
                  "idle",
                )
              }
            >
              Idle
            </button>

            <button
              className={
                state ===
                "speaking"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setState(
                  "speaking",
                )
              }
            >
              Speaking
            </button>

            <button
              className={
                state === "tool"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setState(
                  "tool",
                )
              }
            >
              Tool / Search
            </button>
          </div>

          <div className="status">
            <span>
              Estado:
            </span>

            <strong>
              {state}
            </strong>
          </div>

          <div className="meter">
            <div
              className="meter-fill"
              style={{
                width: `${
                  audioLevel * 100
                }%`,
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
```

---

# 4. `app/globals.css`

```css
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
  background: #050608;
  color: white;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

body {
  overflow-x: hidden;
}

.page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(
      circle at center,
      #10141b 0%,
      #050608 50%,
      #020304 100%
    );
}

.agent-container {
  width: min(
    1100px,
    100%
  );

  min-height: 700px;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    280px;

  gap: 30px;

  padding: 30px;
}

.visual {
  min-height: 620px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 28px;

  background:
    radial-gradient(
      circle at center,
      rgba(
        20,
        30,
        45,
        0.45
      ),
      transparent 65%
    );

  overflow: hidden;
}

.controls {
  align-self: center;

  padding: 24px;

  border: 1px solid
    rgba(
      255,
      255,
      255,
      0.08
    );

  border-radius: 20px;

  background: rgba(
    255,
    255,
    255,
    0.035
  );

  backdrop-filter: blur(
    20px
  );
}

.controls h1 {
  margin: 0 0 8px;

  font-size: 20px;
  font-weight: 600;
}

.description {
  margin: 0 0 24px;

  color: #858b94;

  font-size: 13px;

  line-height: 1.5;
}

.buttons {
  display: flex;

  flex-direction: column;

  gap: 8px;
}

.buttons button {
  border: 1px solid
    rgba(
      255,
      255,
      255,
      0.08
    );

  background: rgba(
    255,
    255,
    255,
    0.04
  );

  color: #aeb4bd;

  border-radius: 10px;

  padding: 11px 14px;

  text-align: left;

  cursor: pointer;

  transition:
    background 160ms ease,
    border 160ms ease,
    color 160ms ease;
}

.buttons button:hover {
  background: rgba(
    255,
    255,
    255,
    0.08
  );

  color: white;
}

.buttons button.active {
  background: rgba(
    255,
    255,
    255,
    0.1
  );

  border-color: rgba(
    255,
    255,
    255,
    0.2
  );

  color: white;
}

.status {
  margin-top: 24px;

  display: flex;

  justify-content: space-between;

  font-size: 12px;
}

.status span {
  color: #777e88;
}

.status strong {
  font-weight: 500;

  text-transform: uppercase;
}

.meter {
  width: 100%;

  height: 3px;

  margin-top: 18px;

  border-radius: 999px;

  background: rgba(
    255,
    255,
    255,
    0.08
  );

  overflow: hidden;
}

.meter-fill {
  height: 100%;

  border-radius: inherit;

  background: #008cff;

  transition:
    width 50ms linear;
}

@media (max-width: 800px) {
  .agent-container {
    grid-template-columns: 1fr;

    padding: 15px;
  }

  .visual {
    min-height: 480px;
  }

  .controls {
    width: 100%;
  }
}
```

---

# 5. Conectando ao áudio real do agente

A versão acima utiliza uma simulação de áudio. Para conectar ao áudio real, utilize um `AnalyserNode`.

Fluxo:

```text
Áudio do agente
      ↓
AudioContext
      ↓
AnalyserNode
      ↓
FFT
      ↓
┌───────────────┐
│ audioLevel    │
│ frequencyData │
└───────┬───────┘
        ↓
FerrofluidVoiceAgent
```

Exemplo:

```ts
const analyser =
  audioContext.createAnalyser();

analyser.fftSize = 128;

const data =
  new Uint8Array(
    analyser.frequencyBinCount,
  );

function updateAudio() {
  analyser.getByteFrequencyData(
    data,
  );

  let sum = 0;

  for (
    let i = 0;
    i < data.length;
    i++
  ) {
    sum += data[i];
  }

  const average =
    sum /
    data.length /
    255;

  const frequencyData =
    Array.from(data).map(
      (value) =>
        value / 255,
    );

  setAudioLevel(
    average,
  );

  setFrequencyData(
    frequencyData,
  );

  requestAnimationFrame(
    updateAudio,
  );
}
```

Essa rotina substitui a simulação existente em `page.tsx`.

---

# 6. Integração com o agente de IA

A API do componente foi pensada para que o agente não precise conhecer detalhes de Three.js.

O estado pode ser calculado assim:

```ts
const ferrofluidState =
  isToolRunning
    ? "tool"
    : isAgentSpeaking
      ? "speaking"
      : "idle";
```

E o componente:

```tsx
<FerrofluidVoiceAgent
  state={ferrofluidState}
  audioLevel={audioLevel}
  frequencyData={frequencyData}
/>
```

Estados:

| Agente | Estado | Visual |
|---|---|---|
| Inativo | `idle` | Orb ferrofluida cinza |
| Começou a falar | `speaking` | Semi-anel azul |
| Voz baixa | `speaking` | Espinhos pequenos |
| Voz alta | `speaking` | Espinhos maiores |
| Pesquisa / Tool | `tool` | Rosa/magenta + rotação |
| Tool terminou e continua falando | `speaking` | Volta ao azul |
| Terminou de falar | `idle` | Volta para orb |

---

# 7. Direção do semi-anel

A geometria foi deliberadamente construída para formar:

```text
             /\    /\
          /\/  \__/  \/\ 
        /                \
       /                  \
      |                    |
       \                  /
        \________________/
               ↓
            abertura
```

A abertura fica **para baixo**.

A implementação utiliza:

```ts
const angle = Math.PI * t;

const x =
  Math.cos(angle) * radius;

const y =
  Math.sin(angle) * radius;
```

Isso produz um arco superior no plano XY.

---

# 8. Comportamento visual

## Idle

```text
             ______
          .-'      '-.
        .'            '.
       /                \
      |      ORB         |
       \                /
        '.            .'
          '-.______.-'
```

A orb usa `MeshDistortMaterial`, portanto possui uma deformação orgânica.

## Speaking

```text
             /\    /\
          /\/  \__/  \/\ 
        /                \
       /                  \
      |                    |
       \                  /
        \________________/
```

A intensidade dos espinhos é influenciada por:

```ts
audioLevel
frequencyData
```

## Tool

A cor muda para:

```text
#FF2FA8
```

e o objeto entra em rotação:

```ts
const targetRotation =
  state === "tool"
    ? time * 0.75
    : 0;
```

O Bloom também aumenta para enfatizar a execução da ferramenta.

---

# 9. Próxima evolução recomendada

A implementação acima é uma base funcional. Para chegar ainda mais próximo do ferrofluido da referência visual, a próxima etapa é substituir os cones independentes por deformação real da superfície.

Em vez de:

```text
cone
cone
cone
cone
cone
```

o ideal é:

```text
             /\
        ____/  \____
     __/            \__
   _/                  \_
  /                      \
 /                        \
```

onde os espinhos fazem parte da própria superfície líquida.

Isso pode ser implementado usando:

- shader GLSL procedural;
- displacement baseado em noise;
- deformação radial;
- SDF;
- vertex displacement;
- campos magnéticos simulados;
- FFT como força de deformação;
- partículas/droplets secundários;
- bloom;
- metalness/roughness variável.

Essa abordagem permite que os espinhos realmente pareçam nascer do ferrofluido e se fundir novamente à superfície, em vez de parecerem cones colocados sobre um anel.

---

# 10. Arquitetura final recomendada

```text
Voice Agent
     │
     ├── audioLevel
     ├── frequencyData
     ├── isSpeaking
     └── isUsingTool
              │
              ▼
     Ferrofluid Controller
              │
     ┌────────┼─────────┐
     ▼        ▼         ▼
   IDLE   SPEAKING    TOOL
     │        │         │
     ▼        ▼         ▼
    ORB    BLUE ARC   PINK ARC
   GRAY    + SPIKES   + ROTATION
              │
              ▼
          FFT Audio
              │
              ▼
      Procedural Spikes
```

O componente deve permanecer isolado da lógica do agente. O agente fornece somente estado e dados de áudio; o componente é responsável pela renderização e pelas transições.
