import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

interface SiteCacheState {
  cache: Record<string, CacheEntry>;
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, ttl?: number) => void;
  invalidate: (pattern?: string) => void;
  clear: () => void;
}

const DEFAULT_TTL = 5 * 60 * 1000;

export const useSiteCache = create<SiteCacheState>()(
  persist(
    (set, get) => ({
      cache: {},

      get: <T>(key: string): T | null => {
        const entry = get().cache[key] as CacheEntry | undefined;
        if (!entry) return null;
        if (Date.now() - entry.timestamp > entry.ttl) {
          set((state) => {
            const { [key]: _unused, ...rest } = state.cache;
            return { cache: rest };
          });
          return null;
        }
        return entry.data as T;
      },

      set: <T>(key: string, data: T, ttl: number = DEFAULT_TTL) => {
        set((state) => ({
          cache: {
            ...state.cache,
            [key]: { data, timestamp: Date.now(), ttl },
          },
        }));
      },

      invalidate: (pattern?: string) => {
        if (!pattern) {
          set({ cache: {} });
          return;
        }
        set((state) => {
          const newCache: Record<string, CacheEntry> = {};
          for (const [k, v] of Object.entries(state.cache)) {
            if (!k.includes(pattern)) newCache[k] = v;
          }
          return { cache: newCache };
        });
      },

      clear: () => set({ cache: {} }),
    }),
    {
      name: 'pixelfandom:site-cache',
      version: 1,
    }
  )
);
