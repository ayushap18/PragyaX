import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { rateLimit } from '@/lib/rateLimit';
import { errorResponse, rateLimitResponse, getClientIP } from '@/lib/apiHelpers';

const checkRate = rateLimit('earthquakes', { maxRequests: 30, windowMs: 60_000 });

interface Earthquake {
  id: string;
  magnitude: number;
  place: string;
  lat: number;
  lon: number;
  depthKm: number;
  timeUtc: string;
  tsunamiRisk: boolean;
  alertLevel: string | null;
  url: string;
  felt: number | null;
}

function getFeedUrl(minmag: number): string {
  if (minmag >= 4.5) return 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson';
  if (minmag >= 2.5) return 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
  return 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
}

export async function GET(request: Request) {
  const ip = getClientIP(request);
  const limit = checkRate(ip);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs!);

  const { searchParams } = new URL(request.url);
  const minmag = parseFloat(searchParams.get('minmag') || '2.0');
  const hours = Math.min(parseInt(searchParams.get('hours') || '24', 10), 168);

  const cacheKey = `earthquakes-${minmag}-${hours}`;
  const cached = cache.get<{ earthquakes: Earthquake[] }>(cacheKey);
  if (cached) {
    return NextResponse.json({
      count: cached.earthquakes.length,
      earthquakes: cached.earthquakes,
      cached: true,
      source: 'usgs',
    });
  }

  try {
    const feedUrl = getFeedUrl(minmag);
    const res = await fetch(feedUrl, { signal: AbortSignal.timeout(15000) });

    if (!res.ok) {
      return errorResponse('UPSTREAM_ERROR', `USGS returned ${res.status}`, 502);
    }

    const geojson = await res.json();
    const cutoff = Date.now() - hours * 3600_000;

    const earthquakes: Earthquake[] = (geojson.features || [])
      .filter((f: { properties: { time: number; mag: number } }) =>
        f.properties.time >= cutoff && f.properties.mag >= minmag
      )
      .map((f: { id: string; properties: Record<string, unknown>; geometry: { coordinates: number[] } }) => ({
        id: f.id,
        magnitude: f.properties.mag as number,
        place: (f.properties.place as string) || 'Unknown',
        lon: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        depthKm: f.geometry.coordinates[2],
        timeUtc: new Date(f.properties.time as number).toISOString(),
        tsunamiRisk: (f.properties.tsunami as number) === 1,
        alertLevel: (f.properties.alert as string) || null,
        url: (f.properties.url as string) || '',
        felt: (f.properties.felt as number) || null,
      }));

    const result = { earthquakes };
    cache.set(cacheKey, result, 300_000); // 5 min cache

    return NextResponse.json({
      count: earthquakes.length,
      earthquakes,
      cached: false,
      source: 'usgs',
    });
  } catch (err) {
    return errorResponse(
      'FETCH_ERROR',
      err instanceof Error ? err.message : 'Failed to fetch earthquakes',
      502
    );
  }
}
