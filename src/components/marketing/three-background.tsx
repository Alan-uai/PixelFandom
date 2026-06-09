'use client';

import { useEffect, useRef } from 'react';

interface Vec3 { x: number; y: number; z: number; }
interface Shape3D { type: 'torus' | 'octahedron' | 'cube'; x: number; y: number; z: number; rotX: number; rotY: number; rotZ: number; size: number; color: string; speed: number; }

function rotateX(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}
function rotateY(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}
function rotateZ(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c, z: v.z };
}

function project3D(x: number, y: number, z: number, w: number, h: number, mx: number, my: number): { sx: number; sy: number; scale: number } {
  const perspective = 800 / (800 + z);
  const px = (mouseX - w / 2) * 0.02;
  const py = (mouseY - h / 2) * 0.02;
  return { sx: (x + px * (z * 0.01)) * perspective + w / 2, sy: (y + py * (z * 0.01)) * perspective + h / 2, scale: perspective };
}

let mouseX = 0;
let mouseY = 0;

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w / 2;
  const cy = h / 2 + 100;
  const spacing = 50;
  const range = 1200;
  const mx = (mouseX - cx) * 0.015;
  const my = (mouseY - cy) * 0.015;
  ctx.strokeStyle = 'rgba(75, 197, 255, 0.04)';
  ctx.lineWidth = 0.5;
  for (let x = -range; x <= range; x += spacing) {
    const zz = Math.abs(x) / range;
    const depth = 1 - zz;
    const px = cx + (x + mx * depth * 200) * depth;
    const py = cy + range * depth + my * depth * 0.5;
    ctx.globalAlpha = Math.max(0, depth * 0.5);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py - range * 2 * depth);
    ctx.stroke();
  }
  for (let y = -range; y <= range; y += spacing) {
    const zz = Math.abs(y) / range;
    const depth = 1 - zz;
    const px = cx + range * depth + mx * depth * 0.5;
    const py = cy + (y + my * depth * 200) * depth;
    ctx.globalAlpha = Math.max(0, depth * 0.5);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - range * 2 * depth, py);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawOrbs(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const colors = ['#4BC5FF', '#7C3AED', '#F43F5E'];
  const cx = w / 2;
  const cy = h / 2;
  const mx = (mouseX - cx) * 0.01;
  const my = (mouseY - cy) * 0.01;
  for (let i = 0; i < 3; i++) {
    const angle = t * 0.0003 + i * 2.094;
    const rad = 200 + Math.sin(t * 0.0004 + i * 1.5) * 40;
    const ox = cx + Math.cos(angle) * rad + mx * 0.3;
    const oy = cy + Math.sin(angle) * rad * 0.6 + my * 0.3;
    const r = 80 + Math.sin(t * 0.0005 + i) * 20;
    const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
    const color = colors[i];
    const r2 = parseInt(color.slice(1, 3), 16);
    const g2 = parseInt(color.slice(3, 5), 16);
    const b2 = parseInt(color.slice(5, 7), 16);
    grad.addColorStop(0, `rgba(${r2},${g2},${b2},0.08)`);
    grad.addColorStop(0.4, `rgba(${r2},${g2},${b2},0.04)`);
    grad.addColorStop(1, `rgba(${r2},${g2},${b2},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const sorted = [...particles].sort((a, b) => a.z - b.z);
  for (const p of sorted) {
    const pj = project3D(p.x, p.y, p.z, w, h, mouseX, mouseY);
    const sz = p.size * pj.scale;
    p.x += p.vx;
    p.y += p.vy;
    p.z += p.vz;
    if (Math.abs(p.x) > 1200) p.vx *= -1;
    if (Math.abs(p.y) > 1200) p.vy *= -1;
    if (p.z < 0 || p.z > 1000) p.vz *= -1;
    const alpha = Math.max(0, 1 - p.z / 1000) * 0.7;
    const bright = 0.5 + p.bright * 0.5;
    ctx.beginPath();
    ctx.arc(pj.sx, pj.sy, sz, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(75, 197, 255, ${alpha * bright})`;
    ctx.fill();
    const dist = Math.hypot(pj.sx - cx, pj.sy - cy);
    if (dist < 300) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(pj.sx, pj.sy);
      ctx.strokeStyle = `rgba(75, 197, 255, ${alpha * 0.12 * bright * (1 - dist / 300)})`;
      ctx.lineWidth = 0.3;
      ctx.stroke();
    }
  }
}

function drawShape3D(ctx: CanvasRenderingContext2D, s: Shape3D, w: number, h: number, t: number) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = s.rotX + t * s.speed * 0.0006;
  const ry = s.rotY + t * s.speed * 0.0008;
  const rz = s.rotZ + t * s.speed * 0.0004;

  const pj = project3D(s.x, s.y, s.z, w, h, mouseX, mouseY);

  if (s.type === 'torus') {
    const segments = 24;
    const tubeSegments = 12;
    const R = s.size;
    const r = s.size * 0.35;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.2;

    for (let i = 0; i < segments; i++) {
      const theta1 = (i / segments) * Math.PI * 2;
      const theta2 = ((i + 1) / segments) * Math.PI * 2;
      for (let j = 0; j < tubeSegments; j++) {
        const phi1 = (j / tubeSegments) * Math.PI * 2;
        const phi2 = ((j + 1) / tubeSegments) * Math.PI * 2;

        const pts = [
          { x: (R + r * Math.cos(phi1)) * Math.cos(theta1), y: (R + r * Math.cos(phi1)) * Math.sin(theta1), z: r * Math.sin(phi1) },
          { x: (R + r * Math.cos(phi2)) * Math.cos(theta1), y: (R + r * Math.cos(phi2)) * Math.sin(theta1), z: r * Math.sin(phi2) },
          { x: (R + r * Math.cos(phi2)) * Math.cos(theta2), y: (R + r * Math.cos(phi2)) * Math.sin(theta2), z: r * Math.sin(phi2) },
          { x: (R + r * Math.cos(phi1)) * Math.cos(theta2), y: (R + r * Math.cos(phi1)) * Math.sin(theta2), z: r * Math.sin(phi1) },
        ];

        for (const pt of pts) {
          let v = rotateX(pt, rx);
          v = rotateY(v, ry);
          v = rotateZ(v, rz);
          pt.x = v.x; pt.y = v.y; pt.z = v.z;
        }

        const zAvg = (pts[0].z + pts[1].z + pts[2].z + pts[3].z) / 4;
        const alphaFactor = Math.max(0, (zAvg + R * 1.5) / (R * 3));
        const alpha = 0.15 + alphaFactor * 0.5;

        ctx.beginPath();
        ctx.moveTo(pj.sx + pts[0].x * pj.scale, pj.sy + pts[0].y * pj.scale);
        ctx.lineTo(pj.sx + pts[1].x * pj.scale, pj.sy + pts[1].y * pj.scale);
        ctx.lineTo(pj.sx + pts[2].x * pj.scale, pj.sy + pts[2].y * pj.scale);
        ctx.lineTo(pj.sx + pts[3].x * pj.scale, pj.sy + pts[3].y * pj.scale);
        ctx.closePath();
        ctx.strokeStyle = s.color.replace('1)', `${alpha})`);
        ctx.stroke();
      }
    }
  }

  if (s.type === 'octahedron') {
    const d = s.size;
    const verts: Vec3[] = [
      { x: 0, y: d, z: 0 }, { x: 0, y: -d, z: 0 },
      { x: d, y: 0, z: 0 }, { x: -d, y: 0, z: 0 },
      { x: 0, y: 0, z: d }, { x: 0, y: 0, z: -d },
    ];
    const faces: [number, number, number][] = [
      [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
      [1, 4, 2], [1, 3, 4], [1, 5, 3], [1, 2, 5],
    ];
    const rotated = verts.map(v => rotateZ(rotateY(rotateX(v, rx), ry), rz));
    const projected = rotated.map(v => ({ sx: pj.sx + v.x * pj.scale, sy: pj.sy + v.y * pj.scale, z: v.z }));

    const color = s.color;
    const r2 = parseInt(color.slice(1, 3), 16);
    const g2 = parseInt(color.slice(3, 5), 16);
    const b2 = parseInt(color.slice(5, 7), 16);

    for (const f of faces) {
      const [a, b, c] = f;
      const zAvg = (rotated[a].z + rotated[b].z + rotated[c].z) / 3;
      const alpha = Math.max(0.1, (zAvg + d) / (d * 2)) * 0.5;
      ctx.beginPath();
      ctx.moveTo(projected[a].sx, projected[a].sy);
      ctx.lineTo(projected[b].sx, projected[b].sy);
      ctx.lineTo(projected[c].sx, projected[c].sy);
      ctx.closePath();
      ctx.fillStyle = `rgba(${r2},${g2},${b2},${alpha * 0.3})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${r2},${g2},${b2},${alpha * 0.7})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  if (s.type === 'cube') {
    const d = s.size;
    const verts: Vec3[] = [
      { x: -d, y: -d, z: -d }, { x: d, y: -d, z: -d }, { x: d, y: d, z: -d }, { x: -d, y: d, z: -d },
      { x: -d, y: -d, z: d }, { x: d, y: -d, z: d }, { x: d, y: d, z: d }, { x: -d, y: d, z: d },
    ];
    const faces: [number, number, number, number, string][] = [
      [4, 5, 6, 7, 'front'],
      [0, 1, 5, 4, 'top'],
      [0, 4, 7, 3, 'left'],
    ];

    const rotated = verts.map(v => rotateZ(rotateY(rotateX(v, rx), ry), rz));
    const projected = rotated.map(v => ({ sx: pj.sx + v.x * pj.scale, sy: pj.sy + v.y * pj.scale, z: v.z }));

    const color = s.color;
    const r2 = parseInt(color.slice(1, 3), 16);
    const g2 = parseInt(color.slice(3, 5), 16);
    const b2 = parseInt(color.slice(5, 7), 16);

    const faceAlpha: Record<string, number> = { front: 1, top: 0.6, left: 0.35 };

    for (const f of faces) {
      const [a, b, c, d2, label] = f;
      const zAvg = (rotated[a].z + rotated[b].z + rotated[c].z + rotated[d2].z) / 4;
      const alpha = Math.max(0.1, (zAvg + s.size) / (s.size * 2)) * faceAlpha[label] * 0.6;

      if (alpha <= 0.05) continue;
      ctx.beginPath();
      ctx.moveTo(projected[a].sx, projected[a].sy);
      ctx.lineTo(projected[b].sx, projected[b].sy);
      ctx.lineTo(projected[c].sx, projected[c].sy);
      ctx.lineTo(projected[d2].sx, projected[d2].sy);
      ctx.closePath();
      ctx.fillStyle = `rgba(${r2},${g2},${b2},${alpha * 0.25})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${r2},${g2},${b2},${alpha * 0.8})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
}

interface Particle { x: number; y: number; z: number; vx: number; vy: number; vz: number; size: number; bright: number; }

export default function ThreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const w = () => canvas!.width;
    const h = () => canvas!.height;

    const particles: Particle[] = [];
    const PARTICLE_COUNT = 250;

    const shapes: Shape3D[] = [
      { type: 'torus', x: 0, y: -60, z: 200, rotX: 0.8, rotY: 0, rotZ: 0, size: 90, color: 'rgba(124, 58, 237, 1)', speed: 0.6 },
      { type: 'octahedron', x: -160, y: 80, z: 400, rotX: 0.3, rotY: 0.7, rotZ: 0, size: 55, color: 'rgba(244, 63, 94, 1)', speed: 0.8 },
      { type: 'cube', x: 160, y: -40, z: 500, rotX: 0.5, rotY: 0.2, rotZ: 0.3, size: 50, color: 'rgba(75, 197, 255, 1)', speed: 0.5 },
    ];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 2400,
        y: (Math.random() - 0.5) * 2400,
        z: Math.random() * 1000,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        vz: (Math.random() - 0.5) * 0.05,
        size: Math.random() * 2 + 1,
        bright: 0.3 + Math.random() * 0.7,
      });
    }

    resize();

    function animate() {
      time += 1;
      const cw = w();
      const ch = h();
      ctx!.clearRect(0, 0, cw, ch);

      drawGrid(ctx!, cw, ch, time);
      drawOrbs(ctx!, cw, ch, time);
      drawParticles(ctx!, particles, cw, ch);
      for (const s of shapes) drawShape3D(ctx!, s, cw, ch, time);

      animId = requestAnimationFrame(animate);
    }

    function onMouseMove(e: MouseEvent) { mouseX = e.clientX; mouseY = e.clientY; }
    function onResize() { resize(); }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
