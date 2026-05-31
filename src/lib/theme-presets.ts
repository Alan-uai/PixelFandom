export interface ThemePresetColors {
  primary: string;
  accent: string;
  background: string;
  card: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: ThemePresetColors;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'ciano',
    name: 'Ciano',
    colors: { primary: '198 100% 65%', accent: '0 100% 65%', background: '0 0% 13%', card: '0 0% 15%' },
  },
  {
    id: 'azul',
    name: 'Azul',
    colors: { primary: '220 80% 55%', accent: '340 75% 55%', background: '220 30% 10%', card: '220 25% 13%' },
  },
  {
    id: 'roxo',
    name: 'Roxo',
    colors: { primary: '270 80% 60%', accent: '30 80% 55%', background: '270 30% 10%', card: '270 25% 13%' },
  },
  {
    id: 'rosa',
    name: 'Rosa',
    colors: { primary: '340 75% 60%', accent: '198 100% 65%', background: '340 30% 12%', card: '340 25% 14%' },
  },
  {
    id: 'vermelho',
    name: 'Vermelho',
    colors: { primary: '0 80% 55%', accent: '220 80% 55%', background: '0 30% 10%', card: '0 25% 13%' },
  },
  {
    id: 'laranja',
    name: 'Laranja',
    colors: { primary: '25 90% 55%', accent: '270 80% 60%', background: '25 30% 10%', card: '25 25% 13%' },
  },
  {
    id: 'verde',
    name: 'Verde',
    colors: { primary: '145 60% 45%', accent: '340 75% 55%', background: '145 30% 10%', card: '145 25% 13%' },
  },
  {
    id: 'verde-limao',
    name: 'Verde Limão',
    colors: { primary: '85 70% 50%', accent: '25 90% 55%', background: '85 30% 10%', card: '85 25% 13%' },
  },
  {
    id: 'cinza',
    name: 'Cinza',
    colors: { primary: '0 0% 60%', accent: '198 100% 65%', background: '0 0% 13%', card: '0 0% 15%' },
  },
];

export function applyThemePreset(id: string) {
  const preset = THEME_PRESETS.find((p) => p.id === id);
  if (!preset) return;
  const root = document.documentElement;
  root.style.setProperty('--primary', preset.colors.primary);
  root.style.setProperty('--accent', preset.colors.accent);
  root.style.setProperty('--background', preset.colors.background);
  root.style.setProperty('--card', preset.colors.card);
  root.style.setProperty('--ring', preset.colors.primary);
  root.style.setProperty('--sidebar-primary', preset.colors.primary);
  root.style.setProperty('--sidebar-ring', preset.colors.primary);
}
