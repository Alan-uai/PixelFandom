'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TOTAL = 123;
const FRAME_BASE = '/parallax/frame_';
const frameUrl = (i: number) => `${FRAME_BASE}${String(i).padStart(3, '0')}.jpg`;

export default function ParallaxHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const images: (HTMLImageElement | null)[] = new Array(TOTAL).fill(null);
    let current = -1;
    let rafId = 0;

    const drawCover = (img: HTMLImageElement) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = cw / ch;
      let dw: number;
      let dh: number;
      if (ir > cr) {
        dh = ch;
        dw = ch * ir;
      } else {
        dw = cw;
        dh = cw / ir;
      }
      ctx!.clearRect(0, 0, cw, ch);
      ctx!.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    const render = (index: number) => {
      const i = Math.max(0, Math.min(TOTAL - 1, index));
      const img = images[i];
      if (!img || !img.complete || img.naturalWidth === 0) return;
      drawCover(img);
      current = i;
    };

    const preload = (from: number) => {
      const lookahead = 8;
      for (let k = from; k < Math.min(TOTAL, from + lookahead + 1); k++) {
        if (images[k]) continue;
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => {
          if (k <= current + 1 || current < 0) render(k);
        };
        im.src = frameUrl(k);
        images[k] = im;
      }
    };

    const setFrame = (progress: number) => {
      const idx = Math.round(progress * (TOTAL - 1));
      if (idx !== current) {
        render(idx);
        preload(idx);
      }
    };

    const resize = () => {
      const { clientWidth, clientHeight } = section;
      canvas.width = Math.floor(clientWidth * dpr);
      canvas.height = Math.floor(clientHeight * dpr);
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
      render(current < 0 ? 0 : current);
    };

    resize();
    preload(0);
    render(0);

    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=240%',
      pin: true,
      scrub: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => setFrame(self.progress));
      },
    });

    let overlayTween: gsap.core.Tween | undefined;
    if (overlay) {
      overlayTween = gsap.to(overlay, {
        yPercent: -28,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=60%',
          scrub: true,
        },
      });
    }

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
      st.kill();
      overlayTween?.scrollTrigger?.kill();
      overlayTween?.kill();
    };
  }, []);

  return (
    <section
      id="navstrip-origin"
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-black"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      >
        <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)] font-display md:text-7xl">
          PixelFandom
        </h1>
        <p className="mt-4 max-w-xl text-base text-white/80 drop-shadow md:text-lg">
          O universo dos seus games, em uma wiki viva.
        </p>
      </div>
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-xs text-white/70">
        <span>Role para explorar</span>
        <span className="animate-bounce">↓</span>
      </div>
    </section>
  );
}
