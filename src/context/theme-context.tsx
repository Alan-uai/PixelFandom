'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { Theme } from '@/lib/types';

export interface TenantTheme {
  primary_color?: string;
  background_color?: string;
  card_color?: string;
  sidebar_color?: string;
  accent_color?: string;
  font_family?: string;
  heading_font?: string;
  border_radius?: string;
  sidebar_width?: 'narrow' | 'normal' | 'wide';
  header_style?: 'compact' | 'expanded' | 'minimal';
}

type ThemeMode = Theme;

interface ThemeContextValue {
  theme: TenantTheme;
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const defaultTheme: TenantTheme = {
  primary_color: '198 100% 65%',
  background_color: '0 0% 13%',
  card_color: '0 0% 15%',
  sidebar_color: '0 0% 13.3%',
  accent_color: '0 100% 65%',
  font_family: 'Inter, ui-sans-serif, system-ui, sans-serif',
  heading_font: 'Inter, ui-sans-serif, system-ui, sans-serif',
  border_radius: '0.5rem',
  sidebar_width: 'normal',
  header_style: 'compact',
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  mode: 'system',
  resolvedMode: 'dark',
  setMode: () => {},
  isDark: true,
});

function applyCSSVars(theme: TenantTheme) {
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primary_color || defaultTheme.primary_color!);

  if (theme.background_color) root.style.setProperty('--background', theme.background_color);
  if (theme.card_color) root.style.setProperty('--card', theme.card_color);
  if (theme.sidebar_color) root.style.setProperty('--sidebar-background', theme.sidebar_color);
  if (theme.accent_color) root.style.setProperty('--accent', theme.accent_color);
  if (theme.font_family) root.style.setProperty('--font-family', theme.font_family);
  if (theme.heading_font) root.style.setProperty('--heading-font', theme.heading_font);
  if (theme.border_radius) root.style.setProperty('--radius', theme.border_radius);

  root.style.setProperty('--ring', theme.primary_color || defaultTheme.primary_color!);
  root.style.setProperty('--sidebar-primary', theme.primary_color || defaultTheme.primary_color!);
  root.style.setProperty('--sidebar-ring', theme.primary_color || defaultTheme.primary_color!);
}

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

interface ThemeProviderProps {
  tenantTheme: TenantTheme | null | undefined;
  mode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
  children: ReactNode;
}

export function ThemeProvider({ tenantTheme, mode, onModeChange, children }: ThemeProviderProps) {
  const merged = useMemo(() => ({ ...defaultTheme, ...(tenantTheme || {}) }), [tenantTheme]);
  const resolved = resolveMode(mode);
  const isDark = resolved === 'dark';

  useEffect(() => {
    applyCSSVars(merged);
  }, [merged]);

  useEffect(() => {
    const cl = document.documentElement.classList;
    if (isDark) {
      cl.add('dark');
      cl.remove('light');
    } else {
      cl.add('light');
      cl.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => onModeChange('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode, onModeChange]);

  return (
    <ThemeContext.Provider value={{ theme: merged, mode, resolvedMode: resolved, setMode: onModeChange, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
