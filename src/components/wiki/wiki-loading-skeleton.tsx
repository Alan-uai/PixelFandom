'use client';

import { useState } from 'react';

type CenterMotif = 'orb' | 'cube' | 'plates' | 'none';

const MOTIFS: CenterMotif[] = ['orb', 'cube', 'plates', 'none'];

/** Shared glass + depth surface used by every skeleton block. */
const SURFACE =
  'relative overflow-hidden rounded-2xl border border-primary/20 bg-card/60 shadow-lg shadow-primary/5 backdrop-blur-md';

/** Primary-tinted shimmer fill applied over glass surfaces. */
function Sheen() {
  return (
    <span
      aria-hidden
      className="skeleton-sheen pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
    </span>
  );
}

/** Pulsing glass core used inside 3D centerpieces. */
function GlassCore({ size = 56 }: { size?: number }) {
  return (
    <span
      className="skeleton-core absolute rounded-full"
      style={{
        width: size,
        height: size,
        background:
          'radial-gradient(circle at 35% 30%, hsl(var(--primary-lighter) / 0.95), hsl(var(--primary) / 0.55) 55%, transparent 72%)',
        boxShadow: '0 0 28px 6px hsl(var(--primary) / 0.45)',
      }}
    />
  );
}

/* ───────────────────────────── Centerpieces ───────────────────────────── */

function OrbCenterpiece() {
  return (
    <div className="relative flex h-44 w-44 items-center justify-center [perspective:900px]">
      {/* orbiting rings */}
      <div
        className="skeleton-orbit preserve-3d absolute h-40 w-40 rounded-full border border-primary/30"
        style={{ transform: 'rotateX(74deg)' }}
      />
      <div
        className="skeleton-orbit preserve-3d absolute h-32 w-32 rounded-full border border-primary/25"
        style={{ transform: 'rotateX(74deg) rotateZ(60deg)', animationDirection: 'reverse', animationDuration: '5s' }}
      />
      <div
        className="skeleton-orbit preserve-3d absolute h-24 w-24 rounded-full border border-primary/20"
        style={{ transform: 'rotateX(74deg) rotateZ(120deg)', animationDuration: '4s' }}
      />
      {/* glass sphere */}
      <div
        className="preserve-3d absolute h-24 w-24 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 32% 28%, hsl(0 0% 100% / 0.55), hsl(var(--primary) / 0.25) 45%, hsl(var(--primary) / 0.05) 70%)',
          border: '1px solid hsl(var(--primary) / 0.4)',
          boxShadow: 'inset 0 0 24px hsl(var(--primary) / 0.35), 0 12px 40px hsl(var(--primary) / 0.25)',
          backdropFilter: 'blur(2px)',
        }}
      >
        <GlassCore size={48} />
      </div>
    </div>
  );
}

function CubeCenterpiece() {
  const faces: React.CSSProperties[] = [
    { transform: 'rotateY(0deg) translateZ(46px)' },
    { transform: 'rotateY(90deg) translateZ(46px)' },
    { transform: 'rotateY(180deg) translateZ(46px)' },
    { transform: 'rotateY(-90deg) translateZ(46px)' },
    { transform: 'rotateX(90deg) translateZ(46px)' },
    { transform: 'rotateX(-90deg) translateZ(46px)' },
  ];
  return (
    <div className="relative flex h-44 w-44 items-center justify-center [perspective:900px]">
      <div className="skeleton-cube preserve-3d relative h-24 w-24">
        {faces.map((style, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute inset-0 rounded-lg border border-primary/35 bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm"
            style={{
              ...style,
              boxShadow: 'inset 0 0 18px hsl(var(--primary) / 0.25)',
            }}
          />
        ))}
        <GlassCore size={34} />
      </div>
    </div>
  );
}

function PlatesCenterpiece() {
  const plates = [
    { z: 36, w: 120, o: 0.28, d: '0s' },
    { z: 24, w: 150, o: 0.2, d: '0.4s' },
    { z: 12, w: 178, o: 0.14, d: '0.8s' },
  ];
  return (
    <div className="relative flex h-44 w-44 items-center justify-center [perspective:1000px]">
      <div className="skeleton-float preserve-3d relative" style={{ transformStyle: 'preserve-3d' }}>
        {plates.map((p, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute left-1/2 top-1/2 rounded-2xl border border-primary/30 bg-card/70 backdrop-blur-md"
            style={{
              width: p.w,
              height: p.w * 0.62,
              marginLeft: -p.w / 2,
              marginTop: -(p.w * 0.62) / 2,
              transform: `translateZ(${p.z}px)`,
              opacity: p.o,
              boxShadow: '0 14px 36px hsl(var(--primary) / 0.18)',
              animationDelay: p.d,
            }}
          />
        ))}
        <GlassCore size={40} />
      </div>
    </div>
  );
}

function Centerpiece({ motif }: { motif: CenterMotif }) {
  if (motif === 'orb') return <OrbCenterpiece />;
  if (motif === 'cube') return <CubeCenterpiece />;
  if (motif === 'plates') return <PlatesCenterpiece />;
  return null;
}

/* ───────────────────────────── Skeleton blocks ───────────────────────────── */

function NavBar() {
  return (
    <div className="mb-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl border border-primary/30 bg-card/70 shadow-md shadow-primary/10" />
        <div className="h-4 w-32 rounded bg-muted/80" />
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-16 rounded-full bg-muted/60" />
        ))}
      </div>
      <div className="h-9 w-9 rounded-full border border-primary/30 bg-card/70" />
    </div>
  );
}

function HeroCover() {
  return (
    <div className={`${SURFACE} mb-10 h-44 transform md:h-60 [perspective:1200px]`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
      <Sheen />
    </div>
  );
}

function HeaderRow() {
  return (
    <div className="mb-10 flex items-center gap-4">
      <div className="h-16 w-16 shrink-0 rounded-2xl border border-primary/30 bg-card/70 shadow-lg shadow-primary/10" />
      <div className="flex-1 space-y-2">
        <div className="h-6 w-56 rounded bg-muted/80" />
        <div className="h-4 w-80 max-w-full rounded bg-muted/60" />
      </div>
    </div>
  );
}

function GameCardGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="mb-12 [perspective:1200px]">
      <div className="mb-4 h-5 w-40 rounded bg-muted/70" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`${SURFACE} h-28 transform transition-transform`}
            style={{ animationDelay: `${(i % 4) * 0.15}s` }}
          >
            <div className="absolute left-3 top-3 h-8 w-8 rounded-lg bg-muted/70" />
            <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
              <div className="h-3 w-3/4 rounded bg-muted/70" />
              <div className="h-2.5 w-1/2 rounded bg-muted/50" />
            </div>
            <Sheen />
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticleList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      <div className="mb-4 h-5 w-44 rounded bg-muted/70" />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${SURFACE} h-16 p-3`}>
          <div className="mb-2 h-3.5 w-2/3 rounded bg-muted/70" />
          <div className="h-2.5 w-full rounded bg-muted/50" />
          <Sheen />
        </div>
      ))}
    </div>
  );
}

function SidebarPlaceholder() {
  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className={`${SURFACE} h-72 p-4`}>
        <div className="mb-4 h-4 w-28 rounded bg-muted/70" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 w-full rounded bg-muted/50" style={{ width: `${90 - i * 8}%` }} />
          ))}
        </div>
        <Sheen />
      </div>
    </aside>
  );
}

function CenterStage({ motif }: { motif: CenterMotif }) {
  return (
    <div className="mb-10 flex justify-center">
      <Centerpiece motif={motif} />
    </div>
  );
}

/* ───────────────────────────── Public component ───────────────────────────── */

export function WikiLoadingSkeleton({ variant = 'full' }: { variant?: 'full' | 'content' }) {
  const [motif] = useState<CenterMotif>(() => MOTIFS[Math.floor(Math.random() * MOTIFS.length)]);

  if (variant === 'full') {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="min-h-screen w-full bg-background px-4 py-6 md:px-8"
      >
        <span className="sr-only">Carregando wiki…</span>
        <div className="mx-auto flex max-w-6xl gap-6">
          <SidebarPlaceholder />
          <div className="min-w-0 flex-1">
            <NavBar />
            <CenterStage motif={motif} />
            <HeroCover />
            <HeaderRow />
            <GameCardGrid />
            <ArticleList />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="w-full bg-background px-4 py-6"
    >
      <span className="sr-only">Carregando wiki…</span>
      <div className="mx-auto max-w-4xl">
        <CenterStage motif={motif} />
        <HeroCover />
        <HeaderRow />
        <GameCardGrid count={4} />
        <ArticleList count={3} />
      </div>
    </div>
  );
}
