'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { audioLevels, type AudioLevelsSnapshot } from '@/lib/voice/audioLevels'

export type OrbVisualStatus = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error'

type FerrofluidOrbProps = {
  className?: string
  /** Base status owned by the parent (connection lifecycle). */
  status: OrbVisualStatus
  /** True while the agent is searching/navigating — arc turns pink + spins. */
  searching?: boolean
  /** Emits the derived live status (speaking/listening…) for the parent UI. */
  onStatusChange?: (status: OrbVisualStatus) => void
}

/* ---------------------------------------------------------------------------
   Status → shader theme (RGB triples used as rim + magnetic "energy" colour).
   ------------------------------------------------------------------------- */

type OrbTheme = {
  idle: [number, number, number]
  active: [number, number, number]
  mixTarget: number
  rim: [number, number, number]
  rimStrength: number
}

const STATUS_THEMES: Record<OrbVisualStatus, OrbTheme> = {
  idle:       { idle: [0.04, 0.09, 0.13], active: [0.25, 0.75, 0.95], mixTarget: 0.25, rim: [0.35, 0.85, 1.0],  rimStrength: 0.32 },
  connecting: { idle: [0.10, 0.06, 0.02], active: [1.0, 0.62, 0.12], mixTarget: 0.75, rim: [1.0, 0.72, 0.25],  rimStrength: 0.6 },
  connected:  { idle: [0.02, 0.08, 0.05], active: [0.25, 0.95, 0.50], mixTarget: 0.55, rim: [0.30, 1.0, 0.55],  rimStrength: 0.5 },
  listening:  { idle: [0.02, 0.10, 0.13], active: [0.15, 0.90, 1.00], mixTarget: 0.95, rim: [0.20, 0.90, 1.0], rimStrength: 0.9 },
  speaking:   { idle: [0.09, 0.03, 0.13], active: [0.75, 0.55, 1.00], mixTarget: 1.0,  rim: [0.85, 0.60, 1.0], rimStrength: 1.0 },
  error:      { idle: [0.11, 0.02, 0.02], active: [1.0, 0.22, 0.16], mixTarget: 0.95, rim: [1.0, 0.30, 0.20], rimStrength: 0.9 },
}

// PINK — overrides the status theme while the agent is searching.
const SEARCH_THEME: OrbTheme = {
  idle: [0.18, 0.04, 0.11],
  active: [1.0, 0.42, 0.72],
  mixTarget: 1.0,
  rim: [1.0, 0.52, 0.80],
  rimStrength: 1.0,
}

/* -------------------------------------------------------------------------
   GLSL — ferrofluid orbs.
   ------------------------------------------------------------------------- */

const FERROFLUID_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uVolume;
uniform float uBass;
uniform float uTreble;
uniform float uPitch;
uniform float uHover;
uniform float uCalm;
uniform float uMorph;
uniform vec3 uPointerDir;

varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vNoise01;
varying float vHeight;

const float PI = 3.141592653589793;

// Simplex 3D noise (Ashima / Ian McEwan, MIT).
vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g  = step(x0.yzx, x0.xyz);
  vec3 l  = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float fbm(vec3 p){
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++){
    s += a * snoise(p);
    p = p * 2.02 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return s;
}

// Parametrisation matching THREE.SphereGeometry (u,v in [0,1]).
// The base shape morphs between an orb and a ferrofluid semi-arc — the spine
// animation stays identical, it just wraps around whichever liquid body.
const float RING_R = 0.40; // ring major radius (axis of the hoop)
const float TUBE_R = 0.26; // ring tube radius (thickness of the hoop)
// Semi-arc: almost closed (300°), vertical (gap at bottom).
const float ARC_SPAN = 5.236; // ~300° in radians (6π/3.6)
const float ARC_OFFSET = -2.618; // center the arc: -ARC_SPAN/2

vec3 spherePosAt(float u, float v){
  float th = u * PI * 2.0;
  float ph = v * PI;
  return vec3(-cos(th) * sin(ph), cos(ph), sin(th) * sin(ph));
}

vec3 arcPosAt(float u, float v){
  float th = ARC_OFFSET + u * ARC_SPAN; // partial arc along major axis
  float ph = v * PI * 2.0; // full tube circumference
  // Center of the tube at angle th
  vec3 center = vec3(cos(th) * RING_R, 0.0, sin(th) * RING_R);
  // Tube cross-section
  vec3 tube = vec3(cos(th) * cos(ph), sin(ph), sin(th) * cos(ph));
  vec3 pos = center + tube * TUBE_R;
  // Rotate 90° around X (vertical) then -90° around Z (gap → bottom)
  // X-rotation: (x, y, z) → (x, -z, y)
  // Z-rotation: (x, y, z) → (y, -x, z)
  // Combined:   (x, y, z) → (-z, -x, y)
  return vec3(-pos.z, -pos.x, pos.y);
}

vec3 baseAt(float u, float v){
  return mix(spherePosAt(u, v), arcPosAt(u, v), uMorph);
}

// Direction the fluid sprouts along: radial for the orb, tube-normal for the
// arc — blended during the morph so spines always stick out of the liquid.
vec3 spineDir(float u, float v){
  float th = u * PI * 2.0;
  float ph = v * PI * 2.0;
  vec3 td = vec3(cos(th) * cos(ph), sin(ph), sin(th) * cos(ph));
  if (uMorph > 0.01) {
    // Arc tube normal: tangent × binormal, rotated with the arc.
    float ath = ARC_OFFSET + u * ARC_SPAN;
    vec3 tang = vec3(-sin(ath) * RING_R, 0.0, cos(ath) * RING_R);
    vec3 norm = vec3(cos(ath), 0.0, sin(ath));
    vec3 tubeN = normalize(cross(tang, norm));
    // Apply the same rotation as arcPosAt: (x,y,z) → (-z,-x,y)
    vec3 arcN = vec3(-tubeN.z, -tubeN.x, tubeN.y);
    td = arcN;
  }
  return normalize(mix(spherePosAt(u, v), td, uMorph));
}

float field(vec3 d, float t){
  vec3 p = d;
  float n1 = fbm(p * 2.2 + vec3(t * 0.30,  t * 0.16, t * 0.22));
  float n2 = fbm(p * 4.8 - vec3(t * 0.10, -t * 0.32, -t * 0.14));
  return n1 * 0.62 + n2 * 0.38;
}

vec3 calc(float u, float v, float t){
  vec3 base = baseAt(u, v);
  vec3 dir = spineDir(u, v);
  float f = field(dir, t);

  // ── Voice-reactive ferrofluid spines ────────────────────────────────────
  // The voice taps (user input + agent output) drive three channels:
  //   uVolume → eruption amplitude (how far the silhouette extends)
  //   uBass   → heavy needle length (low-timbre rumble)
  //   uTreble → micro-tremor over every ridge (sibilance / breathiness)
  // While quiet, the fluid relaxes back into a smooth liquid-metal pool.

  float voice = clamp(uVolume, 0.0, 1.0);
  float bass  = clamp(uBass, 0.0, 1.0);
  float treb  = clamp(uTreble, 0.0, 1.0);

   // 0 = resting pool, 1 = fully erected spine field.
   // Low threshold so spines erupt readily while the agent is talking.
   float growth = smoothstep(0.004, 0.12, voice + bass * 0.5);

   // As the voice grows, the ridge threshold drops — more of the noise field
   // sharpens into needles, exactly like a ferrofluid under a rising magnet.
   float ridgeFloor = mix(0.40, 0.04, growth);
   float ridgeCeil  = mix(0.60, 0.98, growth);
   float gate   = smoothstep(ridgeFloor, ridgeCeil, f);
   float sharp  = 1.30 + growth * 4.2 + bass * 2.0;
   float spike  = pow(gate, sharp);
   spike = clamp(spike, 0.0, 2.2);

   // Fine sibilance tremor — only while speech is present (never at rest).
   float flutter = treb * growth * (0.35 + 0.55 * voice);
   spike *= 1.0 + flutter * (snoise(dir * 16.0 + vec3(t * 6.5)) * 0.5 + 0.5);

   // Amplitude: thin resting film vs MASSIVE erupting needles.
   float amp = 0.05 + 1.05 * growth + 0.35 * bass * growth;

  // The whole body swells with the utterance (slow voice envelope).
  float swell = voice * (0.08 + 0.06 * sin(t * 2.2 + base.y * 5.0));

  // Liquid sheets — slow mid-frequency undulation, only while at rest.
  float sheet = (1.0 - growth) * 0.05 *
    (sin(base.x * 6.0 + t * 0.8) * sin(base.y * 5.0 - t * 0.6));

  // Idle breathing (respects reduced-motion via uCalm).
  float idle = uCalm * (0.035 + 0.030 * sin(t * 0.65 + base.y * 8.0));

  // Magnetic pull: spines lean toward the hovered surface point.
  float pd = max(dot(dir, uPointerDir), 0.0);
  float mag = uHover * (0.18 * pow(pd, 3.0) + 0.08 * (f * 0.5 + 0.5) * pd);

  float h = idle + swell + sheet + amp * spike + mag;
  // Keep the silhouette inside the expanded camera frustum (no clipping).
  h = min(h, 0.85);
  return base + dir * h;
}

void main(){
  float t = uTime;
  vec3 np = calc(uv.x, uv.y, t);
  float inc = 0.012;
  vec3 tg = calc(uv.x + inc, uv.y, t) - np;
  vec3 bt = calc(uv.x, uv.y + inc, t) - np;
  vec3 objectNormal = normalize(cross(bt, tg));

  vNormalW = normalize(mat3(modelMatrix) * objectNormal);
  vec4 worldPos = modelMatrix * vec4(np, 1.0);
  vec4 mvPosition = viewMatrix * worldPos;
  vViewDir = normalize(-mvPosition.xyz);
  vNoise01 = field(spineDir(uv.x, uv.y), t) * 0.5 + 0.5;
  float baseR = length(baseAt(uv.x, uv.y));
  vHeight = max(length(np) - baseR, 0.0);

  gl_Position = projectionMatrix * mvPosition;
}
`

const FERROFLUID_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uVolume;
uniform float uBass;
uniform float uTreble;
uniform float uHover;
uniform vec3 uColorIdle;
uniform vec3 uColorActive;
uniform float uColorMix;
uniform vec3 uRimColor;
uniform float uRimStrength;

varying vec3 vNormalW;
varying vec3 vViewDir;
varying float vNoise01;
varying float vHeight;

void main(){
  vec3 n = normalize(vNormalW);
  vec3 view = normalize(vViewDir);

  // Procedural studio environment → dark steel with chromatic glints.
  vec3 keyL    = normalize(vec3( 0.45,  0.60,  0.35));
  vec3 rimL    = normalize(vec3(-0.35,  0.50, -0.80));
  vec3 fillL   = normalize(vec3(-0.70, -0.10,  0.40));
  vec3 bounceL = vec3(0.0, -1.0, 0.0);

  float k = pow(max(dot(n, keyL),    0.0), 26.0);
  float r = pow(max(dot(n, rimL),    0.0), 13.0);
  float f = pow(max(dot(n, fillL),   0.0),  5.0);
  float b = pow(max(dot(n, bounceL), 0.0),  3.0);

  vec3 chrome = vec3(0.030, 0.033, 0.040);
  chrome += vec3(0.62, 0.70, 0.78) * k;
  chrome += vec3(0.34, 0.40, 0.52) * r;
  chrome += vec3(0.07, 0.08, 0.11) * f;
  chrome += vec3(0.045, 0.05, 0.065) * b;
  chrome += vec3(0.10, 0.11, 0.13) * pow(max(dot(n, view), 0.0), 1.6) * 0.28;

  float fres = pow(1.0 - max(dot(n, view), 0.0), 2.6);

  vec3 status = mix(uColorIdle, uColorActive, uColorMix);

  // Magnetic energy: status colour rises where the field peaks.
  float energyMask = uVolume * (0.25 + 0.75 * vNoise01);
  energyMask *= 0.45 + 0.55 * pow(max(vHeight * 9.0, 0.0), 1.3);
  vec3 energy = status * energyMask * (0.9 + 0.7 * uBass);

  // Ferrofluid spine apexes ignite — taller needles burn brighter.
  float apex = smoothstep(0.50, 0.95, vNoise01) * uVolume;
  apex *= 0.35 + 0.65 * smoothstep(0.02, 0.30, vHeight);
  vec3 apexGlow = status * apex * 0.9;

  vec3 col = chrome + energy + apexGlow;
  col += uRimColor * fres * (uRimStrength * (0.4 + uVolume));
  col += status * uHover * 0.07;
  col += status * uTreble * 0.10 * apex;

  gl_FragColor = vec4(col, 1.0);
}
`

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
uniform float uVolume;
uniform vec3 uRimColor;
uniform float uStrength;
uniform float uAlpha;
varying vec3 vNormalW;
varying vec3 vViewDir;
void main(){
  vec3 n = normalize(vNormalW);
  vec3 view = normalize(vViewDir);
  float fres = pow(1.0 - abs(dot(n, view)), 2.2);
  float a = fres * uStrength * (0.28 + uVolume * 1.6) * uAlpha;
  vec3 c = uRimColor * fres * uStrength * (0.55 + uVolume * 1.3);
  gl_FragColor = vec4(c, a);
}
`

/* -------------------------------------------------------------------------
   Mesh.
   ------------------------------------------------------------------------- */

const damp = (cur: number, target: number, lambda: number, dt: number) =>
  cur + (target - cur) * (1 - Math.exp(-lambda * dt))

const themeColor = (t: [number, number, number]) => new THREE.Color(t[0], t[1], t[2])

const REDUCED_MOTION =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

type FluidMeshProps = {
  statusRef: React.RefObject<OrbVisualStatus>
  searching: boolean
  onStatusChange: (s: OrbVisualStatus) => void
  /** Second arg = whether the pointer-up should swallow the following click (real drag). */
  onDragState: (dragging: boolean, suppressClick?: boolean) => void
}

function FluidMesh({ statusRef, searching, onStatusChange, onDragState }: FluidMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const glowArcRef = useRef<THREE.Mesh>(null)
  const drag = useRef({ active: false, moved: false, lastX: 0, lastY: 0 })
  const rot = useRef({ yaw: 0.3, pitch: 0.12, yawV: 0, pitchV: 0 })
  const pointerTarget = useRef(new THREE.Vector3(0, 0, 1))
  const pointerCur = useRef(new THREE.Vector3(0, 0, 1))
  const hoverTarget = useRef(0)
  const hoverCur = useRef(0)
  const visualStatus = useRef<OrbVisualStatus>('idle')
  const lastFrameAt = useRef(-1)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { invalidate } = useThree()
  const scratchColor = useMemo(() => new THREE.Color(), [])
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 120, 72), [])
  const glowSphereGeometry = useMemo(() => new THREE.SphereGeometry(1.45, 48, 32), [])
  const glowArcGeometry = useMemo(() => new THREE.TorusGeometry(0.42, 0.34, 24, 64, Math.PI * 5.236 / (Math.PI * 2)), [])

  const fluidMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FERROFLUID_VERTEX,
        fragmentShader: FERROFLUID_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uVolume: { value: 0 },
          uBass: { value: 0 },
          uTreble: { value: 0 },
          uPitch: { value: 0.35 },
          uHover: { value: 0 },
          uCalm: { value: 1 },
          uMorph: { value: 0 },
          uPointerDir: { value: new THREE.Vector3(0, 0, 1) },
          uColorIdle: { value: themeColor(STATUS_THEMES.idle.idle) },
          uColorActive: { value: themeColor(STATUS_THEMES.idle.active) },
          uColorMix: { value: 0.25 },
          uRimColor: { value: themeColor(STATUS_THEMES.idle.rim) },
          uRimStrength: { value: STATUS_THEMES.idle.rimStrength },
        },
      }),
    []
  )

  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GLOW_VERTEX,
        fragmentShader: GLOW_FRAGMENT,
        uniforms: {
          uVolume: { value: 0 },
          uRimColor: { value: themeColor(STATUS_THEMES.idle.rim) },
          uStrength: { value: 0.6 },
          uAlpha: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      }),
    []
  )

  const glowArcMat = useMemo(() => glowMat.clone(), [glowMat])

  useEffect(() => {
    const m = fluidMat
    const g = glowMat
    const ga = glowArcMat
    const g1 = geometry
    const g2 = glowSphereGeometry
    const g3 = glowArcGeometry
    return () => {
      m.dispose()
      g.dispose()
      ga.dispose()
      g1.dispose()
      g2.dispose()
      g3.dispose()
    }
  }, [fluidMat, glowMat, glowArcMat, geometry, glowSphereGeometry, glowArcGeometry])

  useEffect(() => () => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = null
  }, [])

  // Attach GPU resources via refs (R3F convention — keeps JSX clean and
  // avoids react/no-unknown-property on `geometry`/`material` props).
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.geometry = geometry
      meshRef.current.material = fluidMat
    }
    if (glowRef.current) {
      glowRef.current.geometry = glowSphereGeometry
      glowRef.current.material = glowMat
    }
    if (glowArcRef.current) {
      glowArcRef.current.geometry = glowArcGeometry
      glowArcRef.current.material = glowArcMat
    }
  }, [geometry, glowSphereGeometry, glowArcGeometry, fluidMat, glowMat, glowArcMat])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const now = state.clock.elapsedTime

    const lv: AudioLevelsSnapshot = audioLevels.sample()

    // Amplify the raw audio snapshot so the ferrofluid spines are dramatically
    // visible even at normal speaking volume.
    const boostedVolume = Math.min(lv.volume * 4.5, 1)
    const boostedBass   = Math.min(lv.bass   * 3.8, 1)
    const boostedTreble = Math.min(lv.treble * 4.0, 1)

    // ── Status-driven voice envelope ───────────────────────────────────────
    // The orb MUST erupt while the agent is talking even if the raw output
    // analyser reads quiet (some platforms deliver low-amplitude PCM into the
    // Web Audio graph, so a pure level gate can leave the fluid frozen on the
    // idle pool while only the colour changes). We blend the real audio with a
    // guaranteed floor tied to the live speaking/listening status, modulated by
    // a couple of sine layers so the spikes shimmer instead of pulsing flat.
    // Bass → needle length/count, mid → motion, treble → surface shimmer
    // (this matches how real ferrofluid visualizers map the spectrum).
    const isSpeaking = visualStatus.current === 'speaking'
    const isListening = visualStatus.current === 'listening'
    const talkFloor =
      isSpeaking
        ? 0.62 + 0.26 * (0.5 + 0.5 * Math.sin(now * 11.0)) + 0.10 * Math.sin(now * 27.0)
        : isListening
          ? 0.40 + 0.22 * (0.5 + 0.5 * Math.sin(now * 8.0))
          : 0.0
    const talkBass = (isSpeaking || isListening)
      ? 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(now * 6.0))
      : 0.0
    const talkTreble = (isSpeaking || isListening)
      ? 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(now * 17.0))
      : 0.0
    const envVolume  = Math.max(boostedVolume, talkFloor)
    const envBass    = Math.max(boostedBass, talkBass)
    const envTreble  = Math.max(boostedTreble, talkTreble)

    // Throttle the idle loop (30 fps) — full 60 fps only while the orb is
    // being interacted with, the voice agent is live, or audio is flowing.
    const active =
      hoverTarget.current > 0.02 ||
      drag.current.active ||
      visualStatus.current !== 'idle' ||
      envVolume > 0.04
    if (!active) {
      if (now - lastFrameAt.current < 1 / 30) {
        if (!idleTimer.current) {
          idleTimer.current = setTimeout(() => {
            idleTimer.current = null
            invalidate()
          }, 33)
        }
        return
      }
    } else if (idleTimer.current) {
      clearTimeout(idleTimer.current)
      idleTimer.current = null
    }
    lastFrameAt.current = now

    const u = fluidMat.uniforms

    // Orb ↔ ring morph: any live/active status opens the orb into the ring.
    const live = visualStatus.current !== 'idle' && visualStatus.current !== 'error'
    const ringTarget = searching || live ? 1 : 0
    u.uMorph.value = damp(u.uMorph.value, ringTarget, 4.5, dt)

    u.uTime.value = now
    u.uVolume.value = damp(u.uVolume.value, envVolume, 11, dt)
    u.uBass.value = damp(u.uBass.value, envBass, 11, dt)
    u.uTreble.value = damp(u.uTreble.value, envTreble, 11, dt)
    u.uPitch.value = damp(u.uPitch.value, lv.pitch, 5, dt)
    u.uCalm.value = damp(u.uCalm.value, REDUCED_MOTION ? 0.5 : 1 - Math.min(1, envVolume * 3.2), 6, dt)

    // Magnetic pointer direction (updated directly from R3F events — no
    // per-frame raycaster on the CPU). Reset when the pointer leaves.
    if (hoverTarget.current <= 0.02) {
      pointerTarget.current.set(0, 0, 1)
    }
    pointerCur.current.lerp(pointerTarget.current, 1 - Math.exp(-10 * dt))
    u.uPointerDir.value.copy(pointerCur.current)
    hoverCur.current = damp(hoverCur.current, hoverTarget.current, 10, dt)
    u.uHover.value = hoverCur.current

    // Theming: pink while the agent is searching, otherwise the status theme.
    const theme = searching ? SEARCH_THEME : STATUS_THEMES[visualStatus.current]
    scratchColor.setRGB(theme.idle[0], theme.idle[1], theme.idle[2])
    u.uColorIdle.value.lerp(scratchColor, 1 - Math.exp(-6 * dt))
    scratchColor.setRGB(theme.active[0], theme.active[1], theme.active[2])
    u.uColorActive.value.lerp(scratchColor, 1 - Math.exp(-6 * dt))
    u.uColorMix.value = damp(u.uColorMix.value, theme.mixTarget, 6, dt)
    scratchColor.setRGB(theme.rim[0], theme.rim[1], theme.rim[2])
    u.uRimColor.value.lerp(scratchColor, 1 - Math.exp(-6 * dt))
    u.uRimStrength.value = damp(u.uRimStrength.value, theme.rimStrength, 6, dt)
    glowMat.uniforms.uRimColor.value.copy(u.uRimColor.value)
    glowMat.uniforms.uVolume.value = u.uVolume.value
    glowArcMat.uniforms.uRimColor.value.copy(u.uRimColor.value)
    glowArcMat.uniforms.uVolume.value = u.uVolume.value

    // Glow halo cross-fades between sphere and arc shapes based on morph.
    const morph = u.uMorph.value
    glowMat.uniforms.uAlpha.value = 1 - morph
    glowArcMat.uniforms.uAlpha.value = morph

    // Rotation: idle drift + drag inertia. The semi-arc only spins during
    // search/navigation — otherwise it stays still and reacts to voice via spines.
    const r = rot.current
    if (!drag.current.active) {
      r.yawV *= Math.exp(-dt * 3.2)
      r.pitchV *= Math.exp(-dt * 3.2)
      if (searching && !REDUCED_MOTION) {
        // Searching: full 360° spin around the arc's own axis (counter-clockwise).
        r.yaw -= dt * ((Math.PI * 2.0) / 1.6)
      }
      // Slight tilt in arc mode so the shape reads clearly from the front.
      const tilt = ringTarget * 0.34
      if (!REDUCED_MOTION) {
        r.pitch += (tilt - r.pitch) * (1 - Math.exp(-2.2 * dt))
      }
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = r.yaw
      groupRef.current.rotation.x = r.pitch
      groupRef.current.position.y = REDUCED_MOTION ? 0 : Math.sin(now * 0.8) * 0.06
    }
    invalidate()
  })

  // Throttled status derivation → notify the parent.
  useEffect(() => {
    let last: OrbVisualStatus = 'idle'
    const id = setInterval(() => {
      const s = audioLevels.sample()
      const base = statusRef.current
      let next: OrbVisualStatus = base
      if (base !== 'error' && base !== 'connecting') {
        if (s.outputActivity > 0.28) next = 'speaking'
        else if (s.inputActivity > 0.20) next = 'listening'
        else if (base === 'idle') next = 'idle'
        else if (base === 'connected' || base === 'listening') next = 'connected'
        else next = s.live ? 'listening' : 'connected'
      }
      visualStatus.current = next
      if (next !== last) {
        last = next
        onStatusChange(next)
      }
    }, 160)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          hoverTarget.current = 1
          invalidate()
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          hoverTarget.current = 0
          invalidate()
        }}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          drag.current.active = true
          drag.current.moved = false
          drag.current.lastX = e.nativeEvent.clientX
          drag.current.lastY = e.nativeEvent.clientY
          onDragState(true)
          invalidate()
          try {
            ;(e.nativeEvent.currentTarget as Element | null)?.setPointerCapture?.(e.pointerId)
          } catch { /* noop */ }
        }}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          const nx = e.nativeEvent.clientX
          const ny = e.nativeEvent.clientY
          const d = drag.current
          if (d.active) {
            const dx = nx - d.lastX
            const dy = ny - d.lastY
            if (Math.abs(dx) + Math.abs(dy) > 2) {
              d.moved = true
              rot.current.yawV = -dx * 0.05
              rot.current.pitchV = dy * 0.045
              rot.current.yaw += rot.current.yawV * 0.5
              rot.current.pitch = THREE.MathUtils.clamp(rot.current.pitch + rot.current.pitchV * 0.5, -0.6, 0.6)
            }
            d.lastX = nx
            d.lastY = ny
          } else if (e.point) {
            // Magnetic pull toward the hovered surface point (R3F already
            // computed the intersection — no raycaster needed here).
            pointerTarget.current.copy(e.point).normalize()
          }
          invalidate()
        }}
        onPointerUp={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          const wasDrag = drag.current.moved
          drag.current.active = false
          drag.current.moved = false
          // Always end the drag state; only a real drag swallows the
          // following click. A plain tap must reach the orb button.
          onDragState(false, wasDrag)
          invalidate()
        }}
        onPointerCancel={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          drag.current.active = false
          drag.current.moved = false
          onDragState(false, false)
          invalidate()
        }}
      />
      <mesh ref={glowRef} />
      <mesh ref={glowArcRef} />
    </group>
  )
}

/* -------------------------------------------------------------------------
   Public component.
   ------------------------------------------------------------------------- */

class WebGLBoundary extends React.Component<{ fallback: React.ReactNode; children?: React.ReactNode }, { failed: boolean }> {
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

export default function FerrofluidOrb({ className, status, searching = false, onStatusChange }: FerrofluidOrbProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const statusRef = useRef<OrbVisualStatus>(status)
  useEffect(() => {
    statusRef.current = status
  }, [status])

  const statusChangeRef = useRef(onStatusChange)
  useEffect(() => {
    statusChangeRef.current = onStatusChange
  }, [onStatusChange])

  // Suppress the wrapper button's onClick right after a real drag ends so a
  // shake doesn't toggle the connection. Plain taps never suppress: the
  // `moving` flag is cleared on every pointerup so clicks always propagate.
  const dragState = useRef({ moving: false, suppressUntil: 0 })
  const onDragState = (dragging: boolean, suppressClick = false) => {
    dragState.current.moving = dragging
    if (dragging) dragState.current.suppressUntil = 0
    else if (suppressClick) dragState.current.suppressUntil = performance.now() + 100
  }

  return (
    <div
      className={className}
      onClickCapture={(e) => {
        const d = dragState.current
        if (d.moving || performance.now() < d.suppressUntil) {
          e.stopPropagation()
          e.preventDefault()
        }
      }}
    >
      <WebGLBoundary fallback={<OrbFallback />}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 0, 4.4], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          frameloop="demand"
          resize={{ scroll: false }}
          style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'grab', outline: 'none' }}
        >
          {mounted && (
            <FluidMesh
              statusRef={statusRef}
              searching={searching}
              onStatusChange={(s) => statusChangeRef.current?.(s)}
              onDragState={onDragState}
            />
          )}
        </Canvas>
      </WebGLBoundary>
      {mounted ? null : <OrbFallback />}
    </div>
  )
}