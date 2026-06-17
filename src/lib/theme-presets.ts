export interface ThemePresetColors {
  primary: string;
  accent: string;
  background: string;
  card: string;
  foreground?: string;
  muted?: string;
  border?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  mode: 'dark' | 'light';
  colors: ThemePresetColors;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'ciano',
    name: 'Ciano',
    mode: 'dark',
    colors: { primary: '198 100% 65%', accent: '0 100% 65%', background: '0 0% 13%', card: '0 0% 15%', foreground: '0 0% 95%', muted: '240 4% 12%', border: '240 4% 15%' },
  },
  {
    id: 'azul',
    name: 'Azul',
    mode: 'dark',
    colors: { primary: '220 80% 55%', accent: '340 75% 55%', background: '220 30% 10%', card: '220 25% 13%', foreground: '0 0% 95%', muted: '220 20% 16%', border: '220 20% 18%' },
  },
  {
    id: 'roxo',
    name: 'Roxo',
    mode: 'dark',
    colors: { primary: '270 80% 60%', accent: '30 80% 55%', background: '270 30% 10%', card: '270 25% 13%', foreground: '0 0% 95%', muted: '270 20% 16%', border: '270 20% 18%' },
  },
  {
    id: 'rosa',
    name: 'Rosa',
    mode: 'dark',
    colors: { primary: '340 75% 60%', accent: '198 100% 65%', background: '340 30% 12%', card: '340 25% 14%', foreground: '0 0% 95%', muted: '340 20% 18%', border: '340 20% 20%' },
  },
  {
    id: 'vermelho',
    name: 'Vermelho',
    mode: 'dark',
    colors: { primary: '0 80% 55%', accent: '220 80% 55%', background: '0 30% 10%', card: '0 25% 13%', foreground: '0 0% 95%', muted: '0 20% 16%', border: '0 20% 18%' },
  },
  {
    id: 'laranja',
    name: 'Laranja',
    mode: 'dark',
    colors: { primary: '25 90% 55%', accent: '270 80% 60%', background: '25 30% 10%', card: '25 25% 13%', foreground: '0 0% 95%', muted: '25 20% 16%', border: '25 20% 18%' },
  },
  {
    id: 'verde',
    name: 'Verde',
    mode: 'dark',
    colors: { primary: '145 60% 45%', accent: '340 75% 55%', background: '145 30% 10%', card: '145 25% 13%', foreground: '0 0% 95%', muted: '145 20% 16%', border: '145 20% 18%' },
  },
  {
    id: 'verde-limao',
    name: 'Verde Limão',
    mode: 'dark',
    colors: { primary: '85 70% 50%', accent: '25 90% 55%', background: '85 30% 10%', card: '85 25% 13%', foreground: '0 0% 95%', muted: '85 20% 16%', border: '85 20% 18%' },
  },
  {
    id: 'cinza',
    name: 'Cinza',
    mode: 'dark',
    colors: { primary: '0 0% 60%', accent: '198 100% 65%', background: '0 0% 13%', card: '0 0% 15%', foreground: '0 0% 95%', muted: '0 0% 18%', border: '0 0% 20%' },
  },
  {
    id: 'midnight-purple',
    name: 'Midnight Purple',
    mode: 'dark',
    colors: { primary: '270 80% 65%', accent: '198 100% 65%', background: '250 20% 4%', card: '250 15% 8%', foreground: '0 0% 98%', muted: '250 10% 18%', border: '250 10% 18%' },
  },
  {
    id: 'aurora-green',
    name: 'Aurora Green',
    mode: 'dark',
    colors: { primary: '150 70% 50%', accent: '270 80% 60%', background: '160 20% 4%', card: '160 15% 7%', foreground: '0 0% 98%', muted: '160 10% 16%', border: '160 10% 16%' },
  },
  {
    id: 'cyber-light',
    name: 'Cyber Light',
    mode: 'light',
    colors: { primary: '198 100% 45%', accent: '270 70% 50%', background: '0 0% 100%', card: '0 0% 98%', foreground: '240 10% 4%', muted: '240 5% 90%', border: '240 6% 85%' },
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    mode: 'light',
    colors: { primary: '25 90% 55%', accent: '340 75% 55%', background: '30 20% 98%', card: '30 15% 95%', foreground: '25 10% 10%', muted: '30 10% 85%', border: '30 10% 80%' },
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    mode: 'light',
    colors: { primary: '210 80% 50%', accent: '270 70% 55%', background: '210 20% 98%', card: '210 15% 95%', foreground: '210 15% 8%', muted: '210 10% 85%', border: '210 10% 80%' },
  },
  {
    id: 'lavender-light',
    name: 'Lavender Light',
    mode: 'light',
    colors: { primary: '260 70% 55%', accent: '340 75% 55%', background: '260 20% 98%', card: '260 15% 95%', foreground: '260 15% 8%', muted: '260 10% 85%', border: '260 10% 80%' },
  },
];

export function applyThemePreset(id: string) {
  const preset = THEME_PRESETS.find((p) => p.id === id);
  if (!preset) return;
  const root = document.documentElement;
  const c = preset.colors;
  root.style.setProperty('--primary', c.primary);
  root.style.setProperty('--accent', c.accent);
  root.style.setProperty('--background', c.background);
  root.style.setProperty('--card', c.card);
  root.style.setProperty('--ring', c.primary);
  root.style.setProperty('--sidebar-primary', c.primary);
  root.style.setProperty('--sidebar-ring', c.primary);
  if (c.foreground) root.style.setProperty('--foreground', c.foreground);
  if (c.muted) root.style.setProperty('--muted', c.muted);
  if (c.border) root.style.setProperty('--border', c.border);
  root.style.setProperty('--sidebar-foreground', c.foreground || '0 0% 95%');
  root.style.setProperty('--sidebar-border', c.border || '240 4% 15%');
  root.style.setProperty('--muted-foreground', '0 0% 55%');
  root.style.setProperty('--card-foreground', c.foreground || '0 0% 95%');
  root.style.setProperty('--popover', c.background);
  root.style.setProperty('--popover-foreground', c.foreground || '0 0% 95%');
  root.style.setProperty('--input', c.border || '240 4% 15%');
}
