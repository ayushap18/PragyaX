import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { rateLimit } from '@/lib/rateLimit';
import { errorResponse, rateLimitResponse, getClientIP } from '@/lib/apiHelpers';

const checkRate = rateLimit('satellites', { maxRequests: 15, windowMs: 60_000 });

const GROUP_URLS: Record<string, string> = {
  stations: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json',
  active: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json',
  starlink: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json',
  'gps-ops': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=json',
  visual: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json',
  resource: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=resource&FORMAT=json',
  geo: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=json',
  gnss: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=gnss&FORMAT=json',
  science: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=json',
  // 'indian' is a virtual group — handled specially below
};

// Celestrak NAME queries for Indian satellites (synced with ISRO_SATELLITE_PATTERNS in constants/chanakya.ts)
const INDIAN_SAT_NAMES = [
  'IRNSS', 'NAVIC', 'CARTOSAT', 'RESOURCESAT', 'OCEANSAT',
  'INSAT', 'GSAT', 'RISAT', 'EOS-', 'ASTROSAT',
  'SARAL', 'SCATSAT', 'EMISAT', 'MICROSAT', 'HAMSAT',
  'ANUSAT', 'NISAR', 'PRATHAM', 'KALAMSAT',
];

async function fetchIndianSatellites(): Promise<Record<string, unknown>[]> {
  const results: Record<string, unknown>[] = [];
  const seen = new Set<number>();

  // Fetch from multiple name queries in parallel
  const fetches = INDIAN_SAT_NAMES.map(async (name) => {
    try {
      const url = `https://celestrak.org/NORAD/elements/gp.php?NAME=${encodeURIComponent(name)}&FORMAT=json`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  });

  const batches = await Promise.all(fetches);
  for (const batch of batches) {
    for (const sat of batch) {
      const noradId = sat.NORAD_CAT_ID as number;
      if (!seen.has(noradId)) {
        seen.add(noradId);
        results.push(sat);
      }
    }
  }

  return results;
}

interface SatelliteTLE {
  name: string;
  noradId: number;
  intlDesignator: string;
  tleLine1: string;
  tleLine2: string;
  orbitType: string;
  launchDate: string;
  epoch: string;
  meanMotion: number;
  inclination: number;
  eccentricity: number;
}

function deriveOrbitType(meanMotion: number): string {
  if (meanMotion > 11.25) return 'LEO';
  if (meanMotion >= 1.8 && meanMotion <= 2.2) return 'MEO';
  if (meanMotion >= 0.9 && meanMotion <= 1.1) return 'GEO';
  return 'HEO';
}

function ommToTleLine1(omm: Record<string, unknown>): string {
  const norad = String(omm.NORAD_CAT_ID || '').padStart(5, '0');
  const classification = (omm.CLASSIFICATION_TYPE as string) || 'U';
  const intlDes = (omm.OBJECT_ID as string) || '00000A';
  const epoch = (omm.EPOCH as string) || '';

  // Simplified TLE line 1 construction
  const epochDate = new Date(epoch);
  const year = epochDate.getUTCFullYear() % 100;
  const startOfYear = new Date(Date.UTC(epochDate.getUTCFullYear(), 0, 1));
  const dayOfYear = (epochDate.getTime() - startOfYear.getTime()) / 86400000 + 1;
  const epochStr = `${String(year).padStart(2, '0')}${dayOfYear.toFixed(8).padStart(12, '0')}`;

  const meanMotionDot = (omm.MEAN_MOTION_DOT as number) || 0;
  const bstar = (omm.BSTAR as number) || 0;

  return `1 ${norad}${classification} ${intlDes.padEnd(8)} ${epochStr} ${meanMotionDot >= 0 ? ' ' : ''}${meanMotionDot.toFixed(8).slice(0, 10)}  00000-0 ${formatBstar(bstar)} 0  999`;
}

function ommToTleLine2(omm: Record<string, unknown>): string {
  const norad = String(omm.NORAD_CAT_ID || '').padStart(5, '0');
  const inc = ((omm.INCLINATION as number) || 0).toFixed(4).padStart(8);
  const raan = ((omm.RA_OF_ASC_NODE as number) || 0).toFixed(4).padStart(8);
  const ecc = ((omm.ECCENTRICITY as number) || 0).toFixed(7).slice(2);
  const argOfPer = ((omm.ARG_OF_PERICENTER as number) || 0).toFixed(4).padStart(8);
  const meanAnom = ((omm.MEAN_ANOMALY as number) || 0).toFixed(4).padStart(8);
  const meanMotion = ((omm.MEAN_MOTION as number) || 0).toFixed(8).padStart(11);
  const revNum = String((omm.REV_AT_EPOCH as number) || 0).padStart(5, '0');

  return `2 ${norad} ${inc} ${raan} ${ecc} ${argOfPer} ${meanAnom} ${meanMotion}${revNum}`;
}

function formatBstar(bstar: number): string {
  if (bstar === 0) return ' 00000-0';
  const sign = bstar >= 0 ? ' ' : '-';
  const abs = Math.abs(bstar);
  const exp = Math.floor(Math.log10(abs));
  const mantissa = abs / Math.pow(10, exp);
  return `${sign}${Math.round(mantissa * 10000).toString().padStart(5, '0')}${exp >= 0 ? '+' : '-'}${Math.abs(exp)}`;
}

export async function GET(request: Request) {
  const ip = getClientIP(request);
  const limit = checkRate(ip);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs!);

  const { searchParams } = new URL(request.url);
  const group = searchParams.get('group') || 'stations';

  if (group !== 'indian' && !GROUP_URLS[group]) {
    return errorResponse('INVALID_GROUP', `Unknown group: ${group}. Valid: ${Object.keys(GROUP_URLS).join(', ')}, indian`, 400);
  }

  const cacheKey = `satellites-${group}`;
  const cached = cache.get<{ satellites: SatelliteTLE[] }>(cacheKey);
  if (cached) {
    return NextResponse.json({
      count: cached.satellites.length,
      satellites: cached.satellites,
      cached: true,
      source: 'celestrak',
    });
  }

  try {
    let ommData: Record<string, unknown>[];

    if (group === 'indian') {
      // Special handler: fetch ISRO satellites by name queries
      ommData = await fetchIndianSatellites();
    } else {
      const res = await fetch(GROUP_URLS[group], { signal: AbortSignal.timeout(30000) });
      if (!res.ok) {
        return errorResponse('UPSTREAM_ERROR', `Celestrak returned ${res.status}`, 502);
      }
      ommData = await res.json();
      if (!Array.isArray(ommData)) ommData = [];
    }
    const satellites: SatelliteTLE[] = (Array.isArray(ommData) ? ommData : []).map(
      (omm: Record<string, unknown>) => {
        const meanMotion = (omm.MEAN_MOTION as number) || 0;
        return {
          name: (omm.OBJECT_NAME as string) || 'UNKNOWN',
          noradId: (omm.NORAD_CAT_ID as number) || 0,
          intlDesignator: (omm.OBJECT_ID as string) || '',
          tleLine1: ommToTleLine1(omm),
          tleLine2: ommToTleLine2(omm),
          orbitType: deriveOrbitType(meanMotion),
          launchDate: (omm.LAUNCH_DATE as string) || '',
          epoch: (omm.EPOCH as string) || '',
          meanMotion,
          inclination: (omm.INCLINATION as number) || 0,
          eccentricity: (omm.ECCENTRICITY as number) || 0,
        };
      }
    );

    const result = { satellites };
    cache.set(cacheKey, result, 3_600_000); // 1 hour cache

    return NextResponse.json({
      count: satellites.length,
      satellites,
      cached: false,
      source: 'celestrak',
    });
  } catch (err) {
    return errorResponse(
      'FETCH_ERROR',
      err instanceof Error ? err.message : 'Failed to fetch satellites',
      502
    );
  }
}
