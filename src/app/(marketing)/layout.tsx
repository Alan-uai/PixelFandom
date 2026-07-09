'use client';

import { useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { AuthDialogProvider } from '@/context/auth-dialog-context';
import ThreeBackground from '@/components/marketing/three-background';
import SplashScreen from '@/components/marketing/splash-screen';
import FloatingNavStrip from '@/components/marketing/floating-nav-strip';

function FloatingNav() {
  const [show, setShow] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(() => {
          setShow(window.scrollY > 60);
          ticking.current = false;
        });
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}
    >
      <button
        onClick={scrollToTop}
        className="flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/[0.08] px-4 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)] cursor-pointer hover:bg-black/70 transition-colors"
      >
        <span className="text-sm font-semibold font-display text-gradient-cyan">
          PixelFandom
        </span>
      </button>
    </nav>
  );
}

function LayoutContent({ children }: { children: ReactNode }) {
  const [navStripOutOfView, setNavStripOutOfView] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const target = document.getElementById('navstrip-origin');
      if (!target) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          setNavStripOutOfView(
            !entry.isIntersecting && entry.boundingClientRect.top < 0
          );
        },
        { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
      );
      observer.observe(target);
      return () => observer.disconnect();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <FloatingNav />
      <FloatingNavStrip show={navStripOutOfView} />
      <main className="flex flex-1 flex-col relative z-10">
        {children}
      </main>
    </>
  );
}

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashComplete = useCallback(() => {
    try {
      localStorage.setItem('pf_splash', new Date().toISOString());
    } catch {/* noop */}
    setSplashDone(true);
  }, []);

  return (
    <AuthDialogProvider>
      <div className="flex min-h-screen w-full flex-col relative overflow-x-hidden">
        <ThreeBackground />
        <LayoutContent>
          {children}
        </LayoutContent>
        {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      </div>
    </AuthDialogProvider>
  );
}
