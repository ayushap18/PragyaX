import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { rateLimit } from '@/lib/rateLimit';
import { errorResponse, rateLimitResponse, getClientIP } from '@/lib/apiHelpers';

const checkRate = rateLimit('flights', { maxRequests: 12, windowMs: 60_000 });

let oauthToken: string | null = null;
let oauthExpiresAt = 0;

async function getOpenSkyToken(): Promise<string | null> {
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (oauthToken && Date.now() < oauthExpiresAt) return oauthToken;

  try {
    const res = await fetch(
      'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    oauthToken = data.access_token;
    oauthExpiresAt = Date.now() + (data.expires_in - 300) * 1000; // 5 min buffer
    return oauthToken;
  } catch {
    return null;
  }
}

interface Aircraft {
  icao24: string;
  callsign: string;
  originCountry: string;
  lat: number;
  lon: number;
  altitudeM: number;
  altitudeFt: number;
  velocityMs: number;
  velocityKts: number;
  heading: number;
  verticalRateMs: number;
  onGround: boolean;
  squawk: string;
}

function transformStateVector(sv: (string | number | boolean | null)[]): Aircraft | null {
  const lat = sv[6] as number | null;
  const lon = sv[5] as number | null;
  if (lat === null || lon === null) return null;

  const altM = (sv[7] as number | null) ?? 0;
  const velMs = (sv[9] as number | null) ?? 0;

  return {
    icao24: (sv[0] as string) ?? '',
    callsign: ((sv[1] as string) ?? '').trim(),
    originCountry: (sv[2] as string) ?? '',
    lat,
    lon,
    altitudeM: altM,
    altitudeFt: Math.round(altM * 3.281),
    velocityMs: velMs,
    velocityKts: Math.round(velMs * 1.944),
    heading: (sv[10] as number | null) ?? 0,
    verticalRateMs: (sv[11] as number | null) ?? 0,
    onGround: (sv[8] as boolean) ?? false,
    squawk: (sv[14] as string | null) ?? '',
  };
}

export async function GET(request: Request) {
  const ip = getClientIP(request);
  const limit = checkRate(ip);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs!);

  const { searchParams } = new URL(request.url);
  const lamin = searchParams.get('lamin');
  const lamax = searchParams.get('lamax');
  const lomin = searchParams.get('lomin');
  const lomax = searchParams.get('lomax');

  const cacheKey = `flights-${lamin}-${lamax}-${lomin}-${lomax}`;
  const cached = cache.get<{ time: number; aircraft: Aircraft[] }>(cacheKey);
  if (cached) {
    return NextResponse.json({
      time: cached.time,
      count: cached.aircraft.length,
      aircraft: cached.aircraft,
      cached: true,
      source: 'opensky',
    });
  }

  try {
    const params = new URLSearchParams();
    if (lamin) params.set('lamin', lamin);
    if (lamax) params.set('lamax', lamax);
    if (lomin) params.set('lomin', lomin);
    if (lomax) params.set('lomax', lomax);

    const url = `https://opensky-network.org/api/states/all${params.toString() ? '?' + params.toString() : ''}`;
    const headers: Record<string, string> = {};

    const token = await getOpenSkyToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });

    if (!res.ok) {
      // Return last cached data if available
      const fallback = cache.get<{ time: number; aircraft: Aircraft[] }>('flights-fallback');
      if (fallback) {
        return NextResponse.json({
          time: fallback.time,
          count: fallback.aircraft.length,
          aircraft: fallback.aircraft,
          cached: true,
          fallback: true,
          source: 'opensky',
        });
      }
      return errorResponse('UPSTREAM_ERROR', `OpenSky returned ${res.status}`, 502);
    }

    const data = await res.json();
    const states = data.states || [];
    const aircraft: Aircraft[] = [];

    for (const sv of states) {
      const ac = transformStateVector(sv);
      if (ac) aircraft.push(ac);
    }

    const result = { time: data.time, aircraft };
    cache.set(cacheKey, result, 10_000); // 10s cache
    cache.set('flights-fallback', result, 300_000); // 5min fallback

    return NextResponse.json({
      time: data.time,
      count: aircraft.length,
      aircraft,
      cached: false,
      source: 'opensky',
    });
  } catch (err) {
    const fallback = cache.get<{ time: number; aircraft: Aircraft[] }>('flights-fallback');
    if (fallback) {
      return NextResponse.json({
        time: fallback.time,
        count: fallback.aircraft.length,
        aircraft: fallback.aircraft,
        cached: true,
        fallback: true,
        source: 'opensky',
      });
    }
    return errorResponse(
      'FETCH_ERROR',
      err instanceof Error ? err.message : 'Failed to fetch flights',
      502
    );
  }
}
