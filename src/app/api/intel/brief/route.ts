import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { rateLimit } from '@/lib/rateLimit';
import { errorResponse, rateLimitResponse, getClientIP, parseBody, validateCoordinates, sanitizeForPrompt } from '@/lib/apiHelpers';
import { ARGUS7_SYSTEM_PROMPT } from '@/lib/prompts';

const checkRate = rateLimit('intel-brief', { maxRequests: 30, windowMs: 60_000 });

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const limit = checkRate(ip);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs!);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return errorResponse('SERVICE_UNAVAILABLE', 'AI service not available', 503);
  }

  try {
    const result = await parseBody(request);
    if (result.error) return result.error;
    const body = result.data;

    const coords = validateCoordinates(body.lat, body.lon);
    if (!coords) {
      return errorResponse('INVALID_COORDINATES', 'Invalid latitude or longitude', 400);
    }

    const currentMode = sanitizeForPrompt(String(body.currentMode || 'NORMAL'), 20);
    const altitudeKm = Math.max(0, Math.min(50000, Number(body.altitudeKm) || 0));
    const aircraftCount = Math.max(0, Math.min(99999, Number(body.aircraftCount) || 0));
    const satelliteCount = Math.max(0, Math.min(99999, Number(body.satelliteCount) || 0));
    const weatherSummary = sanitizeForPrompt(String(body.weatherSummary || 'Clear'), 100);

    const cacheKey = `intel-brief-${coords.lat.toFixed(2)}-${coords.lon.toFixed(2)}-${currentMode}`;
    const cached = cache.get<{ brief: string; missionId: string }>(cacheKey);
    if (cached) {
      return NextResponse.json({
        brief: cached.brief,
        missionId: cached.missionId,
        generatedAt: new Date().toISOString(),
        cached: true,
      });
    }

    const nearestQuake = body.nearestQuake as { magnitude?: number; place?: string; distanceKm?: number } | undefined;
    const quakeInfo = nearestQuake
      ? `M${Number(nearestQuake.magnitude || 0).toFixed(1)} at ${sanitizeForPrompt(String(nearestQuake.place || 'Unknown'), 80)}, ${Math.round(Number(nearestQuake.distanceKm) || 0)}km away`
      : 'None detected';

    const userPrompt = `Current observation parameters:
- Position: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}, altitude ${altitudeKm}km
- Mode: ${currentMode}
- Active layers: ${Array.isArray(body.activeLayers) ? (body.activeLayers as string[]).slice(0, 20).join(', ') : 'none'}
- Aircraft in view: ${aircraftCount}
- Tracked satellites: ${satelliteCount}
- Nearest seismic event: ${quakeInfo}
- Weather: ${weatherSummary}
- Timestamp: ${new Date().toISOString()}

Generate the intelligence brief now.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        temperature: 0.3,
        system: ARGUS7_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return errorResponse('UPSTREAM_ERROR', 'AI service returned an error', 502);
    }

    const data = await res.json();
    const brief = data.content?.[0]?.text || '';
    const missionId = `KH${Math.floor(10 + Math.random() * 90)}-${Math.floor(1000 + Math.random() * 9000)} OPS-${Math.floor(1000 + Math.random() * 9000)}`;

    cache.set(cacheKey, { brief, missionId }, 60_000); // 60s cache

    return NextResponse.json({
      brief,
      missionId,
      generatedAt: new Date().toISOString(),
      cached: false,
    });
  } catch {
    return errorResponse('INTERNAL_ERROR', 'Failed to generate intel brief', 502);
  }
}
