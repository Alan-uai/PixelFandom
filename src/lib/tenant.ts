'use server';

import { supabase } from '@/supabase';
import type { Tenant } from '@/supabase/client';

const TENANT_CACHE = new Map<string, { tenant: Tenant; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

function getCached(key: string): Tenant | null {
  const entry = TENANT_CACHE.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.tenant;
  }
  TENANT_CACHE.delete(key);
  return null;
}

function setCache(key: string, tenant: Tenant) {
  TENANT_CACHE.set(key, { tenant, expiresAt: Date.now() + CACHE_TTL_MS });
}

function cacheKey(domain: string): string {
  return `domain:${domain.toLowerCase()}`;
}

export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  const key = cacheKey(domain);
  const cached = getCached(key);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('custom_domain', domain)
    .single();

  if (error || !data) return null;

  setCache(key, data);
  return data;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getPublicTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('is_public', true)
    .order('name');

  if (error || !data) return [];
  return data;
}

export function extractDomainFromHost(host: string): string {
  return host.split(':')[0].toLowerCase();
}

export function extractSlugFromHost(host: string, mainDomain: string): string | null {
  const domain = extractDomainFromHost(host);
  if (domain === mainDomain) return null;

  const parts = domain.replace(`.${mainDomain}`, '').split('.');
  if (parts.length > 0 && parts[0] !== 'www') {
    return parts[0];
  }
  return null;
}

export async function getUserTenants(userId: string): Promise<(Tenant & { role: string })[]> {
  const { data, error } = await supabase
    .from('tenant_members')
    .select('role, tenants(*)')
    .eq('user_id', userId) as any;

  if (error || !data) return [];

  return data
    .filter((item: any) => item.tenants)
    .map((item: any) => ({
      ...(item.tenants as Tenant),
      role: item.role,
    }));
}

export async function isTenantMember(
  tenantId: string,
  userId: string,
  minRole?: 'viewer' | 'editor' | 'admin' | 'owner'
): Promise<boolean> {
  const roleHierarchy: Record<string, number> = {
    viewer: 0,
    editor: 1,
    admin: 2,
    owner: 3,
  };

  const minLevel = minRole ? roleHierarchy[minRole] : 0;

  const { data, error } = await supabase
    .from('tenant_members')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return false;

  return roleHierarchy[data.role] >= minLevel;
}
