// Shared utilities for date/time and weather tools.
// Used by both the text chat (server) and the voice chat (browser).

const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export interface DateHourInfo {
  location: string | null;
  timezone: string;
  utcOffsetLabel: string;
  iso: string;
  hour: number;
  minute: number;
  second: number;
  day: number;
  month: number;
  monthName: string;
  year: number;
  weekday: string;
  isDaytime: boolean;
  human: string;
}

// Resolve the IANA timezone + UTC offset for a given location via Open-Meteo.
// Falls back to UTC when no location is provided or resolution fails.
async function resolveTimezone(location?: string): Promise<{
  timezone: string;
  utcOffsetSeconds: number;
  resolvedName: string | null;
}> {
  const place = (location || '').trim();
  if (!place) {
    return { timezone: 'UTC', utcOffsetSeconds: 0, resolvedName: null };
  }

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      place,
    )}&count=1&language=pt&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) return { timezone: 'UTC', utcOffsetSeconds: 0, resolvedName: null };
    const geoData = await geoRes.json();
    const hit = geoData?.results?.[0];
    if (!hit) return { timezone: 'UTC', utcOffsetSeconds: 0, resolvedName: null };

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}&current=temperature_2m`;
    const fRes = await fetch(forecastUrl);
    if (!fRes.ok) return { timezone: 'UTC', utcOffsetSeconds: 0, resolvedName: null };
    const fData = await fRes.json();
    const tz = fData?.timezone as string | undefined;
    const offset = typeof fData?.utc_offset_seconds === 'number' ? fData.utc_offset_seconds : 0;
    if (!tz) return { timezone: 'UTC', utcOffsetSeconds: 0, resolvedName: null };

    const resolvedName = [hit.name, hit.admin1].filter(Boolean).join(', ');
    return { timezone: tz, utcOffsetSeconds: offset, resolvedName };
  } catch {
    return { timezone: 'UTC', utcOffsetSeconds: 0, resolvedName: null };
  }
}

function formatOffsetLabel(seconds: number): string {
  const sign = seconds < 0 ? '-' : '+';
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = Math.round((abs % 3600) / 60);
  const mm = m > 0 ? `:${String(m).padStart(2, '0')}` : '';
  return `UTC${sign}${h}${mm}`;
}

function capitalizePt(text: string): string {
  return text
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

// Returns the CURRENT local date/time for a region (dynamic timezone, e.g. Brazil = UTC-3),
// plus weekday, day, month and year in Portuguese. When no location is given, uses UTC.
export async function getDateHourInfo(location?: string): Promise<DateHourInfo> {
  const now = new Date();
  const { timezone, utcOffsetSeconds, resolvedName } = await resolveTimezone(location);

  const fmt = new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const parts = fmt.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  let hour = parseInt(get('hour'), 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(get('minute'), 10);
  const second = parseInt(get('second'), 10);
  const day = parseInt(get('day'), 10);
  const year = parseInt(get('year'), 10);
  const monthNameRaw = get('month');
  const weekdayRaw = get('weekday');

  const monthName = capitalizePt(monthNameRaw);
  const weekday = capitalizePt(weekdayRaw);
  const month = MONTHS_PT.findIndex((m) => m.toLowerCase() === monthNameRaw.toLowerCase()) + 1;

  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const ss = String(second).padStart(2, '0');

  const offsetLabel = formatOffsetLabel(utcOffsetSeconds);
  const where = resolvedName ? ` (${resolvedName})` : '';
  const human = `${weekday}, ${day} de ${monthName} de ${year}, ${hh}:${mm}:${ss} ${offsetLabel}${where}`;

  return {
    location: resolvedName,
    timezone,
    utcOffsetLabel: offsetLabel,
    iso: now.toISOString(),
    hour,
    minute,
    second,
    day,
    month,
    monthName,
    year,
    weekday,
    isDaytime: hour >= 6 && hour < 18,
    human,
  };
}

// ── Weather (Open-Meteo, free, no API key) ──

const WMO_DESCRIPTIONS_PT: Record<number, string> = {
  0: 'Céu limpo',
  1: 'Predomínio de sol',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina gelada',
  51: 'Garoa leve',
  53: 'Garoa moderada',
  55: 'Garoa intensa',
  56: 'Garoa congelante leve',
  57: 'Garoa congelante intensa',
  61: 'Chuva leve',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  66: 'Chuva congelante leve',
  67: 'Chuva congelante intensa',
  71: 'Neve leve',
  73: 'Neve moderada',
  75: 'Neve forte',
  77: 'Grãos de neve',
  80: 'Pancadas de chuva leves',
  81: 'Pancadas de chuva moderadas',
  82: 'Pancadas de chuva fortes',
  85: 'Pancadas de neve leves',
  86: 'Pancadas de neve fortes',
  95: 'Tempestade',
  96: 'Tempestade com granizo leve',
  99: 'Tempestade com granizo forte',
};

function describeWeather(code: number, isDay: boolean): string {
  const base = WMO_DESCRIPTIONS_PT[code] ?? 'Condição desconhecida';
  if (code <= 1) {
    return isDay ? 'Ensolarado' : 'Céu limpo (noite)';
  }
  return base;
}

export interface WeatherInfo {
  location: string;
  resolvedName: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  cloudCover: number;
  isDay: boolean;
  weatherCode: number;
  condition: string;
  human: string;
}

export async function getWeatherInfo(location: string): Promise<WeatherInfo | { error: string }> {
  const place = (location || '').trim();
  if (!place) {
    return { error: 'Informe uma cidade ou região para consultar o clima.' };
  }

  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    place,
  )}&count=1&language=pt&format=json`;

  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) {
    return { error: 'Não foi possível localizar a região informada.' };
  }
  const geoData = await geoRes.json();
  const hit = geoData?.results?.[0];
  if (!hit) {
    return { error: `Não encontrei a região "${place}". Tente outro nome de cidade ou região.` };
  }

  const lat = hit.latitude as number;
  const lon = hit.longitude as number;

  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m`;
  const fRes = await fetch(forecastUrl);
  if (!fRes.ok) {
    return { error: 'Não foi possível obter os dados de clima no momento.' };
  }
  const fData = await fRes.json();
  const cur = fData?.current;
  if (!cur) {
    return { error: 'Dados de clima indisponíveis para esta região.' };
  }

  const code = Number(cur.weather_code);
  const isDay = Number(cur.is_day) === 1;
  const condition = describeWeather(code, isDay);

  const resolvedName = [hit.name, hit.admin1].filter(Boolean).join(', ');
  const temperature = Number(cur.temperature_2m);
  const apparentTemperature = Number(cur.apparent_temperature);
  const humidity = Number(cur.relative_humidity_2m);
  const windSpeed = Number(cur.wind_speed_10m);
  const precipitation = Number(cur.precipitation);
  const cloudCover = Number(cur.cloud_cover);

  const human = `${condition} em ${resolvedName}. ${Math.round(
    temperature,
  )}°C (sensação de ${Math.round(apparentTemperature)}°C), umidade ${humidity}%, vento ${Math.round(
    windSpeed,
  )} km/h, ${cloudCover}% de nuvens.`;

  return {
    location: place,
    resolvedName,
    country: hit.country ?? null,
    latitude: lat,
    longitude: lon,
    temperature,
    apparentTemperature,
    humidity,
    windSpeed,
    precipitation,
    cloudCover,
    isDay,
    weatherCode: code,
    condition,
    human,
  };
}
