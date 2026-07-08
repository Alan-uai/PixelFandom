import { createHash } from 'node:crypto';
import { supabase } from '@/supabase';
import { detectSqlInjection } from './sql-injection-detect';
import { virusScanner } from './virus-scan';

export interface ThreatContext {
  ip: string;
  fingerprint: string;
  userId?: string;
  path: string;
  method: string;
  userAgent?: string;
}

export interface ThreatEvent {
  eventType: 'sql_injection' | 'malware_upload' | 'brute_force' | 'rate_limit' | 'invalid_file' | 'suspicious_request' | 'blocked_request';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, unknown>;
}

const BLOCK_CACHE = new Map<string, { blocked: boolean; expiry: number }>();
const BLOCK_CACHE_TTL = 5 * 60 * 1000;

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

export function getClientIp(request: { headers: Headers }): string {
  return request.headers.get('x-forwarded-for')
    ?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || request.headers.get('cf-connecting-ip')
    || 'unknown';
}

export function getFingerprint(request: { headers: Headers }): string {
  const ip = getClientIp(request);
  const ua = request.headers.get('user-agent') || '';
  const lang = request.headers.get('accept-language') || '';
  const encoding = request.headers.get('accept-encoding') || '';

  const raw = `${ip}|${ua}|${lang}|${encoding}`;
  return createHash('sha256').update(raw).digest('hex');
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  const ipHash = hashIp(ip);

  const cached = BLOCK_CACHE.get(ipHash);
  if (cached && Date.now() < cached.expiry) {
    return cached.blocked;
  }

  try {
    const { data, error } = await supabase
      .from('ip_blocks')
      .select('id, expires_at')
      .eq('ip_hash', ipHash)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('isIpBlocked error:', error);
      return false;
    }

    const blocked = !!data;
    if (blocked && data.expires_at && new Date(data.expires_at) < new Date()) {
      await supabase
        .from('ip_blocks')
        .update({ is_active: false })
        .eq('id', data.id);
      BLOCK_CACHE.set(ipHash, { blocked: false, expiry: Date.now() + BLOCK_CACHE_TTL });
      return false;
    }

    BLOCK_CACHE.set(ipHash, { blocked, expiry: Date.now() + BLOCK_CACHE_TTL });
    return blocked;
  } catch {
    return false;
  }
}

export async function isFingerprintBlocked(fingerprint: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('request_fingerprints')
      .select('is_blocked')
      .eq('fingerprint_hash', fingerprint)
      .maybeSingle();

    return data?.is_blocked === true;
  } catch {
    return false;
  }
}

async function logThreatEvent(event: ThreatEvent & ThreatContext) {
  try {
    await supabase.from('threat_events').insert({
      ip_hash: hashIp(event.ip),
      fingerprint_hash: event.fingerprint,
      user_id: event.userId || null,
      event_type: event.eventType,
      severity: event.severity,
      path: event.path,
      method: event.method,
      details: (event.details || {}) as Record<string, unknown>,
    });
  } catch (err) {
    console.error('Failed to log threat event:', err);
  }
}

async function autoBlockIp(
  ip: string,
  fingerprint: string,
  threatType: string,
  reason: string,
  expiryHours: number | null = null,
) {
  const ipHash = hashIp(ip);

  try {
    await supabase.from('ip_blocks').insert({
      ip_hash: ipHash,
      reason,
      threat_type: threatType,
      expires_at: expiryHours ? new Date(Date.now() + expiryHours * 3600_000).toISOString() : null,
      metadata: { auto_blocked: true } as Record<string, unknown>,
    });

    BLOCK_CACHE.set(ipHash, { blocked: true, expiry: Date.now() + BLOCK_CACHE_TTL * 12 });

    if (fingerprint) {
      await supabase
        .from('request_fingerprints')
        .update({ is_blocked: true })
        .eq('fingerprint_hash', fingerprint);

      const { data: linkedFingerprints } = await supabase
        .from('request_fingerprints')
        .select('fingerprint_hash, ip_hashes')
        .contains('ip_hashes', [ipHash]);

      if (linkedFingerprints) {
        for (const fp of linkedFingerprints) {
          for (const otherIpHash of (fp.ip_hashes || [])) {
            if (otherIpHash === ipHash) continue;
            const existingBlock = await supabase
              .from('ip_blocks')
              .select('id')
              .eq('ip_hash', otherIpHash)
              .eq('is_active', true)
              .maybeSingle();

            if (!existingBlock?.data) {
              await supabase.from('ip_blocks').insert({
                ip_hash: otherIpHash,
                reason: `Cross-IP block: linked to blocked fingerprint ${fp.fingerprint_hash}`,
                threat_type: threatType as any,
                metadata: { cross_blocked: true, source_fingerprint: fingerprint } as Record<string, unknown>,
              });
              BLOCK_CACHE.set(otherIpHash, { blocked: true, expiry: Date.now() + BLOCK_CACHE_TTL * 12 });
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to auto-block IP:', err);
  }
}

export async function handleThreatDetection(
  ctx: ThreatContext,
  event: ThreatEvent,
): Promise<void> {
  await logThreatEvent({ ...ctx, ...event });

  if (event.severity === 'critical') {
    const expiryHours = event.eventType === 'sql_injection' ? null
      : event.eventType === 'malware_upload' ? null
      : 24;
    await autoBlockIp(ctx.ip, ctx.fingerprint, event.eventType, event.eventType.replace(/_/g, ' '), expiryHours);
  } else if (event.severity === 'high') {
    await autoBlockIp(ctx.ip, ctx.fingerprint, event.eventType, event.eventType.replace(/_/g, ' '), 24);
  }
}

export async function checkRequestForThreats(
  request: { headers: Headers; url?: string; method?: string },
  body?: unknown,
): Promise<{ blocked: boolean; reason?: string }> {
  const ip = getClientIp(request);
  const fingerprint = getFingerprint(request);
  const path = request.url || '/unknown';
  const method = request.method || 'GET';

  const ipBlocked = await isIpBlocked(ip);
  if (ipBlocked) {
    await logThreatEvent({
      ip, fingerprint, path, method,
      eventType: 'blocked_request',
      severity: 'medium',
      details: { reason: 'IP blocked' },
    });
    return { blocked: true, reason: 'Access denied' };
  }

  const fpBlocked = await isFingerprintBlocked(fingerprint);
  if (fpBlocked) {
    const isBlocked = await isIpBlocked(ip);
    if (!isBlocked) {
      await autoBlockIp(ip, fingerprint, 'abuse', 'Linked to blocked fingerprint');
    }
    return { blocked: true, reason: 'Access denied' };
  }

  if (body) {
    const sqliResult = detectSqlInjection(body as Record<string, unknown>);
    if (sqliResult.detected) {
      await handleThreatDetection(
        { ip, fingerprint, path, method },
        {
          eventType: 'sql_injection',
          severity: 'critical',
          details: {
            paths: sqliResult.findings.map(f => ({ path: f.path })),
          },
        },
      );
      return { blocked: true, reason: 'Malicious request detected' };
    }
  }

  return { blocked: false };
}
