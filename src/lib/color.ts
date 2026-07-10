'use client';

export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  const toHex = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export function isColorString(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim());
}

export function hexToStyle(v: string): { color: string; borderColor: string; backgroundColor: string } | null {
  if (!isColorString(v)) return null;
  const hsl = hexToHsl(v);
  if (!hsl) return null;
  return {
    color: `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)`,
    borderColor: `hsl(${hsl.h} ${hsl.s}% ${hsl.l}% / 0.3)`,
    backgroundColor: `hsl(${hsl.h} ${hsl.s}% ${hsl.l}% / 0.1)`,
  };
}

export function hueToHex(hue: number, saturation = 75, lightness = 58): string {
  return hslToHex(hue, saturation, lightness);
}

export function hexToHue(hex: string): number {
  return hexToHsl(hex)?.h ?? 0;
}

export function hexToSaturation(hex: string): number {
  return hexToHsl(hex)?.s ?? 75;
}

export function hexToLightness(hex: string): number {
  return hexToHsl(hex)?.l ?? 58;
}
