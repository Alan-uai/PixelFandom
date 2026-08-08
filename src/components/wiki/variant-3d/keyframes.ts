'use client';

/* Ambient looping keyframes for the variant-3d presets. Injected once into a
   <style> tag (same pattern as variant-animated-value.tsx) so they are
   available globally without touching the tailwind config. */

let injected = false;

export function ensureVariant3DKeyframes(): void {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  const styleId = 'variant-3d-kf';
  if (document.getElementById(styleId)) return;
  const el = document.createElement('style');
  el.id = styleId;
  el.textContent = `
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
@media (prefers-reduced-motion: reduce) {
  .v3d-ambient-float,
  .v3d-ambient-glow,
  .v3d-ambient-breathe,
  .v3d-ambient-drift,
  .v3d-ambient-pulse,
  .v3d-ambient-spin,
  .v3d-ambient-tilt {
    animation: none;
  }
}
`;
  document.head.appendChild(el);
}
