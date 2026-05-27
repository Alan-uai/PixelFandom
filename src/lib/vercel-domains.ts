const VERCEL_API = 'https://api.vercel.com';
const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN || '';
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || '';

export type DomainStatus = {
  name: string;
  verified: boolean;
  configured: boolean;
  nameservers: string[];
  intendedNameservers: string[];
  cname: string | null;
  cnameResolves: boolean;
  conflict: boolean;
  pending: boolean;
};

async function vercelFetch(path: string, options: RequestInit = {}) {
  const url = `${VERCEL_API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body?.error?.message || body?.message || `Vercel API error (${res.status})`;
    throw new Error(message);
  }

  return body;
}

export async function addDomain(domain: string): Promise<DomainStatus> {
  if (!VERCEL_PROJECT_ID) throw new Error('VERCEL_PROJECT_ID não configurado');

  const data = await vercelFetch(`/v9/projects/${VERCEL_PROJECT_ID}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name: domain }),
  });

  return {
    name: domain,
    verified: data?.verified ?? false,
    configured: data?.configured ?? false,
    nameservers: data?.nameservers || [],
    intendedNameservers: data?.intendedNameservers || [],
    cname: data?.cname || null,
    cnameResolves: data?.cnameResolves ?? false,
    conflict: !!data?.conflict,
    pending: !(data?.verified ?? false),
  };
}

export async function removeDomain(domain: string): Promise<void> {
  if (!VERCEL_PROJECT_ID) throw new Error('VERCEL_PROJECT_ID não configurado');
  await vercelFetch(`/v9/projects/${VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domain)}`, {
    method: 'DELETE',
  });
}

export async function verifyDomain(domain: string): Promise<DomainStatus> {
  if (!VERCEL_PROJECT_ID) throw new Error('VERCEL_PROJECT_ID não configurado');

  const data = await vercelFetch(
    `/v9/projects/${VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domain)}/verify`,
    { method: 'POST' }
  );

  return {
    name: domain,
    verified: true,
    configured: data?.configured || false,
    nameservers: data?.nameservers || [],
    intendedNameservers: data?.intendedNameservers || [],
    cname: data?.cname || null,
    cnameResolves: data?.cnameResolves || false,
    conflict: !!data?.conflict,
    pending: false,
  };
}

export async function getDomainConfig(domain: string): Promise<DomainStatus> {
  const data = await vercelFetch(`/v6/domains/${encodeURIComponent(domain)}/config`);

  return {
    name: domain,
    verified: data?.verified || false,
    configured: data?.configuredBy === 'CNAME' || data?.configuredBy === 'A',
    nameservers: data?.nameservers || [],
    intendedNameservers: data?.intendedNameservers || [],
    cname: data?.cname || null,
    cnameResolves: data?.cnameResolves || false,
    conflict: !!data?.conflict,
    pending: !data?.verified,
  };
}

export async function listDomains(): Promise<string[]> {
  if (!VERCEL_PROJECT_ID) return [];

  const data = await vercelFetch(`/v9/projects/${VERCEL_PROJECT_ID}/domains`);
  return (data?.domains || []).map((d: any) => d.name);
}

export async function addDomainWithRetry(baseSlug: string): Promise<{ domain: string; status: DomainStatus }> {
  const suffixes = ['', '-pf'];
  for (let i = 1; i <= 10; i++) {
    suffixes.push(`-pf-${i}`);
  }

  for (const suffix of suffixes) {
    const domain = `${baseSlug}${suffix}.vercel.app`;
    try {
      const status = await addDomain(domain);
      return { domain, status };
    } catch (err: any) {
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('already in use') || msg.includes('already assigned') || msg.includes('already exists')) {
        continue;
      }
      throw err;
    }
  }

  throw new Error('Nenhum domínio .vercel.app disponível encontrado');
}

export function formatInstructions(status: DomainStatus): string[] {
  const lines: string[] = [];

  if (status.nameservers.length > 0) {
    lines.push('Aponte os nameservers do seu domínio para:');
    status.nameservers.forEach((ns) => lines.push(`  ${ns}`));
  } else if (status.cname) {
    lines.push(`Crie um registro CNAME apontando ${status.name} para:`);
    lines.push(`  ${status.cname}`);
  } else {
    lines.push('Adicione um registro CNAME apontando seu domínio para:');
    lines.push('  cname.vercel-dns.com');
  }

  return lines;
}
