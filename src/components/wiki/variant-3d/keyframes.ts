'use client';

/* Single source of truth for all variant-3d keyframes:
   - Ambient looping presets (float, glow, breathe, etc.)
   - Beam / reflection transition (used by listing + detail views)
   - Flip-in / content-expand (used by detail views)
   Injected once into a <style> tag so they are available globally
   without touching the tailwind config. */

let injected = false;

export function ensureVariant3DKeyframes(): void {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const styleId = 'variant-3d-kf';
  if (document.getElementById(styleId)) return;
  const el = document.createElement('style');
  el.id = styleId;
  el.textContent = `
/* ── Ambient looping presets ── */
@keyframes v3d-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes v3d-glow {
  0%, 100% { box-shadow: 0 4px 16px -6px rgba(59,130,246,0.25); }
  50% { box-shadow: 0 8px 24px -6px rgba(59,130,246,0.45); }
}
@keyframes v3d-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}
@keyframes v3d-drift {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(3px); }
}
@keyframes v3d-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.92; }
}
@keyframes v3d-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes v3d-tilt {
  0%, 100% { transform: rotateX(0deg) rotateY(0deg); }
  50% { transform: rotateX(4deg) rotateY(6deg); }
}
.v3d-ambient-float { animation: v3d-float 3.2s ease-in-out infinite; }
.v3d-ambient-glow { animation: v3d-glow 2.8s ease-in-out infinite; }
.v3d-ambient-breathe { animation: v3d-breathe 3.6s ease-in-out infinite; }
.v3d-ambient-drift { animation: v3d-drift 4s ease-in-out infinite; }
.v3d-ambient-pulse { animation: v3d-pulse 2.4s ease-in-out infinite; }
.v3d-ambient-spin { animation: v3d-spin 6s linear infinite; }
.v3d-ambient-tilt { animation: v3d-tilt 5s ease-in-out infinite; }

/* ── Beam sweep (gold diagonal) for variant-switch transition ── */
@keyframes variant-beam-ltr {
  0% { left: -35%; opacity: 0; }
  15% { opacity: 1; }
  100% { left: 110%; opacity: 0; }
}
@keyframes variant-beam-rtl {
  0% { right: -35%; left: auto; opacity: 0; }
  15% { opacity: 1; }
  100% { right: 110%; opacity: 0; }
}
.variant-beam-ltr { animation: variant-beam-ltr 0.75s ease-in-out; }
.variant-beam-rtl { animation: variant-beam-rtl 0.75s ease-in-out; }

/* ── Reflection (bright sweep that settles after the beam) ── */
@keyframes variant-reflection {
  0% { transform: translateX(-60%) skewX(-18deg); opacity: 0; }
  40% { opacity: 0.6; }
  100% { transform: translateX(160%) skewX(-18deg); opacity: 0; }
}
.variant-3d-transition::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%);
  animation: variant-reflection 0.8s ease-out;
  z-index: 5;
}

/* ── Heading / icon entrance (category & variant name) ── */
@keyframes variant-head-in {
  0% { opacity: 0; transform: translateY(12px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.variant-head-in { animation: variant-head-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both; }

/* ── 3D Icon pop (full rotateX/Y + translateZ entrance) ── */
@keyframes variant-icon-3d {
  0% {
    opacity: 0;
    transform: perspective(400px) rotateX(-25deg) rotateY(25deg) translateZ(-30px) scale(0.5);
    filter: blur(2px);
  }
  40% {
    opacity: 0.8;
    transform: perspective(400px) rotateX(8deg) rotateY(-6deg) translateZ(10px) scale(1.1);
    filter: blur(0);
  }
  70% {
    transform: perspective(400px) rotateX(-3deg) rotateY(2deg) translateZ(4px) scale(1.03);
  }
  100% {
    opacity: 1;
    transform: perspective(400px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1);
    filter: blur(0);
  }
}
.variant-icon-3d {
  animation: variant-icon-3d 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transform-style: preserve-3d;
}

/* ── Text scramble entrance (3D flip + blur reveal) ── */
@keyframes variant-text-scramble {
  0% {
    opacity: 0;
    transform: perspective(500px) rotateX(-40deg) translateZ(-20px);
    filter: blur(4px);
  }
  30% {
    opacity: 0.7;
    transform: perspective(500px) rotateX(10deg) translateZ(8px);
    filter: blur(1px);
  }
  60% {
    opacity: 1;
    transform: perspective(500px) rotateX(-4deg) translateZ(-2px);
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: perspective(500px) rotateX(0deg) translateZ(0px);
    filter: blur(0);
  }
}
.variant-text-scramble {
  animation: variant-text-scramble 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  transform-style: preserve-3d;
}

/* ── Badge draw (SVG stroke draw + clip reveal, staggered via animation-delay) ── */
@keyframes variant-badge-draw {
  0% {
    clip-path: circle(0% at 50% 50%);
    opacity: 0;
    transform: scale(0.6) translateZ(10px);
  }
  50% {
    opacity: 1;
    transform: scale(1.08) translateZ(4px);
  }
  100% {
    clip-path: circle(50% at 50% 50%);
    opacity: 1;
    transform: scale(1) translateZ(0px);
  }
}
.variant-badge-draw {
  animation: variant-badge-draw 0.45s ease-out both;
  transform-style: preserve-3d;
}

/* Legacy icon pop (kept for backward compat) */
@keyframes variant-icon-pop {
  0% { opacity: 0; transform: scale(0.4) rotate(-18deg); }
  60% { transform: scale(1.12) rotate(3deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}
.variant-icon-pop { animation: variant-icon-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

/* ── Flip-in (detail card entrance during variant switch) ── */
@keyframes variant-3d-flip-in {
  0% { transform: scale(0.97); }
  100% { transform: scale(1); }
}
.variant-3d-flip-in {
  animation: variant-3d-flip-in 0.45s ease-out;
  transform-style: preserve-3d;
}

/* ── Content expand (detail body settles after flip-in) ── */
@keyframes variant-content-expand {
  0% { transform: translateY(-8px) scaleY(0.96); }
  100% { transform: translateY(0) scaleY(1); }
}
.variant-content-expand {
  animation: variant-content-expand 0.35s ease-out 0.05s both;
  transform-origin: top;
}

/* ── Reduced-motion overrides ── */
@media (prefers-reduced-motion: reduce) {
  .v3d-ambient-float,
  .v3d-ambient-glow,
  .v3d-ambient-breathe,
  .v3d-ambient-drift,
  .v3d-ambient-pulse,
  .v3d-ambient-spin,
  .v3d-ambient-tilt,
  .variant-beam-ltr,
  .variant-beam-rtl,
  .variant-icon-3d,
  .variant-text-scramble,
  .variant-badge-draw {
    animation: none;
  }
}
@media (prefers-reduced-motion: no-preference) {
  .variant-beam-ltr, .variant-beam-rtl { will-change: left, opacity; }
}
`;
  document.head.appendChild(el);
}
