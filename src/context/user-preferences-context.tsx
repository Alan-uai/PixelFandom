'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase, useUser } from '@/supabase';
import { applyThemePreset } from '@/lib/theme-presets';

export type ThemeMode = 'system' | 'light' | 'dark';
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

export interface UserPreferences {
  theme_mode: ThemeMode;
  font_size: FontSize;
  density: Density;
  sidebar_collapsed: boolean;
  notification_preferences: Record<string, boolean>;
  voice_settings: Record<string, unknown>;
  chat_settings: ChatSettings;
  wiki_preferences: Record<string, Partial<ChatSettings>>;
  theme_preset: string;
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
};

function loadLocal(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { }
  return { ...DEFAULTS };
}

function saveLocal(prefs: UserPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch { }
}

interface UserPreferencesContextValue {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  updatePreferences: (partial: Partial<UserPreferences>) => void;
  synced: boolean;
  saving: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextValue>({
  preferences: DEFAULTS,
  updatePreference: () => {},
  updatePreferences: () => {},
  synced: false,
  saving: false,
});

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [preferences, setPreferences] = useState<UserPreferences>(loadLocal);
  const [synced, setSynced] = useState(false);
  const [saving, setSaving] = useState(false);

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
    <UserPreferencesContext.Provider value={{ preferences, updatePreference, updatePreferences, synced, saving }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  return useContext(UserPreferencesContext);
}

export { DEFAULTS as DEFAULT_PREFERENCES };
