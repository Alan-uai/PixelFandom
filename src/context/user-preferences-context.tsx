'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase, useUser } from '@/supabase';
import { applyThemePreset } from '@/lib/theme-presets';
import type { Theme } from '@/lib/types';

export type ThemeMode = Theme;
export type Density = 'comfortable' | 'compact';
export type FontSize = 'small' | 'medium' | 'large';

export interface ChatSettings {
  personality_id: string;
  persona: string;
  emoji_style: string;
  response_style: string;
  display_mode: string;
  language: string;
}

export interface AnimationSettings {
  /** Master — desliga animações em todas as superfícies. */
  enabled: boolean;
  /** Animações no Dashboard. */
  dashboard: boolean;
  /** Animações na Wiki. */
  wiki: boolean;
}

export interface UserPreferences {
  theme_mode: Theme;
  font_size: FontSize;
  density: Density;
  sidebar_collapsed: boolean;
  notification_preferences: Record<string, boolean>;
  voice_settings: Record<string, unknown>;
  chat_settings: ChatSettings;
  wiki_preferences: Record<string, Partial<ChatSettings>>;
  theme_preset: string;
  animations: AnimationSettings;
}

const STORAGE_KEY = 'pixelfandom:user-preferences';

const CHAT_DEFAULTS: ChatSettings = {
  personality_id: 'friendly',
  persona: 'amigavel',
  emoji_style: 'moderate',
  response_style: 'detailed',
  display_mode: 'acordeao',
  language: 'pt_br',
};

const DEFAULTS: UserPreferences = {
  theme_mode: 'system',
  font_size: 'medium',
  density: 'comfortable',
  sidebar_collapsed: false,
  notification_preferences: {},
  voice_settings: {},
  chat_settings: { ...CHAT_DEFAULTS },
  wiki_preferences: {},
  theme_preset: 'ciano',
  animations: { enabled: true, dashboard: true, wiki: true },
};

function loadLocal(): UserPreferences {
  const base: UserPreferences = { ...DEFAULTS, animations: systemAnimationDefaults() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as Partial<UserPreferences>;
      // Animações: se o usuário já personalizou (salvou `animations`), usa a
      // escolha dele; caso contrário, aplica o padrão do sistema
      // (prefers-reduced-motion) para respeitar o usuário por padrão.
      return {
        ...base,
        ...stored,
        animations: stored.animations ?? base.animations,
      };
    }
  } catch {/* noop */}
  return base;
}

function saveLocal(prefs: UserPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {/* noop */}
}

function systemUsesReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Padrão de animações em função da preferência de movimento do sistema.
 *  Se o usuário solicitar movimento reduzido, as animações ficam desligadas
 *  em todas as superfícies (dashboard e wiki) por padrão, respeitando-o.
 *  O usuário pode re-personalizar depois via UserPreferencesProvider. */
export function systemAnimationDefaults(reduced: boolean = systemUsesReducedMotion()): AnimationSettings {
  return reduced
    ? { enabled: false, dashboard: false, wiki: false }
    : { enabled: true, dashboard: true, wiki: true };
}

interface UserPreferencesContextValue {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  updatePreferences: (partial: Partial<UserPreferences>) => void;
  synced: boolean;
  saving: boolean;
  /** Indica se o sistema operacional solicitou movimento reduzido. */
  prefersReducedMotion: boolean;
}

export const UserPreferencesContext = createContext<UserPreferencesContextValue>({
  preferences: DEFAULTS,
  updatePreference: () => {},
  updatePreferences: () => {},
  synced: false,
  saving: false,
  prefersReducedMotion: false,
});

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [preferences, setPreferences] = useState<UserPreferences>(loadLocal);
  const [synced, setSynced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => systemUsesReducedMotion());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    saveLocal(preferences);
  }, [preferences]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      applyThemePreset(preferences.theme_preset);
    }
  }, [preferences.theme_preset]);

  useEffect(() => {
    if (!user || synced) return;
    (async () => {
      const { data } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      if (data?.preferences) {
        const cloud = data.preferences as Partial<UserPreferences>;
        setPreferences((prev) => {
          const merged = { ...prev, ...cloud };
          saveLocal(merged);
          return merged;
        });
      }
      setSynced(true);
    })();
  }, [user, synced]);

  const syncToCloud = useCallback(async (prefs: UserPreferences) => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from('user_preferences')
      .upsert(
        { user_id: user.id, preferences: prefs, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    setSaving(false);
  }, [user]);

  const updatePreference = useCallback(<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      saveLocal(next);
      syncToCloud(next);
      return next;
    });
  }, [syncToCloud]);

  const updatePreferences = useCallback((partial: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...partial };
      saveLocal(next);
      syncToCloud(next);
      return next;
    });
  }, [syncToCloud]);

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreference, updatePreferences, synced, saving, prefersReducedMotion }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  return useContext(UserPreferencesContext);
}

export { DEFAULTS as DEFAULT_PREFERENCES };
