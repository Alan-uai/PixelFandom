'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.parentElement!.offsetWidth;
    let h = canvas.parentElement!.offsetHeight;
    canvas.width = w;
    canvas.height = h;

    const count = 80;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 1.5 + 0.5,
    }));

    const onMouse = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('mousemove', onMouse);
    window.addEventListener('mouseleave', onLeave);

    const animate = () => {
      ctx!.clearRect(0, 0, w, h);
      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const force = (200 - dist) / 200;
          p.vx += (dx / dist) * force * 0.3;
          p.vy += (dy / dist) * force * 0.3;
        }

        p.vx += (Math.random() - 0.5) * 0.05;
        p.vy += (Math.random() - 0.5) * 0.05;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(75, 197, 255, 0.4)';
        ctx!.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const lx = p.x - q.x;
          const ly = p.y - q.y;
          const ld = Math.sqrt(lx * lx + ly * ly);
          if (ld < 150) {
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(q.x, q.y);
            ctx!.strokeStyle = `rgba(75, 197, 255, ${(1 - ld / 150) * 0.15})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    const onResize = () => {
      w = canvas.parentElement!.offsetWidth;
      h = canvas.parentElement!.offsetHeight;
      canvas.width = w;
      canvas.height = h;
    };

    window.addEventListener('resize', onResize);
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

const linkSections = [
  {
    title: 'Produto',
    links: [
      { label: 'Sobre', href: '/about' },
      { label: 'Recursos', href: '/features' },
      { label: 'Preços', href: '/pricing' },
    ],
  },
  {
    title: 'Comunidade',
    links: [
      { label: 'Discord', href: 'https://discord.gg/pixelfandom' },
      { label: 'GitHub', href: 'https://github.com/pixelfandom' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Suporte',
    links: [
      { label: 'Documentação', href: '/docs' },
      { label: 'Contato', href: '/contact' },
      { label: 'Status', href: '/status' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Termos de Serviço', href: '/terms' },
      { label: 'Privacidade', href: '/privacy' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Segurança', href: '/security' },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-16 overflow-hidden">
      <ParticleCanvas />

      <div className="relative z-10 max-w-5xl mx-auto px-4 flex flex-col items-center">
        <Link href="/" className="text-gradient-cyan font-display text-2xl tracking-tight">
          PixelFandom
        </Link>

        <div className="mt-10 flex flex-wrap justify-center gap-12 sm:gap-16">
          {linkSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary hover:drop-shadow-[0_0_6px_hsl(198,100%,65%,0.4)] transition-all duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 w-full border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>&copy; {currentYear} PixelFandom. Feito para f&atilde;s.</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-primary hover:drop-shadow-[0_0_6px_hsl(198,100%,65%,0.4)] transition-all duration-300">Termos</Link>
            <Link href="/privacy" className="hover:text-primary hover:drop-shadow-[0_0_6px_hsl(198,100%,65%,0.4)] transition-all duration-300">Privacidade</Link>
            <Link href="/cookies" className="hover:text-primary hover:drop-shadow-[0_0_6px_hsl(198,100%,65%,0.4)] transition-all duration-300">Cookies</Link>
            <Link href="/security" className="hover:text-primary hover:drop-shadow-[0_0_6px_hsl(198,100%,65%,0.4)] transition-all duration-300">Segurança</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
