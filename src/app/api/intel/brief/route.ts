import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { rateLimit } from '@/lib/rateLimit';
import { errorResponse, rateLimitResponse, getClientIP } from '@/lib/apiHelpers';
import { ARGUS7_SYSTEM_PROMPT } from '@/lib/prompts';

const checkRate = rateLimit('intel-brief', { maxRequests: 30, windowMs: 60_000 });

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const limit = checkRate(ip);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs!);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return errorResponse('NO_API_KEY', 'Anthropic API key not configured', 503);
  }

  try {
    const body = await request.json();
    const { lat, lon, altitudeKm, currentMode, activeLayers, aircraftCount, satelliteCount, nearestQuake, weatherSummary, utcTimestamp } = body;

    const cacheKey = `intel-brief-${(lat as number).toFixed(2)}-${(lon as number).toFixed(2)}-${currentMode}`;
    const cached = cache.get<{ brief: string; missionId: string }>(cacheKey);
    if (cached) {
      return NextResponse.json({
        brief: cached.brief,
        missionId: cached.missionId,
        generatedAt: new Date().toISOString(),
        cached: true,
      });
    }

    const userPrompt = `Current observation parameters:
- Position: ${lat}°N, ${lon}°E, altitude ${altitudeKm}km
- Mode: ${currentMode}
- Active layers: ${(activeLayers as string[]).join(', ')}
- Aircraft in view: ${aircraftCount}
- Tracked satellites: ${satelliteCount}
- Nearest seismic event: ${nearestQuake ? `M${nearestQuake.magnitude} at ${nearestQuake.place}, ${nearestQuake.distanceKm}km away` : 'None detected'}
- Weather: ${weatherSummary || 'Clear'}
- Timestamp: ${utcTimestamp}

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
      const errText = await res.text();
      return errorResponse('ANTHROPIC_ERROR', `Claude API error: ${res.status} - ${errText}`, 502);
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
  } catch (err) {
    return errorResponse(
      'FETCH_ERROR',
      err instanceof Error ? err.message : 'Failed to generate intel brief',
      502
    );
  }
}
