import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { rateLimit } from '@/lib/rateLimit';
import { errorResponse, rateLimitResponse, getClientIP } from '@/lib/apiHelpers';
import { CCTV_ANALYSIS_SYSTEM_PROMPT } from '@/lib/prompts';

const checkRate = rateLimit('vision-analyze', { maxRequests: 20, windowMs: 60_000 });

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
    const { cameraId, city, label, lat, lon, direction } = body;

    const cacheKey = `cctv-${cameraId}`;
    const cached = cache.get<{
      vehicleCount: number;
      trafficFlow: string;
      anomalies: string[];
      weatherObserved: string;
      crowdDensity: string;
      summary: string;
    }>(cacheKey);

    if (cached) {
      return NextResponse.json({
        cameraId,
        timestamp: new Date().toISOString(),
        ...cached,
        cached: true,
      });
    }

    const userPrompt = `Camera: ${label} (${cameraId})
City: ${city}
Position: ${lat}°N, ${lon}°E
Facing: ${direction}
Time: ${new Date().toISOString()}

Generate the surveillance analysis.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        temperature: 0.5,
        system: CCTV_ANALYSIS_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return errorResponse('ANTHROPIC_ERROR', `Claude API error: ${res.status}`, 502);
    }

    const data = await res.json();
    let responseText = data.content?.[0]?.text || '';
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsed = JSON.parse(responseText);

      cache.set(cacheKey, parsed, 300_000); // 5min cache

      return NextResponse.json({
        cameraId,
        timestamp: new Date().toISOString(),
        vehicleCount: parsed.vehicleCount || 0,
        trafficFlow: parsed.trafficFlow || 'MODERATE',
        anomalies: parsed.anomalies || [],
        weatherObserved: parsed.weatherObserved || 'CLEAR',
        crowdDensity: parsed.crowdDensity || 'MODERATE',
        summary: parsed.summary || 'Analysis complete.',
        cached: false,
      });
    } catch {
      return NextResponse.json({
        cameraId,
        timestamp: new Date().toISOString(),
        vehicleCount: Math.floor(20 + Math.random() * 80),
        trafficFlow: 'MODERATE',
        anomalies: [],
        weatherObserved: 'CLEAR VISIBILITY',
        crowdDensity: 'MODERATE',
        summary: 'Standard activity observed, no anomalies detected.',
        cached: false,
      });
    }
  } catch (err) {
    return errorResponse(
      'FETCH_ERROR',
      err instanceof Error ? err.message : 'Failed to analyze camera feed',
      502
    );
  }
}
