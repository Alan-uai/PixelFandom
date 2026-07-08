const SQL_INJECTION_PATTERNS: RegExp[] = [
  /\bOR\b.{0,20}['"]\s*=\s*['"]/i,
  /\bOR\b.{0,20}\d+\s*=\s*\d+/i,
  /'?\s*OR\s+['\d].*--/i,
  /'?\s*OR\s+['\d].*#/i,
  /'?\s*OR\s+['\d].*\/\*/i,
  /\bUNION\s+(ALL\s+)?SELECT\b/i,
  /\bSELECT\s+.*\bINTO\s+(OUTFILE|DUMPFILE)\b/i,
  /\bDROP\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW|FUNCTION|TRIGGER)/i,
  /\bDELETE\s+FROM\b/i,
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+\w+\s+SET\b/i,
  /\bTRUNCATE\s+(TABLE\s+)?/i,
  /\bALTER\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW|FUNCTION)/i,
  /\bCREATE\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW|FUNCTION|TRIGGER|PROCEDURE)/i,
  /\bRENAME\s+(TABLE|DATABASE|SCHEMA)/i,
  /\bEXEC\b/i,
  /\bEXECUTE\b/i,
  /\bxp_\w+/i,
  /\bWAITFOR\s+DELAY\b/i,
  /\bBENCHMARK\s*\(/i,
  /\bpg_sleep\s*\(/i,
  /\bSLEEP\s*\(/i,
  /;\s*DROP\b/i,
  /;\s*DELETE\b/i,
  /;\s*INSERT\b/i,
  /;\s*UPDATE\b/i,
  /;\s*EXEC\b/i,
  /;\s*ALTER\b/i,
  /;\s*CREATE\b/i,
  /;\s*TRUNCATE\b/i,
  /;\s*SELECT\b/i,
  /\bINFORMATION_SCHEMA\b/i,
  /\bpg_catalog\b/i,
  /\bsys\.(columns|objects|tables|databases)\b/i,
  /\bMYSQL\.(user|db|host)\b/i,
  /\bpg_typeof\b/i,
  /\bLOAD_FILE\s*\(/i,
  /\bINTO\s+@/i,
  /--\s*$/m,
  /#\s*$/m,
  /\/\*!\d{5}/,
  /\bCONVERT\s*\(.*,\s*integer\b/i,
  /\bCAST\s*\(.*\s+AS\s+(text|integer|boolean)/i,
  /'\s*OR\s+'/i,
  /'\s*OR\s+\d+/i,
  /"\s*OR\s+"/i,
];

const SUSPICIOUS_CHAR_PATTERNS: RegExp[] = [
  /['";\\]{3,}/,
  /--.*$/m,
  /\/\*.*\*\//,
];

const SKIP_KEYS = new Set([
  'password', 'password_confirmation', 'current_password',
  'api_key', 'secret', 'token', 'authorization',
]);

type ScanTarget = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];

function scanValue(value: string): { detected: boolean; pattern?: RegExp } {
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(value)) {
      return { detected: true, pattern };
    }
  }

  for (const pattern of SUSPICIOUS_CHAR_PATTERNS) {
    if (pattern.test(value)) {
      return { detected: true, pattern };
    }
  }

  if (value.length > 200 && (
    value.includes('select') || value.includes('from') ||
    value.includes('where') || value.includes('drop')
  )) {
    return { detected: true, pattern: /long.*sql.*keywords/i };
  }

  return { detected: false };
}

function deepScan(obj: ScanTarget, path = ''): Array<{ path: string; pattern?: RegExp }> {
  const findings: Array<{ path: string; pattern?: RegExp }> = [];

  if (typeof obj === 'string') {
    const result = scanValue(obj);
    if (result.detected) {
      findings.push({ path: path || '(root)', pattern: result.pattern });
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      findings.push(...deepScan(item, `${path}[${i}]`));
    });
  } else if (obj !== null && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SKIP_KEYS.has(key)) continue;
      findings.push(...deepScan(value as ScanTarget, path ? `${path}.${key}` : key));
    }
  }

  return findings;
}

export interface SqlInjectionResult {
  detected: boolean;
  findings: Array<{ path: string; pattern?: RegExp }>;
  safe: boolean;
}

export function detectSqlInjection(input: ScanTarget): SqlInjectionResult {
  const findings = deepScan(input);
  return {
    detected: findings.length > 0,
    findings,
    safe: findings.length === 0,
  };
}

export function containsSqlInjection(input: string): boolean {
  return scanValue(input).detected;
}
