'use client';

const _subscribers = new Map<string, Set<() => void>>();

export function cacheSubscribe(key: string, fn: () => void): () => void {
  if (!_subscribers.has(key)) _subscribers.set(key, new Set());
  _subscribers.get(key)!.add(fn);
  return () => { _subscribers.get(key)?.delete(fn); };
}

export function cacheNotify(key: string): void {
  _subscribers.get(key)?.forEach((fn) => fn());
}

export function cacheNotifyAll(): void {
  for (const fns of _subscribers.values()) {
    fns.forEach((fn) => fn());
  }
}
