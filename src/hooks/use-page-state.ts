'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

function readFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw) as T;
  } catch { /* sessionStorage may be unavailable */ }
  return fallback;
}

function writeToStorage<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch { /* sessionStorage may be unavailable */ }
}

export function usePageState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const pathname = usePathname();
  const storageKey = `pf:page-state:${pathname}:${key}`;
  const prevKey = useRef(storageKey);

  const [state, setState] = useState<T>(() =>
    readFromStorage(storageKey, defaultValue),
  );

  useEffect(() => {
    if (prevKey.current !== storageKey) {
      prevKey.current = storageKey;
      const stored = readFromStorage(storageKey, defaultValue);
      setState(stored);
    }
  }, [storageKey, defaultValue]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
        writeToStorage(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  return [state, setValue];
}
