import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { rateLimit } from '@/lib/rateLimit';
import { errorResponse, rateLimitResponse, getClientIP } from '@/lib/apiHelpers';

const checkRate = rateLimit('satellites', { maxRequests: 5, windowMs: 60_000 });

const GROUP_URLS: Record<string, string> = {
  stations: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json',
  active: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json',
  starlink: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json',
  'gps-ops': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=json',
  visual: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json',
};

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

  if (!GROUP_URLS[group]) {
    return errorResponse('INVALID_GROUP', `Unknown group: ${group}. Valid: ${Object.keys(GROUP_URLS).join(', ')}`, 400);
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
    const res = await fetch(GROUP_URLS[group], { signal: AbortSignal.timeout(30000) });

    if (!res.ok) {
      return errorResponse('UPSTREAM_ERROR', `Celestrak returned ${res.status}`, 502);
    }

    const ommData = await res.json();
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
