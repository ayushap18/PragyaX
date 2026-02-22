import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { rateLimit } from '@/lib/rateLimit';
import { rateLimitResponse, errorResponse, getClientIP } from '@/lib/apiHelpers';

const checkRate = rateLimit('weather-tile', { maxRequests: 120, windowMs: 60_000 });

const VALID_LAYERS = [
  'precipitation_new',
  'clouds_new',
  'wind_new',
  'temp_new',
  'pressure_new',
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ layer: string; z: string; x: string; y: string }> }
) {
  const ip = getClientIP(request);
  const limit = checkRate(ip);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs!);

  const { layer, z, x, y } = await params;

  if (!VALID_LAYERS.includes(layer)) {
    return errorResponse(
      'INVALID_LAYER',
      `Unknown weather layer: ${layer}. Valid: ${VALID_LAYERS.join(', ')}`,
      400
    );
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return errorResponse('NO_API_KEY', 'OpenWeatherMap API key not configured', 503);
  }

  const cacheKey = `weather-${layer}-${z}-${x}-${y}`;
  const cached = cache.get<ArrayBuffer>(cacheKey);
  if (cached) {
    return new NextResponse(cached, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=900',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    const url = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      return errorResponse('UPSTREAM_ERROR', `OWM returned ${res.status}`, 502);
    }

    const buffer = await res.arrayBuffer();
    cache.set(cacheKey, buffer, 900_000); // 15 min cache

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=900',
        'X-Cache': 'MISS',
      },
    });
  } catch (err) {
    return errorResponse(
      'FETCH_ERROR',
      err instanceof Error ? err.message : 'Failed to fetch weather tile',
      502
    );
  }
}
