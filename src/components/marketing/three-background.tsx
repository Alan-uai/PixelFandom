'use client';

import { useEffect, useRef } from 'react';

export default function ThreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let mouseX = 0;
    let mouseY = 0;
    let time = 0;

    const particles: { x: number; y: number; z: number; vx: number; vy: number; size: number; speed: number }[] = [];
    const PARTICLE_COUNT = 160;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function initParticles() {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: (Math.random() - 0.5) * 2000,
          y: (Math.random() - 0.5) * 2000,
          z: Math.random() * 1000,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 0.5 + 0.2,
        });
      }
    }

    resize();
    initParticles();

    function drawGrid(cx: number, cy: number) {
      const spacing = 40;
      const range = 600;
      const offsetX = (mouseX - cx) * 0.02;
      const offsetY = (mouseY - cy) * 0.02;

      ctx!.strokeStyle = 'rgba(75, 197, 255, 0.06)';
      ctx!.lineWidth = 0.5;

      for (let x = -range; x <= range; x += spacing) {
        const px = cx + x + offsetX * (x / range);
        const wave = Math.sin(time * 0.001 + x * 0.01) * 3;
        ctx!.beginPath();
        ctx!.moveTo(px, cy - range + wave);
        ctx!.lineTo(px, cy + range + wave);
        ctx!.stroke();
      }

      for (let y = -range; y <= range; y += spacing) {
        const py = cy + y + offsetY * (y / range);
        const wave = Math.cos(time * 0.001 + y * 0.01) * 3;
        ctx!.beginPath();
        ctx!.moveTo(cx - range + wave, py);
        ctx!.lineTo(cx + range + wave, py);
        ctx!.stroke();
      }
    }

    function drawParticles(cx: number, cy: number) {
      const sorted = [...particles].sort((a, b) => a.z - b.z);

      for (const p of sorted) {
        const scale = 400 / (400 + p.z);
        const px = cx + (p.x + (mouseX - cx) * p.z * 0.0001) * scale;
        const py = cy + (p.y + (mouseY - cy) * p.z * 0.0001) * scale;
        const size = p.size * scale;

        p.x += p.vx;
        p.y += p.vy;

        if (Math.abs(p.x) > 1000) p.vx *= -1;
        if (Math.abs(p.y) > 1000) p.vy *= -1;

        const alpha = Math.max(0, 1 - p.z / 1000) * 0.8;
        ctx!.beginPath();
        ctx!.arc(px, py, size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(75, 197, 255, ${alpha})`;
        ctx!.fill();

        const dist = Math.hypot(px - cx, py - cy);
        if (dist < 250) {
          ctx!.beginPath();
          ctx!.moveTo(cx, cy);
          ctx!.lineTo(px, py);
          ctx!.strokeStyle = `rgba(75, 197, 255, ${alpha * 0.15 * (1 - dist / 250)})`;
          ctx!.lineWidth = 0.3;
          ctx!.stroke();
        }
      }
    }

    function drawFloatingOrbs(cx: number, cy: number) {
      const orbCount = 3;
      for (let i = 0; i < orbCount; i++) {
        const angle = time * 0.0003 + (i * Math.PI * 2) / orbCount;
        const radius = 180 + Math.sin(time * 0.0005 + i) * 30;
        const ox = cx + Math.cos(angle) * radius;
        const oy = cy + Math.sin(angle) * radius * 0.6;
        const gradient = ctx!.createRadialGradient(ox, oy, 0, ox, oy, 60);
        gradient.addColorStop(0, 'rgba(75, 197, 255, 0.04)');
        gradient.addColorStop(0.5, 'rgba(75, 197, 255, 0.02)');
        gradient.addColorStop(1, 'rgba(75, 197, 255, 0)');
        ctx!.fillStyle = gradient;
        ctx!.beginPath();
        ctx!.arc(ox, oy, 60, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function animate() {
      const cx = canvas!.width / 2;
      const cy = canvas!.height / 2;
      time += 1;

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      drawGrid(cx, cy);
      drawFloatingOrbs(cx, cy);
      drawParticles(cx, cy);

      animId = requestAnimationFrame(animate);
    }

    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    function onResize() {
      resize();
    }

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
      style={{ opacity: 0.6 }}
    />
  );
}
