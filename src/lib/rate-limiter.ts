import { supabase } from '@/supabase';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
}

const DEFAULTS: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 30,
};

const UPLOAD_LIMITS: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 5,
};

const IN_MEMORY_ONLY = process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_SUPABASE_URL;

export function checkRateLimitInMemory(
  key: string,
  config: RateLimitConfig = DEFAULTS,
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULTS,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const memResult = checkRateLimitInMemory(key, config);

  if (IN_MEMORY_ONLY) return memResult;
  if (!memResult.allowed) return memResult;

  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_window_ms: config.windowMs,
      p_max_requests: config.maxRequests,
    });

    if (error) return memResult;

    return {
      allowed: data.allowed ?? memResult.allowed,
      remaining: data.remaining ?? memResult.remaining,
      resetAt: data.reset_at ?? memResult.resetAt,
    };
  } catch {
    return memResult;
  }
}

export function getRateLimiterForPath(path: string): RateLimitConfig {
  if (path.startsWith('/api/upload')) {
    return UPLOAD_LIMITS;
  }
  if (path.startsWith('/api/tenants') && path.includes('/media')) {
    return {
      windowMs: 60_000,
      maxRequests: 10,
    };
  }
  return DEFAULTS;
}
